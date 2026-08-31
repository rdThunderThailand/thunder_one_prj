/** Run: node src/features/media-workspace/compositions/zone-bindings.check.mts */
import assert from "node:assert/strict";
import {
  bindingsFromCompositionZones,
  findUnboundZoneIds,
  isComplete,
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
