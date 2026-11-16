/** Run: node src/features/asset-workspace/domain/inventory.check.mts */
import assert from "node:assert/strict";
import {
  detailHref,
  dueHint,
  EMPTY_SCOPE,
  scopeForMode,
  scopeReady,
  scanMatch,
  sessionActions,
  sessionHref,
  sessionProgress,
  startedRange,
  validateSetup,
  verifyInput,
  findingChange,
  activityResult,
  activityText,
  assetActionHref,
  decisionsFor,
  findingStatus,
  reconcileInput,
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
assert.deepEqual(sessionActions("In Progress"), { continue: true, cancel: true, complete: true, close: false, edit: true });
assert.deepEqual(sessionActions("Completed"), { continue: false, cancel: false, complete: false, close: true, edit: false });
assert.equal(detailHref("s1", "assets"), "/asset-workspace/inventory/s1/assets");

console.log("inventory.check ok");

// I3 Verify
const vRow = { snapshotId: "s1", resultUpdatedAt: null };
const vDraft = { result: "Verified" as const, locationId: "l2", custody: "", condition: "" as const, note: " ok " };
assert.deepEqual(verifyInput(vRow, vDraft), { ok: true, input: { snapshotId: "s1", result: "Verified", note: "ok" } });
const empty = verifyInput(vRow, { ...vDraft, result: "Mismatch", locationId: "" });
assert.ok(!empty.ok && empty.field === "actual");
assert.deepEqual(verifyInput({ snapshotId: "s1", resultUpdatedAt: "t" }, { ...vDraft, result: "Mismatch", custody: "org_unit:u1", condition: "Damaged", note: "" }), {
  ok: true,
  input: { snapshotId: "s1", result: "Mismatch", expectedUpdatedAt: "t", actualLocationId: "l2", actualCustodyType: "org_unit", actualCustodyId: "u1", condition: "Damaged" },
});
assert.ok(!verifyInput(vRow, { ...vDraft, note: "x".repeat(1001) }).ok);
const vRows = [{ assetTag: "AT-1", serialNumber: "SN9" }, { assetTag: "AT-10", serialNumber: null }];
assert.equal(scanMatch(vRows, " at-1 "), vRows[0]);
assert.equal(scanMatch(vRows, "sn9"), vRows[0]);
assert.equal(scanMatch(vRows, "AT"), null);
assert.equal(scanMatch(vRows, undefined), null);
assert.equal(findingChange({ type: "mismatch_condition", expectedCondition: "Good", foundCondition: "Damaged" } as never), "Good → Damaged");
assert.equal(findingChange({ type: "not_found" } as never), null);

// I4 Reconcile
assert.deepEqual(decisionsFor("not_found"), ["mark_lost", "dismiss"]);
assert.deepEqual(decisionsFor("unexpected"), ["register_asset", "dismiss"]);
assert.equal(assetActionHref("transfer_custody", "a 1"), "/asset-workspace/assets/a%201/transfer");
assert.equal(assetActionHref("update_location", null), null);
assert.equal(assetActionHref("dismiss", "a1"), null);
const rBad = reconcileInput({ decision: "register_asset", reason: " ", note: "", assetId: "" });
assert.ok(!rBad.ok && rBad.fields.reason && rBad.fields.assetId);
assert.deepEqual(reconcileInput({ decision: "dismiss", reason: " dup ", note: "", assetId: "x" }), { ok: true, input: { decision: "dismiss", reason: "dup" } });
assert.deepEqual(reconcileInput({ decision: "register_asset", reason: "r", note: " n ", assetId: "a9" }), {
  ok: true, input: { decision: "register_asset", reason: "r", note: "n", assetId: "a9" },
});
assert.equal(findingStatus({ resolutionState: "open", decision: null }), "Open");
assert.equal(findingStatus({ resolutionState: "reconciled", decision: "mark_lost" }), "Reconciled · Mark as Lost");
assert.equal(findingStatus({ resolutionState: "dismissed", decision: "dismiss" }), "Dismissed");

// Activity result colour source
assert.equal(activityResult({ details: { result: "Mismatch" } }), "Mismatch");
assert.equal(activityResult({ details: { before: { result: "Verified" }, after: { result: "Not Found" } } }), "Not Found");
assert.equal(activityResult({ details: { after: "Verified" } }), "Verified");
assert.equal(activityResult({ details: { result: "Remaining" } }), null);
assert.equal(activityResult({ details: null }), null);

// Activity table text
assert.deepEqual(activityText({ action: "complete", details: { expected: 80, done: 1, remaining: 79 } }), {
  subtitle: "Session status changed to Completed", details: "1 of 80 checked · 79 remaining",
});
assert.equal(activityText({ action: "close", details: { open_findings: 0 } }).details, "No open discrepancies");
assert.equal(activityText({ action: "close", details: { open_findings: 2 } }).details, "2 open discrepancies left");
assert.equal(activityText({ action: "result_change", details: { before: { result: "Mismatch" }, after: { result: "Verified" } } }).details, "Mismatch → Verified");
assert.equal(activityText({ action: "reconcile", details: { decision: "dismiss", reason: "dup" } }).details, "Dismiss: dup");
assert.equal(activityText({ action: "update", details: { before: { name: "A", due_date: "1" }, after: { name: "B", due_date: "1" } } }).details, "Changed: name");
assert.equal(activityText({ action: "start", details: { expected: 1, assignees: 4 } }).details, "1 asset · 4 assignees");
assert.equal(activityText({ action: "verify", details: null }).details, "—");
assert.equal(activityText({ action: "update", details: { before: { scope_json: 1 }, after: { scope_json: 2 } } }).details, "Changed: scope");
