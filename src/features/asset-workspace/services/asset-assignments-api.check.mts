import assert from "node:assert/strict";
import { getAssignmentFilters, getCurrentAssignments, type AssignmentRequester } from "./asset-assignments-api.ts";

const auth = { tenantId: "test-tenant", token: "test-token" };
const query = { page: 1, pageSize: 25, q: "Laptop & display" };
const requests: string[] = [];
const requester: AssignmentRequester = async (path, receivedAuth) => {
  assert.equal(receivedAuth, auth);
  requests.push(path);
  return { status: 200, data: { success: true, data: { data: [], page: 1, pageSize: 25, total: 0, totalPages: 0 } } };
};
assert.deepEqual(await getCurrentAssignments(auth, query, requester), {
  ok: true, data: { rows: [], page: 1, pageSize: 25, total: 0, totalPages: 0 },
});
assert.equal(requests.length, 1);
assert.equal(new URLSearchParams(requests[0].split("?")[1]).get("q"), query.q);
const error: AssignmentRequester = async () => ({ status: 403, data: { error: { code: "PERMISSION_DENIED", message: "Do not show raw errors" } } });
assert.deepEqual(await getCurrentAssignments(auth, query, error), { ok: false, code: "PERMISSION_DENIED" });
const malformed: AssignmentRequester = async () => ({ status: 200, data: { success: true, data: [] } });
assert.deepEqual(await getCurrentAssignments(auth, query, malformed), { ok: false, code: "INVALID_RESPONSE" });
const wrongPage: AssignmentRequester = async () => ({ status: 200, data: { success: true,
  data: { data: [], page: 2, pageSize: 25, total: 0, totalPages: 0 } } });
assert.deepEqual(await getCurrentAssignments(auth, query, wrongPage), { ok: false, code: "INVALID_RESPONSE" });
const offline: AssignmentRequester = async () => { throw new Error("private diagnostic"); };
assert.deepEqual(await getCurrentAssignments(auth, query, offline), { ok: false, code: "CONNECTION_FAILED" });
const missing: AssignmentRequester = async () => ({ status: 404, data: null });
assert.deepEqual(await getAssignmentFilters(auth, missing), { ok: false, code: "NOT_FOUND" });
const filters: AssignmentRequester = async (path) => {
  assert.equal(path, "assets/filters");
  return { status: 200, data: { success: true, data: { categories: [], locations: [], custodyTargets: [], statuses: [], conditions: [] } } };
};
assert.equal((await getAssignmentFilters(auth, filters)).ok, true);
console.log("Assignment Current mocked API checks passed; no live requests or writes");
