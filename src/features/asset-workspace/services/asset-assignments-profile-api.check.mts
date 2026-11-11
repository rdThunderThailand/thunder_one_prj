import assert from "node:assert/strict";
import { getProfileAssignments } from "./asset-assignments-profile-api.ts";
import { getRecentAssignments } from "./asset-assignments-write.ts";

const assetId = "10000000-0000-0000-0000-000000000001";
const id = "10000000-0000-0000-0000-000000000002";
const holder = { id, type: "person", name: "Jane Doe", avatarUrl: null };
const at = "2026-11-11T09:00:00+07:00";
const start = { id, action: "Assign", at, asset: { id: assetId, name: "Laptop", assetTag: "AST-001" },
  from: null, to: holder, performedBy: null, condition: null, reason: null, location: { id, name: "Historical room" },
  custodyPeriod: { startedAt: at, endedAt: null }, evidence: [] };
const returned = { ...start, action: "Return", from: holder, to: null, custodyPeriod: null, condition: "Good" };
const response = { data: [returned, start], page: 2, pageSize: 20, total: 22, totalPages: 2, expiresAt: at };
const query = { page: 2, pageSize: 20, q: "Jane Doe", event_type: "Assign", date_from: "2026-11-01", date_to: "2026-11-11" } as const;
const controller = new AbortController();
const result = await getProfileAssignments("tenant:user", assetId, query, controller.signal, async (method, path, body, options) => {
  assert.equal(method, "GET");
  assert.equal(body, undefined);
  assert.equal(options?.context, "tenant:user");
  assert.equal(options?.signal, controller.signal);
  const [route, queryString] = path.split("?");
  assert.equal(route, `/${assetId}/assignments`);
  assert.deepEqual(Object.fromEntries(new URLSearchParams(queryString)), { ...query, page: "2", pageSize: "20" });
  return response;
});
assert.ok(result.ok);
assert.equal(result.data.data[0].custodyPeriod, null);
assert.equal(result.data.data[1].custodyPeriod?.startedAt, at);
assert.equal(result.data.data[1].location?.name, "Historical room");
assert.equal(result.data.expiresAt, at);
for (const malformed of [
  { ...response, page: 1 },
  { ...response, pageSize: 10 },
  { ...response, totalPages: 4 },
  { ...response, data: [start, start] },
  { ...response, data: [{ ...start, asset: { ...start.asset, id } }] },
  { ...response, data: [{ ...start, custodyPeriod: null }] },
  { ...response, data: [{ ...returned, custodyPeriod: start.custodyPeriod }] },
  { ...response, data: [{ ...start, custodyPeriod: { startedAt: at, endedAt: "2026-11-01T00:00:00Z" } }] },
]) {
  const bad = await getProfileAssignments("tenant:user", assetId, query, controller.signal, async () => malformed);
  assert.ok(!bad.ok);
  assert.equal(bad.code, "CONTRACT_MISMATCH");
}
for (const code of ["VALIDATION", "UNAUTHENTICATED", "PERMISSION_DENIED", "NOT_FOUND"]) {
  const bad = await getProfileAssignments("tenant:user", assetId, query, controller.signal, async () => {
    throw { code, message: "Upstream diagnostics" };
  });
  assert.ok(!bad.ok);
  assert.equal(bad.code, code);
  assert.equal(bad.message, "");
}
const recent = await getRecentAssignments("tenant:user", assetId, controller.signal, async () => response);
assert.ok(recent.ok);
assert.ok(!("custodyPeriod" in recent.data.data[0]));
console.log("Per-asset assignment query, periods, pagination, error codes and Recent History compatibility passed");
