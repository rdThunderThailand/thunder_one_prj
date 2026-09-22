/** Run: node src/features/playlists/duration.check.mts */
import assert from "node:assert/strict";
import { formatDuration, totalDurationSeconds } from "./duration.ts";

assert.equal(formatDuration(0), "00:00:00");
assert.equal(formatDuration(140), "00:02:20");
assert.equal(formatDuration(3661), "01:01:01");
// Never renders a negative or fractional clock.
assert.equal(formatDuration(-5), "00:00:00");
assert.equal(formatDuration(9.9), "00:00:09");

const items = [
  { mediaAssetId: "a-1", durationSeconds: 10 },
  { mediaAssetId: "a-2", durationSeconds: null }, // falls back to the asset's own length
  { mediaAssetId: "a-3", durationSeconds: null }, // no asset length known → contributes 0
];

assert.equal(totalDurationSeconds(items, { "a-2": 15 }), 25);
assert.equal(totalDurationSeconds(items), 10);
assert.equal(totalDurationSeconds([]), 0);
// A null in the lookup is as good as missing.
assert.equal(totalDurationSeconds(items, { "a-2": null }), 10);

console.log("duration.check.mts — all assertions passed");
