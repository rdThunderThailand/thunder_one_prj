// Composition Zone-binding rules — the one pure module ticket 03 calls for: which Zones are
// unbound, per-Zone duration totals, completeness against the Layout, and the draft → payload
// mapping for media_composition_set_zones. Plain functions over plain data, no React.
//
// Rewritten from the superseded model's src/features/media-workspace/publications/zone-bindings.ts,
// not extended. `hasLayoutZoneDrift` does not survive here — it was a set difference over Zone
// ids, wrong in both directions under ADR 0049 §9's stable ids; drift is ticket 06, a revision
// comparison, not a client-side computation (ADR 0049 §7, §11).

import type { CompositionAssetItem, CompositionZone } from "./types";

export type ZonePlayback = {
  playMode: "sequential" | "shuffle";
  repeat: "loop" | "once";
  startFrom: "first" | "resume";
};

export const DEFAULT_ZONE_PLAYBACK: ZonePlayback = {
  playMode: "sequential",
  repeat: "loop",
  startFrom: "first",
};

export type ZoneBindingDraft = {
  layoutZoneId: string;
  source: "playlist" | "assets";
  /** Existing Playlist id, or the implicit Playlist id after picked assets are first saved. */
  playlistId: string | null;
  /** Carried for display so a bound draft stays legible without a second lookup. */
  playlistName?: string;
  assetItems: CompositionAssetItem[];
  playback: ZonePlayback;
};

export type SetZonesPayload = {
  zones: Array<{
    layout_zone_id: string;
    playlist_id: string;
    playback: {
      play_mode: ZonePlayback["playMode"];
      repeat: ZonePlayback["repeat"];
      start_from: ZonePlayback["startFrom"];
    };
  }>;
};

function hasContent(binding: ZoneBindingDraft | undefined): boolean {
  if (!binding) return false;
  if (binding.source === "playlist") return Boolean(binding.playlistId);
  return binding.assetItems.length > 0;
}

/** A Zone is bound once it resolves to a Playlist id — `source: "assets"` with items still
 *  picked but not yet saved as an inline Playlist counts as unbound (nothing to send yet). */
function isBound(binding: ZoneBindingDraft | undefined): boolean {
  return Boolean(binding?.playlistId);
}

export function findUnboundZoneIds(
  layoutZoneIds: string[],
  bindings: ZoneBindingDraft[],
): string[] {
  return layoutZoneIds.filter((zoneId) => {
    const binding = bindings.find((candidate) => candidate.layoutZoneId === zoneId);
    return !isBound(binding);
  });
}

/** Completeness against the Layout — every Zone must resolve to a saved Playlist before the
 *  Composition may activate (ADR 0049 §6, §10). */
export function isComplete(layoutZoneIds: string[], bindings: ZoneBindingDraft[]): boolean {
  return layoutZoneIds.length > 0 && findUnboundZoneIds(layoutZoneIds, bindings).length === 0;
}

export function totalZoneDurationSeconds(
  binding: ZoneBindingDraft,
  assetDurations: Record<string, number | undefined>,
  playlistDurations: Record<string, number | undefined>,
): number {
  if (binding.source === "playlist") {
    return binding.playlistId ? (playlistDurations[binding.playlistId] ?? 0) : 0;
  }
  return binding.assetItems.reduce(
    (total, item) => total + (item.duration_seconds ?? assetDurations[item.media_asset_id] ?? 0),
    0,
  );
}

/** `media_composition_set_zones` replaces the whole binding set — an unbound or
 *  not-yet-content-having Zone is simply absent from the payload (§6: draft may be incomplete). */
export function toSetZonesPayload(
  layoutZoneIds: string[],
  bindings: ZoneBindingDraft[],
): SetZonesPayload {
  return {
    zones: layoutZoneIds
      .map((layoutZoneId) => bindings.find((candidate) => candidate.layoutZoneId === layoutZoneId))
      .filter((binding): binding is ZoneBindingDraft => hasContent(binding) && Boolean(binding?.playlistId))
      .map((binding) => ({
        layout_zone_id: binding.layoutZoneId,
        playlist_id: binding.playlistId as string,
        playback: {
          play_mode: binding.playback.playMode,
          repeat: binding.playback.repeat,
          start_from: binding.playback.startFrom,
        },
      })),
  };
}

export function toCompositionUpsertPayload(name: string, layoutId: string): { name: string; layout_id: string } {
  return { name: name.trim(), layout_id: layoutId };
}

/** `media_composition_get`'s Zone rows → the editor's binding drafts, one binding per Zone
 *  that already has a Playlist. A Zone with `playlist_id: null` stays absent from `bindings`,
 *  which is exactly what `findUnboundZoneIds` expects. */
export function bindingsFromCompositionZones(zones: CompositionZone[]): ZoneBindingDraft[] {
  return zones
    .filter((zone): zone is CompositionZone & { playlist_id: string } => zone.playlist_id !== null)
    .map((zone) => ({
      layoutZoneId: zone.layout_zone_id,
      source: "playlist",
      playlistId: zone.playlist_id,
      assetItems: [],
      playback: zone.playback
        ? {
            playMode: zone.playback.play_mode,
            repeat: zone.playback.repeat,
            startFrom: zone.playback.start_from,
          }
        : { ...DEFAULT_ZONE_PLAYBACK },
    }));
}
