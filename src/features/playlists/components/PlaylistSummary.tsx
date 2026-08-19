"use client";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { MediaThumb } from "@/components/ui/MediaThumb";
import { usePreviewUrls } from "@/hooks/usePreviewUrls";
import { useMemo } from "react";
import type { Campaign, MediaAsset, Tag } from "@/types/domain";
import { usePlaylistDraftStore } from "../store/usePlaylistDraftStore";
import { formatDuration, totalDurationSeconds } from "../duration";
import { resolveCoverAssetId } from "../metadata";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <span className="text-sm text-zinc-500 dark:text-zinc-400">{label}</span>
      <span className="text-right text-sm font-medium text-zinc-900 dark:text-zinc-100">
        {value}
      </span>
    </div>
  );
}

export function PlaylistSummary({
  assets,
  campaigns,
  workspaceTags,
}: {
  assets: MediaAsset[];
  campaigns: Campaign[];
  workspaceTags: Tag[];
}) {
  const { name, info, playback, items } = usePlaylistDraftStore();

  const assetDurations = useMemo(
    () => Object.fromEntries(assets.map((a) => [a.id, a.duration_seconds])),
    [assets]
  );

  const coverId = resolveCoverAssetId(
    info.coverAssetId,
    items.map((item, index) => ({ media_asset_id: item.mediaAssetId, position: index }))
  );
  const coverIds = useMemo(() => (coverId ? [coverId] : []), [coverId]);
  const previews = usePreviewUrls(coverIds);
  const coverAsset = assets.find((a) => a.id === coverId);

  const campaignName = campaigns.find((c) => c.id === info.campaignId)?.name;
  const tagNames = (info.tags ?? []).map(
    (id) => workspaceTags.find((t) => t.id === id)?.name ?? id
  );

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-5">
        <h2 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Playlist Summary
        </h2>

        <div className="mb-3 flex items-center gap-3">
          <MediaThumb
            url={coverId ? previews.urls[coverId] : undefined}
            kind={coverAsset?.kind}
            alt={name || "Playlist cover"}
            className="h-16 w-16"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {name || <span className="text-zinc-400">Untitled playlist</span>}
            </p>
            {coverAsset?.title && (
              <p className="truncate text-xs text-zinc-400">Cover: {coverAsset.title}</p>
            )}
          </div>
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          <Row label="Items" value={items.length} />
          <Row
            label="Total Duration"
            value={formatDuration(totalDurationSeconds(items, assetDurations))}
          />
          <Row label="Playlist Type" value={info.playlistType ?? "—"} />
          <Row label="Resolution" value={info.resolution ?? "—"} />
          <Row label="Frame Rate" value={info.frameRate ? `${info.frameRate} fps` : "—"} />
          <Row label="Play Mode" value={playback.playMode ?? "—"} />
          <Row label="Repeat" value={playback.repeat ?? "—"} />
          <Row
            label="Start Playback From"
            value={playback.startFrom === "resume" ? "Resume last successful item" : "First item"}
          />
          <Row
            label="Default Transition"
            value={
              playback.defaultTransition
                ? `${playback.defaultTransition} (${playback.transitionDuration ?? 1}s)`
                : "—"
            }
          />
          <Row label="Campaign" value={campaignName ?? "—"} />
        </div>

        {tagNames.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5 border-t border-zinc-100 pt-3 dark:border-zinc-800">
            {tagNames.map((tag) => (
              <Badge key={tag} color="indigo" variant="pill">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
