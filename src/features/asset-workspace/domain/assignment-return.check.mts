import assert from "node:assert/strict";
import { assetReturnBlock, returnBody, returnCondition, returnNeedsReload, returnOutcomes, statusAfterReturn } from "./assignment-return.ts";
import { actionHref, assignOrigin } from "./assignment-assign.ts";
import { assignmentWriteText } from "../components/assignments/assignment-error-text.ts";

const custody = { type: "person" as const, id: "seed", name: "Owner" };
assert.equal(assetReturnBlock({ lifecycleStatus: "Assigned", custody }), null);
assert.equal(assetReturnBlock({ lifecycleStatus: "Assigned", custody: null }), "no_custody");
for (const lifecycleStatus of ["Available", "In Maintenance", "Retired", "Disposed", "Legacy"]) {
  assert.equal(assetReturnBlock({ lifecycleStatus, custody }), "not_assigned");
}
for (const value of ["Good", "Fair", "Damaged", "Unusable"]) assert.equal(returnCondition(value), value);
for (const value of [null, undefined, "Bad", "good", ["Good"], ""]) assert.equal(returnCondition(value), null);
assert.equal(statusAfterReturn("Good"), "Available");
assert.equal(statusAfterReturn("Fair"), "Available");
assert.equal(statusAfterReturn("Damaged"), "In Maintenance");
assert.equal(statusAfterReturn("Unusable"), "In Maintenance");
assert.deepEqual(returnBody({ updatedAt: "version", condition: "Damaged", reason: " Repair ", fileIds: ["evidence"] }), {
  expectedUpdatedAt: "version", condition: "Damaged", reason: "Repair", evidenceFileIds: ["evidence"],
});
assert.deepEqual(returnBody({ updatedAt: "version", condition: "Good", reason: " ", fileIds: [] }), {
  expectedUpdatedAt: "version", condition: "Good",
});
for (const code of ["STALE", "INVALID_STATE", "NOT_FOUND"]) assert.equal(returnNeedsReload({ code }), true);
assert.equal(returnNeedsReload({ code: "CONNECTION_FAILED", uncertain: true }), true);
assert.equal(returnNeedsReload({ code: "VALIDATION", uncertain: false }), false);
assert.equal(returnOutcomes()[0], "Current custodian will be closed");
assert.deepEqual(returnOutcomes()[1], { text: "Asset status will be updated based on condition", sub: ["Good / Fair → Available", "Damaged / Unusable → In Maintenance"] });
assert.equal(actionHref("asset", "return", true), "/asset-workspace/assignments/asset/return");
assert.equal(actionHref("asset", "return", false), "/asset-workspace/assets/asset/return");
assert.equal(assignOrigin("assignments", "asset").href, "/asset-workspace/assignments");
assert.equal(assignmentWriteText("NOT_FOUND", false, "return"), "The asset is no longer available. Reload to check.");
for (const action of ["assign", "transfer"] as const) {
  assert.equal(assignmentWriteText("NOT_FOUND", false, action), "The asset or the chosen custodian is no longer available. Reload and choose again.");
}
console.log("assignment-return conditions, body, eligibility, origin and error compatibility checks passed");
