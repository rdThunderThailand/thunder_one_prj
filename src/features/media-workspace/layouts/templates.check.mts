/** Run: node src/features/media-workspace/layouts/templates.check.mts */
import assert from "node:assert/strict";
import { BLANK_ZONES, LAYOUT_TEMPLATES } from "./templates.ts";
import { MAX_ZONES, validateZones } from "./geometry.ts";

assert.equal(LAYOUT_TEMPLATES.length, 7);
assert.equal(new Set(LAYOUT_TEMPLATES.map((t) => t.key)).size, 7);

// A typo'd percentage in a constant would otherwise surface only as a save-time 400 from
// the RPC, on a Layout the operator did not author and cannot fix.
for (const template of LAYOUT_TEMPLATES) {
  assert.deepEqual(validateZones(template.zones), [], `template ${template.key} has invalid geometry`);
  assert.ok(
    template.zones.length >= 1 && template.zones.length <= MAX_ZONES,
    `template ${template.key} has ${template.zones.length} zones`
  );
  assert.deepEqual(
    template.zones.map((z) => z.position),
    template.zones.map((_, i) => i),
    `template ${template.key} positions must be 0-based and dense`
  );
}

// Start-blank is a legal Layout on its own — the editor never sits on an unsaveable canvas.
assert.deepEqual(validateZones(BLANK_ZONES), []);
assert.equal(BLANK_ZONES.length, 1);

// The three splits that tile the full frame must leave no sliver of background behind.
const tiled = ["50-50", "4-grid", "3-column"];
for (const key of tiled) {
  const template = LAYOUT_TEMPLATES.find((t) => t.key === key);
  assert.ok(template, `${key} missing`);
  const area = template.zones.reduce((sum, z) => sum + z.width * z.height, 0);
  assert.equal(Math.round(area), 10000, `${key} should tile the whole frame`);
}

console.log("templates.check.mts — all assertions passed");
