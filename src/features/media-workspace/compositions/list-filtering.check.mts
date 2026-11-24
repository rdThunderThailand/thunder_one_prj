/** Run: node src/features/media-workspace/compositions/list-filtering.check.mts */
import assert from "node:assert/strict";
import { copyName, filterCompositions, paginate, sortCompositions, summarize } from "./list-filtering.ts";
import type { CompositionListItem } from "./types/index.ts";

const row = (over: Partial<CompositionListItem> & { id: string }): CompositionListItem => ({
  name: over.id,
  layout_id: "layout-1",
  layout_name: "Menu Board",
  status: "draft",
  revision: 1,
  zone_count: 2,
  bound_count: 0,
  ...over,
});

const compositions: CompositionListItem[] = [
  row({ id: "kfc", name: "KFC Menu", status: "active", bound_count: 2, updated_at: "2024-01-02" }),
  row({ id: "coffee", name: "Coffee Corner", status: "inactive", bound_count: 2, updated_at: "2024-01-01" }),
  row({ id: "draft1", name: "Half done", status: "draft", bound_count: 1 }),
];

const all = { query: "", status: "all" } as const;

assert.equal(filterCompositions(compositions, all).length, 3);
assert.deepEqual(
  filterCompositions(compositions, { query: "corner", status: "inactive" }).map((c) => c.id),
  ["coffee"],
);
assert.equal(filterCompositions(compositions, { ...all, status: "draft" }).length, 1);
assert.equal(filterCompositions(compositions, { ...all, query: "nomatch" }).length, 0);

assert.deepEqual(paginate([1, 2, 3, 4, 5], 2, 2), { rows: [3, 4], page: 2, totalPages: 3 });
assert.deepEqual(paginate([], 4, 10), { rows: [], page: 1, totalPages: 1 });

assert.deepEqual(summarize(compositions), { total: 3, draft: 1, active: 1, inactive: 1 });
assert.deepEqual(summarize([]), { total: 0, draft: 0, active: 0, inactive: 0 });

assert.equal(copyName("KFC Menu", []), "KFC Menu (Copy)");
assert.equal(copyName("KFC Menu", ["KFC Menu (Copy)"]), "KFC Menu (Copy 2)");
assert.ok(copyName("x".repeat(400), []).length <= 200);

// status sort — draft(0) before active(1) before inactive(2).
assert.deepEqual(
  sortCompositions(compositions, { key: "status", dir: "asc" }).map((c) => c.id),
  ["draft1", "kfc", "coffee"],
);

// zones sort by bound_count, ties break on name then id.
const z1 = row({ id: "z1", name: "B", bound_count: 2 });
const z2 = row({ id: "z2", name: "A", bound_count: 4 });
const z3 = row({ id: "z3", name: "C", bound_count: 1 });
assert.deepEqual(
  sortCompositions([z1, z2, z3], { key: "zones", dir: "asc" }).map((c) => c.id),
  ["z3", "z1", "z2"],
);

// updated — empty sorts last regardless of direction.
assert.deepEqual(
  sortCompositions(compositions, { key: "updated", dir: "desc" }).map((c) => c.id),
  ["kfc", "coffee", "draft1"],
);
assert.deepEqual(
  sortCompositions(compositions, { key: "updated", dir: "asc" }).map((c) => c.id),
  ["coffee", "kfc", "draft1"],
);

// Stable, non-mutating.
const orig = [...compositions];
const origCopy = [...orig];
sortCompositions(orig, { key: "name", dir: "asc" });
assert.deepEqual(orig, origCopy, "sortCompositions mutated its input");

console.log("list-filtering.check.mts — all assertions passed");
