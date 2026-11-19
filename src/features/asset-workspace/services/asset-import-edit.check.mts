import assert from "node:assert/strict";
import { createHttpImportApi } from "./asset-import-http.ts";
import { ImportApiError } from "./asset-import-api.ts";
import { readAllImportRows } from "./asset-import-edit.ts";
import type { ImportHttpRequester } from "./asset-import-transport.ts";

const id = "11111111-1111-4111-8111-111111111111";
const patchRow = { id, rowIndex: 2, values: { category: "NEW" }, version: 2, editedAt: "2026-11-19T00:00:00Z",
  severity: "valid", messages: [], errorCode: null, errorMessage: null };
const row = { ...patchRow, result: null, createdAsset: null, override: null, originalRowIndex: null };
const saved = { row, affectedRows: [], counts: { total: 1, valid: 1, warning: 0, error: 0 }, editedCount: 1 };
const calls: Parameters<ImportHttpRequester>[0][] = [];
const api = createHttpImportApi({ tenantId: id, userId: id }, async (request) => {
  calls.push(request);
  return { status: 200, data: { success: true, data: request.method === "PATCH" ? { ...saved, row: patchRow }
    : request.url.endsWith("/check") ? { severity: "valid", messages: [] }
    : { rows: [row], total: 1, page: 1, pageSize: 100 } } };
});
const body = { values: { category: "NEW" }, version: 1,
  apply_to_same_value: { field: "category" as const, from: "OLD" } };
assert.deepEqual(await api.saveRow(id, id, body), saved);
assert.equal(calls[0].method, "PATCH");
assert.deepEqual(calls[0].data, body);
assert.equal(calls[0].headers["x-registration-context"], `${id}:${id}`);
const controller = new AbortController();
await api.checkRow(id, id, { asset_tag: "TAG" }, controller.signal);
assert.equal(calls[1].signal, controller.signal);
assert.deepEqual(calls[1].data, { values: { asset_tag: "TAG" } });
assert.deepEqual(await readAllImportRows(api, id), [row]);
controller.abort();
await assert.rejects(() => readAllImportRows(api, id, controller.signal), { name: "AbortError" });
for (const code of ["STALE", "INVALID_STATE", "PERMISSION_DENIED", "NOT_FOUND", "VALIDATION"]) {
  const broken = createHttpImportApi({ tenantId: id, userId: id }, async () => ({
    status: code === "PERMISSION_DENIED" ? 403 : code === "NOT_FOUND" ? 404 : code === "VALIDATION" ? 400 : 409,
    data: { error: { code, message: "Rejected" } },
  }));
  await assert.rejects(() => broken.saveRow(id, id, body), (error) => error instanceof ImportApiError && error.code === code);
}
console.log("Import edit API checks passed");
