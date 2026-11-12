import assert from "node:assert/strict";
import {
  allowedConditions, allowedTargets, changeStatusBody, DISPOSAL_METHODS, disposeBlock, disposeBody, disposeErrors, changeStatusErrors, endsCustody, lifecycleNeedsReload, retireBody,
  exportFileName, exportFileNameError, exportScopeFor, labelCopies, lifecycleMenu, readExportHandoff, retireEligibility, retireErrors,
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

assert.deepEqual(DISPOSAL_METHODS.map(({ value }) => value), ["Sold", "Donated", "Scrapped-Destroyed", "Returned to Vendor", "Other"]);
assert.equal(disposeBlock({ lifecycleStatus: "Retired" }), null);
assert.equal(disposeBlock({ lifecycleStatus: "Disposed" }), "This asset is already disposed.");
for (const lifecycleStatus of ["Available", "Assigned", "In Maintenance"]) {
  assert.equal(disposeBlock({ lifecycleStatus }), "Only Retired assets can be disposed.");
}
const dispose = { method: "Scrapped-Destroyed", reason: " Beyond repair ", notes: "" };
assert.ok(Object.values(disposeErrors(dispose)).every((error) => error === null));
assert.ok(disposeErrors({ ...dispose, method: "Recycled (e-waste)" }).method);
assert.ok(disposeErrors({ ...dispose, reason: "" }).reason);
assert.deepEqual(disposeBody("v", dispose, []), { expectedUpdatedAt: "v", disposalMethod: "Scrapped-Destroyed", reason: "Beyond repair" });
assert.deepEqual(disposeBody("v", { ...dispose, notes: " Cert EW-1 " }, ["f"]), {
  expectedUpdatedAt: "v", disposalMethod: "Scrapped-Destroyed", reason: "Beyond repair", notes: "Cert EW-1", evidenceFileIds: ["f"],
});
console.log("Dispose eligibility, method, field and payload checks passed");

for (const [lifecycleStatus, custody, expected] of [
  ["Available", null, [null, null, "Only available when Retired"]],
  ["Assigned", holder, [null, "Return asset first", "Only available when Retired"]],
  ["In Maintenance", null, [null, null, "Only available when Retired"]],
  ["In Maintenance", holder, [null, "Change status to Available first", "Only available when Retired"]],
  ["Retired", null, [null, "Already retired", null]],
  ["Disposed", null, ["Disposed assets can't change", "Disposed assets can't change", "Already disposed"]],
] as const) {
  const menu = lifecycleMenu({ lifecycleStatus, custody } as AssetDetail);
  assert.deepEqual(menu.map(({ action }) => action), ["change-status", "retire", "dispose"]);
  assert.deepEqual(menu.map(({ reason }) => reason), expected, `${lifecycleStatus} ${custody ? "with" : "without"} holder`);
}
console.log("More Actions availability checks passed");

for (const [input, copies] of [["1", 1], ["5", 5], ["20", 20], ["21", 20], ["0", 1], ["-3", 1], ["2.7", 2], ["", 1], ["abc", 1]] as const) {
  assert.equal(labelCopies(input), copies, `copies "${input}"`);
}
console.log("Label copies checks passed");

// FE 05 export page.
assert.equal(exportFileName(new Date("2026-11-11T18:30:00Z")), "ThunderOne_Asset_Export_2026-11-12", "Bangkok date");
assert.equal(exportFileNameError("Q4 audit"), null);
assert.equal(exportFileNameError("  "), "Enter a file name.");
assert.equal(exportFileNameError("x".repeat(101)), "Enter 100 characters or fewer.");
for (const bad of ["a/b", `a${String.fromCharCode(92)}b`, "a:b", "a*b", "a?b", 'a"b', "a<b", "a>b", "a|b"]) {
  assert.match(exportFileNameError(bad) ?? "", /^Remove these characters/, bad);
}
const id = "10000000-0000-4000-8000-000000000001";
assert.equal(readExportHandoff(null), null);
assert.equal(readExportHandoff("{bad json"), null);
assert.equal(readExportHandoff(JSON.stringify({ from: "https://evil.example/", ids: [id] })), null, "from must stay in the workspace");
assert.equal(readExportHandoff(JSON.stringify({ from: "/asset-workspace/assets", ids: ["nope"] })), null, "ids must be GUIDs");
assert.equal(readExportHandoff(JSON.stringify({ from: "/asset-workspace/assets", filters: { page: "2" } })), null, "only export filter keys");
assert.deepEqual(readExportHandoff(JSON.stringify({ from: "/asset-workspace/assets?status=Assigned", filters: { status: "Assigned", q: " " } })),
  { from: "/asset-workspace/assets?status=Assigned", filters: { status: "Assigned" } });
assert.deepEqual(readExportHandoff(JSON.stringify({ from: "/asset-workspace/assets", filters: { q: "" } })), { from: "/asset-workspace/assets", filters: undefined });
const handoff = { from: "/asset-workspace/assets", ids: [id], filters: { status: "Retired" as const } };
assert.deepEqual(exportScopeFor("all", handoff, ""), { kind: "filtered", filters: {} });
assert.deepEqual(exportScopeFor("filtered", handoff, ""), { kind: "filtered", filters: { status: "Retired" } });
assert.equal(exportScopeFor("filtered", null, ""), null);
assert.deepEqual(exportScopeFor("selected", handoff, ""), { kind: "selected", ids: [id] });
assert.equal(exportScopeFor("selected", null, ""), null);
assert.equal(exportScopeFor("category", handoff, ""), null, "no pick yet");
assert.deepEqual(exportScopeFor("category", null, id), { kind: "filtered", filters: { category_id: id, include_child_categories: "true" } });
assert.deepEqual(exportScopeFor("location", null, id), { kind: "filtered", filters: { location_id: id } });
assert.deepEqual(exportScopeFor("status", null, "Disposed"), { kind: "filtered", filters: { status: "Disposed" } });
assert.equal(exportScopeFor("status", null, "In Use"), null, "only real statuses");
console.log("Export page file name, handoff and scope checks passed");
