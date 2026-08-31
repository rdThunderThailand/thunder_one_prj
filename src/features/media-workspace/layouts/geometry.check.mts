/** Run: node src/features/media-workspace/layouts/geometry.check.mts */
import assert from "node:assert/strict";
import {
  clampRect,
  deriveAspectRatio,
  deviceFit,
  evenSplitPercents,
  parseAspectRatio,
  parseResolution,
  rectsOverlap,
  referencePixels,
  roundPercent,
  sameRatio,
  validateZones,
} from "./geometry.ts";

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

// Three equal columns must land on exactly 100, not 99.999999999999 — this is the reason
// the module compares thousandths rather than floats.
assert.deepEqual(
  validateZones([
    { x: 0, y: 0, width: 33.333, height: 100 },
    { x: 33.333, y: 0, width: 33.333, height: 100 },
    { x: 66.666, y: 0, width: 33.334, height: 100 },
  ]),
  []
);

assert.equal(roundPercent(33.3334), 33.333);
assert.equal(roundPercent(33.3335), 33.334);

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
// A spanned 3-monitor width — this is exactly what the widened regex exists to accept.
assert.deepEqual(parseAspectRatio("5760:1080"), [5760, 1080]);
// An unparseable value is a validation error, never a silent 16:9.
assert.equal(parseAspectRatio("1920x1080"), null);
assert.equal(parseAspectRatio("0:0"), null);
assert.equal(parseAspectRatio("not-a-ratio"), null);

// Fits — the two shapes the production fleet actually reports (ADR 0055).
assert.equal(deviceFit("1920x1080", "16:9"), "fits");
assert.equal(deviceFit("1920x1008", "16:9"), "fits");   // taskbar work area, 1.071 in band
assert.equal(deviceFit("1920x1200", "16:9"), "fits");   // 16:10 panel, 1.111 in band
assert.equal(deviceFit("1080x1080", "16:9"), "fits");   // square fits anything

// Does not fit.
assert.equal(deviceFit("1080x1920", "16:9"), "orientation-mismatch");
assert.equal(deviceFit("1024x768", "16:9"), "aspect-mismatch");    // 4:3, 1.333
assert.equal(deviceFit("1920x1080", "16:3"), "aspect-mismatch");   // videowall layout, 3.000

// Unknown — never "does not fit".
assert.equal(deviceFit(null, "16:9"), "unknown");
assert.equal(deviceFit("1920x", "16:9"), "unknown");
assert.equal(deviceFit("0x1080", "16:9"), "unknown");
assert.equal(deviceFit("1920x1080", "not-a-ratio"), "unknown");

// Ticket 19 — resolution parse/validate.
assert.deepEqual(parseResolution("1920x1080"), [1920, 1080]);
assert.deepEqual(parseResolution("3000x2000"), [3000, 2000]);
assert.deepEqual(parseResolution("5760x1080"), [5760, 1080]); // spanned 3-monitor width
assert.equal(parseResolution("99x1080"), null); // below the 100 floor
assert.equal(parseResolution("100000x1080"), null); // above the 99999 ceiling
assert.equal(parseResolution("1920:1080"), null); // wrong separator
assert.equal(parseResolution("not-a-resolution"), null);

// Ticket 19 — GCD ratio derivation, matching what Layouts already stored before this ticket.
assert.equal(deriveAspectRatio(1920, 1080), "16:9");
assert.equal(deriveAspectRatio(1080, 1920), "9:16");
assert.equal(deriveAspectRatio(3840, 2160), "16:9");
assert.equal(deriveAspectRatio(3000, 2000), "3:2");
assert.equal(deriveAspectRatio(5760, 1080), "16:3");

// Ticket 19 — numeric same-ratio comparison, never string comparison.
assert.equal(sameRatio([1920, 1080], [3840, 2160]), true);
assert.equal(sameRatio(parseAspectRatio("16:9")!, [1920, 1080]), true);
assert.equal(sameRatio([1920, 1080], [1080, 1920]), false);

// Ticket 19 — percent to reference-pixel conversion.
assert.equal(referencePixels(50, 1920), 960);
assert.equal(referencePixels(33.333, 5760), 1920); // lands exactly on one monitor
assert.equal(referencePixels(100, 1080), 1080);

// Ticket 19 — even split into N columns, remainder on exactly one column.
assert.deepEqual(evenSplitPercents(2), [50, 50]);
assert.deepEqual(evenSplitPercents(3), [33.333, 33.333, 33.334]);
assert.deepEqual(evenSplitPercents(4), [25, 25, 25, 25]);
assert.equal(
  evenSplitPercents(3).reduce((a, b) => a + b, 0),
  100
);

console.log("geometry.check.mts — all assertions passed");
