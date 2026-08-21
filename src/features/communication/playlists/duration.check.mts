/** Run: node src/features/playlists/duration.check.mts */
import assert from "node:assert/strict";
import { durationPerLoopSeconds, formatDuration, totalDurationSeconds } from "./duration.ts";

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

// durationPerLoopSeconds: loop, 3 items, fade transitions cost 2s each — items 2 and 3's
// incoming transitions plus the wrap back into item 1.
const loopItems = [
  { mediaAssetId: "a-1", durationSeconds: 10, transition: "fade" as const },
  { mediaAssetId: "a-2", durationSeconds: 10, transition: "fade" as const },
  { mediaAssetId: "a-3", durationSeconds: 10, transition: "fade" as const },
];
assert.equal(
  durationPerLoopSeconds(loopItems, {}, { repeat: "loop", transitionDuration: 2 }),
  36 // 30 media + (2 + 2) between items + 2 wrap
);

// A single-item playlist never counts a self-transition, loop or not.
assert.equal(
  durationPerLoopSeconds(
    [{ mediaAssetId: "a-1", durationSeconds: 10, transition: "fade" as const }],
    {},
    { repeat: "loop", transitionDuration: 2 }
  ),
  10
);

// Play once: no wrap transition after the last item.
assert.equal(
  durationPerLoopSeconds(loopItems, {}, { repeat: "once", transitionDuration: 2 }),
  34 // 30 media + (2 + 2) between items, no wrap
);

// A "cut" transition costs 0 seconds regardless of transitionDuration.
const cutItems = [
  { mediaAssetId: "a-1", durationSeconds: 10, transition: "cut" as const },
  { mediaAssetId: "a-2", durationSeconds: 10, transition: "cut" as const },
];
assert.equal(
  durationPerLoopSeconds(cutItems, {}, { repeat: "loop", transitionDuration: 5 }),
  20
);

console.log("duration.check.mts — all assertions passed");
