import assert from "node:assert/strict";
import { categoryDetailTab, clearCategoryAssetsSearch, readCategoryAssetsSearch, updateCategoryAssetsSearch } from "./category-assets-query.ts";
import { assetListQueryString } from "./assets-list-query.ts";
import { assetListSchema } from "./assets-list-types.ts";

const id = "c1111111-1111-1111-1111-111111111111";
const initial = readCategoryAssetsSearch(id, "tab=assets");
assert.ok(initial.success);
assert.equal(initial.data.page, 1);
assert.equal(initial.data.pageSize, 25);
assert.equal(initial.data.category_id, id);
assert.equal(initial.data.include_child_categories, "true");
const request = new URLSearchParams(assetListQueryString(initial.data, { omitDefaultSort: true }));
assert.deepEqual([...request.keys()].sort(), ["category_id", "include_child_categories", "page", "pageSize"].sort());
assert.equal(new URLSearchParams(assetListQueryString(initial.data)).get("sort"), "created_at", "existing Assets callers keep their default serialization");
const scoped = readCategoryAssetsSearch(id, "tab=assets&category_id=other&include_child_categories=false&sort=status_since&custody_id=other&export=true");
assert.ok(scoped.success);
assert.deepEqual(scoped.data, initial.data, "query parameters cannot override category scope or add extra request fields");
for (const search of ["page=0", "pageSize=201", "q=" + "x".repeat(101), "status=In+Use", "condition=Unknown", "q=a&q=b", "page=1&page=2", "location_id=bad"]) {
  assert.equal(readCategoryAssetsSearch(id, search).success, false, search);
}
const filtered = readCategoryAssetsSearch(id, "tab=assets&q=+Laptop+&status=Disposed&condition=Good&page=2&pageSize=10");
assert.ok(filtered.success && filtered.data.status === "Disposed" && filtered.data.q === "Laptop");
assert.equal(categoryDetailTab("tab=assets"), "assets");
assert.equal(categoryDetailTab("tab=unknown"), "overview");
const changed = updateCategoryAssetsSearch("tab=assets&q=old&page=8&pageSize=50", { status: "Assigned" });
assert.equal(changed.get("page"), null);
assert.equal(changed.get("pageSize"), "50");
assert.equal(changed.get("tab"), "assets");
const switched = updateCategoryAssetsSearch(changed.toString(), { tab: undefined });
assert.equal(switched.get("status"), "Assigned", "switching tabs retains filters without sending them to category reads");
assert.equal(switched.get("tab"), null);
assert.equal(updateCategoryAssetsSearch("tab=assets", { page: "3" }).get("page"), "3");
assert.equal(clearCategoryAssetsSearch("tab=assets&q=x&page=4&status=Disposed").toString(), "tab=assets");
assert.equal(updateCategoryAssetsSearch("tab=assets", { category_id: "other" }).get("category_id"), null);

const row = { id: "asset", name: "Laptop", assetTag: "LT-1", serialNumber: null, category: { id, name: "Computer" },
  location: null, custody: null, lifecycleStatus: "Disposed", condition: null, acquisitionDate: null,
  registrationDate: "2026-11-09T00:00:00Z", updatedAt: "2026-11-09T00:00:00Z", statusSince: "2026-11-09T00:00:00Z" };
const parsed = assetListSchema.parse({ data: [row], total: 520, page: 1, pageSize: 25, totalPages: 21 });
assert.equal(parsed.rows[0].asset_code, "LT-1");
assert.equal(parsed.rows[0].status, "Disposed");
assert.equal(parsed.rows[0].location_name, null);
assert.equal(parsed.total, 520, "preserve the server total; don't substitute the current page length");
assert.ok(!assetListSchema.safeParse({ data: [{}], total: 520, page: 1, pageSize: 25, totalPages: 21 }).success);
console.log("Category Assets scope, filters, paging, tab URL, default-sort compatibility and row contract checks passed.");
