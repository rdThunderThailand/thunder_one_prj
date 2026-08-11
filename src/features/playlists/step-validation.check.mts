/** Run: node src/features/playlists/step-validation.check.mts */
import assert from "node:assert/strict";
import { canSubmit, PLAYLIST_LIMITS, validateStep } from "./step-validation.ts";
import type { DraftItem } from "./types/index.ts";

const item: DraftItem = {
  mediaAssetId: "a-1",
  durationSeconds: 10,
  transition: "cut",
};

const valid = { name: "KFC Wednesday", description: "promo", items: [item] };

assert.equal(validateStep(1, valid).valid, true);
assert.equal(validateStep(2, valid).valid, true);
assert.equal(validateStep(3, valid).valid, true);
assert.equal(canSubmit(valid), true);

// Step 1: a name of only whitespace is no name.
assert.equal(validateStep(1, { ...valid, name: "   " }).valid, false);
assert.equal(validateStep(1, { ...valid, name: "x".repeat(PLAYLIST_LIMITS.nameMax) }).valid, true);
assert.equal(
  validateStep(1, { ...valid, name: "x".repeat(PLAYLIST_LIMITS.nameMax + 1) }).valid,
  false
);
assert.equal(
  validateStep(1, { ...valid, description: "x".repeat(PLAYLIST_LIMITS.descriptionMax + 1) }).valid,
  false
);

// Both step-1 rules can fail at once, and each reports itself.
assert.equal(
  validateStep(1, { name: "", description: "x".repeat(999), items: [item] }).errors.length,
  2
);

// A name already taken in the tenant is caught here, because the RPC only reports the
// UNIQUE violation as an opaque 500.
assert.equal(validateStep(1, { ...valid, takenNames: ["KFC Wednesday"] }).valid, false);
// Case and surrounding whitespace do not rescue a collision.
assert.equal(validateStep(1, { ...valid, takenNames: ["  kfc wednesday "] }).valid, false);
assert.equal(validateStep(1, { ...valid, takenNames: ["Other playlist"] }).valid, true);
assert.equal(validateStep(1, { ...valid, takenNames: [] }).valid, true);
// The name check never fires on a blank name — that error is reported once, not twice.
assert.deepEqual(validateStep(1, { ...valid, name: "", takenNames: [""] }).errors, [
  "ตั้งชื่อ playlist ก่อน",
]);
assert.equal(canSubmit({ ...valid, takenNames: ["KFC Wednesday"] }), false);

// Step 2 needs content; the other steps do not care about it.
assert.equal(validateStep(2, { ...valid, items: [] }).valid, false);
assert.equal(validateStep(1, { ...valid, items: [] }).valid, true);
assert.equal(canSubmit({ ...valid, items: [] }), false);

console.log("step-validation.check.mts — all assertions passed");
