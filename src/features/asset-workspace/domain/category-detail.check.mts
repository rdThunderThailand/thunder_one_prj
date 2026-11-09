/** Run: node src/features/asset-workspace/domain/category-detail.check.mts */
import assert from "node:assert/strict";
import { categoryAssetsHref, categoryChildrenView, categoryDetailHref } from "./category-detail.ts";
import type { CategoryChild } from "./asset-category.ts";

const children: CategoryChild[] = [
  { id: "one", name: "Computer", assetCount: 320, status: "Active" },
  { id: "two", name: "Display", assetCount: 120, status: "Inactive" },
  { id: "three", name: "Network Equipment", assetCount: 80, status: "Active" },
];
const original = structuredClone(children);
const query = { q: "", page: 1, pageSize: 10, sort: "default", direction: "asc" } as const;
const initial = categoryChildrenView(children, query);
assert.deepEqual(initial.rows, children, "keep API order until the user chooses a sort");
assert.equal(initial.total, 3);
assert.equal(initial.rows.reduce((sum, child) => sum + child.assetCount, 0), 520);
assert.deepEqual(categoryChildrenView(children, { ...query, q: " DISPLAY " }).rows, [children[1]]);
assert.equal(categoryChildrenView(children, { ...query, q: "Active" }).total, 0, "search category names, not statuses");
assert.deepEqual(categoryChildrenView(children, { ...query, sort: "assets", direction: "asc" }).rows.map((c) => c.assetCount), [80, 120, 320]);
assert.deepEqual(categoryChildrenView(children, { ...query, sort: "name", direction: "desc" }).rows.map((c) => c.name), ["Network Equipment", "Display", "Computer"]);
const last = categoryChildrenView(children, { ...query, pageSize: 2, page: 99 });
assert.equal(last.page, 2);
assert.deepEqual(last.rows, [children[2]]);
assert.equal(categoryChildrenView(children, { ...query, q: "no match", page: 3 }).page, 1);
assert.deepEqual(categoryChildrenView([], query), { page: 1, totalPages: 1, total: 0, rows: [] });
assert.deepEqual(children, original, "filtering and sorting never modify server data");
const url = new URL(categoryAssetsHref("c1111111-1111-1111-1111-111111111111"), "http://localhost");
assert.equal(url.pathname, "/asset-workspace/assets");
assert.equal(url.searchParams.get("category_id"), "c1111111-1111-1111-1111-111111111111");
assert.equal(url.searchParams.get("include_child_categories"), "true");
assert.equal(categoryDetailHref("unsafe/id"), "/asset-workspace/categories/unsafe%2Fid");
console.log("Category detail child navigation/filter/sort/paging checks passed.");
