import assert from "node:assert/strict";
import { roundPercent } from "./geometry.ts";
import { snapDelta, snapTargets } from "./zone-snap.ts";

const left = { x: 0, y: 0, width: 50, height: 100 };
const targets = snapTargets([left]);
const threshold = { x: 1, y: 1 };

// Moving a Zone whose left edge lands 0.6% past its neighbour's right edge sticks to it.
const moved = snapDelta({ x: 60, y: 10, width: 20, height: 20 }, "move", -9.4, 0, targets, threshold);
assert.equal(moved.dx, -10);
assert.equal(moved.guideX, 50);

// Outside the threshold nothing changes and no guide shows.
const free = snapDelta({ x: 60, y: 10, width: 20, height: 20 }, "move", -5, 0, targets, threshold);
assert.deepEqual(free, { dx: -5, dy: 0, guideX: null, guideY: null });

// A west handle snaps only the edge it moves; the east edge (80) is not a candidate.
const resized = snapDelta({ x: 60, y: 10, width: 20, height: 20 }, "w", -9.5, 0, targets, threshold);
assert.equal(resized.dx, -10);

// An east handle reaching for the canvas side snaps to 100.
const east = snapDelta({ x: 60, y: 10, width: 39.4, height: 20 }, "e", 0, 0, targets, threshold);
assert.equal(east.dx.toFixed(3), "0.600");
assert.equal(east.guideX, 100);

// px typed in a panel survives the percent round-trip on a wide frame.
for (const px of [1, 7, 1919, 12345]) assert.equal(Math.round((roundPercent((px / 99999) * 100) / 100) * 99999), px);

console.log("zone-snap: ok");
