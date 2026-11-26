/** Run: node src/features/asset-workspace/domain/asset-import-history.check.mts */
import assert from "node:assert/strict";
import { HISTORY_STATUS, importHistorySchema, importHistoryFailure } from "./asset-import-history.ts";

assert.equal(HISTORY_STATUS.partially_completed.label, "Partially completed");
assert.equal(importHistoryFailure({ status: 403, code: "PERMISSION_DENIED" }).status, 403);
assert.equal(importHistorySchema.safeParse({ batches: [], page: 1, pageSize: 25, total: 0 }).success, true);
assert.equal(importHistorySchema.safeParse({ batches: [], page: 1, pageSize: 200, total: 0 }).success, false);
console.log("Import History: status labels, permission failure and fixed page-size contract passed.");
