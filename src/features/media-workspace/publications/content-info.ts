// Read-only facts for the Prepare Content frame's Content Info rail. Branch-specific by design
// (ADR 0072 §9): a Playlist has no single resolution and a Composition's duration is per-Zone,
// so one flat shape would assert what it never measured.

import type { MediaAsset } from "@/types/domain";
import type { StagePreview } from "../preview/composition-preview";
import { computePlaylistTotals, type PlaylistTotals } from "../playlists/totals.ts";
import { zoneSchedule } from "../preview/preview-clock.ts";

type AssetsById = Record<string, MediaAsset | undefined>;

/** Item count, total duration and total size for a Playlist publication. `isPartial` is carried
 *  through from `computePlaylistTotals` — a size the join could not fully resolve. */
export function playlistFacts(preview: StagePreview, assetsById: AssetsById): PlaylistTotals {
  const items = (preview.zones[0]?.items ?? []).map((item) => ({
    media_asset_id: item.mediaAssetId,
    duration_seconds: item.durationSeconds ?? null,
  }));
  return computePlaylistTotals(items, assetsById);
}

export type ZoneDuration = { id: string; name: string; seconds: number };

/** One playback-cycle length per Zone. Item durations fall back to the asset's own length the
 *  same way `PreviewStage` resolves them, so a video with no per-item override still counts. */
export function compositionZoneDurations(preview: StagePreview, assetsById: AssetsById): ZoneDuration[] {
  return preview.zones.map((zone) => {
    const items = zone.items.map((item) => ({
      ...item,
      durationSeconds: item.durationSeconds ?? assetsById[item.mediaAssetId]?.duration_seconds ?? null,
    }));
    return { id: zone.id, name: zone.name, seconds: zoneSchedule(items, zone.playback, zone.id).totalSeconds };
  });
}

export type ZonePlayback = ZoneDuration & {
  playMode: "sequential" | "shuffle";
  repeat: "loop" | "once";
  /** The Zone's own media-fit override (ADR 0064); null when it inherits. */
  fit: string | null;
  isMuted: boolean;
  /** A Zone with no items has nothing to play, so its play mode is not offered for editing. */
  hasContent: boolean;
};

/** What the Create wizard's How to Play shows for a Layout: each Zone's resolved playback, read-only. */
export function compositionZonePlayback(preview: StagePreview, assetsById: AssetsById): ZonePlayback[] {
  const durations = compositionZoneDurations(preview, assetsById);
  return preview.zones.map((zone, index) => ({
    ...durations[index],
    playMode: zone.playback?.playMode ?? "sequential",
    repeat: zone.playback?.repeat ?? "loop",
    fit: zone.playback?.zoneMediaFitOverride ?? null,
    isMuted: zone.playback?.zoneMuted ?? false,
    hasContent: zone.items.length > 0,
  }));
}
