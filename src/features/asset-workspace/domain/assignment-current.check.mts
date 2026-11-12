import assert from "node:assert/strict";
import { assignmentActions, assignmentDate, currentAssignmentQueryString, readCurrentAssignmentQuery } from "./assignment-current.ts";
import { currentAssignmentSchema, currentAssignmentsPageSchema } from "../services/asset-assignments-contract.ts";
import { assignmentErrorText } from "../components/assignments/assignment-error-text.ts";

const id = "c1111111-1111-1111-1111-111111111111";
const row = currentAssignmentSchema.parse({
  assignmentId: id, assignedAt: "2026-11-09T18:30:00Z",
  custodian: { type: "person", id, name: "Owner", avatarUrl: null, department: null },
  location: null,
  asset: { id, name: "Laptop", assetTag: "AST-001", serialNumber: null, category: null,
    thumbnailUrl: null, lifecycleStatus: "Assigned", condition: "Good", updatedAt: "2026-11-09T18:30:00Z" },
});

assert.deepEqual(readCurrentAssignmentQuery({}), {
  ok: true, tab: "current", query: { page: 1, pageSize: 25 }, filtered: false,
});
const filtered = readCurrentAssignmentQuery({ category_id: id, custody_type: "org_unit", custody_id: id,
  location_id: id, q: "  Laptop  ", tab: "current", ignored: "not forwarded" });
assert.equal(filtered.ok, true);
if (filtered.ok) {
  const params = new URLSearchParams(currentAssignmentQueryString(filtered.query));
  assert.equal(params.get("q"), "Laptop");
  assert.equal(params.get("custody_id"), id);
  assert.equal(params.has("tab"), false);
  assert.equal(params.has("ignored"), false);
}
for (const invalid of [{ page: "0" }, { pageSize: "201" }, { q: "x".repeat(201) },
  { category_id: "broken" }, { custody_id: id }, { tab: "other" }, { q: ["a", "b"] }]) {
  assert.equal(readCurrentAssignmentQuery(invalid).ok, false);
}
assert.equal(readCurrentAssignmentQuery({ page: "", pageSize: "", q: "" }).ok, true);
assert.equal(readCurrentAssignmentQuery({ tab: "history" }).ok, true);
assert.equal(readCurrentAssignmentQuery({ custody_type: "person" }).ok, true);
assert.equal(assignmentDate("invalid"), "Not available");
assert.equal(assignmentDate(row.assignedAt), "10 Nov 2026");
assert.deepEqual(assignmentActions(row), { transfer: null, return: null });
for (const condition of ["Fair", "Damaged", "Unusable", null, "Legacy"]) {
  const actions = assignmentActions({ ...row, asset: { ...row.asset, condition } });
  assert.equal(actions.return, null);
  if (condition === "Fair") assert.equal(actions.transfer, null);
  else if (condition === "Damaged" || condition === "Unusable") assert.equal(actions.transfer, "Return it instead");
  else assert.match(actions.transfer!, /could not be verified/);
}
for (const lifecycleStatus of ["Available", "In Maintenance", "Retired", "Disposed", "Legacy"]) {
  const actions = assignmentActions({ ...row, asset: { ...row.asset, lifecycleStatus } });
  assert.ok(actions.transfer);
  assert.ok(actions.return);
}
assert.equal(currentAssignmentsPageSchema.safeParse({ data: [row, row], page: 1, pageSize: 25, total: 2, totalPages: 1 }).success, false);
assert.equal(currentAssignmentsPageSchema.safeParse({ data: [], page: 9, pageSize: 25, total: 3, totalPages: 1 }).success, true);
assert.equal(currentAssignmentsPageSchema.safeParse({ data: [], page: 1, pageSize: 25, total: 0, totalPages: 1 }).success, false);
assert.match(assignmentErrorText("PERMISSION_DENIED").body, /permission/);
assert.equal(assignmentErrorText("unknown").body.includes("unknown"), false);
console.log("Assignment Current query, contract, eligibility, date and error checks passed");
