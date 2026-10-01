/** Run: node src/features/media-workspace/publications/content-info.check.mts */
import assert from "node:assert/strict";
import { playlistFacts, compositionZoneDurations, compositionZonePlayback } from "./content-info.ts";
import type { StagePreview } from "../preview/composition-preview.ts";
import type { MediaAsset } from "../../../types/domain.ts";

const assetsById: Record<string, MediaAsset | undefined> = {
  "a-1": { id: "a-1", duration_seconds: 8, file: { file_size_bytes: 1_048_576 } },
  "a-2": { id: "a-2", duration_seconds: 12 }, // no size → understates, isPartial
};

const playlistPreview: StagePreview = {
  aspectRatio: "16:9",
  referenceResolution: null,
  zones: [
    {
      id: "z", name: "Playlist", x: 0, y: 0, width: 100, height: 100,
      items: [
        { mediaAssetId: "a-1", durationSeconds: 5 }, // per-item override wins
        { mediaAssetId: "a-2", durationSeconds: null }, // falls back to asset's 12s
      ],
    },
  ],
};

const facts = playlistFacts(playlistPreview, assetsById);
assert.equal(facts.fileCount, 2);
assert.equal(facts.isPartial, true);
assert.equal(facts.durationLabel, "00:00:17"); // 5 + 12

const compositionPreview: StagePreview = {
  aspectRatio: "16:9",
  referenceResolution: "1920x1080",
  zones: [
    { id: "main", name: "Main", x: 0, y: 0, width: 70, height: 100, items: [{ mediaAssetId: "a-1", durationSeconds: null }] },
    { id: "side", name: "Side", x: 70, y: 0, width: 30, height: 100, items: [{ mediaAssetId: "a-2", durationSeconds: 4 }] },
  ],
};

const zones = compositionZoneDurations(compositionPreview, assetsById);
assert.deepEqual(zones.map((z) => z.name), ["Main", "Side"]);
assert.equal(zones[0].seconds, 8); // resolved from a-1's own length
assert.equal(zones[1].seconds, 4);

// How to Play facts per Zone (#199): the resolved play mode / repeat, the Zone's own fit and mute.
const playbackPreview: StagePreview = {
  ...compositionPreview,
  zones: [
    ...compositionPreview.zones,
    {
      id: "foot", name: "Footer", x: 0, y: 90, width: 100, height: 10,
      items: [{ mediaAssetId: "a-2", durationSeconds: 6 }],
      playback: { playMode: "shuffle", repeat: "once", zoneMediaFitOverride: "fill", zoneMuted: true },
    },
  ],
};
const rows = compositionZonePlayback(playbackPreview, assetsById);
assert.deepEqual(rows.map((r) => r.name), ["Main", "Side", "Footer"]);
// A Zone with no playback block reads the player defaults, never "undefined".
assert.deepEqual([rows[0].playMode, rows[0].repeat, rows[0].fit, rows[0].isMuted], ["sequential", "loop", null, false]);
assert.deepEqual(rows.map((r) => r.hasContent), [true, true, true]);
assert.deepEqual([rows[2].playMode, rows[2].repeat, rows[2].fit, rows[2].isMuted, rows[2].seconds], ["shuffle", "once", "fill", true, 6]);

console.log("content-info.check.mts — all assertions passed");
