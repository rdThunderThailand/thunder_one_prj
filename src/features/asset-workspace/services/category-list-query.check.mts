/** Run: node src/features/asset-workspace/services/category-list-query.check.mts */
import assert from "node:assert/strict";
import { readCategoryListSearch } from "./category-list-query.ts";
import { assetListQueryString, readAssetListSearch } from "./assets-list-query.ts";
import { filteredAssetExport } from "../domain/asset-export.ts";

const id = "11111111-1111-4111-8111-111111111111";
const childId = "22222222-2222-4222-8222-222222222222";
const defaults = readCategoryListSearch("");
assert.ok(defaults.success);
if (!defaults.success) throw new Error("Invalid category defaults");
assert.deepEqual(defaults.data, { q: "", sort: "default", direction: "asc", page: 1, pageSize: 10, expanded: [] });
const params = new URLSearchParams({
  q: " อุปกรณ์ ", status: "Inactive", parent: id, sort: "assets", direction: "desc", page: "3", pageSize: "25",
  expanded: `${id},${childId}`,
});
const parsed = readCategoryListSearch(params.toString());
assert.ok(parsed.success);
if (!parsed.success) throw new Error("Valid category query rejected");
assert.deepEqual(parsed.data, {
  q: "อุปกรณ์", status: "Inactive", parent: id, sort: "assets", direction: "desc", page: 3, pageSize: 25,
  expanded: [id, childId],
});
assert.equal(readCategoryListSearch("parent=top-level").success, true);
const upperId = "AAAAAAAA-AAAA-4AAA-8AAA-AAAAAAAAAAAA";
const normalized = readCategoryListSearch(`parent=${upperId}&expanded=${upperId}`);
assert.ok(normalized.success && normalized.data.parent === upperId.toLowerCase());
assert.ok(normalized.success && normalized.data.expanded[0] === upperId.toLowerCase());
const seededId = "c1111111-1111-1111-1111-111111111111";
const seededQuery = readCategoryListSearch(`parent=${seededId}&expanded=${seededId}`);
assert.ok(seededQuery.success, "existing seeded category IDs survive URL state");
const seededLink = readAssetListSearch(`category_id=${seededId}&include_child_categories=true`);
assert.ok(seededLink.success, "seeded category count links remain valid Assets filters");
if (!seededLink.success) throw new Error("Existing seeded category rejected");
assert.equal(new URLSearchParams(assetListQueryString(seededLink.data)).get("category_id"), seededId);
assert.deepEqual(filteredAssetExport(seededLink.data, 10).request,
  { scope: "filtered", filters: { category_id: seededId, include_child_categories: "true" } });
for (const search of [
  "page=0", "page=1.5", "pageSize=200", "status=Ready", "parent=invalid", "sort=code",
  "direction=sideways", "q=first&q=second", `q=${"a".repeat(256)}`, "expanded=invalid",
]) assert.equal(readCategoryListSearch(search).success, false, search);

const countLink = readAssetListSearch(`category_id=${id}&include_child_categories=true&page=2`);
assert.ok(countLink.success);
if (!countLink.success) throw new Error("Count-link scope rejected");
const sent = new URLSearchParams(assetListQueryString(countLink.data));
assert.equal(sent.get("category_id"), id);
assert.equal(sent.get("include_child_categories"), "true");
assert.equal(sent.get("page"), "2");
assert.deepEqual(readAssetListSearch(sent.toString()), countLink, "reload preserves count-link scope");
const exported = filteredAssetExport(countLink.data, 520);
assert.deepEqual(exported.request, { scope: "filtered", filters: { category_id: id, include_child_categories: "true" } });
const exact = readAssetListSearch(`category_id=${id}`);
assert.ok(exact.success);
if (!exact.success) throw new Error("Existing exact-category scope rejected");
assert.equal(new URLSearchParams(assetListQueryString(exact.data)).has("include_child_categories"), false);
assert.equal(readAssetListSearch("include_child_categories=false").success, true);
assert.equal(readAssetListSearch("include_child_categories=1").success, false);
assert.equal(readAssetListSearch("include_child_categories=true&include_child_categories=false").success, false);
console.log("Category URL state and Assets count-link query/export compatibility checks passed.");
