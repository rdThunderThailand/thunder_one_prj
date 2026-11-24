/** Run: node src/features/asset-workspace/services/kept-import-pages.check.mts */
import assert from "node:assert/strict";
import { keepImportPages } from "./kept-import-pages.ts";

const pages = keepImportPages();
const page = { rows: [], page: 1, pageSize: 10, total: 0 };
for (const status of ["validated", "completed", "partially_completed", "failed"] as const) {
  pages.set(pages.key(status, "first"), page);
  assert.equal(pages.get(pages.key(status, "first")), page);
}
for (const status of ["uploaded", "processing", undefined] as const) {
  assert.equal(pages.key(status, "first"), null, "rows that Core still changes are never kept");
  pages.set(pages.key(status, "first"), page);
  assert.equal(pages.get(pages.key(status, "first")), undefined);
}
assert.equal(pages.get(pages.key("validated", "second")), undefined);
pages.clear();
assert.equal(pages.get(pages.key("completed", "first")), undefined);
console.log("Kept import pages checks passed.");
