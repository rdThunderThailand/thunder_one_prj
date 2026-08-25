/** Run: node src/features/media-workspace/layouts/geometry.check.mts */
import assert from "node:assert/strict";
import { clampRect, parseAspectRatio, rectsOverlap, roundPercent, validateZones } from "./geometry.ts";

const full = { x: 0, y: 0, width: 100, height: 100 };
const left = { x: 0, y: 0, width: 50, height: 100 };
const right = { x: 50, y: 0, width: 50, height: 100 };

assert.deepEqual(validateZones([full]), []);

// A 50/50 split is the commonest Layout there is — touching edges must not read as overlap.
assert.deepEqual(validateZones([left, right]), []);
assert.equal(rectsOverlap(left, right), false);
assert.equal(rectsOverlap(full, left), true);

assert.deepEqual(validateZones([]), [{ kind: "no-zones" }]);
assert.deepEqual(
  validateZones([full, full, full, full, full]).filter((e) => e.kind === "too-many-zones"),
  [{ kind: "too-many-zones", count: 5 }]
);

assert.deepEqual(validateZones([{ x: 0, y: 0, width: 0, height: 50 }]), [
  { kind: "non-positive", index: 0 },
]);
// Out of the frame on the x axis: 60 + 50 = 110.
assert.deepEqual(validateZones([{ x: 60, y: 0, width: 50, height: 50 }]), [
  { kind: "out-of-bounds", index: 0 },
]);
assert.deepEqual(validateZones([full, left]).filter((e) => e.kind === "overlap"), [
  { kind: "overlap", a: 0, b: 1 },
]);

// Thirds must land on exactly 100, not 99.99999999999999 — this is the reason the module
// compares tenths rather than floats.
assert.deepEqual(
  validateZones([
    { x: 0, y: 0, width: 33.3, height: 100 },
    { x: 33.3, y: 0, width: 33.3, height: 100 },
    { x: 66.6, y: 0, width: 33.4, height: 100 },
  ]),
  []
);

assert.equal(roundPercent(33.34), 33.3);
assert.equal(roundPercent(33.35), 33.4);

// clampRect pulls a dragged rectangle back inside the frame instead of rejecting it.
assert.deepEqual(clampRect({ x: 90, y: 0, width: 50, height: 50 }), {
  x: 50,
  y: 0,
  width: 50,
  height: 50,
});
assert.deepEqual(clampRect({ x: -10, y: -10, width: 20, height: 20 }), {
  x: 0,
  y: 0,
  width: 20,
  height: 20,
});
// Everything clampRect returns must pass validation — that is the contract that lets the
// editor clamp during a drag and only block on save.
assert.deepEqual(validateZones([clampRect({ x: 120, y: 120, width: 200, height: 200 })]), []);

assert.deepEqual(parseAspectRatio("16:9"), [16, 9]);
assert.deepEqual(parseAspectRatio("16:3"), [16, 3]);
// A bad stored value renders a 16:9 box rather than crashing a list row.
assert.deepEqual(parseAspectRatio("1920x1080"), [16, 9]);
assert.deepEqual(parseAspectRatio("0:0"), [16, 9]);

console.log("geometry.check.mts — all assertions passed");
