/** Run: node src/features/asset-workspace/services/asset-categories-api.check.mts */
import assert from "node:assert/strict";
import { getCategories, getCategory, type CategoryRequester } from "./asset-categories-api.ts";

const id = "11111111-1111-4111-8111-111111111111";
const childId = "22222222-2222-4222-8222-222222222222";
const context = `${id}:${childId}`;
const category = {
  id, name: "อุปกรณ์", code: "CAT-00001", parentId: null, parent: null, description: null,
  isSerialRequired: false, status: "Inactive", ownAssetCount: 0, assetCount: 520, childCount: 1,
  updatedAt: "2026-11-06T10:00:00+00:00",
};
const signal = new AbortController().signal;
const response = (data: unknown, status = 200): CategoryRequester => async () => ({ status, data });
const success = (data: unknown) => ({ success: true, data });

const result = await getCategories(context, signal, async (path, options) => {
  assert.equal(path, "/list", "client-side filters never reach Core");
  assert.deepEqual(options, { context, signal });
  return { status: 200, data: success([category]) };
});
assert.deepEqual(result, { ok: true, data: [category] });
assert.deepEqual(await getCategories(context, signal, response(success([]))), { ok: true, data: [] });

// Existing PostgreSQL seed IDs do not all have an RFC UUID version/variant.
const seededId = "c1111111-1111-1111-1111-111111111111";
const seeded = {
  ...category, id: seededId, name: "CCTV Cameras", code: "CAT-A", ownAssetCount: 10,
  assetCount: 10, childCount: 0, status: "Active", updatedAt: "2026-03-30T03:46:50.198486+00:00",
};
assert.deepEqual(await getCategories(context, signal, response(success([seeded]))), { ok: true, data: [seeded] });
const child = { ...category, parentId: seededId, parent: { id: seededId, name: seeded.name } };
assert.deepEqual(await getCategories(context, signal, response(success([seeded, child]))), { ok: true, data: [seeded, child] });
const seededDetail = { ...seeded, children: [] };
assert.deepEqual(await getCategory(context, seededId, signal, response(success(seededDetail))), { ok: true, data: seededDetail });
const seededChildDetail = { ...category, children: [{ id: seededId, name: seeded.name, status: "Active", assetCount: 10 }] };
assert.deepEqual(await getCategory(context, id, signal, response(success(seededChildDetail))), { ok: true, data: seededChildDetail });

const detail = { ...category, children: [{ id: childId, name: "Computer", status: "Active", assetCount: 320 }] };
assert.deepEqual(await getCategory(context, id, signal, async (path) => {
  assert.equal(path, `/${id}`);
  return { status: 200, data: success(detail) };
}), { ok: true, data: detail });
const badId = await getCategory(context, "../../another-tenant", signal, async () => {
  assert.fail("invalid IDs must not cause a request");
});
assert.ok(!badId.ok && badId.status === 400);

for (const data of [
  [category], { success: false, data: [category] }, success({ rows: [category] }),
  success([category, category]), success([{ ...category, assetCount: -1 }]),
  success([{ ...category, status: "Ready" }]), success([{ ...category, updatedAt: "invalid" }]),
  success([{ ...category, id: "not-a-uuid" }]),
]) {
  const invalid = await getCategories(context, signal, response(data));
  assert.ok(!invalid.ok && invalid.status === 502, "bad envelopes/counts/statuses/dates fail closed");
}
for (const status of [400, 401, 403, 404, 429, 500]) {
  const failed = await getCategories(context, signal, response({ secret: "private upstream text" }, status));
  assert.ok(!failed.ok);
  if (!failed.ok) {
    assert.equal(failed.status, status);
    assert.ok(!failed.message.includes("private upstream text"));
  }
}
const network = await getCategories(context, signal, async () => { throw new Error("private connection detail"); });
assert.ok(!network.ok && network.status === 503 && !network.message.includes("private connection detail"));

const cancelled = new AbortController();
cancelled.abort();
await assert.rejects(() => getCategories(context, cancelled.signal, async () => {
  assert.fail("an already-aborted read must not make a request");
}), { name: "AbortError" });
const interrupted = new AbortController();
await assert.rejects(() => getCategories(context, interrupted.signal, async () => {
  interrupted.abort();
  return { status: 200, data: success([category]) };
}), { name: "AbortError" });
console.log("Category read contract, context, failures, validation, and cancellation checks passed.");
