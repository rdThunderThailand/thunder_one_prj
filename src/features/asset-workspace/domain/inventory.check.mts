/** Run: node src/features/asset-workspace/domain/inventory.check.mts */
import assert from "node:assert/strict";
import {
  detailHref,
  dueHint,
  EMPTY_SCOPE,
  scopeForMode,
  scopeReady,
  sessionActions,
  sessionHref,
  sessionProgress,
  startedRange,
  validateSetup,
  wizardStep,
} from "./inventory.ts";

// Step 1
const bad = validateSetup({ name: "  ", description: "x".repeat(501), dueDate: "", ownerUserId: "" });
assert.ok(!bad.ok && bad.fields.name && bad.fields.description && bad.fields.dueDate);
assert.deepEqual(validateSetup({ name: " Q4 Count ", description: "  ", dueDate: "2026-12-31", ownerUserId: "" }), {
  ok: true, input: { name: "Q4 Count", description: null, dueDate: "2026-12-31" },
});
const owner = validateSetup({ name: "A", description: "", dueDate: "2026-12-31", ownerUserId: "u1" });
assert.ok(owner.ok && owner.input.ownerUserId === "u1");

// Step 2
const scope = { ...EMPTY_SCOPE, locationIds: ["l1"], assetIds: ["a1"] };
assert.equal(scopeReady("by_scope", EMPTY_SCOPE), false);
assert.equal(scopeReady("by_scope", scope), true);
assert.deepEqual(scopeForMode("by_scope", scope).assetIds, []);
assert.deepEqual(scopeForMode("specific_assets", scope), { ...EMPTY_SCOPE, assetIds: ["a1"] });

// Due hint
assert.deepEqual(dueHint("2026-11-28", "2026-11-12"), { text: "16 days left", overdue: false });
assert.deepEqual(dueHint("2026-11-12", "2026-11-12"), { text: "Due today", overdue: false });
assert.deepEqual(dueHint("2026-11-11", "2026-11-12"), { text: "1 day overdue", overdue: true });
assert.equal(dueHint(null, "2026-11-12"), null);

// List
assert.equal(sessionHref({ id: "s1", status: "Draft" }), "/asset-workspace/inventory/s1/setup");
assert.equal(sessionHref({ id: "s1", status: "In Progress" }), "/asset-workspace/inventory/s1");
assert.deepEqual(startedRange("2026-11-01", "2026-11-30"), { from: "2026-11-01T00:00:00+07:00", to: "2026-11-30T17:00:00.000Z" });
assert.deepEqual(startedRange("bad", undefined), {});

// Wizard resume
assert.equal(wizardStep("2", null), 2);
assert.equal(wizardStep(undefined, null), 1);
const draft = { scopeMode: "by_scope" as const, scope: { locations: [], orgUnits: [], categories: [], custodians: [], assetIds: [] } };
assert.equal(wizardStep(undefined, draft), 2);
assert.equal(wizardStep(undefined, { ...draft, scope: { ...draft.scope, locations: [{ id: "l1", name: "HQ" }] } }), 3);

// Detail (I2)
assert.deepEqual(sessionProgress({ expected: 8, verified: 3, mismatch: 1, notFound: 1, unexpected: 2, remaining: 3 }), {
  done: 5, pct: 63, discrepancies: 4,
});
assert.equal(sessionProgress({ expected: 0, verified: 0, mismatch: 0, notFound: 0, unexpected: 0, remaining: 0 }).pct, 0);
assert.deepEqual(sessionActions("In Progress"), { continue: true, cancel: true });
assert.deepEqual(sessionActions("Completed"), { continue: false, cancel: false });
assert.equal(detailHref("s1", "assets"), "/asset-workspace/inventory/s1/assets");

console.log("inventory.check ok");
