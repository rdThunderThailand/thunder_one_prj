// Composition Zone-binding rules — the one pure module ticket 03 calls for: which Zones are
// unbound, per-Zone duration totals, completeness against the Layout, and the draft → payload
// mapping for media_composition_set_zones. Plain functions over plain data, no React.
//
// Rewritten from the superseded model's src/features/media-workspace/publications/zone-bindings.ts,
// not extended. `hasLayoutZoneDrift` does not survive here — it was a set difference over Zone
// ids, wrong in both directions under ADR 0049 §9's stable ids; drift is ticket 06, a revision
// comparison, not a client-side computation (ADR 0049 §7, §11).

import type { LayoutZone } from "../layouts/types";
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
  /** ADR 0063 §2 3b: minted into the draft *before* `media_playlist_upsert` runs and kept
   *  across a failed save, so a re-clicked Save re-sends the same key instead of a fresh one
   *  and the RPC returns the Playlist it already made. Absent until a Zone needs one. */
  idempotencyKey?: string;
  /** Carried for display so a bound draft stays legible without a second lookup. */
  playlistName?: string;
  assetItems: CompositionAssetItem[];
  playback: ZonePlayback;
};

/** Moved here from `ZoneContentPicker.tsx` (ticket 27) — a plain factory has no reason to
 *  live in a "use client" component file, and ticket 27's `applyPlaybackToAll` needs it too. */
export function defaultBinding(layoutZoneId: string): ZoneBindingDraft {
  return {
    layoutZoneId,
    source: "playlist",
    playlistId: null,
    assetItems: [],
    playback: { ...DEFAULT_ZONE_PLAYBACK },
  };
}

/** Ticket 27's "Apply to All Zones": sets `playback` on every Zone's binding, replacing no
 *  content. A Zone with no binding yet gets a placeholder — no `playlistId`, so it changes
 *  nothing on save — but the playback sticks once the operator does bind it, since binding
 *  a Zone always spreads its existing draft (see ZoneContentPicker's `onSelect`). */
export function applyPlaybackToAll(
  layoutZoneIds: string[],
  bindings: ZoneBindingDraft[],
  playback: ZonePlayback,
): ZoneBindingDraft[] {
  return layoutZoneIds.map((zoneId) => {
    const existing = bindings.find((binding) => binding.layoutZoneId === zoneId);
    return existing ? { ...existing, playback } : { ...defaultBinding(zoneId), playback };
  });
}

/** Replace the draft for `next`'s Zone, or append it if that Zone has none yet. */
export const upsertBinding = (prev: ZoneBindingDraft[], next: ZoneBindingDraft): ZoneBindingDraft[] =>
  prev.some((b) => b.layoutZoneId === next.layoutZoneId)
    ? prev.map((b) => (b.layoutZoneId === next.layoutZoneId ? next : b))
    : [...prev, next];

/** A Zone whose picked assets still have to become an inline Playlist on the next save. */
function needsInlinePlaylist(binding: ZoneBindingDraft): boolean {
  return binding.source === "assets" && binding.assetItems.length > 0 && !binding.playlistId;
}

/** ADR 0063 §2 3b: every Zone that will need an inline Playlist is given its idempotency key
 *  *before* the first write, so a re-clicked Save after a partial failure re-sends the same
 *  key and `media_playlist_upsert` hands back the row it already made instead of a second one.
 *  Returns the input untouched when every key is already there, so the caller can skip a
 *  pointless state update. */
export function withIdempotencyKeys(bindings: ZoneBindingDraft[]): ZoneBindingDraft[] {
  const missing = (binding: ZoneBindingDraft) => needsInlinePlaylist(binding) && !binding.idempotencyKey;
  if (!bindings.some(missing)) return bindings;
  return bindings.map((binding) => (missing(binding) ? { ...binding, idempotencyKey: crypto.randomUUID() } : binding));
}

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

/** Re-points bindings from the Zone ids the editor was holding onto the ids the save just
 *  assigned. Positional, because a fresh insert gives no other correspondence: a blank
 *  canvas or a copied preset carries client-minted ids until `media_layout_upsert` has run.
 *  A source id with no counterpart is left as it is rather than dropped — losing one here
 *  silently unbinds a Zone the operator had already filled. */
export function remapZoneBindings(
  bindings: ZoneBindingDraft[],
  sourceZones: LayoutZone[],
  targetZones: LayoutZone[],
): ZoneBindingDraft[] {
  const idsBySourceId = new Map<string, string>();
  sourceZones.forEach((zone, index) => {
    const targetId = targetZones[index]?.id;
    if (zone.id && targetId) idsBySourceId.set(zone.id, targetId);
  });
  return bindings.map((binding) => ({
    ...binding,
    layoutZoneId: idsBySourceId.get(binding.layoutZoneId) ?? binding.layoutZoneId,
  }));
}
