"use client";

import { useRef, useState } from "react";
import type { MediaAsset } from "@/types/domain";
import { fetchMediaAsset } from "@/lib/api/media-api";
import { uploadAndRegisterAsset } from "@/features/media-workspace/publications/services/upload-api";
import { rejectUploadReason } from "@/features/media-workspace/publications/upload-limits";

/** Shared upload pipeline for the file-picker "Upload Asset" button in both the
 *  Publication and Playlist wizards: authorization → resumable TUS upload → (video only)
 *  a second upload for the generated thumbnail → register the asset. Callers own what
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
      const registered = await uploadAndRegisterAsset(file, { folderId, onProgress: setUploadPct });
      // Registration only hands back an id, so read the Asset itself for callers that
      // auto-select the thing they just uploaded.
      const asset = registered?.media_asset_id
        ? await fetchMediaAsset(registered.media_asset_id)
        : null;
      await onUploaded(asset, isVideoFile);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadPct(null);
    }
  }

  return { fileInputRef, uploadPct, uploadError, handleFilePicked };
}
