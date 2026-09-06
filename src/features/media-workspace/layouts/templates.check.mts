/** Run: node src/features/media-workspace/layouts/templates.check.mts */
import assert from "node:assert/strict";
import { BLANK_ZONES, LAYOUT_TEMPLATES } from "./templates.ts";
import { validateZones } from "./geometry.ts";

// Seven starting geometries, each in both orientations (ADR 0063 §3).
assert.equal(LAYOUT_TEMPLATES.length, 14);
assert.equal(new Set(LAYOUT_TEMPLATES.map((t) => t.key)).size, 14);
assert.equal(LAYOUT_TEMPLATES.filter((t) => t.orientation === "landscape").length, 7);
assert.equal(LAYOUT_TEMPLATES.filter((t) => t.orientation === "portrait").length, 7);

// A typo'd percentage in a constant would otherwise surface only as a save-time 400 from
// the RPC, on a Layout the operator did not author and cannot fix.
for (const template of LAYOUT_TEMPLATES) {
  assert.deepEqual(validateZones(template.zones), [], `template ${template.key} has invalid geometry`);
  assert.ok(template.zones.length >= 1, `template ${template.key} has ${template.zones.length} zones`);
  assert.deepEqual(
    template.zones.map((z) => z.position),
    template.zones.map((_, i) => i),
    `template ${template.key} positions must be 0-based and dense`
  );
  // Catalogue fields the picker reads (ADR 0063 §3).
  assert.ok(template.description.length > 0, `template ${template.key} needs a description`);
  assert.ok(template.use_cases.length > 0, `template ${template.key} needs at least one use case`);
  assert.ok(["landscape", "portrait"].includes(template.orientation));
}

// Start-blank is a legal Layout on its own — the editor never sits on an unsaveable canvas.
assert.deepEqual(validateZones(BLANK_ZONES), []);
assert.equal(BLANK_ZONES.length, 1);

// The splits that tile the full frame must leave no sliver of background behind.
const tiled = ["50-50", "4-grid", "3-column"];
for (const base of tiled) {
  for (const template of LAYOUT_TEMPLATES.filter((t) => t.key.startsWith(`${base}-`))) {
    const area = template.zones.reduce((sum, z) => sum + z.width * z.height, 0);
    assert.equal(Math.round(area), 10000, `${template.key} should tile the whole frame`);
  }
}

console.log("templates.check.mts — all assertions passed");
