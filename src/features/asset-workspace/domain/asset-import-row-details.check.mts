/** Run: node src/features/asset-workspace/domain/asset-import-row-details.check.mts */
import assert from "node:assert/strict";
import { rowFieldChecks, rowHasExtraMessages, rowIssueCounts } from "./asset-import-row-details.ts";
import type { ImportRow } from "./asset-import-types.ts";

const base: ImportRow = {
  id: "11111111-1111-4111-8111-111111111111", rowIndex: 8, severity: "error", result: "not_registered",
  values: { name: "Camera", serial_number: "SN-1", category: "Unknown" },
  messages: [
    { field: "serial_number", code: "SERIAL_DUPLICATE", severity: "warning", message: "Duplicate" },
    { field: "category", code: "UNKNOWN_CATEGORY", severity: "warning", message: "Unknown" },
    { field: "category", code: "VALIDATION", severity: "error", message: "Asset Name is required." },
  ],
  errorCode: "UNKNOWN_CATEGORY", errorMessage: "Unknown", createdAsset: null, override: null, originalRowIndex: null,
};
const status = (row: ImportRow, key: string) => rowFieldChecks(row).find((check) => check.key === key);

// A filled field with no message passed, a blank one was not provided, and an error outranks a warning.
assert.equal(status(base, "name")?.status, "valid");
assert.equal(status(base, "notes")?.status, "empty");
assert.equal(status(base, "serial_number")?.status, "warning");
assert.equal(status(base, "category")?.status, "error");
assert.match(status(base, "category")?.message ?? "", /Unknown.*required/);
assert.equal(rowFieldChecks(base).length, 9);
assert.deepEqual(rowIssueCounts(base), { errors: 1, warnings: 2 });

// Only messages a field cell cannot show need the list under the tables, and a cell keeps its message details.
assert.equal(rowHasExtraMessages(base), false);
assert.equal(rowHasExtraMessages({ ...base, errorMessage: "Core text" }), true);
const withDetails = { ...base, errorMessage: "Duplicate", messages: [{ ...base.messages[0], details: [] }] };
assert.equal(rowHasExtraMessages(withDetails), false);
assert.deepEqual(status(withDetails, "serial_number")?.messages[0].details, []);
assert.equal(rowHasExtraMessages({ ...base, messages: [{ ...base.messages[0], field: "row" }] }), true);

console.log("asset-import-row-details.check.mts: field results, issue counts and extra messages passed");
