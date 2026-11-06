/** Run: node src/features/asset-workspace/services/asset-import-validation.check.mts */
import assert from "node:assert/strict";
import { autoMap } from "../domain/asset-import-mapping.ts";
import type { ImportBatch, ImportOptions, ImportRow, ParsedImportFile, SendRow } from "../domain/asset-import-types.ts";
import { ImportApiError } from "./asset-import-api.ts";
import { createHttpImportApi, type ImportHttpRequester } from "./asset-import-http.ts";
import { prepareImportValidation, validateImportBatch } from "./asset-import-validation.ts";
import type { ImportProgress } from "./asset-import-start.ts";

const tenantId = "11111111-1111-4111-8111-111111111111";
const userId = "22222222-2222-4222-8222-222222222222";
const batchId = "33333333-3333-4333-8333-333333333333";
const headers = ["Asset Name", "Category", "Location", "Notes", "Model"];
const rows = Array.from({ length: 4800 }, (_, index) => ({ rowIndex: index + 2,
  cells: [`จอ ${index + 1}`, "DISPLAY", "HQ", "", "Ignored model"] }));
const file = new File([headers.join(",") + "\n" + rows.map((row) => row.cells.join(",")).join("\n")], "assets.csv");
const parsed: ParsedImportFile = { file, name: file.name, sizeBytes: file.size, kind: "csv", headers, rows, columnCount: 5, reimport: null };
const mapping = autoMap(headers);
const options: Pick<ImportOptions, "columns" | "chunks"> = {
  columns: ["name", "category", "location", "notes"].map((key) => ({
    key, label: key, required: key !== "notes", example: "",
  })) as ImportOptions["columns"],
  chunks: { rowsPerRequest: 1000, confirmRowsPerRequest: 100 },
};
const counts = { valid: 4798, warning: 1, error: 1, created: 0, createdWithWarning: 0, notRegistered: 0, pending: 0 };
const batch: ImportBatch = {
  id: batchId, batchCode: "IMP-20261104-0001", status: "validated", totalRows: rows.length,
  createdAt: "2026-11-04T00:00:00Z", createdBy: { id: userId, name: "Test manager" }, sourceFile: null,
  counts, original: null, registeredAssetsPath: `/assets/list?import_batch_id=${batchId}`,
};
const warning: ImportRow = {
  id: userId, rowIndex: 37, values: { name: "จอ 36", serial_number: "SN-1" }, severity: "warning",
  messages: [{ field: "serial_number", code: "SERIAL_DUPLICATE", severity: "warning", message: "Core diagnostic",
    details: [{ id: tenantId, assetTag: "AST-1", name: "Existing display" }] }],
  result: null, createdAsset: null, override: null, originalRowIndex: null,
};
const success = (data: unknown) => ({ status: 200, data: { success: true, data } });
const failure = (code: string, status: number, details?: unknown) => ({ status, data: { error: { code, message: "Hidden diagnostic", details } } });
type Scenario = "success" | "lost-chunk" | "missing-once" | "missing-always" | "bad-row" | "missing-batch"
  | "moved-batch" | "forbidden" | "closed" | "bad-count" | "read-network" | "all-error";
let scenario: Scenario = "success";
let stored = new Map<number, SendRow>();
let sent: SendRow[][] = [];
let validateCalls = 0;
let readCalls = 0;
let dropped = false;
const requester: ImportHttpRequester = async (request) => {
  assert.equal(request.headers["x-registration-context"], `${tenantId}:${userId}`);
  if (request.method === "POST" && request.url.endsWith("/rows")) {
    const payload = request.data as { rows: SendRow[] };
    const currentProgress = progress.at(-1);
    const acknowledgedRows = payload.rows[0].row_index - 2;
    assert.equal(currentProgress?.validation?.phase, "sending");
    assert.equal(currentProgress?.validation?.sentRows, acknowledgedRows,
      "pending rows must not be reported as sent before the response arrives");
    assert.equal(currentProgress?.value, acknowledgedRows / rows.length * 100);
    assert.ok(payload.rows.length > 0 && payload.rows.length <= 1000);
    sent.push(payload.rows);
    if (scenario === "bad-row") return failure("VALIDATION", 400);
    if (scenario === "missing-batch") return failure("NOT_FOUND", 404);
    if (scenario === "moved-batch") return failure("INVALID_STATE", 409);
    if (scenario === "forbidden") return failure("PERMISSION_DENIED", 403);
    if (scenario === "closed") return failure("IMPORT_UNAVAILABLE", 503);
    let inserted = 0;
    for (const row of payload.rows) {
      if (!stored.has(row.row_index)) { stored.set(row.row_index, row); inserted += 1; }
      assert.deepEqual(Object.keys(row.values).sort(), ["category", "location", "name", "notes"]);
    }
    if (scenario === "lost-chunk" && sent.length === 2 && !dropped) {
      dropped = true;
      throw new Error("Response lost after storing this chunk");
    }
    return success({ received: payload.rows.length, inserted: scenario === "bad-count" ? inserted + 1 : inserted,
      alreadyPresent: payload.rows.length - inserted, batch: { status: "uploaded", rowsStored: stored.size, totalRows: rows.length } });
  }
  if (request.url.endsWith("/validate")) {
    assert.equal(progress.at(-1)?.validation?.phase, "validating");
    validateCalls += 1;
    if (scenario === "missing-always" || (scenario === "missing-once" && validateCalls === 1)) {
      return failure("VALIDATION", 400, { expected: rows.length, received: rows.length - 1 });
    }
    return success({ batchId, status: "validated", counts: { total: rows.length,
      valid: scenario === "all-error" ? 0 : counts.valid, warning: scenario === "all-error" ? 0 : counts.warning,
      error: scenario === "all-error" ? rows.length : counts.error } });
  }
  if (request.url.includes("/rows?")) {
    const query = new URL(request.url, "https://frontend.example.invalid").searchParams;
    assert.deepEqual([...query.keys()].sort(), ["page", "pageSize", "q", "severity"].sort());
    assert.equal(query.get("severity"), "warning");
    assert.equal(query.get("q"), "37");
    if (query.get("page") === "2") return failure("VALIDATION", 400);
    return success({ rows: [warning], page: 1, pageSize: 10, total: 1 });
  }
  if (request.url.endsWith("/error-file")) {
    assert.equal(request.responseType, "blob");
    return { status: 409, data: new Blob([JSON.stringify(failure("INVALID_STATE", 409).data)]) };
  }
  readCalls += 1;
  if (scenario === "read-network" && readCalls === 1) throw new Error("Read unavailable");
  return success(scenario === "all-error" ? { ...batch, counts: { ...counts, valid: 0, warning: 0, error: rows.length } } : batch);
};
const api = createHttpImportApi({ tenantId, userId }, requester);
function reset(next: Scenario) {
  scenario = next;
  stored = new Map();
  sent = [];
  validateCalls = readCalls = 0;
  dropped = false;
}
const prepare = () => prepareImportValidation(batchId, parsed, mapping, options);
const progress: ImportProgress[] = [];
const run = (attempt: ReturnType<typeof prepare>, check = () => {}) =>
  validateImportBatch(api, attempt, (value) => progress.push(value), check);
const rejectsCode = async (operation: () => Promise<unknown>, code: string) =>
  assert.rejects(operation, (error) => error instanceof ImportApiError && error.code === code);

reset("success");
const ready = prepare();
assert.deepEqual(ready.chunks.map((chunk) => chunk.length), [1000, 1000, 1000, 1000, 800]);
assert.deepEqual(await run(ready), batch);
assert.ok(progress.some((item) => item.label === "Sending rows 1,001–2,000 of 4,800…"));
assert.equal(progress[0].value, 0, "progress starts before any row has been acknowledged");
assert.deepEqual(progress.at(-1)?.validation, { phase: "refreshing", sentRows: 4800, totalRows: 4800 });
assert.equal(stored.size, 4800);
assert.equal(validateCalls, 1);

reset("lost-chunk");
const interrupted = prepare();
await rejectsCode(() => run(interrupted), "CONNECTION_FAILED");
assert.equal(interrupted.nextChunk, 1);
assert.equal(progress.at(-1)?.validation?.sentRows, 1000, "a lost response must not advance the reported row count");
await run(interrupted);
assert.deepEqual(sent.map((chunk) => chunk[0].row_index), [2, 1002, 1002, 2002, 3002, 4002]);
assert.deepEqual(sent[1], sent[2]);
assert.equal(stored.size, 4800);

reset("missing-once");
await run(prepare());
assert.equal(sent.length, 10);
assert.equal(validateCalls, 2);
assert.equal(stored.size, 4800);
reset("missing-always");
await rejectsCode(() => run(prepare()), "VALIDATION");
assert.equal(validateCalls, 2, "missing-row recovery must not loop");

for (const [test, code] of [["bad-row", "VALIDATION"], ["missing-batch", "NOT_FOUND"], ["moved-batch", "INVALID_STATE"],
  ["forbidden", "PERMISSION_DENIED"], ["closed", "IMPORT_UNAVAILABLE"], ["bad-count", "INVALID_RESPONSE"]] as const) {
  reset(test);
  await rejectsCode(() => run(prepare()), code);
  assert.equal(sent.length, 1);
  assert.equal(validateCalls, 0);
}
reset("read-network");
const completedRows = prepare();
await rejectsCode(() => run(completedRows), "CONNECTION_FAILED");
assert.equal(completedRows.nextChunk, 5);
await run(completedRows);
assert.equal(sent.length, 5, "a failed batch read must not send the stored rows again");

reset("all-error");
const allError = await run(prepare());
assert.equal(allError.counts.error, 4800);
assert.equal(allError.counts.valid + allError.counts.warning, 0);

reset("success");
assert.throws(() => prepareImportValidation(batchId, parsed, mapping.map(() => null), options), ImportApiError);
assert.throws(() => prepareImportValidation(batchId, { ...parsed, rows: [{ rowIndex: 42, cells: ["x".repeat(5001), "DISPLAY", "HQ"] }] }, mapping, options),
  (error) => error instanceof ImportApiError && error.code === "CELL_TOO_LONG" && error.message.includes("42"));
assert.equal(sent.length, 0);
await assert.rejects(() => run(prepare(), () => { throw new Error("Cancelled"); }), /Cancelled/);
assert.equal(sent.length, 0);
const page = await api.listRows(batchId, { page: 1, pageSize: 10, severity: "warning", q: " 37 " });
assert.deepEqual(page.rows, [warning]);
await rejectsCode(() => api.listRows(batchId, { page: 2, pageSize: 10, severity: "warning", q: "37" }), "VALIDATION");
await rejectsCode(() => api.downloadFile(batchId, "error", batch.batchCode), "INVALID_STATE");
console.log("asset-import-validation.check.mts: chunking, frozen retries, bounded recovery, contract reads, errors and blob failures passed");
