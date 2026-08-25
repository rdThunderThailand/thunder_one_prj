"use client";

import { useAssetUpload } from "@/features/media-workspace/assets/useAssetUpload";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { UploadIcon } from "@/components/ui/icons";
import { UPLOAD_ACCEPT_ATTR, UPLOAD_ACCEPT_LABEL } from "@/features/media-workspace/publications/upload-limits";
import type { MediaAsset } from "@/types/domain";
import { AssetPicker } from "./AssetPicker";
import { SelectedItems } from "./SelectedItems";
import {
  DEFAULT_IMAGE_DURATION_SECONDS,
  usePlaylistDraftStore,
} from "../store/usePlaylistDraftStore";

export function ContentStep({
  assets,
  loading,
  onAssetUploaded,
}: {
  assets: MediaAsset[];
  loading: boolean;
  onAssetUploaded: () => void | Promise<void>;
}) {
  const { items, playback, addItem, removeItem } = usePlaylistDraftStore();
  const selectedIds = items.map((i) => i.mediaAssetId);

  const toggle = (asset: MediaAsset) => {
    if (selectedIds.includes(asset.id)) {
      removeItem(asset.id);
      return;
    }
    const isVideo = asset.kind === "video";
    addItem({
      mediaAssetId: asset.id,
      title: asset.title,
      kind: asset.kind,
      // Videos keep null so the backend falls back to the clip's own length; images take
      // the wizard's default, which the operator can then override per row.
      durationSeconds: isVideo
        ? null
        : (playback.defaultImageDuration ?? DEFAULT_IMAGE_DURATION_SECONDS),
      transition: playback.defaultTransition ?? "fade",
    });
  };

  const { fileInputRef, uploadPct, uploadError, handleFilePicked } = useAssetUpload(
    async (asset) => {
      await onAssetUploaded();
      if (asset) toggle(asset);
    }
  );

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Content Library
          </h2>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept={UPLOAD_ACCEPT_ATTR}
              onChange={handleFilePicked}
              className="hidden"
            />
            <Button
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadPct !== null}
            >
              <UploadIcon className="h-3.5 w-3.5" />
              {uploadPct !== null ? `Uploading ${uploadPct}%` : "Upload Asset"}
            </Button>
          </div>
        </div>
        {uploadError && <p className="mb-3 text-xs text-red-500">{uploadError}</p>}
        {!uploadError && (
          <p className="mb-3 text-xs text-zinc-400">{UPLOAD_ACCEPT_LABEL}</p>
        )}
        <AssetPicker
          assets={assets}
          loading={loading}
          selectedIds={selectedIds}
          onToggle={toggle}
        />
      </Card>

      <Card className="p-5">
        <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Selected for Playlist ({items.length})
        </h2>
        <SelectedItems assets={assets} />
      </Card>
    </div>
  );
}
