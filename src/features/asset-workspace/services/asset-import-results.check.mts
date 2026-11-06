/** Run: node src/features/asset-workspace/services/asset-import-results.check.mts */
import assert from "node:assert/strict";
import type { ImportOptions, ImportRow } from "../domain/asset-import-types.ts";
import { importResultMessage } from "../domain/asset-import-messages.ts";
import { ImportApiError } from "./asset-import-api.ts";
import { errorFileAsXlsx } from "./asset-import-error-xlsx.ts";
import { createHttpImportApi } from "./asset-import-http.ts";
import { parseImportFile } from "./asset-import-parse.ts";

const tenantId = "11111111-1111-4111-8111-111111111111";
const userId = "22222222-2222-4222-8222-222222222222";
const batchId = "33333333-3333-4333-8333-333333333333";
// HTTP fixtures stay in this check file; result rows in the app always come from Core.
const row: ImportRow = {
  id: userId, rowIndex: 12, values: { name: "จอ", serial_number: "SN-1" }, severity: "warning",
  result: "created_with_warning", errorCode: "SERIAL_DUPLICATE", errorMessage: "Serial Number is already used by another asset",
  messages: [{ field: "serial_number", code: "SERIAL_DUPLICATE", severity: "warning", message: "Duplicate serial",
    details: [{ id: tenantId, name: "Earlier asset", assetTag: "AST-1" }], detailsTotal: 25 }],
  createdAsset: { id: batchId, name: "จอ", assetTag: "AST-2" },
  override: { reason: null, by: null, at: "2026-11-04T08:00:00Z" }, originalRowIndex: 15,
};
let sourceReads = 0;
let errorStatus = 0;
const queries: URLSearchParams[] = [];
const originalCsv = 'Import ID,Source Row,Asset Name\r\n' + batchId + ',12,"จอ"\r\n';
const api = createHttpImportApi({ tenantId, userId }, async (request) => {
  assert.equal(request.method, "GET");
  assert.equal(request.headers["x-registration-context"], `${tenantId}:${userId}`);
  if (errorStatus) return { status: errorStatus, data: new Blob([JSON.stringify({ error: {
    code: errorStatus === 404 ? "NOT_FOUND" : errorStatus === 409 ? "INVALID_STATE" : "IMPORT_UNAVAILABLE", message: "Diagnostic",
  } })]) };
  if (request.url.includes("/rows?")) {
    const query = new URL(request.url, "https://frontend.example.invalid").searchParams;
    queries.push(query);
    return { status: 200, data: { success: true, data: { rows: [row], page: 1, pageSize: 10, total: 1 } } };
  }
  if (request.url.endsWith("/source-file")) {
    sourceReads += 1;
    return { status: 200, data: { success: true, data: {
      url: `https://storage.example.invalid/source/${sourceReads}`, name: "assets.csv", expiresAt: "2026-11-04T08:05:00Z",
    } } };
  }
  assert.ok(request.url.endsWith("/result-file") || request.url.endsWith("/error-file"));
  assert.equal(request.responseType, "blob");
  return { status: 200, data: new Blob(["\uFEFF", originalCsv], { type: "text/csv;charset=utf-8" }) };
});
for (const result of [undefined, "created", "created_with_warning", "not_registered", "pending"] as const) {
  const page = await api.listRows(batchId, { result, q: "  จอ  ", page: 1, pageSize: 10 });
  assert.deepEqual(page.rows[0], row, "do not drop result messages, duplicate totals or nullable override fields");
  assert.equal(importResultMessage(page.rows[0]).severity, "warning");
  const query = queries.at(-1)!;
  assert.equal(query.get("q"), "จอ");
  assert.equal(query.get("result"), result ?? null);
  assert.equal(query.has("severity"), false, "P4 filters by result, not validation severity");
}
assert.notEqual((await api.sourceFileUrl(batchId)).url, (await api.sourceFileUrl(batchId)).url,
  "request a fresh source URL on every action rather than caching a five-minute link");
for (const kind of ["result", "error"] as const) {
  const file = await api.downloadFile(batchId, kind, "IMP-20261104-0001");
  assert.equal(file.filename, `IMP-20261104-0001-${kind === "error" ? "errors" : "result"}.csv`);
  assert.equal(await file.blob.text(), originalCsv, "preserve the Core artifact and its trace columns without generating rows");
  const bytes = new Uint8Array(await file.blob.arrayBuffer());
  assert.deepEqual([...bytes.slice(0, 3)], [0xef, 0xbb, 0xbf]);
  assert.notDeepEqual([...bytes.slice(3, 6)], [0xef, 0xbb, 0xbf]);
}
// The Excel error file must upload back on P1 exactly like Core's CSV.
const errorCsv = `﻿Asset Name,Acquisition Date,Import ID,Source Row,Error Message\r\n"จอ, ใหญ่",2026-01-01,${batchId},12,"'=SUM(1,2)"\r\n`;
const excel = await errorFileAsXlsx({ blob: new Blob([errorCsv]), filename: "IMP-1-errors.csv" });
assert.equal(excel.filename, "IMP-1-errors.xlsx");
const reopened = await parseImportFile(new File([excel.blob], excel.filename), {
  file: { extensions: [".csv", ".xlsx"], maxBytes: 1_000_000, maxRows: 10 },
} as ImportOptions);
assert.deepEqual(reopened.headers, ["Asset Name", "Acquisition Date", "Import ID", "Source Row", "Error Message"]);
assert.deepEqual(reopened.rows[0].cells, ["จอ, ใหญ่", "2026-01-01", batchId, "12", "'=SUM(1,2)"]);
assert.deepEqual(reopened.reimport, { originalImportId: batchId, sourceRowColumn: 3 });
for (const [status, code] of [[404, "NOT_FOUND"], [409, "INVALID_STATE"], [503, "IMPORT_UNAVAILABLE"]] as const) {
  errorStatus = status;
  await assert.rejects(() => api.downloadFile(batchId, "error", "IMP-20261104-0001"),
    (error) => error instanceof ImportApiError && error.code === code && error.status === status);
}
console.log("asset-import-results.check.mts: result filters, additive rows, fresh source reads, real-artifact transport and blob errors passed");
