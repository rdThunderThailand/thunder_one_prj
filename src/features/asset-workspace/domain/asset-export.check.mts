/** Run: node src/features/asset-workspace/domain/asset-export.check.mts */
import assert from "node:assert/strict";
import { assetExportFilename, EXPORT_COLUMNS, EXPORT_FILTER_KEYS, exportCountIssue, filteredAssetExport, selectedAssetExport } from "./asset-export.ts";
import type { AssetListQuery } from "../services/assets-list-query.ts";

const query: AssetListQuery = Object.freeze({
  page: 7, pageSize: 200, sort: "status_since", q: " laptop ", status: "Available", condition: "Good",
  category_id: "11111111-1111-4111-8111-111111111111", location_id: "22222222-2222-4222-8222-222222222222",
  include_child_categories: "true",
  import_batch_id: "33333333-3333-4333-8333-333333333333", custody_type: "person",
  custody_id: "44444444-4444-4444-8444-444444444444",
});
const filtered = filteredAssetExport(query, 1234);
assert.equal(filtered.request.scope, "filtered");
assert.equal(filtered.count, 1234, "matching total is independent of page size");
assert.ok(filtered.label.includes("across all pages"));
if (filtered.request.scope !== "filtered") throw new Error("Expected filtered request");
assert.deepEqual(Object.keys(filtered.request.filters).sort(), [...EXPORT_FILTER_KEYS].sort());
assert.equal(filtered.request.filters.q, "laptop");
assert.equal(filtered.request.filters.include_child_categories, "true");
for (const key of ["page", "pageSize", "sort"]) assert.equal(key in filtered.request.filters, false);
assert.equal(query.q, " laptop ", "the current list query is not mutated");

const all = filteredAssetExport({ page: 1, pageSize: 25, sort: "created_at", q: "   " }, 42);
assert.deepEqual(all.request, { scope: "filtered", filters: {} });
assert.equal(all.label, "All assets in this organization");
assert.throws(() => filteredAssetExport({ ...query, custody_type: undefined }, 3), /assignee type/);

const id = "AAAAAAAA-AAAA-4AAA-8AAA-AAAAAAAAAAAA";
const ids = [id, id.toLowerCase()];
const selected = selectedAssetExport(ids);
assert.deepEqual(selected.request, { scope: "selected", asset_ids: [id.toLowerCase()] });
assert.equal(selected.count, 1);
ids.push(query.category_id!);
assert.equal(selected.count, 1, "the confirmed scope does not retain a mutable selection array");
assert.throws(() => selectedAssetExport([]), /Select at least one/);
assert.throws(() => selectedAssetExport(["not-an-id"]));
assert.equal(selectedAssetExport(Array(10001).fill(id)).count, 1, "limits count unique IDs");
assert.equal(exportCountIssue(0), "No eligible assets were found for this export.");
assert.equal(exportCountIssue(10000), null);
assert.ok(exportCountIssue(10001)?.includes("10,000"));
assert.equal(assetExportFilename(new Date("2026-11-05T16:59:59Z")), "assets-export-2026-11-05.csv");
assert.equal(assetExportFilename(new Date("2026-11-05T17:00:00Z")), "assets-export-2026-11-06.csv");
assert.equal(EXPORT_COLUMNS.length, 11);
console.log("Asset export scope, filter allowlist, selection isolation, limits and Bangkok filename checks passed.");
