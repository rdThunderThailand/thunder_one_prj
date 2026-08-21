// Totals row for the playlist detail table. File size and name/resolution come from a
// join against `fetchMediaAssets()` — a playlist item alone carries none of that
// (docs/adr/0020). Some assets in the join may be missing (deleted, join failed to
// load, or belong to another tenant); the total then understates rather than lies.

import type { MediaAsset } from "@/types/domain";
import type { PlaylistItem } from "./types";
import { formatDuration, totalDurationSeconds } from "./duration.ts";

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

export type PlaylistTotals = {
  fileCount: number;
  /** Suffixed with "+" when at least one item's asset was not found in the join. */
  sizeLabel: string;
  isPartial: boolean;
  durationLabel: string;
};

export function computePlaylistTotals(
  items: Pick<PlaylistItem, "media_asset_id" | "duration_seconds">[],
  assetsById: Record<string, MediaAsset | undefined>
): PlaylistTotals {
  let totalBytes = 0;
  let isPartial = false;
  const assetDurations: Record<string, number | null | undefined> = {};

  for (const item of items) {
    const asset = assetsById[item.media_asset_id];
    assetDurations[item.media_asset_id] = asset?.duration_seconds;
    const size = asset?.file?.file_size_bytes;
    if (size == null) {
      isPartial = true;
      continue;
    }
    totalBytes += size;
  }

  const durationSeconds = totalDurationSeconds(
    items.map((i) => ({ mediaAssetId: i.media_asset_id, durationSeconds: i.duration_seconds ?? null })),
    assetDurations
  );

  return {
    fileCount: items.length,
    sizeLabel: `${formatBytes(totalBytes)}${isPartial ? "+" : ""}`,
    isPartial,
    durationLabel: formatDuration(durationSeconds),
  };
}
