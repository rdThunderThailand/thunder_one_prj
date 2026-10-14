import assert from "node:assert/strict";
import { previewFrameAt, zoneSchedule } from "./preview-clock.ts";

// Two items, default transition (fade/1s), repeat: loop. ADR 0094: fades add no time, so the cycle
// is media-only — the loop_duration the device receives. fades = [1, 1]; totalSeconds = 10 + 10.
const loopItems = [
  { mediaAssetId: "a", durationSeconds: 10 },
  { mediaAssetId: "b", durationSeconds: 10 },
];
const loopSchedule = zoneSchedule(loopItems, { playMode: "sequential", repeat: "loop" }, "zone-loop");
assert.deepEqual(loopSchedule.order, [0, 1]);
assert.deepEqual(loopSchedule.starts, [0, 10]);
assert.deepEqual(loopSchedule.fades, [1, 1]);
assert.equal(loopSchedule.totalSeconds, 20);

// The fade sits inside the incoming slot, [starts[1], starts[1] + fades[1]) = [10, 11), and the
// incoming item plays from its own start while the outgoing one holds its last frame.
const midFade = previewFrameAt(loopSchedule, loopItems, 10.5);
assert.equal(midFade.itemIndex, 1);
assert.equal(midFade.offsetSeconds, 0.5);
assert.equal(midFade.transition?.outgoingIndex, 0);
assert.equal(midFade.transition?.outgoingOffsetSeconds, 10);
assert.equal(midFade.transition?.progress, 0.5);

// After the fade the incoming item keeps the time it played during it — no timeline shift.
const afterFade = previewFrameAt(loopSchedule, loopItems, 15);
assert.equal(afterFade.itemIndex, 1);
assert.equal(afterFade.offsetSeconds, 5);
assert.equal(afterFade.transition, null);

// The outgoing item is never cut short: item 0 plays undisturbed to its boundary.
const beforeBoundary = previewFrameAt(loopSchedule, loopItems, 9.9);
assert.equal(beforeBoundary.itemIndex, 0);
assert.equal(beforeBoundary.transition, null);

// The cycle starts clean on the first item — a paused preview at t = 0 shows item 0, not a wrap
// fade parked on the last item. Loop wraps: t = totalSeconds behaves like t = 0.
const atStart = previewFrameAt(loopSchedule, loopItems, 0.5);
assert.equal(atStart.itemIndex, 0);
assert.equal(atStart.transition, null);
assert.deepEqual(previewFrameAt(loopSchedule, loopItems, 20), previewFrameAt(loopSchedule, loopItems, 0));

// repeat: once — same length, nothing to fade in from at the start, holds the last frame after.
const onceSchedule = zoneSchedule(loopItems, { playMode: "sequential", repeat: "once" }, "zone-once");
assert.equal(onceSchedule.totalSeconds, 20);
assert.equal(previewFrameAt(onceSchedule, loopItems, 0.5).transition, null);
const ended = previewFrameAt(onceSchedule, loopItems, 25);
assert.equal(ended.ended, true);
assert.equal(ended.itemIndex, 1);
assert.equal(ended.offsetSeconds, 10);
assert.equal(previewFrameAt(onceSchedule, loopItems, 19.9).ended, false);

// "cut" is 0 regardless of any stored transitionDurationSeconds.
const cutItems = [
  { mediaAssetId: "a", durationSeconds: 10 },
  { mediaAssetId: "b", durationSeconds: 10, transition: "cut", transitionDurationSeconds: 5 },
];
const cutSchedule = zoneSchedule(cutItems, { repeat: "loop" }, "zone-cut");
assert.deepEqual(cutSchedule.fades, [1, 0]);
assert.equal(cutSchedule.totalSeconds, 20);
const atCut = previewFrameAt(cutSchedule, cutItems, 10);
assert.equal(atCut.transition, null);
assert.equal(atCut.itemIndex, 1);

// A fade longer than its item is capped at the item, as the player clamps it.
const longFade = zoneSchedule(
  [{ mediaAssetId: "a", durationSeconds: 10 }, { mediaAssetId: "b", durationSeconds: 2, transitionDurationSeconds: 5 }],
  { repeat: "loop" },
  "zone-long",
);
assert.deepEqual(longFade.fades, [1, 2]);

// Seeded shuffle: deterministic per Zone id, across repeated calls and independent of item duration.
const shuffleItems = ["a", "b", "c", "d", "e"].map((id) => ({ mediaAssetId: id, durationSeconds: 5 }));
const shufflePlayback = { playMode: "shuffle" as const, repeat: "loop" as const };
const s1 = zoneSchedule(shuffleItems, shufflePlayback, "zone-42");
const s2 = zoneSchedule(shuffleItems, shufflePlayback, "zone-42");
assert.deepEqual(s1.order, s2.order);
const sOther = zoneSchedule(shuffleItems, shufflePlayback, "zone-alpha");
assert.notDeepEqual(s1.order, sOther.order);

// Pure function of t: scrubbing backwards then forwards again returns the identical frame.
const forward = previewFrameAt(loopSchedule, loopItems, 15);
previewFrameAt(loopSchedule, loopItems, 3); // scrub backwards
const forwardAgain = previewFrameAt(loopSchedule, loopItems, 15);
assert.deepEqual(forward, forwardAgain);

console.log("preview-clock.check.mts OK");
