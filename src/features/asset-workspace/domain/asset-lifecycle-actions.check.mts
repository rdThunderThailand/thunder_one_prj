import assert from "node:assert/strict";
import {
  allowedConditions, allowedTargets, changeStatusBody, changeStatusErrors, endsCustody, lifecycleNeedsReload, retireBody,
  retireEligibility, retireErrors,
} from "./asset-lifecycle-actions.ts";
import type { AssetDetail } from "../services/asset-profile-contract.ts";

for (const [lifecycleStatus, expected] of [
  ["Available", ["Available", "In Maintenance"]],
  ["Assigned", ["Assigned", "In Maintenance"]],
  ["In Maintenance", ["In Maintenance", "Available"]],
  ["Retired", ["Retired"]],
  ["Disposed", []],
  ["constructor", []],
] as const) {
  assert.deepEqual(allowedTargets({ lifecycleStatus }), expected);
}
assert.deepEqual(allowedConditions("Available"), ["Good", "Fair"]);
assert.deepEqual(allowedConditions("Assigned"), ["Good", "Fair", "Damaged"]);
assert.deepEqual(allowedConditions("In Maintenance"), ["Fair", "Damaged", "Unusable"]);
assert.deepEqual(allowedConditions("Retired"), ["Good", "Fair", "Damaged", "Unusable"]);
assert.deepEqual(allowedConditions("Disposed"), []);

const asset = { lifecycleStatus: "In Maintenance", condition: "Fair", custody: { name: "Holder" } } as AssetDetail;
assert.equal(endsCustody(asset, "Available"), true);
assert.equal(endsCustody({ ...asset, custody: null }, "Available"), false);
assert.equal(endsCustody(asset, "In Maintenance"), false);
const draft = { status: "Available", condition: "Good", reason: "  Repair complete  ", notes: "  " };
assert.ok(Object.values(changeStatusErrors(asset, draft)).every((error) => error === null));
assert.ok(changeStatusErrors(asset, { ...draft, condition: "Unusable" }).condition);
assert.ok(changeStatusErrors(asset, { ...draft, status: "In Maintenance", condition: "Fair" }).change);
assert.ok(changeStatusErrors(asset, { ...draft, reason: " " }).reason);
assert.deepEqual(changeStatusBody("version", draft, []), {
  expectedUpdatedAt: "version", status: "Available", condition: "Good", reason: "Repair complete",
});
assert.deepEqual(changeStatusBody("version", { ...draft, notes: "  Tested  " }, ["file"]), {
  expectedUpdatedAt: "version", status: "Available", condition: "Good", reason: "Repair complete",
  notes: "Tested", evidenceFileIds: ["file"],
});
assert.equal(lifecycleNeedsReload("STALE"), true);
assert.equal(lifecycleNeedsReload("INVALID_STATE"), true);
assert.equal(lifecycleNeedsReload("INTERNAL", true), true);
assert.equal(lifecycleNeedsReload("VALIDATION"), false);
console.log("Change Status target, condition, custody and payload checks passed");

const holder = { name: "Holder" } as AssetDetail["custody"];
assert.equal(retireEligibility({ lifecycleStatus: "Available", custody: null }).kind, "ok");
assert.equal(retireEligibility({ lifecycleStatus: "In Maintenance", custody: null }).kind, "ok");
assert.deepEqual(retireEligibility({ lifecycleStatus: "Assigned", custody: holder }), { kind: "blocked", action: "return" });
assert.deepEqual(retireEligibility({ lifecycleStatus: "In Maintenance", custody: holder }), { kind: "blocked", action: "change-status" });
assert.equal(retireEligibility({ lifecycleStatus: "Retired", custody: null }).kind, "done");
assert.equal(retireEligibility({ lifecycleStatus: "Disposed", custody: null }).kind, "done");
assert.equal(retireEligibility({ lifecycleStatus: "constructor", custody: null }).kind, "done");
const retire = { condition: "Unusable", reason: "  End of life  ", notes: "" };
assert.ok(Object.values(retireErrors(retire)).every((error) => error === null));
assert.ok(retireErrors({ ...retire, condition: "" }).condition);
assert.ok(retireErrors({ ...retire, reason: "  " }).reason);
assert.ok(retireErrors({ ...retire, notes: "x".repeat(501) }).notes);
assert.deepEqual(retireBody("v", retire, []), { expectedUpdatedAt: "v", condition: "Unusable", reason: "End of life" });
assert.deepEqual(retireBody("v", { ...retire, notes: " Wiped " }, ["f"]), {
  expectedUpdatedAt: "v", condition: "Unusable", reason: "End of life", notes: "Wiped", evidenceFileIds: ["f"],
});
console.log("Retire eligibility, field and payload checks passed");
