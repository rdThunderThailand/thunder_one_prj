import assert from "node:assert/strict";
import { importChanges, importPatch, sameValueRows } from "./asset-import-edit.ts";
import type { ImportRow } from "./asset-import-types.ts";

const row: ImportRow = { id: "row", rowIndex: 2, version: 1, values: { name: "Desk", category: "OLD", notes: "Clear me" },
  severity: "error", messages: [], result: null, override: null, createdAsset: null, originalRowIndex: null };
assert.deepEqual(importChanges(row.values, { ...row.values }), {});
assert.deepEqual(importChanges(row.values, { ...row.values, notes: "" }), { notes: "" });
assert.deepEqual(importPatch(row, { ...row.values, category: "NEW", location: "HQ" }, "category"), {
  values: { category: "NEW", location: "HQ" }, version: 1, apply_to_same_value: { field: "category", from: "OLD" },
});
assert.equal(importPatch(row, { ...row.values, name: "Table" }, "category").apply_to_same_value, undefined);
assert.throws(() => importPatch({ ...row, version: undefined }, { name: "Table" }, null));
assert.equal(sameValueRows([row, { ...row, id: "other", values: { category: " OLD " } },
  { ...row, id: "different", values: { category: "NEW" } }], row, "category"), 1);
console.log("Import edit draft checks passed");
