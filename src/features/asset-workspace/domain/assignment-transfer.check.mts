import assert from "node:assert/strict";
import { assetTransferBlock, conditionBlocksTransfer, isCurrentHolder, transferBody, transferOutcomes } from "./assignment-transfer.ts";

const holder = { type: "person" as const, id: "p1", name: "Somchai" };
assert.equal(assetTransferBlock({ lifecycleStatus: "Assigned", condition: "Good", custody: holder }), null);
assert.equal(assetTransferBlock({ lifecycleStatus: "Available", condition: "Good", custody: null }), "no_custody");
assert.equal(assetTransferBlock({ lifecycleStatus: "Assigned", condition: "Damaged", custody: holder }), "condition_blocks_transfer");

const target = { type: "person" as const, id: "p1", name: "Somchai", secondary: null };
assert.equal(isCurrentHolder(holder, target), true);
assert.equal(isCurrentHolder(holder, { ...target, type: "org_unit" }), false);
assert.equal(conditionBlocksTransfer("Unusable"), true);
assert.equal(conditionBlocksTransfer("Fair"), false);

const base = { updatedAt: "t", target, condition: "Good", currentLocationId: "l1", reason: "  ", fileIds: [] };
assert.deepEqual(transferBody({ ...base, locationId: "l1" }),
  { expectedUpdatedAt: "t", target: { type: "person", id: "p1" }, condition: "Good" });
assert.deepEqual(transferBody({ ...base, locationId: "l2", reason: " Move ", fileIds: ["f"] }), {
  expectedUpdatedAt: "t", target: { type: "person", id: "p1" }, condition: "Good", newLocationId: "l2", reason: "Move",
  evidenceFileIds: ["f"],
});

assert.equal(transferOutcomes("IT", "HQ", "Branch")[2], "Location will be updated to Branch");
assert.equal(transferOutcomes(null, "HQ", null)[2], "Location stays HQ");
console.log("assignment-transfer checks passed");
