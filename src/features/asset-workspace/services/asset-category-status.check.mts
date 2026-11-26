/** Run: node src/features/asset-workspace/services/asset-category-status.check.mts */
import assert from "node:assert/strict";
import { setAssetCategoryStatus, type CategoryStatusRequester } from "./asset-category-status.ts";
import type { AssetCategoryDetail } from "../domain/asset-category.ts";

const category: AssetCategoryDetail = {
  id: "c1111111-1111-1111-1111-111111111111", name: "Electronics", code: "CAT-01",
  parentId: null, parent: null, description: null, isSerialRequired: true, status: "Active",
  ownAssetCount: 12, assetCount: 520, childCount: 1, updatedAt: "2026-11-09T00:00:00.123456+00:00",
  children: [{ id: "c2222222-2222-2222-2222-222222222222", name: "Computer", status: "Active", assetCount: 508 }],
};
const updated = { ...category, status: "Inactive", updatedAt: "2026-11-09T00:01:00.654321+00:00" };
const signal = new AbortController().signal;
const response = (status: number, data: unknown): CategoryStatusRequester => async () => ({ status, data });
let calls = 0;
const changed = await setAssetCategoryStatus("tenant:user", category, "Inactive", signal, async (id, body, options) => {
  calls++;
  assert.equal(id, category.id);
  assert.deepEqual(body, { status: "Inactive", expectedUpdatedAt: category.updatedAt });
  assert.deepEqual(options, { context: "tenant:user", signal });
  return { status: 200, data: { success: true, data: updated } };
});
assert.deepEqual(changed, { ok: true, data: updated });
assert.equal(calls, 1);
assert.equal(category.status, "Active", "the current snapshot is not changed optimistically");

const activated = await setAssetCategoryStatus("tenant:user", { ...category, status: "Inactive" }, "Active", signal,
  response(200, { success: true, data: category }));
assert.ok(activated.ok && activated.data.status === "Active");
const noop = await setAssetCategoryStatus("tenant:user", category, "Active", signal,
  response(200, { success: true, data: category }));
assert.ok(noop.ok && noop.data.updatedAt === category.updatedAt, "same-state no-op retains the server timestamp");

for (const [status, code] of [[409, "STALE"], [401, "UNAUTHENTICATED"], [403, "PERMISSION_DENIED"], [404, "NOT_FOUND"]] as const) {
  const result = await setAssetCategoryStatus("tenant:user", category, "Inactive", signal,
    response(status, { error: { code, message: "private backend diagnostics" } }));
  assert.ok(!result.ok && result.status === status && result.code === code && !result.uncertain);
  assert.ok(!JSON.stringify(result).includes("private backend diagnostics"));
}
for (const [status, data] of [
  [502, { error: "Gateway timeout", uncertain: true }],
  [500, { error: { code: "INTERNAL" } }],
  [200, { success: true, data: { id: category.id } }],
  [200, { success: true, data: { ...updated, id: "c3333333-3333-3333-3333-333333333333" } }],
] as const) {
  let attempts = 0;
  const result = await setAssetCategoryStatus("tenant:user", category, "Inactive", signal, async () => {
    attempts++;
    return { status, data };
  });
  assert.ok(!result.ok && result.uncertain);
  assert.equal(attempts, 1, "an uncertain mutation is never retried");
}
const preflight = await setAssetCategoryStatus("tenant:user", category, "Inactive", signal,
  response(503, { error: "Not configured", uncertain: false }));
assert.ok(!preflight.ok && !preflight.uncertain);
const network = await setAssetCategoryStatus("tenant:user", category, "Inactive", signal, async () => { throw new Error("private network details"); });
assert.ok(!network.ok && network.uncertain && !network.message.includes("private network details"));
const cancelled = new AbortController();
cancelled.abort();
const notSent = await setAssetCategoryStatus("tenant:user", category, "Inactive", cancelled.signal, async () => {
  assert.fail("a pre-aborted request must not dispatch");
});
assert.ok(!notSent.ok && !notSent.uncertain);
const afterDispatch = new AbortController();
const cancelledDuring = await setAssetCategoryStatus("tenant:user", category, "Inactive", afterDispatch.signal, async () => {
  afterDispatch.abort();
  throw new Error("cancelled after dispatch");
});
assert.ok(!cancelledDuring.ok && cancelledDuring.uncertain);
console.log("Category status checks passed (injected requester; no network or database writes).");
