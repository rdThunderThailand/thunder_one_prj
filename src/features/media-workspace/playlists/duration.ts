import type { DraftItem } from "./types";

export function formatDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  return [hours, minutes, seconds].map((n) => String(n).padStart(2, "0")).join(":");
}

/** `assetDurations` maps media_asset_id → the asset's own length, for items with no override. */
export function totalDurationSeconds(
  items: Pick<DraftItem, "mediaAssetId" | "durationSeconds">[],
  assetDurations: Record<string, number | null | undefined> = {}
): number {
  return items.reduce((sum, item) => {
    const resolved = item.durationSeconds ?? assetDurations[item.mediaAssetId] ?? 0;
    return sum + Math.max(0, resolved);
  }, 0);
}
