import assert from "node:assert/strict";
import { assignAsset, getRecentAssignments, returnAsset, searchAvailableAssets, transferAsset } from "./asset-assignments-write.ts";

const id = "10000000-0000-4000-8000-000000000001";
const signal = new AbortController().signal;
const calls: unknown[][] = [];
const ok = (data: unknown) => (async (...args: unknown[]) => { calls.push(args); return data; }) as never;
const fail = (code: string, uncertain: boolean) => (async () => { throw Object.assign(new Error("x"), { code, uncertain }); }) as never;

const detail = {
  id, name: "Laptop", assetTag: "AST-1", serialNumber: null, category: null, categoryPath: [], qrValue: null, location: null,
  custody: { id: "20000000-0000-4000-8000-000000000002", name: "Somchai", type: "person", avatarUrl: null, department: null },
  lifecycleStatus: "Assigned", condition: "Good", acquisitionDate: null, registrationDate: "2026-11-10", updatedAt: "2026-11-10T00:00:00Z",
};
const saved = await assignAsset("ctx", id, { a: 1 }, signal, ok(detail));
assert.equal(saved.ok, true);
assert.deepEqual(calls.at(-1)?.slice(0, 3), ["POST", `/${id}/assign`, { a: 1 }]);
assert.equal((calls.at(-1)?.[3] as { creation: boolean }).creation, true);
assert.deepEqual(await assignAsset("ctx", id, {}, signal, fail("STALE", false)), { ok: false, code: "STALE", uncertain: false });
assert.deepEqual(await assignAsset("ctx", id, {}, signal, ok({ id: "other" })), { ok: false, code: "INVALID_RESPONSE", uncertain: true });

await transferAsset("ctx", id, { b: 2 }, signal, ok(detail));
assert.deepEqual(calls.at(-1)?.slice(0, 3), ["POST", `/${id}/transfer`, { b: 2 }]);
assert.deepEqual(await transferAsset("ctx", id, {}, signal, (async () => { throw new Error("down"); }) as never),
  { ok: false, code: "CONNECTION_FAILED", uncertain: true });

await searchAvailableAssets("ctx", " lap top ", signal, ok({ data: [], page: 1, pageSize: 10, total: 0, totalPages: 0 }));
assert.equal(calls.at(-1)?.[1], "/list?status=Available&pageSize=10&q=lap+top");
assert.deepEqual(await searchAvailableAssets("ctx", "", signal, ok({ nope: true })), { ok: false, status: 502, code: "CONTRACT_MISMATCH", message: "" });

const recent = await getRecentAssignments("ctx", id, signal, ok({ total: 1, data: [{ id, action: "Assign", at: "t", from: null,
  to: { type: "org_unit", id, name: "IT", avatarUrl: null }, location: null }] }));
assert.equal(recent.ok && recent.data.data[0].to?.name, "IT");
assert.deepEqual(await getRecentAssignments("ctx", id, signal, fail("NOT_FOUND", false)), { ok: false, status: 0, code: "NOT_FOUND", message: "" });

console.log("asset-assignments-write checks passed");

const returned = { ...detail, custody: null, lifecycleStatus: "In Maintenance", condition: "Damaged" };
const returnBody = { expectedUpdatedAt: detail.updatedAt, condition: "Damaged", evidenceFileIds: [id] };
const callCount = calls.length;
assert.equal((await returnAsset("ctx", id, returnBody, signal, ok(returned))).ok, true);
assert.equal(calls.length, callCount + 1);
assert.deepEqual(calls.at(-1)?.slice(0, 3), ["POST", `/${id}/return`, returnBody]);
assert.equal((calls.at(-1)?.[3] as { creation: boolean }).creation, true);
assert.deepEqual(await returnAsset("ctx", id, returnBody, signal, fail("STALE", false)), { ok: false, code: "STALE", uncertain: false });
assert.deepEqual(await returnAsset("ctx", id, returnBody, signal, ok({ id: "wrong" })), { ok: false, code: "INVALID_RESPONSE", uncertain: true });
let attempts = 0;
const uncertain = await returnAsset("ctx", id, returnBody, signal, (async () => {
  attempts += 1;
  throw Object.assign(new Error("private"), { code: "INTERNAL", uncertain: true });
}) as never);
assert.equal(attempts, 1);
assert.deepEqual(uncertain, { ok: false, code: "INTERNAL", uncertain: true });
console.log("Return POST parsing, uncertainty and no-retry checks passed");
