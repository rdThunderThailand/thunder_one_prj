import { requestApi } from "@/lib/api/media-api";
import { resolveUploadMimeType } from "../upload-limits";
import { Upload } from "tus-js-client";

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

/** The resumable endpoint talks to Storage directly, past /api/proxy, so it needs the user's
 *  own access token rather than the httpOnly cookie the proxy forwards. */
async function fetchStorageAccessToken(): Promise<string> {
  const response = await fetch("/api/auth/storage-token", { cache: "no-store" });
  if (!response.ok) throw new Error("เซสชันหมดอายุ — กรุณาเข้าสู่ระบบใหม่ก่อนอัปโหลด");
  const { access_token } = (await response.json()) as { access_token: string };
  return access_token;
}

export async function fetchUploadUrl(file: File): Promise<UploadTarget> {
  return requestApi<UploadTarget>("POST", "/media/videos/upload-url", {
    filename: file.name,
    mime_type: resolveUploadMimeType(file),
    file_size_bytes: file.size,
  });
}

/** Releases a reservation the browser will never finish, so its Storage object and `files` row
 *  do not wait for the nightly sweep. Core refuses a file_id that already became an Asset. */
export async function cancelUploadReservation(fileId: string): Promise<void> {
  await requestApi("POST", "/media/uploads/cancel", { file_id: fileId });
}

/** Supabase's TUS chunk size is fixed at 6 MB — the server rejects anything else. */
const TUS_CHUNK_SIZE = 6 * 1024 * 1024;

/** A resumed upload whose reservation no longer exists — swept, canceled, or past the TUS
 *  URL's lifetime. Named so the queue can tell "resume this" from "re-authorize this". */
export const EXPIRED_UPLOAD_ERROR = "ExpiredUploadError";

function isReservationGone(error: unknown): boolean {
  const status = (error as { originalResponse?: { getStatus?: () => number } })?.originalResponse?.getStatus?.();
  return status === 401 || status === 403 || status === 404 || status === 410;
}

/** Resumable upload straight to the Storage hostname, bypassing /api/proxy: a 5 GB file
 *  cannot survive a single non-resumable PUT through a serverless proxy. `objectName` comes
 *  from Core and Storage's own RLS policy refuses any key outside the caller's tenant prefix,
 *  so a tampered value is rejected at the server, not merely unused. */
export async function uploadToStorage(
  target: UploadTarget,
  file: File,
  onProgress: (pct: number) => void,
  signal?: AbortSignal,
  shouldResume = false
): Promise<void> {
  const accessToken = await fetchStorageAccessToken();

  return new Promise((resolve, reject) => {
    const upload = new Upload(file, {
      endpoint: target.upload_endpoint,
      headers: {
        authorization: `Bearer ${accessToken}`,
        apikey: target.storage_api_key,
      },
      retryDelays: [0, 3000, 5000, 10000, 20000],
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      chunkSize: TUS_CHUNK_SIZE,
      metadata: {
        bucketName: target.bucket,
        objectName: target.storage_key,
        // The bucket's allowed_mime_types is checked against this, so it has to be the same
        // value Core validated rather than a possibly-empty File.type.
        contentType: resolveUploadMimeType(file),
      },
      onProgress: (uploaded, total) => {
        if (total) onProgress(Math.round((uploaded * 100) / total));
      },
      onError: (error) => {
        if (!isReservationGone(error)) return reject(error);
        const expired = new Error("การอนุญาตอัปโหลดหมดอายุ — ระบบจะเริ่มไฟล์นี้ใหม่");
        expired.name = EXPIRED_UPLOAD_ERROR;
        reject(expired);
      },
      onSuccess: () => resolve(),
    });

    // Distinguishable from a real upload failure so callers (the queue) can mark the
    // row `canceled` instead of `failed`.
    signal?.addEventListener("abort", () => {
      upload.abort();
      const abortError = new Error("Upload canceled");
      abortError.name = "AbortError";
      reject(abortError);
    });

    // The stored upload URL is only safe to resume against the reservation it was created for.
    // tus fingerprints a file as `tus-br-{name}-{type}-{size}-{lastModified}-{endpoint}` —
    // `objectName` is not part of it — so a previous attempt's entry matches even when this
    // call holds a brand-new reservation. Resuming then would append bytes to the old object
    // while registration recorded the new key. Only the caller knows which it holds, so it
    // decides: `shouldResume` is set exactly when it passed the same `target` back in.
    if (!shouldResume) {
      upload.start();
      return;
    }
    upload.findPreviousUploads().then((previous) => {
      if (previous.length) upload.resumeFromPreviousUpload(previous[0]);
      upload.start();
    }, reject);
  });
}

/** The full per-file pipeline shared by the single-file picker (`useAssetUpload`) and
 *  the staged queue: read metadata → resumable upload → (video only) thumbnail upload →
 *  register. One copy so the two callers cannot drift.
 *
 *  Pass `target` to retry against a prior attempt's authorization. Resuming and re-authorizing
 *  are mutually exclusive: tus would happily resume a stored upload URL against a fresh
 *  reservation, writing bytes to the old object while registration recorded the new key, so a
 *  retry either keeps the whole reservation or takes a whole new one. `onTarget` reports the
 *  one actually used, for the next retry or for release on cancel. */
export async function uploadAndRegisterAsset(
  file: File,
  options: {
    folderId?: string | null;
    tagIds?: string[];
    onProgress?: (pct: number) => void;
    signal?: AbortSignal;
    target?: UploadTarget;
    onTarget?: (target: UploadTarget) => void;
  } = {}
): Promise<RegisteredVideo> {
  const { folderId, tagIds, onProgress = () => {}, signal, onTarget } = options;
  const isVideoFile = file.type.startsWith("video/");
  const duration = isVideoFile ? await readVideoDuration(file) : null;
  const dimensions = await readMediaDimensions(file);
  const thumbnailBlob = isVideoFile ? await captureVideoThumbnail(file) : undefined;
  const shouldResume = Boolean(options.target);
  const target = options.target ?? (await fetchUploadUrl(file));
  onTarget?.(target);
  await uploadToStorage(target, file, onProgress, signal, shouldResume);

  // ponytail: the queue tracks only the original file's reservation. A retry that reaches this
  // point takes a fresh thumbnail reservation, and a cancel between here and registration
  // releases the original but not the thumbnail — both leave one small object for the nightly
  // sweep. Carry a second stored target here if that ever becomes real backlog rather than a
  // handful of thumbnails a day.
  let thumbnail_storage_key: string | undefined;
  if (thumbnailBlob) {
    const thumbFile = new File([thumbnailBlob], `${file.name}.thumb.jpg`, { type: "image/jpeg" });
    const thumbTarget = await fetchUploadUrl(thumbFile);
    await uploadToStorage(thumbTarget, thumbFile, () => {}, signal);
    thumbnail_storage_key = thumbTarget.storage_key;
  }

  return registerVideo({
    file_id: target.file_id,
    title: file.name,
    ...(duration ? { duration_seconds: duration } : {}),
    ...(thumbnail_storage_key ? { thumbnail_storage_key } : {}),
    ...(dimensions ?? {}),
    ...(folderId ? { folder_id: folderId } : {}),
    ...(tagIds?.length ? { tag_ids: tagIds } : {}),
  });
}

/** Registration is idempotent per `file_id` and returns only these two fields — it is
 *  not the Asset. Callers that need the Asset fetch it by `media_asset_id`. */
export type RegisteredVideo = { media_asset_id: string; status: string };

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
  return requestApi<RegisteredVideo>("POST", "/media/videos", payload);
}

// ponytail: the browser has already decoded the file by the time it reports these, so the
// dimensions the playlist compatibility check needs (ADR 0019) are free here. Undefined when
// the file cannot be decoded — the asset registers without them and the check stays silent.
export function readMediaDimensions(
  file: File
): Promise<{ width: number; height: number } | undefined> {
  const url = URL.createObjectURL(file);
  const isVideo = file.type.startsWith("video/");

  return new Promise((resolve) => {
    const done = (size?: { width: number; height: number }) => {
      URL.revokeObjectURL(url);
      resolve(size?.width && size.height ? size : undefined);
    };

    if (isVideo) {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => done({ width: video.videoWidth, height: video.videoHeight });
      video.onerror = () => done();
      video.src = url;
      return;
    }

    const image = new Image();
    image.onload = () => done({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => done();
    image.src = url;
  });
}

// ponytail: reads duration from a detached <video>; returns undefined for anything the
// browser can't decode — duration_seconds is optional on the backend, so that's fine.
export function readVideoDuration(file: File): Promise<number | undefined> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const secs = Math.round(video.duration);
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(secs) && secs > 0 ? secs : undefined);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(undefined);
    };
    video.src = url;
  });
}

// ponytail: draws the first frame to a canvas and exports it as a JPEG blob (ADR 0016).
// A separate detached <video> from readVideoDuration's — decoding twice per upload is
// cheap next to the multi-MB payload it replaces on every later render of this asset.
export function captureVideoThumbnail(file: File): Promise<Blob | undefined> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.onloadedmetadata = () => {
      video.currentTime = Math.min(0.1, video.duration || 0);
    };
    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx || !canvas.width || !canvas.height) {
        URL.revokeObjectURL(url);
        resolve(undefined);
        return;
      }
      ctx.drawImage(video, 0, 0);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          resolve(blob ?? undefined);
        },
        "image/jpeg",
        0.8
      );
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(undefined);
    };
    video.src = url;
  });
}
