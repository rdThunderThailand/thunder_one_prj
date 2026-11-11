import assert from "node:assert/strict";
import { canMoveAsset, moveLocationBody, moveLocationErrors, moveLocationFailureText, moveLocationNeedsReload } from "./assignment-move-location.ts";

const asset = { lifecycleStatus: "Available", location: { id: "A" } };
for (const lifecycleStatus of ["Available", "Assigned", "In Maintenance"]) {
  assert.equal(canMoveAsset({ ...asset, lifecycleStatus }), true);
}
for (const lifecycleStatus of ["Retired", "Disposed", "Unknown"]) {
  assert.equal(canMoveAsset({ ...asset, lifecycleStatus }), false);
}
assert.equal(moveLocationErrors(asset, null, "").locationId, "Choose a location.");
assert.equal(moveLocationErrors(asset, "a", "").locationId, "Choose a different location.");
assert.equal(moveLocationErrors(asset, "b", "a".repeat(501)).reason, "Use 500 characters or fewer.");
assert.deepEqual(moveLocationErrors(asset, "b", ` ${"a".repeat(500)} `), { locationId: undefined, reason: undefined });
assert.deepEqual(moveLocationBody("old-version", "b", "   "), { expectedUpdatedAt: "old-version", locationId: "b" });
assert.deepEqual(moveLocationBody("new-version", "b", "  Bench check  "), {
  expectedUpdatedAt: "new-version", locationId: "b", reason: "Bench check",
});
for (const code of ["STALE", "INVALID_STATE", "NOT_FOUND"]) assert.ok(moveLocationNeedsReload({ code, uncertain: false }));
assert.ok(moveLocationNeedsReload({ code: "UPSTREAM_FAILED", uncertain: true }));
assert.ok(!moveLocationNeedsReload({ code: "VALIDATION", uncertain: false }));
assert.match(moveLocationFailureText({ code: "STALE", uncertain: false }), /Reload/);
assert.match(moveLocationFailureText({ code: "PERMISSION_DENIED", uncertain: false }), /permission/);
assert.match(moveLocationFailureText({ code: "UPSTREAM_FAILED", uncertain: true }), /may have been updated/);
console.log("Move Location eligibility, destination, reason, payload and recovery checks passed");
