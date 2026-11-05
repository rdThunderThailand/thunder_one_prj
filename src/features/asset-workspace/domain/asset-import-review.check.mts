/** Run: node src/features/asset-workspace/domain/asset-import-review.check.mts */
import assert from "node:assert/strict";
import { importReviewSelection, importConfirmProcessed } from "./asset-import-review.ts";
import { importResultMessage } from "./asset-import-messages.ts";
import { restoredMappingView } from "./asset-import-step.ts";
import type { ImportBatch, ImportRow } from "./asset-import-types.ts";
import { confirmRequestSchema, importBatchSchema, importRowSchema, rowMessageSchema, sourceFileUrlSchema } from "../services/asset-import-contract.ts";

// Contract fixtures are isolated to checks; none are loaded by the application.
const id = "11111111-1111-4111-8111-111111111111";
const counts = { valid: 172, warning: 10, error: 4, created: 0, createdWithWarning: 0, notRegistered: 0, pending: 0 };
const batch: ImportBatch = {
  id, batchCode: "IMP-20261104-0001", status: "validated", totalRows: 186, counts,
  createdAt: "2026-11-04T00:00:00Z", createdBy: { id, name: "Manager" }, sourceFile: null,
  original: null, registeredAssetsPath: `/assets/list?import_batch_id=${id}`,
};
const warning = importReviewSelection(counts, "ready_and_warnings", "  Replacement units  ", 1000);
assert.equal(warning.toRegister, 182);
assert.equal(warning.invalidReason, false);
assert.deepEqual(warning.body, { mode: "ready_and_warnings", override_reason: "Replacement units" });
const ready = importReviewSelection(counts, "ready_only", "Ignored", 1000);
assert.equal(ready.toRegister, 172);
assert.equal(ready.needsReason, false);
assert.deepEqual(ready.body, { mode: "ready_only" });
for (const reason of ["", "   ", "x".repeat(1001)]) {
  assert.ok(importReviewSelection(counts, "ready_and_warnings", reason, 1000).invalidReason);
}
assert.equal(importReviewSelection(counts, "ready_and_warnings", "x".repeat(1000), 1000).invalidReason, false);
const noWarning = importReviewSelection({ ...counts, warning: 0 }, "ready_and_warnings", "", 1000);
assert.deepEqual(noWarning.body, { mode: "ready_only" });
assert.equal(noWarning.needsReason, false);
assert.equal(importReviewSelection({ ...counts, valid: 0 }, "ready_only", "", 1000).toRegister, 0);
assert.equal(importConfirmProcessed(batch), 0);
assert.equal(importConfirmProcessed({ ...batch, status: "processing", counts: { ...counts, pending: 86 } }), 100);
assert.equal(importConfirmProcessed({ ...batch, status: "failed" }), 186);
assert.equal(restoredMappingView(batch, true), true, "a reload stays on Map & Validate");
assert.equal(restoredMappingView(batch, false), false, "a reload stays on Review & Confirm");
assert.equal(restoredMappingView(batch), false, "with no saved view a validated batch opens Review & Confirm");
assert.equal(restoredMappingView({ ...batch, counts: { ...counts, valid: 0, warning: 0 } }), true, "an all-error batch never opens Review & Confirm");
assert.equal(restoredMappingView({ ...batch, status: "processing" }, true), false);

for (const body of [{}, ready.body, warning.body]) assert.ok(confirmRequestSchema.safeParse(body).success);
for (const body of [{ mode: "other" }, { extra: true }, { override_reason: " " }, { override_reason: "x".repeat(1001) }]) {
  assert.equal(confirmRequestSchema.safeParse(body).success, false);
}
const message = { field: "serial_number", code: "SERIAL_DUPLICATE", severity: "warning", message: "Duplicate serial",
  details: [{ id, assetTag: "AST-1", name: "Earlier asset" }], detailsTotal: 25 } as const;
const row: ImportRow = { id, rowIndex: 2, values: { name: "Display" }, severity: "warning", messages: [{ ...message, details: [...message.details] }],
  result: "created_with_warning", errorCode: "SERIAL_DUPLICATE", errorMessage: "Serial Number is already used by another asset",
  createdAsset: { id, assetTag: "AST-2", name: "Display" }, override: { reason: null, by: null, at: "2026-11-04T00:00:00Z" }, originalRowIndex: null };
const parsed = importRowSchema.parse(row);
assert.deepEqual(parsed, row);
assert.equal(importResultMessage(parsed).severity, "warning", "an errorCode must not turn a successful warning into a failure");
assert.equal(importResultMessage(parsed).text, row.errorMessage);
assert.deepEqual(importResultMessage({ ...row, result: "created" }), { text: "Created", severity: null });
assert.deepEqual(importResultMessage({ ...row, result: null }), { text: "Pending", severity: null });
const failed: ImportRow = { ...row, result: "not_registered", severity: "valid", errorMessage: null, messages: [
  ...row.messages,
  { field: "location", code: "UNKNOWN_LOCATION", severity: "error", message: "Old problem" },
  { field: "asset_tag", code: "TAG_TAKEN", severity: "error", message: "New problem" },
] };
assert.deepEqual(importResultMessage(failed), { text: "Asset Tag is already used.", severity: "error" });
assert.equal(importResultMessage({ ...failed, errorMessage: "Core's primary result message" }).text, "Core's primary result message");
assert.ok(rowMessageSchema.safeParse({ ...message, details: Array.from({ length: 25 }, () => message.details[0]), detailsTotal: undefined }).success,
  "legacy duplicate arrays with no total are not capped by the frontend");
assert.equal(rowMessageSchema.parse(message).detailsTotal, 25);
assert.equal(rowMessageSchema.safeParse({ ...message, detailsTotal: -1 }).success, false);

for (const [status, created, createdWithWarning, notRegistered] of [
  ["completed", 176, 10, 0], ["partially_completed", 172, 10, 4], ["failed", 0, 0, 186],
] as const) {
  assert.ok(importBatchSchema.safeParse({ ...batch, status, counts: { ...counts, created, createdWithWarning, notRegistered } }).success);
}
for (const status of ["completed", "partially_completed", "failed"]) {
  assert.equal(importBatchSchema.safeParse({ ...batch, status }).success, false, "never accept empty fabricated result totals");
}
const source = { url: "https://storage.example.invalid/signed", expiresAt: "2026-11-04T00:05:00Z", name: "assets.csv" };
assert.ok(sourceFileUrlSchema.safeParse(source).success);
for (const url of ["javascript:alert(1)", "data:text/csv,Name", "https://user:secret@example.invalid/file"]) {
  assert.equal(sourceFileUrlSchema.safeParse({ ...source, url }).success, false);
}
console.log("asset-import-review.check.mts: review choices, reason bounds, result authority, additive contracts and final totals passed");
