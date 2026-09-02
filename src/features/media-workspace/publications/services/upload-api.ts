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

/** Supabase's TUS chunk size is fixed at 6 MB — the server rejects anything else. */
const TUS_CHUNK_SIZE = 6 * 1024 * 1024;

/** Resumable upload straight to the Storage hostname, bypassing /api/proxy: a 5 GB file
 *  cannot survive a single non-resumable PUT through a serverless proxy. `objectName` comes
 *  from Core and Storage's own RLS policy refuses any key outside the caller's tenant prefix,
 *  so a tampered value is rejected at the server, not merely unused. */
export async function uploadToStorage(
  target: UploadTarget,
  file: File,
  onProgress: (pct: number) => void
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
      onError: reject,
      onSuccess: () => resolve(),
    });

    upload.findPreviousUploads().then((previous) => {
      if (previous.length) upload.resumeFromPreviousUpload(previous[0]);
      upload.start();
    }, reject);
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
