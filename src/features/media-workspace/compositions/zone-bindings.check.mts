/** Run: node src/features/media-workspace/compositions/zone-bindings.check.mts */
import assert from "node:assert/strict";
import {
  DEFAULT_ZONE_PLAYBACK,
  applyPlaybackToAll,
  bindingsFromCompositionZones,
  defaultBinding,
  findUnboundZoneIds,
  isComplete,
  remapZoneBindings,
  toCompositionUpsertPayload,
  toSetZonesPayload,
  totalZoneDurationSeconds,
  type ZoneBindingDraft,
} from "./zone-bindings.ts";
import type { CompositionZone } from "./types/index.ts";

const zones = ["zone-main", "zone-side"];
const bindings: ZoneBindingDraft[] = [
  {
    layoutZoneId: "zone-main",
    source: "playlist",
    playlistId: "playlist-main",
    assetItems: [],
    playback: { playMode: "sequential", repeat: "loop", startFrom: "first" },
  },
  {
    layoutZoneId: "zone-side",
    source: "assets",
    playlistId: "playlist-side-implicit",
    assetItems: [
      { media_asset_id: "image-1", duration_seconds: 10, transition: "fade" },
      { media_asset_id: "video-1", duration_seconds: null, transition: "cut" },
    ],
    playback: { playMode: "shuffle", repeat: "once", startFrom: "resume" },
  },
];

// --- findUnboundZoneIds / isComplete ---------------------------------------

assert.deepEqual(findUnboundZoneIds(zones, bindings), []);
assert.deepEqual(findUnboundZoneIds(zones, bindings.slice(0, 1)), ["zone-side"]);
assert.equal(isComplete(zones, bindings), true);
assert.equal(isComplete(zones, bindings.slice(0, 1)), false);
assert.equal(isComplete([], []), false, "an empty Layout is never 'complete'");

// A "assets" binding with no playlistId yet (picked but not saved) is still unbound.
const unsavedAssetsBinding: ZoneBindingDraft = {
  layoutZoneId: "zone-side",
  source: "assets",
  playlistId: null,
  assetItems: [{ media_asset_id: "image-1", duration_seconds: 10, transition: "cut" }],
  playback: { playMode: "sequential", repeat: "loop", startFrom: "first" },
};
assert.deepEqual(findUnboundZoneIds(zones, [bindings[0]!, unsavedAssetsBinding]), ["zone-side"]);

// --- totalZoneDurationSeconds ----------------------------------------------

assert.equal(totalZoneDurationSeconds(bindings[1]!, { "video-1": 42 }, {}), 52);
assert.equal(totalZoneDurationSeconds(bindings[0]!, {}, { "playlist-main": 75 }), 75);
assert.equal(totalZoneDurationSeconds(bindings[0]!, {}, {}), 0, "an unresolved Playlist duration is 0, not undefined");

// --- toSetZonesPayload -------------------------------------------------------

assert.deepEqual(toSetZonesPayload(zones, bindings), {
  zones: [
    {
      layout_zone_id: "zone-main",
      playlist_id: "playlist-main",
      playback: { play_mode: "sequential", repeat: "loop", start_from: "first" },
    },
    {
      layout_zone_id: "zone-side",
      playlist_id: "playlist-side-implicit",
      playback: { play_mode: "shuffle", repeat: "once", start_from: "resume" },
    },
  ],
});

// An unbound Zone is simply absent — draft may be saved incomplete (ADR 0049 §6), never throws.
assert.deepEqual(toSetZonesPayload(zones, bindings.slice(0, 1)), {
  zones: [
    {
      layout_zone_id: "zone-main",
      playlist_id: "playlist-main",
      playback: { play_mode: "sequential", repeat: "loop", start_from: "first" },
    },
  ],
});
assert.deepEqual(toSetZonesPayload(zones, []), { zones: [] });

// --- toCompositionUpsertPayload ----------------------------------------------

assert.deepEqual(toCompositionUpsertPayload("  My Composition  ", "layout-1"), {
  name: "My Composition",
  layout_id: "layout-1",
});

// --- bindingsFromCompositionZones --------------------------------------------

const serverZones: CompositionZone[] = [
  {
    layout_zone_id: "zone-main",
    position: 0,
    name: "Main",
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    playlist_id: "playlist-main",
    playback: { play_mode: "shuffle", repeat: "once", start_from: "resume" },
  },
  {
    layout_zone_id: "zone-side",
    position: 1,
    name: "Ticker",
    x: 0,
    y: 0,
    width: 20,
    height: 20,
    playlist_id: null,
    playback: null,
  },
];

assert.deepEqual(bindingsFromCompositionZones(serverZones), [
  {
    layoutZoneId: "zone-main",
    source: "playlist",
    playlistId: "playlist-main",
    assetItems: [],
    playback: { playMode: "shuffle", repeat: "once", startFrom: "resume" },
  },
]);
assert.deepEqual(findUnboundZoneIds(["zone-main", "zone-side"], bindingsFromCompositionZones(serverZones)), ["zone-side"]);

console.log("zone-bindings.check.mts — all assertions passed");

// remapZoneBindings — ticket 25. A blank canvas or a copied preset holds client-minted Zone
// ids until media_layout_upsert has run; losing this remap silently unbinds every Zone the
// operator just filled, and nothing else in the save path would notice.
const lz = (id: string | undefined, position: number) =>
  ({ id, position, name: `Zone ${position}`, x: 0, y: position * 10, width: 100, height: 10 });
const draft = (layoutZoneId: string): ZoneBindingDraft => ({
  layoutZoneId, source: "assets", playlistId: null, assetItems: [], playback: { ...DEFAULT_ZONE_PLAYBACK },
});
const clientZones = [lz("client-a", 0), lz("client-b", 1)];
const savedZones = [lz("db-a", 0), lz("db-b", 1)];

assert.deepEqual(
  remapZoneBindings([draft("client-a"), draft("client-b")], clientZones, savedZones).map((b) => b.layoutZoneId),
  ["db-a", "db-b"],
);
// An id with no positional counterpart is left alone, not dropped or blanked.
assert.deepEqual(
  remapZoneBindings([draft("unknown")], clientZones, savedZones).map((b) => b.layoutZoneId),
  ["unknown"],
);
// Fewer targets than sources: the unmatched binding must not steal a neighbour's id.
assert.deepEqual(
  remapZoneBindings([draft("client-a"), draft("client-b")], clientZones, [lz("db-a", 0)]).map((b) => b.layoutZoneId),
  ["db-a", "client-b"],
);
// A source Zone with no id of its own contributes no mapping.
assert.deepEqual(
  remapZoneBindings([draft("db-b")], [lz(undefined, 0), lz("client-b", 1)], savedZones).map((b) => b.layoutZoneId),
  ["db-b"],
);
// Everything except layoutZoneId survives untouched.
const bound: ZoneBindingDraft = { ...draft("client-a"), source: "playlist", playlistId: "p1", playlistName: "News" };
assert.deepEqual(remapZoneBindings([bound], clientZones, savedZones)[0], { ...bound, layoutZoneId: "db-a" });

console.log("zone-bindings.check.mts — remap assertions passed");

// --- applyPlaybackToAll — ticket 27's "Apply to All Zones" -------------------

const newPlayback = { playMode: "shuffle", repeat: "once", startFrom: "resume" } as const;

// An already-bound Zone keeps its content, only playback changes.
const applied = applyPlaybackToAll(zones, bindings, newPlayback);
assert.deepEqual(
  applied.find((b) => b.layoutZoneId === "zone-main"),
  { ...bindings[0], playback: newPlayback },
);
assert.deepEqual(
  applied.find((b) => b.layoutZoneId === "zone-side"),
  { ...bindings[1], playback: newPlayback },
);

// A Zone with no binding yet gets a placeholder carrying the playback and no content —
// `toSetZonesPayload` must still drop it, so applying does not fabricate a bound Zone.
const withUnbound = applyPlaybackToAll(["zone-main", "zone-unbound"], [bindings[0]!], newPlayback);
const placeholder = withUnbound.find((b) => b.layoutZoneId === "zone-unbound")!;
assert.deepEqual(placeholder, { ...defaultBinding("zone-unbound"), playback: newPlayback });
assert.deepEqual(toSetZonesPayload(["zone-main", "zone-unbound"], withUnbound).zones.map((z) => z.layout_zone_id), ["zone-main"]);

console.log("zone-bindings.check.mts — applyPlaybackToAll assertions passed");
