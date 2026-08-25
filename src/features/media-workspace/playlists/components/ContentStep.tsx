"use client";

import { Card } from "@/components/ui/Card";
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
}: {
  assets: MediaAsset[];
  loading: boolean;
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

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-5">
        <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Content Library
        </h2>
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
