/** Run: node src/features/asset-workspace/domain/category-list.check.mts */
import assert from "node:assert/strict";
import { categoryListView } from "./category-list.ts";
import type { AssetCategory, CategoryListQuery } from "./asset-category.ts";

const id = (value: number) => `00000000-0000-4000-8000-${String(value).padStart(12, "0")}`;
function category(value: number, name: string, updates: Partial<AssetCategory> = {}): AssetCategory {
  return {
    id: id(value), name, code: `CAT-${value}`, parentId: null, parent: null,
    description: null, isSerialRequired: false, status: "Active",
    ownAssetCount: 0, assetCount: 0, childCount: 0, updatedAt: "2026-11-07T00:00:00Z",
    ...updates,
  };
}
const electronics = category(1, "Electronics", { assetCount: 520, childCount: 3, status: "Inactive" });
const parent = { parentId: electronics.id, parent: { id: electronics.id, name: electronics.name } };
const computer = category(2, "Computer", { ...parent, assetCount: 320, childCount: 1 });
const display = category(3, "Display", { ...parent, assetCount: 120 });
const network = category(4, "Network Equipment", { ...parent, assetCount: 80 });
const laptop = category(5, "Laptop", { parentId: computer.id, parent: { id: computer.id, name: computer.name }, assetCount: 50 });
const furniture = category(6, "Furniture", { assetCount: 160 });
// Core's order is meaningful and does not require parents to precede children.
const categories = Object.freeze([computer, electronics, furniture, display, laptop, network].map((row) => Object.freeze(row)));
const defaults: CategoryListQuery = { q: "", sort: "default", direction: "asc", page: 1, pageSize: 10, expanded: [] };
const view = (updates: Partial<CategoryListQuery> = {}) => categoryListView(categories, { ...defaults, ...updates });
const names = (result: ReturnType<typeof view>) => result.rows.map((row) => row.category.name);

assert.deepEqual(names(view()), ["Electronics", "Furniture"], "collapsed descendants never become extra roots");
assert.equal(view().rows[0].category.assetCount, 520, "server rollup is retained for inactive parents");
const expanded = view({ expanded: [electronics.id] });
assert.deepEqual(names(expanded), ["Electronics", "Computer", "Display", "Network Equipment", "Furniture"]);
assert.deepEqual(expanded.rows.slice(0, 4).map((row) => row.category.assetCount), [520, 320, 120, 80]);
assert.deepEqual(expanded.rows.map((row) => row.depth), [0, 1, 1, 1, 0]);
const deep = view({ expanded: [electronics.id, computer.id] });
assert.deepEqual(names(deep), ["Electronics", "Computer", "Laptop", "Display", "Network Equipment", "Furniture"]);
assert.equal(deep.rows[2].depth, 2);
assert.deepEqual(names(view({ expanded: [electronics.id], sort: "name", direction: "desc" })),
  ["Furniture", "Electronics", "Network Equipment", "Display", "Computer"], "sort preserves sibling groups");
assert.deepEqual(names(view({ q: "lApToP" })), ["Laptop"], "search finds a collapsed descendant");
assert.equal(view({ q: "CAT-" }).total, 0, "search is name-only");
assert.equal(view({ q: "Electronics" }).total, 1, "parent names do not expand search matches");
assert.deepEqual(names(view({ parent: electronics.id })), ["Computer", "Display", "Network Equipment"]);
assert.deepEqual(names(view({ parent: "top-level" })), ["Electronics", "Furniture"]);
assert.deepEqual(names(view({ status: "Inactive" })), ["Electronics"]);
assert.deepEqual(names(view({ status: "Active", parent: electronics.id, q: "display" })), ["Display"]);
assert.ok(view({ status: "Active" }).rows.every((row) => row.depth === 0 && !row.hasChildren));
assert.deepEqual(view().parentOptions.map((row) => row.name), ["Computer", "Electronics"], "inactive parent options stay available");
assert.deepEqual(names(view({ status: "Active", sort: "assets", direction: "desc" })),
  ["Computer", "Furniture", "Display", "Network Equipment", "Laptop"]);
assert.equal(view({ q: "missing", page: 100 }).page, 1);

const many = Array.from({ length: 24 }, (_, index) => category(index + 20, `Item ${index}`));
const paged = categoryListView(many, { ...defaults, page: 2 });
assert.equal(paged.total, 24);
assert.equal(paged.totalPages, 3);
assert.deepEqual(paged.rows.map((row) => row.category.id), many.slice(10, 20).map((row) => row.id));
assert.equal(categoryListView(many, { ...defaults, page: 999 }).page, 3);
assert.equal(categoryListView(many, { ...defaults, page: 999 }).rows.length, 4);
assert.equal(categoryListView(many, { ...defaults, pageSize: 25 }).totalPages, 1);

const orphan = category(60, "Orphan", { parentId: id(999) });
const self = category(61, "Self", { parentId: id(61) });
const cycleA = category(62, "Cycle A", { parentId: id(63) });
const cycleB = category(63, "Cycle B", { parentId: id(62) });
const malformed = [orphan, self, cycleA, cycleB];
const safe = categoryListView(malformed, { ...defaults, expanded: malformed.map((row) => row.id) });
assert.equal(safe.total, 4, "malformed cycles terminate without hiding unrelated rows");
assert.equal(new Set(safe.rows.map((row) => row.category.id)).size, 4);
assert.equal(safe.rows.find((row) => row.category.id === orphan.id)?.depth, 0);
assert.deepEqual(categories.map((row) => row.id), [computer, electronics, furniture, display, laptop, network].map((row) => row.id));
console.log("Category tree, counts, filters, sibling sorting, paging, and malformed-parent checks passed.");
