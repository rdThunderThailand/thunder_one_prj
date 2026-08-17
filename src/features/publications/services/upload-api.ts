import { apiClient } from "@/lib/api/client";
import { requestApi } from "@/lib/api/media-api";
import type { MediaAsset } from "../types";

type UploadUrlResponse = {
  file_id: string;
  storage_key: string;
  upload_url: string;
  token?: string;
};

export async function fetchUploadUrl(file: File): Promise<UploadUrlResponse> {
  return requestApi<UploadUrlResponse>("POST", "/media/videos/upload-url", {
    filename: file.name,
    mime_type: file.type || "application/octet-stream",
    file_size_bytes: file.size,
  });
}

export async function uploadToStorage(
  uploadUrl: string,
  file: File,
  onProgress: (pct: number) => void
): Promise<void> {
  // uploadUrl is an ABSOLUTE Supabase signed-upload URL — this is the one request in the
  // codebase that legitimately bypasses /api/proxy. Both options below are load-bearing:
  // the Content-Type header overrides apiClient's application/json default, and
  // transformRequest stops axios from serialising the File object.
  await apiClient.put(uploadUrl, file, {
    headers: { "Content-Type": file.type },
    transformRequest: [(d) => d],
    onUploadProgress: (evt) => {
      if (evt.total) onProgress(Math.round((evt.loaded * 100) / evt.total));
    },
  });
}

export async function registerVideo(payload: {
  file_id: string;
  title: string;
  duration_seconds?: number;
  thumbnail_storage_key?: string;
}): Promise<MediaAsset> {
  return requestApi<MediaAsset>("POST", "/media/videos", payload);
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
