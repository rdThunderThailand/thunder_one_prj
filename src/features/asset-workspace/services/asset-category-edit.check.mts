import assert from "node:assert/strict";
import { updateAssetCategory, type CategoryEditRequester } from "./asset-category-edit.ts";

const id = "c1111111-1111-1111-1111-111111111111";
const input = { expectedUpdatedAt: "2026-11-09T00:00:00.123456+00:00", description: "New text" };
const detail = { id, name: "Electronics", code: "CAT-01", parentId: null, parent: null,
  description: "New text", isSerialRequired: false, status: "Inactive", ownAssetCount: 12,
  assetCount: 520, childCount: 0, children: [], updatedAt: "2026-11-09T00:01:00.654321+00:00" };
const signal = new AbortController().signal;
const response = (status: number, data: unknown): CategoryEditRequester => async () => ({ status, data });
let calls = 0;
const saved = await updateAssetCategory("tenant:user", id, input, signal, async (sentId, body, options) => {
  calls++;
  assert.equal(sentId, id);
  assert.deepEqual(body, input);
  assert.deepEqual(options, { context: "tenant:user", signal });
  return { status: 200, data: { success: true, data: detail } };
});
assert.deepEqual(saved, { ok: true, data: detail });
assert.equal(calls, 1);
for (const [status, code, field] of [[409, "STALE", null], [409, "DUPLICATE_NAME", "name"],
  [400, "INVALID_PARENT", "parentId"], [400, "HIERARCHY_LOOP", "parentId"], [403, "PERMISSION_DENIED", null]] as const) {
  const failed = await updateAssetCategory("tenant:user", id, input, signal,
    response(status, { error: { code, message: "private diagnostics" } }));
  assert.ok(!failed.ok && failed.code === code && !failed.uncertain);
  if (field) assert.ok(failed.fields[field]);
  assert.ok(!JSON.stringify(failed).includes("private diagnostics"));
}
const validation = await updateAssetCategory("tenant:user", id, input, signal,
  response(400, { error: { code: "VALIDATION", details: { description: ["private validation text"] } } }));
assert.ok(!validation.ok && validation.fields.description);
for (const [status, data] of [[502, { error: "Unavailable", uncertain: true }], [500, {}], [200, { success: true, data: {} }],
  [200, { success: true, data: { ...detail, id: "c2222222-2222-2222-2222-222222222222" } }]] as const) {
  let attempts = 0;
  const uncertain = await updateAssetCategory("tenant:user", id, input, signal, async () => {
    attempts++;
    return { status, data };
  });
  assert.ok(!uncertain.ok && uncertain.uncertain);
  assert.equal(attempts, 1);
}
const cancelled = new AbortController();
cancelled.abort();
const notSent = await updateAssetCategory("tenant:user", id, input, cancelled.signal, async () => assert.fail("must not dispatch"));
assert.ok(!notSent.ok && !notSent.uncertain);
const network = await updateAssetCategory("tenant:user", id, input, signal, async () => { throw new Error("timeout"); });
assert.ok(!network.ok && network.uncertain);
console.log("Category edit transport checks passed; injected requests, no live writes.");
