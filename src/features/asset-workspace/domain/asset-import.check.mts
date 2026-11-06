/** Run: node src/features/asset-workspace/domain/asset-import.check.mts */
import assert from "node:assert/strict";
import {
  formatBangkokDateTime,
  formatBytes,
  formatCount,
} from "./asset-import-format.ts";
import {
  autoMap,
  buildSendRows,
  chunk,
  firstTooLongCell,
  ignoredHeaders,
  missingRequired,
  normalizeHeader,
  setMapping,
} from "./asset-import-mapping.ts";
import {
  parseErrorText,
  requestErrorText,
  rowMessageText,
} from "./asset-import-messages.ts";
import { stepFor } from "./asset-import-step.ts";
import {
  IMPORT_FIELD_KEYS,
  type ImportBatch,
  type ImportColumn,
  type ParsedImportFile,
  type RowCode,
} from "./asset-import-types.ts";

// 1. Canonical 9 fields (no description)
assert.equal(IMPORT_FIELD_KEYS.length, 9);
assert.equal((IMPORT_FIELD_KEYS as readonly string[]).includes("description"), false);

// 2. Format helpers
assert.equal(formatBytes(0), "0 B");
assert.equal(formatBytes(512), "512 B");
assert.equal(formatBytes(2048), "2 KB");
assert.equal(formatBytes(8601234), "8.2 MB");
assert.equal(formatBytes(10 * 1024 * 1024), "10 MB");
assert.equal(formatCount(4800), "4,800");
assert.equal(formatCount(5000), "5,000");
assert.equal(formatBangkokDateTime("2026-11-02T07:25:00.000Z"), "2 Nov 2026, 14:25");

// 3. Auto-mapping on sample headers (Model, Type, Warranty End, Status, Description -> null)
const sampleHeaders = [
  "Asset Name *",
  "Model",
  "Type",
  "Category *",
  "Location *",
  "Serial No.",
  "Asset Tag",
  "Purchase Date",
  "Warranty End",
  "Condition",
  "Status",
  "Assignee",
  "Description",
  "Notes",
];
const mapped = autoMap(sampleHeaders);
assert.deepEqual(mapped, [
  "name",
  null,
  null,
  "category",
  "location",
  "serial_number",
  "asset_tag",
  "purchase_date",
  null,
  "condition",
  null,
  "assignee",
  null,
  "notes",
]);

assert.equal(normalizeHeader("  Asset Name * "), "asset name");
assert.deepEqual(ignoredHeaders(sampleHeaders, mapped), [
  "Model",
  "Type",
  "Warranty End",
  "Status",
  "Description",
]);

// 4. setMapping clears duplicate field assignments
const remapped = setMapping(mapped, 1, "name");
assert.equal(remapped[0], null);
assert.equal(remapped[1], "name");

// 5. missingRequired
const sampleColumns: ImportColumn[] = [
  { key: "name", label: "Asset Name", required: true, example: "" },
  { key: "category", label: "Category", required: true, example: "" },
  { key: "location", label: "Location", required: true, example: "" },
  { key: "notes", label: "Notes", required: false, example: "" },
];
assert.deepEqual(missingRequired(mapped, sampleColumns), []);
const withoutCategory = setMapping(mapped, 3, null);
assert.deepEqual(missingRequired(withoutCategory, sampleColumns), ["category"]);

// 6. buildSendRows & original_row_index handling (omits non-integer / out-of-range Source Row)
const fakeReimportFile: ParsedImportFile = {
  file: new File(["a"], "errors.csv", { type: "text/csv" }),
  name: "errors.csv",
  sizeBytes: 10,
  kind: "csv",
  headers: ["Asset Name", "Category", "Location", "Import ID", "Source Row"],
  rows: [
    { rowIndex: 2, cells: ["Camera", "SECURITY", "HQ", "11111111-1111-4111-8111-111111111111", "15"] },
    { rowIndex: 3, cells: ["Desk", "OFFICE", "HQ", "11111111-1111-4111-8111-111111111111", "abc"] },
    { rowIndex: 4, cells: ["Chair", "OFFICE", "HQ", "11111111-1111-4111-8111-111111111111", ""] },
  ],
  columnCount: 5,
  reimport: {
    originalImportId: "11111111-1111-4111-8111-111111111111",
    sourceRowColumn: 4,
  },
};
const reimportMapping = autoMap(fakeReimportFile.headers);
const sendRows = buildSendRows(fakeReimportFile, reimportMapping);
assert.equal(sendRows[0].row_index, 2);
assert.equal(sendRows[0].original_row_index, 15);
assert.equal("original_row_index" in sendRows[1], false);
assert.equal("original_row_index" in sendRows[2], false);

// 7. firstTooLongCell (> 5,000 chars)
assert.equal(firstTooLongCell(fakeReimportFile, reimportMapping), null);
const longFile: ParsedImportFile = {
  ...fakeReimportFile,
  rows: [
    ...fakeReimportFile.rows,
    { rowIndex: 9, cells: ["x".repeat(5001), "OFFICE", "HQ", "", ""] },
  ],
};
assert.equal(firstTooLongCell(longFile, reimportMapping), 9);

// 8. chunk
assert.deepEqual(chunk([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]);

// 9. stepFor table
const baseBatch: ImportBatch = {
  id: "11111111-1111-4111-8111-111111111111",
  batchCode: "IMP-20261104-0001",
  status: "uploaded",
  createdAt: "2026-11-04T10:00:00.000Z",
  createdBy: { id: "u1", name: "User" },
  sourceFile: null,
  totalRows: 10,
  counts: {
    valid: 0,
    warning: 0,
    error: 0,
    created: 0,
    createdWithWarning: 0,
    notRegistered: 0,
    pending: 0,
  },
  original: null,
  registeredAssetsPath: "/assets",
};
assert.deepEqual(stepFor(null, false), { step: 0 });
assert.deepEqual(stepFor({ ...baseBatch, status: "uploaded" }, true), { step: 1 });
assert.deepEqual(stepFor({ ...baseBatch, status: "uploaded" }, false), {
  step: 0,
  notice: "FILE_LOST",
});
assert.deepEqual(stepFor({ ...baseBatch, status: "validated" }, false), { step: 2 });
assert.deepEqual(stepFor({ ...baseBatch, status: "processing" }, false), { step: 2 });
assert.deepEqual(stepFor({ ...baseBatch, status: "completed" }, false), { step: 3 });
assert.deepEqual(stepFor({ ...baseBatch, status: "partially_completed" }, false), {
  step: 3,
});
assert.deepEqual(stepFor({ ...baseBatch, status: "failed" }, false), { step: 3 });

// 10. All 15 RowCode texts
const allCodes: RowCode[] = [
  "VALIDATION",
  "REQUIRED",
  "INVALID_DATE",
  "INVALID_CONDITION",
  "UNKNOWN_CATEGORY",
  "UNKNOWN_LOCATION",
  "UNKNOWN_ASSIGNEE",
  "AMBIGUOUS_REFERENCE",
  "SERIAL_REQUIRED",
  "SERIAL_DUPLICATE",
  "TAG_TAKEN",
  "TAG_DUPLICATE_IN_FILE",
  "ALREADY_IMPORTED",
  "UNKNOWN_SOURCE_ROW",
  "SOURCE_ROW_DUPLICATE_IN_FILE",
];
for (const code of allCodes) {
  const text = rowMessageText(
    { field: "name", code, severity: "error", message: "" },
    { name: "Test" },
  );
  assert.ok(text.length > 0, `Missing text for ${code}`);
}
assert.equal(
  rowMessageText({
    field: "row",
    code: "ALREADY_IMPORTED",
    severity: "error",
    message: "",
  }),
  "This row was already registered by an earlier import.",
);
assert.equal(
  rowMessageText({
    field: "row",
    code: "UNKNOWN_SOURCE_ROW",
    severity: "error",
    message: "",
  }),
  "Source Row is missing or not in the original import.",
);
assert.equal(
  rowMessageText({
    field: "row",
    code: "SOURCE_ROW_DUPLICATE_IN_FILE",
    severity: "error",
    message: "",
  }),
  "This source row appears on more than one row of this file.",
);

// 11. Request & Parse error texts
assert.equal(requestErrorText("UNAUTHENTICATED", 401), "Sign in again to continue.");
assert.equal(
  requestErrorText("PERMISSION_DENIED", 403),
  "You do not have permission to import assets.",
);
assert.equal(
  requestErrorText("IMPORT_UNAVAILABLE", 503),
  "Bulk import is not available yet.",
);
assert.equal(
  parseErrorText("TOO_MANY_ROWS", 5120),
  "The file has 5,120 rows; the limit is 5,000.",
);

console.log("asset-import.check.mts: all domain checks passed");
