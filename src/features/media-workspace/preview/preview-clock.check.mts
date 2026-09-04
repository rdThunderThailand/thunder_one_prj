import assert from "node:assert/strict";
import { previewFrameAt, zoneLoopDurationSeconds, zoneSchedule } from "./preview-clock.ts";

const main = [
  { mediaAssetId: "a", durationSeconds: 12 },
  { mediaAssetId: "b", durationSeconds: 18 },
];
assert.equal(zoneLoopDurationSeconds(main), 30);

// Two items, default transition (fade/1s), repeat: loop. fades = [1, 1]; totalSeconds = 10+10+1+1 = 22.
const loopItems = [
  { mediaAssetId: "a", durationSeconds: 10 },
  { mediaAssetId: "b", durationSeconds: 10 },
];
const loopSchedule = zoneSchedule(loopItems, { playMode: "sequential", repeat: "loop" }, "zone-loop");
assert.deepEqual(loopSchedule.order, [0, 1]);
assert.deepEqual(loopSchedule.starts, [0, 10]);
assert.deepEqual(loopSchedule.fades, [1, 1]);
assert.equal(loopSchedule.totalSeconds, 22);

// k = 0 has no fade at cycle start.
const atStart = previewFrameAt(loopSchedule, loopItems, 0);
assert.equal(atStart.transition, null);
assert.equal(atStart.itemIndex, 0);
assert.equal(atStart.offsetSeconds, 0);

// Interior transition window [starts[1], starts[1] + fades[1]) = [10, 11).
const midFade = previewFrameAt(loopSchedule, loopItems, 10.5);
assert.equal(midFade.itemIndex, 1);
assert.equal(midFade.offsetSeconds, 0);
assert.ok(midFade.transition);
assert.equal(midFade.transition?.outgoingIndex, 0);
assert.equal(midFade.transition?.outgoingOffsetSeconds, 10);
assert.equal(midFade.transition?.progress, 0.5);

// After the interior fade, item 1 plays normally.
const afterFade = previewFrameAt(loopSchedule, loopItems, 15);
assert.equal(afterFade.itemIndex, 1);
assert.equal(afterFade.offsetSeconds, 4);
assert.equal(afterFade.transition, null);

// Wrap fade sits at the end of the cycle: [totalSeconds - fades[0], totalSeconds) = [21, 22).
const wrapMid = previewFrameAt(loopSchedule, loopItems, 21.5);
assert.equal(wrapMid.itemIndex, 0);
assert.equal(wrapMid.offsetSeconds, 0);
assert.ok(wrapMid.transition);
assert.equal(wrapMid.transition?.outgoingIndex, 1);
assert.equal(wrapMid.transition?.outgoingOffsetSeconds, 10);
assert.equal(wrapMid.transition?.progress, 0.5);

// Loop wraps: t = totalSeconds behaves like t = 0.
assert.deepEqual(previewFrameAt(loopSchedule, loopItems, 22), previewFrameAt(loopSchedule, loopItems, 0));

// repeat: once — same items, no wrap fade, clock clamps and holds the last frame past its cycle.
const onceSchedule = zoneSchedule(loopItems, { playMode: "sequential", repeat: "once" }, "zone-once");
assert.equal(onceSchedule.totalSeconds, 21); // 10 + 10 + fades[1](1), no wrap fade
const ended = previewFrameAt(onceSchedule, loopItems, 25);
assert.equal(ended.ended, true);
assert.equal(ended.itemIndex, 1);
assert.equal(ended.offsetSeconds, 10);
assert.equal(previewFrameAt(onceSchedule, loopItems, 20.9).ended, false);

// "cut" costs 0 regardless of any stored transitionDurationSeconds.
const cutItems = [
  { mediaAssetId: "a", durationSeconds: 10 },
  { mediaAssetId: "b", durationSeconds: 10, transition: "cut", transitionDurationSeconds: 5 },
];
const cutSchedule = zoneSchedule(cutItems, { repeat: "loop" }, "zone-cut");
assert.deepEqual(cutSchedule.fades, [1, 0]);
// item 1's cut costs 0 inside the cycle; item 0's own fade (unaffected by item 1's kind) still
// pays for the wrap, since the wrap fade is item 0's — not item 1's — resolved transition.
assert.equal(cutSchedule.totalSeconds, 21);
const atCut = previewFrameAt(cutSchedule, cutItems, 10);
assert.equal(atCut.transition, null);
assert.equal(atCut.itemIndex, 1);

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
