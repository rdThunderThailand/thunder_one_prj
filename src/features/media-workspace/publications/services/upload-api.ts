import { requestApi } from "@/lib/api/media-api";
import { resolveUploadMimeType } from "../upload-limits";
import { captureVideoThumbnail, readMediaDimensions, readVideoDuration } from "./media-file-read";
import { uploadToStorage } from "./tus-upload";
import { abortError, boundedRequest, throwIfAborted } from "./upload-bounds";
import type { ProbeVerdict } from "@/types/domain";

export { EXPIRED_UPLOAD_ERROR } from "./tus-upload";

/** Everything the browser needs to upload; every field is chosen by Core (ADR-0059).
 *  `storage_key` already carries the authenticated tenant's prefix. Core also returns the
 *  legacy signed-PUT `upload_url`/`token`, which the resumable path does not use. */
export type UploadTarget = {
  file_id: string;
  storage_key: string;
  bucket: string;
  upload_endpoint: string;
  storage_api_key: string;
  max_file_size_bytes: number;
};

/** What registration needs from the browser once the bytes are in Storage. Kept by the queue so a
 *  `Retry` after the transfer only registers again (ADR 0059 amendment 2026-11-04). */
export type RegistrationDraft = {
  duration_seconds?: number;
  width?: number;
  height?: number;
  thumbnail_storage_key?: string;
};

export async function fetchUploadUrl(file: File): Promise<UploadTarget> {
  return boundedRequest((options) =>
    requestApi<UploadTarget>(
      "POST",
      "/media/videos/upload-url",
      {
        filename: file.name,
        mime_type: resolveUploadMimeType(file),
        file_size_bytes: file.size,
      },
      options
    )
  );
}

/** Releases a reservation the browser will never finish, so its Storage object and `files` row
 *  do not wait for the nightly sweep. Core refuses a file_id that already became an Asset. */
export async function cancelUploadReservation(fileId: string): Promise<void> {
  await requestApi("POST", "/media/uploads/cancel", { file_id: fileId });
}

/** The full per-file pipeline shared by the single-file picker (`useAssetUpload`) and
 *  the staged queue: read metadata → resumable upload → (video only) thumbnail upload →
 *  register. One copy so the two callers cannot drift.
 *
 *  Pass `target` to retry against a prior attempt's authorization. Resuming and re-authorizing
 *  are mutually exclusive: tus would happily resume a stored upload URL against a fresh
 *  reservation, writing bytes to the old object while registration recorded the new key, so a
 *  retry either keeps the whole reservation or takes a whole new one. `onTarget` reports the
 *  one actually used, for the next retry or for release on cancel.
 *
 *  Pass `registration` with `target` to retry after the transfer finished: tus drops its stored
 *  URL on success, so uploading again would start a second upload to the same key. Registration is
 *  idempotent per `file_id` in Core, so calling it again is safe even when the first call timed out
 *  after Core had already created the Asset. */
export async function uploadAndRegisterAsset(
  file: File,
  options: {
    title?: string;
    folderId?: string | null;
    tagIds?: string[];
    onProgress?: (pct: number) => void;
    signal?: AbortSignal;
    target?: UploadTarget;
    registration?: RegistrationDraft;
    onTarget?: (target: UploadTarget) => void;
    onTransferred?: (draft: RegistrationDraft) => void;
  } = {}
): Promise<RegisteredVideo> {
  const { title, folderId, tagIds, onProgress = () => {}, signal, onTarget, onTransferred } = options;
  const register = (target: UploadTarget, draft: RegistrationDraft) =>
    registerVideo({
      file_id: target.file_id,
      title: title?.trim() || file.name,
      ...draft,
      ...(folderId ? { folder_id: folderId } : {}),
      ...(tagIds?.length ? { tag_ids: tagIds } : {}),
    });

  if (options.target && options.registration) return register(options.target, options.registration);

  throwIfAborted(signal);
  const isVideoFile = file.type.startsWith("video/");
  const duration = isVideoFile ? await readVideoDuration(file) : undefined;
  throwIfAborted(signal);
  const dimensions = await readMediaDimensions(file);
  throwIfAborted(signal);
  const thumbnailBlob = isVideoFile ? await captureVideoThumbnail(file) : undefined;
  throwIfAborted(signal);

  const shouldResume = Boolean(options.target);
  const target = options.target ?? (await fetchUploadUrl(file));
  if (signal?.aborted) {
    // A reservation made after the operator canceled belongs to no row that could release it.
    if (!options.target) void cancelUploadReservation(target.file_id).catch(() => {});
    throw abortError();
  }
  onTarget?.(target);
  await uploadToStorage(target, file, onProgress, signal, shouldResume);

  let draft: RegistrationDraft = { ...(duration ? { duration_seconds: duration } : {}), ...(dimensions ?? {}) };
  // From here a Retry only registers: the transfer is done.
  onTransferred?.(draft);

  // ponytail: the thumbnail is cosmetic, so it must not fail a transfer that already succeeded.
  // The queue tracks only the original file's reservation, so a thumbnail that fails or is canceled
  // leaves one small object for the nightly sweep. Carry a second stored target if that ever
  // becomes real backlog rather than a handful of thumbnails a day.
  if (thumbnailBlob) {
    try {
      const thumbFile = new File([thumbnailBlob], `${file.name}.thumb.jpg`, { type: "image/jpeg" });
      const thumbTarget = await fetchUploadUrl(thumbFile);
      await uploadToStorage(thumbTarget, thumbFile, () => {}, signal);
      draft = { ...draft, thumbnail_storage_key: thumbTarget.storage_key };
      onTransferred?.(draft);
    } catch (error) {
      if ((error as Error)?.name === "AbortError") throw error;
    }
  }
  throwIfAborted(signal);

  return register(target, draft);
}

/** Registration is idempotent per `file_id` and returns only these fields — it is not the
 *  Asset. Callers that need the Asset fetch it by `media_asset_id`. `probe_verdict` is present
 *  only when the route actually probed the file (a video registered after ADR 0070 shipped). */
export type RegisteredVideo = { media_asset_id: string; status: string; probe_verdict?: ProbeVerdict | null };

export async function registerVideo(payload: {
  file_id: string;
  title: string;
  duration_seconds?: number;
  thumbnail_storage_key?: string;
  width?: number;
  height?: number;
  folder_id?: string | null;
  tag_ids?: string[];
}): Promise<RegisteredVideo> {
  return boundedRequest((options) => requestApi<RegisteredVideo>("POST", "/media/videos", payload, options));
}
