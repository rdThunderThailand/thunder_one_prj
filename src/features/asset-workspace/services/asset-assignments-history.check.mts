import assert from "node:assert/strict";
import { getAssignmentHistory, type AssignmentRequester } from "./asset-assignments-api.ts";

const auth = { tenantId: "test-tenant", token: "test-token" };
const query = { page: 1, pageSize: 20, event_type: "Return" as const, date_from: "2026-11-01", q: "Laptop & display" };
const page = { data: [], page: 1, pageSize: 20, total: 0, totalPages: 0, expiresAt: "2026-11-10T02:00:00Z" };
let count = 0;
const requester: AssignmentRequester = async (path, received) => {
  count++;
  assert.equal(received, auth);
  assert.ok(path.startsWith("assignments/history?"));
  const params = new URLSearchParams(path.split("?")[1]);
  assert.deepEqual(Object.fromEntries(params), { q: query.q, event_type: "Return", date_from: query.date_from, page: "1", pageSize: "20" });
  return { status: 200, data: { success: true, data: page } };
};
assert.deepEqual(await getAssignmentHistory(auth, query, requester), { ok: true, data: page });
assert.equal(count, 1);
for (const code of ["VALIDATION", "UNAUTHENTICATED", "PERMISSION_DENIED", "NOT_FOUND", "STALE", "INTERNAL"]) {
  let attempts = 0;
  const failing: AssignmentRequester = async () => {
    attempts++;
    return { status: 400, data: { error: { code, message: "Private upstream diagnostics" } } };
  };
  assert.deepEqual(await getAssignmentHistory(auth, query, failing), { ok: false, code });
  assert.equal(attempts, 1, "No automatic retry");
}
for (const bad of [{ ...page, page: 2 }, { ...page, pageSize: 25 }, { ...page, expiresAt: undefined }, []]) {
  assert.deepEqual(await getAssignmentHistory(auth, query, async () => ({ status: 200, data: { success: true, data: bad } })),
    { ok: false, code: "INVALID_RESPONSE" });
}
assert.deepEqual(await getAssignmentHistory(auth, query, async () => { throw Error("private"); }), { ok: false, code: "CONNECTION_FAILED" });
console.log("History server service checks passed with injected requesters; no live requests or writes");
