/** Run: node src/features/communication/layouts/list-filtering.check.mts */
import assert from "node:assert/strict";
import { copyName, filterLayouts, paginate, sortLayouts, summarize } from "./list-filtering.ts";
import type { LayoutListItem } from "./types/index.ts";

const row = (over: Partial<LayoutListItem> & { id: string }): LayoutListItem => ({
  name: over.id,
  aspect_ratio: "16:9",
  background: "#000000",
  status: "active",
  zone_count: 1,
  zones: [],
  ...over,
});

const layouts: LayoutListItem[] = [
  row({ id: "kfc", name: "KFC Lobby", status: "active", zone_count: 2, updated_at: "2024-01-02" }),
  row({ id: "coffee", name: "Coffee Corner", status: "inactive", zone_count: 4, updated_at: "2024-01-01" }),
  row({ id: "legacy", name: "Legacy split", status: "active", zone_count: 1, aspect_ratio: "9:16" }),
];

const all = { query: "", status: "all" } as const;

assert.equal(filterLayouts(layouts, all).length, 3);

// Search is case-insensitive on a substring, and filters stack with status.
assert.deepEqual(
  filterLayouts(layouts, { query: "corner", status: "inactive" }).map((l) => l.id),
  ["coffee"]
);
assert.equal(filterLayouts(layouts, { ...all, status: "active" }).length, 2);
assert.equal(filterLayouts(layouts, { ...all, query: "nomatch" }).length, 0);

// Pagination clamps instead of stranding the view on an empty page.
assert.deepEqual(paginate([1, 2, 3, 4, 5], 2, 2), { rows: [3, 4], page: 2, totalPages: 3 });
assert.deepEqual(paginate([1, 2, 3, 4, 5], 9, 2), { rows: [5], page: 3, totalPages: 3 });
assert.deepEqual(paginate([1, 2, 3], 0, 10), { rows: [1, 2, 3], page: 1, totalPages: 1 });
assert.deepEqual(paginate([], 4, 10), { rows: [], page: 1, totalPages: 1 });

assert.deepEqual(summarize(layouts), { total: 3, active: 2, inactive: 1 });
assert.deepEqual(summarize([]), { total: 0, active: 0, inactive: 0 });

// A copy never collides with a name already on the page.
assert.equal(copyName("KFC Lobby", []), "KFC Lobby (Copy)");
assert.equal(copyName("KFC Lobby", ["KFC Lobby (Copy)"]), "KFC Lobby (Copy 2)");
assert.equal(
  copyName("KFC Lobby", ["KFC Lobby (Copy)", "KFC Lobby (Copy 2)"]),
  "KFC Lobby (Copy 3)"
);
// Stays inside the column's 200-char limit however long the source name is.
assert.ok(copyName("x".repeat(400), []).length <= 200);

// Sorting by zone count orders by zone_count and ties break on name.
const z1 = row({ id: "z1", name: "B Layout", zone_count: 2 });
const z2 = row({ id: "z2", name: "A Layout", zone_count: 4 });
const z3 = row({ id: "z3", name: "C Layout", zone_count: 1 });
const z4 = row({ id: "z4", name: "C Layout", zone_count: 1 }); // tie on zones and name
assert.deepEqual(
  sortLayouts([z1, z2, z3, z4], { key: "zones", dir: "asc" }).map((l) => l.id),
  ["z3", "z4", "z1", "z2"]
);
assert.deepEqual(
  sortLayouts([z1, z2, z3, z4], { key: "zones", dir: "desc" }).map((l) => l.id),
  ["z2", "z1", "z3", "z4"]
);

// name asc / desc.
assert.deepEqual(
  sortLayouts([z1, z2, z3], { key: "name", dir: "asc" }).map((l) => l.id),
  ["z2", "z1", "z3"]
);
assert.deepEqual(
  sortLayouts([z1, z2, z3], { key: "name", dir: "desc" }).map((l) => l.id),
  ["z3", "z1", "z2"]
);

// aspectRatio sort.
assert.deepEqual(
  sortLayouts([layouts[0]!, layouts[2]!], { key: "aspectRatio", dir: "asc" }).map((l) => l.id),
  ["kfc", "legacy"] // "16:9" < "9:16" lexically ('1' < '9')
);

// status sort — active(0) before inactive(1).
assert.deepEqual(
  sortLayouts(layouts, { key: "status", dir: "asc" }).map((l) => l.id),
  ["kfc", "legacy", "coffee"]
);

// updated — empty (no updated_at/created_at) sorts last regardless of direction.
assert.deepEqual(
  sortLayouts(layouts, { key: "updated", dir: "desc" }).map((l) => l.id),
  ["kfc", "coffee", "legacy"]
);
assert.deepEqual(
  sortLayouts(layouts, { key: "updated", dir: "asc" }).map((l) => l.id),
  ["coffee", "kfc", "legacy"]
);

// Stable, non-mutating.
const orig = [layouts[0]!, layouts[1]!, layouts[2]!];
const origCopy = [...orig];
sortLayouts(orig, { key: "name", dir: "asc" });
assert.deepEqual(orig, origCopy, "sortLayouts mutated its input");

console.log("list-filtering.check.mts — all assertions passed");
