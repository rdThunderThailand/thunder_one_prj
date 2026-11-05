/** Run: node src/features/asset-workspace/services/asset-import-start.check.mts */
import assert from "node:assert/strict";
import type { ImportBatch, ParsedImportFile } from "../domain/asset-import-types.ts";
import { ImportApiError } from "./asset-import-api.ts";
import { createHttpImportApi, type ImportHttpRequester } from "./asset-import-http.ts";
import { startImportBatch } from "./asset-import-start.ts";
import { putRegistrationUpload } from "./registration-upload-transport.ts";
import { XLSX_MIME } from "./asset-import-xlsx-template.ts";

// These responses and the fake Storage fetch are confined to this check file.
const tenantId = "11111111-1111-4111-8111-111111111111";
const userId = "22222222-2222-4222-8222-222222222222";
const batchId = "33333333-3333-4333-8333-333333333333";
const uploadId = "44444444-4444-4444-8444-444444444444";
const originalId = "55555555-5555-4555-8555-555555555555";
const attempt = { batchId, uploadId };
const file = new File(['Asset Name,Category,Location\r\n"จอ, ชั้น 1",DISPLAY,HQ'], "assets.csv", {
  type: "application/vnd.ms-excel",
});
const parsed: ParsedImportFile = {
  file, name: file.name, sizeBytes: file.size, kind: "csv",
  headers: ["Asset Name", "Category", "Location"],
  rows: [{ rowIndex: 2, cells: ["จอ, ชั้น 1", "DISPLAY", "HQ"] }], columnCount: 3, reimport: null,
};
let uploadingFile = file;
let uploadingMime = "text/csv";
const batch: ImportBatch = {
  id: batchId, batchCode: "IMP-20261104-0001", status: "uploaded", totalRows: 1,
  createdAt: "2026-11-04T00:00:00.000Z", createdBy: { id: userId, name: "Test manager" },
  sourceFile: { id: uploadId, name: file.name, sizeBytes: file.size, mimeType: "text/csv" },
  counts: { valid: 0, warning: 0, error: 0, created: 0, createdWithWarning: 0, notRegistered: 0, pending: 0 },
  original: null, registeredAssetsPath: `/assets/list?import_batch_id=${batchId}`,
};
type Scenario = "success" | "put-network" | "create-network" | "create-conflict" | "original-missing"
  | "original-unfinished" | "expired" | "content" | "bad-receipt" | "bad-batch" | "closed" | "forbidden"
  | "cancel-after-reserve" | "cancel-during-put" | "reserve-conflict" | "recovery-network";
let scenario: Scenario = "success";
let completed = false;
let created = false;
let creations = 0;
let dropped = false;
let cancelled = false;
let calls: string[] = [];
let payloads: unknown[] = [];
const success = (data: unknown) => ({ status: 200, data: { success: true, data } });
const failure = (code: string, status: number) => ({ status, data: { error: { code, message: "Never display this diagnostic" } } });
const expiresAt = () => new Date(Date.now() + 60000).toISOString();

const requester: ImportHttpRequester = async (request) => {
  assert.equal(request.headers["x-registration-context"], `${tenantId}:${userId}`);
  if (request.url.endsWith("/registration-uploads")) {
    calls.push("reserve");
    payloads.push(request.data);
    assert.deepEqual(request.data, {
      upload_id: uploadId, submission_id: batchId, purpose: "import_source", filename: uploadingFile.name,
      mime_type: uploadingMime, file_size_bytes: uploadingFile.size,
    });
    if (scenario === "closed") return failure("IMPORT_UNAVAILABLE", 503);
    if (scenario === "forbidden") return failure("PERMISSION_DENIED", 403);
    if (created || scenario === "reserve-conflict") return failure("INVALID_STATE", 409);
    if (scenario === "cancel-after-reserve") cancelled = true;
    return success({ uploadId, fileId: uploadId, completed, expiresAt: expiresAt(),
      signedUploadUrl: completed ? null : "https://storage.example.invalid/source",
      stagingPath: "temporary/source", completionPath: `/registration-uploads/${uploadId}/complete` });
  }
  if (request.url.endsWith("/complete")) {
    calls.push("complete");
    if (scenario === "expired") return failure("UPLOAD_EXPIRED", 409);
    if (scenario === "content") return failure("VALIDATION", 400);
    completed = true;
    return success({ fileId: scenario === "bad-receipt" ? userId : uploadId, expiresAt: expiresAt() });
  }
  if (request.method === "POST" && request.url.endsWith("/imports")) {
    calls.push("create");
    assert.deepEqual(request.data, { batch_id: batchId, source_upload_id: uploadId, total_rows: 1,
      ...(scenario.startsWith("original-") ? { original_import_id: originalId } : {}) });
    if (scenario === "original-missing") return failure("NOT_FOUND", 404);
    if (scenario === "original-unfinished") return failure("INVALID_STATE", 409);
    if (scenario === "create-conflict") { created = true; return failure("INVALID_STATE", 409); }
    const replayed = created;
    if (!created) creations += 1;
    created = true;
    if (scenario === "create-network" && !dropped) { dropped = true; throw new Error("Response lost"); }
    return success({ batchId, batchCode: batch.batchCode, status: "uploaded", totalRows: 1, rowsPerRequest: 1000, replayed });
  }
  if (request.method === "DELETE") { calls.push("delete"); return success({ deleted: true }); }
  calls.push("read");
  if (scenario === "recovery-network" && created) throw new Error("Batch recovery unavailable");
  if (request.url.endsWith(originalId)) return success({ ...batch, id: originalId, status: "validated" });
  if (!created) return failure("NOT_FOUND", 404);
  const currentBatch = uploadingFile === file ? batch : {
    ...batch,
    sourceFile: { ...batch.sourceFile!, name: uploadingFile.name, sizeBytes: uploadingFile.size, mimeType: uploadingMime },
  };
  return success(scenario === "bad-batch" ? { ...currentBatch, id: userId } : currentBatch);
};
const api = createHttpImportApi({ tenantId, userId }, requester);
const checkActive = () => { if (cancelled) throw new Error("Cancelled"); };
const start = () => startImportBatch(api, attempt,
  scenario.startsWith("original-") ? { ...parsed, reimport: { originalImportId: originalId, sourceRowColumn: 2 } } : parsed,
  () => {}, checkActive);
function reset(next: Scenario) {
  scenario = next;
  completed = created = dropped = cancelled = false;
  creations = 0;
  calls = [];
  payloads = [];
}
async function rejects(code: string) {
  await assert.rejects(start, (error) => error instanceof ImportApiError && error.code === code);
}
const realFetch = globalThis.fetch;
try {
  globalThis.fetch = async (url, init) => {
    calls.push("put");
    assert.equal(url, "https://storage.example.invalid/source");
    assert.equal(init?.body, uploadingFile);
    assert.equal(init?.method, "PUT");
    assert.equal(init?.credentials, "omit");
    assert.equal(init?.redirect, "error");
    assert.deepEqual(init?.headers, { "Content-Type": uploadingMime, "x-upsert": "false" });
    if (scenario === "put-network" && !dropped) { dropped = true; throw new Error("Offline"); }
    if (scenario === "cancel-during-put") cancelled = true;
    return new Response(null, { status: 200 });
  };
  reset("success");
  assert.deepEqual(await start(), batch);
  assert.deepEqual(calls, ["reserve", "put", "complete", "create", "read"]);
  assert.deepEqual(await start(), batch);
  assert.deepEqual(calls.slice(-2), ["reserve", "read"], "linked-upload retry recovers the existing batch before replacing any IDs");
  assert.equal(creations, 1);
  await api.discard(batchId);
  assert.equal(calls.at(-1), "delete");

  for (const test of ["put-network", "create-network"] as const) {
    reset(test);
    await rejects("CONNECTION_FAILED");
    assert.equal((await start()).id, batchId);
    assert.equal(creations, 1, "retry must not create a second batch");
    assert.deepEqual(payloads[0], payloads[1], "retry reuses both IDs");
    if (test === "create-network") {
      assert.equal(calls.filter((call) => call === "put").length, 1);
      assert.equal(calls.filter((call) => call === "complete").length, 1);
    }
  }
  reset("create-conflict");
  assert.equal((await start()).id, batchId);
  reset("recovery-network");
  await rejects("CONNECTION_FAILED");
  await rejects("CONNECTION_FAILED");
  assert.equal(creations, 1, "uncertain recovery must retain the original attempt, not restart upload");
  for (const [test, code] of [
    ["expired", "UPLOAD_EXPIRED"], ["content", "UPLOAD_CONTENT_INVALID"],
    ["original-missing", "ORIGINAL_IMPORT_NOT_FOUND"], ["original-unfinished", "ORIGINAL_IMPORT_UNFINISHED"],
    ["bad-receipt", "INVALID_RESPONSE"], ["bad-batch", "INVALID_RESPONSE"],
    ["closed", "IMPORT_UNAVAILABLE"], ["forbidden", "PERMISSION_DENIED"],
    ["reserve-conflict", "UPLOAD_CONFLICT"],
  ] as const) {
    reset(test);
    await rejects(code);
    if (["closed", "forbidden"].includes(test)) assert.deepEqual(calls, ["reserve"]);
    if (["expired", "content", "bad-receipt"].includes(test)) assert.equal(calls.includes("create"), false);
  }
  reset("success");
  cancelled = true;
  await assert.rejects(start, /Cancelled/);
  assert.equal(calls.length, 0);
  for (const test of ["cancel-after-reserve", "cancel-during-put"] as const) {
    reset(test);
    await assert.rejects(start, /Cancelled/);
    assert.deepEqual(calls, test === "cancel-after-reserve" ? ["reserve"] : ["reserve", "put"]);
  }

  reset("success");
  const { utils, write } = await import("xlsx");
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, utils.aoa_to_sheet([parsed.headers, parsed.rows[0].cells]), "Assets");
  uploadingFile = new File([write(workbook, { type: "array", bookType: "xlsx" })], "assets.xlsx", { type: "" });
  uploadingMime = XLSX_MIME;
  const excel = { ...parsed, file: uploadingFile, name: uploadingFile.name, sizeBytes: uploadingFile.size, kind: "xlsx" as const };
  const excelBatch = await startImportBatch(api, attempt, excel, () => {}, checkActive);
  assert.equal(excelBatch.sourceFile?.mimeType, XLSX_MIME, "XLSX uses the canonical MIME even when the browser gives none");
  assert.deepEqual(calls, ["reserve", "put", "complete", "create", "read"]);
  assert.equal((await startImportBatch(api, attempt, excel, () => {}, checkActive)).id, batchId);
  assert.equal(creations, 1, "XLSX retry recovers the original batch");

  // Existing staging objects resume through completion; other Storage failures stay failures.
  for (const [status, body, ok] of [[409, "", true], [400, '{"error":"Duplicate"}', true], [400, '{}', false], [500, '', false]] as const) {
    globalThis.fetch = async () => new Response(body, { status });
    assert.equal((await putRegistrationUpload(file, "https://storage.example.invalid/source", "text/csv")).ok, ok);
  }
  console.log("asset-import-start.check.mts: P1 request order, retries, receipts, recovery, cancellation, and shared Storage checks passed");
} finally {
  globalThis.fetch = realFetch;
}
