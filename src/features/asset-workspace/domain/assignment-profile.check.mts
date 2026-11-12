import assert from "node:assert/strict";
import { currentProfileAssignmentKey, profileAssignmentActions } from "./assignment-profile.ts";
import { assetDetailSchema } from "../services/asset-profile-contract.ts";
import type { ProfileAssignmentEvent } from "../services/asset-assignments-profile-api.ts";

const startedAt = "2026-11-11T09:00:00+07:00";
const holder = { type: "person", id: "holder", name: "Jane Doe", avatarUrl: null, department: null, since: "2026-11-11T02:00:00Z" } as const;
const custody = assetDetailSchema.shape.custody.parse(holder)!;
assert.equal(custody.note, null);
assert.equal(assetDetailSchema.shape.custody.parse({ ...holder, note: "Desk equipment" })?.note, "Desk equipment");
assert.equal(assetDetailSchema.shape.custody.parse(null), null);

const assigned = { lifecycleStatus: "Assigned", condition: "Good", custody };
assert.deepEqual(profileAssignmentActions(assigned), { assign: false, transfer: null, return: null });
assert.equal(profileAssignmentActions({ ...assigned, condition: "Fair" }).transfer, null);
for (const condition of ["Damaged", "Unusable"]) {
  assert.deepEqual(profileAssignmentActions({ ...assigned, condition }), { assign: false, transfer: "Return it instead", return: null });
}
assert.ok(profileAssignmentActions({ ...assigned, condition: null }).transfer);
assert.ok(profileAssignmentActions({ ...assigned, lifecycleStatus: "Retired" }).return);
assert.ok(profileAssignmentActions({ ...assigned, custody: null }).return);
assert.equal(profileAssignmentActions({ ...assigned, lifecycleStatus: "Available" }).assign, false);
assert.equal(profileAssignmentActions({ ...assigned, lifecycleStatus: "Available", custody: null }).assign, true);
assert.equal(profileAssignmentActions({ ...assigned, lifecycleStatus: "Unknown", custody: null }).assign, false);

const event: ProfileAssignmentEvent = {
  id: "transfer", action: "Transfer", at: "2026-11-11T02:01:00Z", asset: { id: "asset", name: "Laptop", assetTag: "AST-001" },
  from: null, to: holder, performedBy: null, condition: "Good", location: null, reason: null,
  custodyPeriod: { startedAt, endedAt: null }, evidence: [],
};
const older = { ...event, id: "old", custodyPeriod: { startedAt: "2026-10-01T00:00:00Z", endedAt: startedAt } };
assert.equal(currentProfileAssignmentKey([event, older], custody), "Transfer:transfer");
assert.equal(currentProfileAssignmentKey([older], custody), undefined);
assert.equal(currentProfileAssignmentKey([], custody), undefined);
assert.equal(currentProfileAssignmentKey([event], null), undefined);
assert.equal(currentProfileAssignmentKey([event], { ...custody, since: null }), undefined);
assert.equal(currentProfileAssignmentKey([event], { ...custody, type: "org_unit" }), undefined);
assert.equal(currentProfileAssignmentKey([event], { ...custody, id: "different" }), undefined);
assert.equal(currentProfileAssignmentKey([{ ...event, action: "Return", to: null, custodyPeriod: null }], custody), undefined);
assert.equal(currentProfileAssignmentKey([event, { ...event, id: "second" }], custody), "Transfer:transfer");
console.log("Profile custody note, assignment eligibility and exact Current period checks passed");
