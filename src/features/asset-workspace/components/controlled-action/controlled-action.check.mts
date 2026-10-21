/** Run: node src/features/asset-workspace/components/controlled-action/controlled-action.check.mts */
import assert from "node:assert/strict";
import {
  actionBlock,
  initialDraft,
  isReasonRequired,
  statusOptions,
  toSubmission,
  validateDraft,
  type ActionAsset,
} from "./controlled-action.ts";

const person = { type: "person" as const, id: "", label: "Somchai" };
const available: ActionAsset = { label: "LT-001", status: "Available", condition: "Good", custody: null, location: "HQ 3F" };
const assigned: ActionAsset = { ...available, status: "Assigned", custody: person };
const maintenance: ActionAsset = { ...available, status: "In Maintenance", condition: "Damaged" };

// Actions outside §4.11 for the status, and custody blocks, stop the flow before Details.
assert.match(actionBlock("dispose", available) ?? "", /not available/);
assert.match(actionBlock("transfer", { ...assigned, condition: "Damaged" }) ?? "", /cannot be transferred/);
assert.equal(actionBlock("assign", available), null);

// Assign: custodian required; no Reason (Available → Assigned has requiresReason false).
const assign = initialDraft(available);
assert.deepEqual(validateDraft("assign", available, assign), ["Enter who receives the asset."]);
assert.deepEqual(validateDraft("assign", available, { ...assign, custody: { ...person, label: "  Nok " } }), []);
assert.equal(toSubmission("assign", available, { ...assign, custody: { ...person, label: " Nok " } }).custody?.label, "Nok");

// Transfer must name someone new.
assert.deepEqual(validateDraft("transfer", assigned, { ...initialDraft(assigned), custody: person }), ["Choose a different custodian."]);

// Return: target follows the condition; going to In Maintenance asks for a Reason.
const ret = initialDraft(assigned);
assert.equal(toSubmission("return", assigned, ret).to, "Available");
assert.deepEqual(validateDraft("return", assigned, ret), []);
assert.equal(isReasonRequired("return", assigned, { ...ret, condition: "Damaged" }), true);
assert.equal(toSubmission("return", assigned, { ...ret, condition: "Damaged", reason: "Cracked" }).to, "In Maintenance");

// Change status/condition: options from the transition table; condition must fit the new status.
assert.deepEqual(statusOptions(available), ["Available", "In Maintenance"]);
assert.deepEqual(validateDraft("change_status_condition", available, initialDraft(available)), ["Change the status or the condition."]);
assert.deepEqual(validateDraft("change_status_condition", available, { ...initialDraft(available), condition: "Fair" }), []);
assert.deepEqual(validateDraft("change_status_condition", available, { ...initialDraft(available), status: "In Maintenance", reason: "x" }), [
  "Good is not allowed for In Maintenance assets.",
]);
// In Maintenance → Available needs a Reason and an allowed condition.
assert.deepEqual(validateDraft("change_status_condition", maintenance, { ...initialDraft(maintenance), status: "Available", condition: "Good" }), [
  "Enter a reason.",
]);
assert.deepEqual(
  validateDraft("change_status_condition", { ...maintenance, custody: person }, { ...initialDraft(maintenance), status: "Available", condition: "Good", reason: "Fixed" }),
  ["Return the asset before making it Available."],
);

// Retire / Dispose carry a Reason; Move location needs a new place.
assert.deepEqual(validateDraft("retire", available, initialDraft(available)), ["Enter a reason."]);
assert.equal(toSubmission("retire", available, { ...initialDraft(available), reason: " old " }).reason, "old");
assert.deepEqual(validateDraft("move_location", available, { ...initialDraft(available), location: "HQ 3F" }), ["Choose a different location."]);
assert.equal(isReasonRequired("move_location", available, initialDraft(available)), false);

console.log("controlled-action.check: ok");
