/** Run: node src/features/media-workspace/layouts/align-zones.check.mts */
import assert from "node:assert/strict";
import { alignZone, duplicateZone } from "./align-zones.ts";
import { validateZones } from "./geometry.ts";
import type { LayoutZone } from "./types/index.ts";

const zone: LayoutZone = { id: "z1", position: 0, name: "Zone 1", x: 40, y: 30, width: 20, height: 10 };

// --- alignZone ---------------------------------------------------------------

assert.deepEqual(alignZone(zone, "left"), { ...zone, x: 0 });
assert.deepEqual(alignZone(zone, "right"), { ...zone, x: 80 });
assert.deepEqual(alignZone(zone, "center-h"), { ...zone, x: 40 });
assert.deepEqual(alignZone(zone, "top"), { ...zone, y: 0 });
assert.deepEqual(alignZone(zone, "middle-v"), { ...zone, y: 45 });

// Width/height never move, and every result still passes the same bounds check the
// canvas and media_layout_upsert both apply — no edge can push a Zone past 0–100.
for (const edge of ["left", "center-h", "right", "top", "middle-v"] as const) {
  const aligned = alignZone(zone, edge);
  assert.equal(aligned.width, zone.width);
  assert.equal(aligned.height, zone.height);
  const errors = validateZones([aligned]);
  assert.deepEqual(errors, [], `${edge} produced an out-of-bounds Zone: ${JSON.stringify(errors)}`);
}

// Three decimal places preserved (docs/layouts/Phase0/contract-v2-zones.md).
const oddWidth: LayoutZone = { ...zone, width: 33.333 };
assert.equal(alignZone(oddWidth, "center-h").x, 33.334);

// --- duplicateZone -------------------------------------------------------------

const zones: LayoutZone[] = [
  { id: "a", position: 0, name: "A", x: 0, y: 0, width: 50, height: 100 },
  { id: "b", position: 1, name: "B", x: 50, y: 0, width: 50, height: 100 },
];

const duplicated = duplicateZone(zones, 0)!;
assert.equal(duplicated.length, 3);
assert.deepEqual(duplicated.map((z) => z.position), [0, 1, 2]);
const copy = duplicated[1]!;
assert.equal(copy.id, undefined, "unsaved until the editor mints an id, same as Split Zone");
assert.equal(copy.name, "A copy");
assert.notDeepEqual({ x: copy.x, y: copy.y }, { x: zones[0]!.x, y: zones[0]!.y }, "must not land exactly on its source");
// The original two Zones are untouched.
assert.deepEqual(duplicated[0], { ...zones[0], position: 0 });
assert.deepEqual(duplicated[2], { ...zones[1], position: 2 });

assert.equal(duplicateZone([], 0), null);
assert.equal(duplicateZone(zones, 5), null, "an out-of-range index is a no-op, not a throw");

console.log("align-zones.check.mts — all assertions passed");
