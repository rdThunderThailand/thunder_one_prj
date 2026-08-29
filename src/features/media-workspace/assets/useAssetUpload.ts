"use client";

import { useRef, useState } from "react";
import type { MediaAsset } from "@/types/domain";
import {
  captureVideoThumbnail,
  fetchUploadUrl,
  readMediaDimensions,
  readVideoDuration,
  registerVideo,
  uploadToStorage,
} from "@/features/media-workspace/publications/services/upload-api";
import { rejectUploadReason } from "@/features/media-workspace/publications/upload-limits";

/** Shared upload pipeline for the file-picker "Upload Asset" button in both the
 *  Publication and Playlist wizards: signed URL → PUT to storage → (video only)
 *  a second PUT for the generated thumbnail → register the asset. Callers own what
 *  happens after — refetching their asset list, auto-selecting the new asset, etc.
 *  — via `onUploaded`, since that behavior differs per wizard. */
export function useAssetUpload(
  onUploaded: (asset: MediaAsset | null, isVideo: boolean) => void | Promise<void>,
  folderId?: string | null
) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const rejection = rejectUploadReason(file);
    if (rejection) {
      setUploadError(rejection);
      return;
    }

    setUploadError(null);
    setUploadPct(0);
    try {
      const isVideoFile = file.type.startsWith("video/");
      const duration = isVideoFile ? await readVideoDuration(file) : null;
      const dimensions = await readMediaDimensions(file);
      const thumbnailBlob = isVideoFile ? await captureVideoThumbnail(file) : undefined;
      const { file_id, upload_url } = await fetchUploadUrl(file);
      await uploadToStorage(upload_url, file, setUploadPct);

      let thumbnail_storage_key: string | undefined;
      if (thumbnailBlob) {
        const thumbFile = new File([thumbnailBlob], `${file.name}.thumb.jpg`, {
          type: "image/jpeg",
        });
        const thumbUpload = await fetchUploadUrl(thumbFile);
        await uploadToStorage(thumbUpload.upload_url, thumbFile, () => {});
        thumbnail_storage_key = thumbUpload.storage_key;
      }

      const asset = await registerVideo({
        file_id,
        title: file.name,
        ...(duration ? { duration_seconds: duration } : {}),
        ...(thumbnail_storage_key ? { thumbnail_storage_key } : {}),
        ...(dimensions ?? {}),
        ...(folderId ? { folder_id: folderId } : {}),
      });
      await onUploaded(asset ?? null, isVideoFile);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadPct(null);
    }
  }

  return { fileInputRef, uploadPct, uploadError, handleFilePicked };
}
