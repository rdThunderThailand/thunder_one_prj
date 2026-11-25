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
    : { rows: [row], total: 1, page: 1, pageSize: 1000 } } };
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

// A large import: every page is read once, the later pages together, and the order stays.
const many = Array.from({ length: 2500 }, (_, index) => ({ ...row, rowIndex: index + 2 }));
const pages: number[] = [];
let missing = 0;
const large = createHttpImportApi({ tenantId: id, userId: id }, async (request) => {
  const params = new URL(request.url, "http://local").searchParams;
  const page = Number(params.get("page"));
  const pageSize = Number(params.get("pageSize"));
  pages.push(page);
  await new Promise((resolve) => setTimeout(resolve, page === 2 ? 20 : 0));
  const rows = many.slice((page - 1) * pageSize, page * pageSize - (page === 2 ? missing : 0));
  return { status: 200, data: { success: true, data: { rows, total: many.length, page, pageSize } } };
});
assert.deepEqual((await readAllImportRows(large, id)).map((row) => row.rowIndex), many.map((row) => row.rowIndex));
assert.deepEqual(pages.sort(), [1, 2, 3]);
missing = 1;
await assert.rejects(() => readAllImportRows(large, id), /could not be read completely/);
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
