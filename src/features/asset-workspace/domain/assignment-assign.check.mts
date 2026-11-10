import assert from "node:assert/strict";
import { assetAssignBlock, assignBody, assignOrigin, assignSteps, evidenceKind } from "./assignment-assign.ts";

assert.deepEqual(assignSteps(true), ["Select Asset", "Assign Details", "Review", "Confirm"]);
assert.deepEqual(assignSteps(false), ["Assign Details", "Review", "Confirm"]);

assert.equal(assignOrigin("assignments", "a1").href, "/asset-workspace/assignments");
assert.equal(assignOrigin(undefined, "a 1").href, "/asset-workspace/assets/a%201");
assert.equal(assignOrigin(undefined, null).href, "/asset-workspace/assignments");

const asset = { id: "a", lifecycleStatus: "Available", condition: "Good", custody: null };
assert.equal(assetAssignBlock(asset), null);
assert.equal(assetAssignBlock({ ...asset, custody: { type: "person", id: "p", name: "P" } }), "has_custody");
assert.equal(assetAssignBlock({ ...asset, lifecycleStatus: "Retired" }), "not_assignable");

assert.equal(evidenceKind({ type: "application/pdf" }), "document");
assert.equal(evidenceKind({ type: "image/png" }), "photo");
assert.equal(evidenceKind({ type: "image/gif" }), null);

const target = { type: "org_unit" as const, id: "u", name: "IT", secondary: null };
assert.deepEqual(assignBody({ updatedAt: "t", target, reason: "  ", fileIds: [] }),
  { expectedUpdatedAt: "t", target: { type: "org_unit", id: "u" } });
assert.deepEqual(assignBody({ updatedAt: "t", target, reason: " New starter ", fileIds: ["f"] }),
  { expectedUpdatedAt: "t", target: { type: "org_unit", id: "u" }, reason: "New starter", evidenceFileIds: ["f"] });

console.log("assignment-assign checks passed");
