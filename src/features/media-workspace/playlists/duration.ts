import type { DraftItem, PlaylistPlayback } from "./types";

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

/**
 * Duration of one playback loop: media duration plus the transitions that actually
 * play. `repeat: "loop"` adds the transition back into item 1 after the last item
 * (skipped for a single-item playlist — no self-transition). `repeat: "once"` counts
 * only the transitions between items, matching AC 10-12 on ticket 86d3xxk5u.
 */
export function durationPerLoopSeconds(
  items: Pick<DraftItem, "mediaAssetId" | "durationSeconds" | "transition">[],
  assetDurations: Record<string, number | null | undefined> = {},
  playback: Pick<PlaylistPlayback, "repeat" | "transitionDuration"> = {}
): number {
  const media = totalDurationSeconds(items, assetDurations);
  if (items.length === 0) return media;

  const transitionSeconds = (transition: DraftItem["transition"]) =>
    transition === "cut" ? 0 : playback.transitionDuration ?? 1;

  // Transitions counted: the incoming transition of every item except the first,
  // plus (only when looping with more than one item) the first item's transition
  // again, representing the wrap back to it.
  let transitions = items.slice(1).reduce((sum, item) => sum + transitionSeconds(item.transition), 0);
  if (playback.repeat === "loop" && items.length > 1) {
    transitions += transitionSeconds(items[0].transition);
  }
  return media + transitions;
}
