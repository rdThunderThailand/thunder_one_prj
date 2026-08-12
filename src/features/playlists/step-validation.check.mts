import assert from "node:assert";
import { validateStep, canSubmit } from "./step-validation.ts";

// Empty name still fails step 1 — the one rule that survived the uniqueness removal.
{
  const result = validateStep(1, { name: "", items: [] });
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.includes("ตั้งชื่อ playlist ก่อน"));
}

// A duplicate-looking name (same string used twice) is no longer rejected — this is the
// behavior change this task exists to make, so assert it directly rather than just
// asserting the old rejection is gone.
{
  const result = validateStep(1, { name: "Lobby Loop", items: [] });
  assert.strictEqual(result.valid, true);
}

// canSubmit requires step 2's item rule too.
{
  assert.strictEqual(canSubmit({ name: "Lobby Loop", items: [] }), false);
  assert.strictEqual(
    canSubmit({ name: "Lobby Loop", items: [{ mediaAssetId: "a", transition: "cut" }] }),
    true
  );
}

console.log("step-validation.check.mts OK");
