import assert from "node:assert/strict";
import { readAssetListSearch, withListDefaults } from "./assets-list-query.ts";

const defaults = { pageSize: 50, sort: "status_since" } as const;
const read = (search: string) => {
  const parsed = readAssetListSearch(search);
  assert.ok(parsed.success);
  return parsed.data;
};

// No org defaults: the query is returned untouched.
assert.deepEqual(withListDefaults(read(""), "", undefined), read(""));

// The URL names neither: the org defaults start the list, other filters stay.
const start = withListDefaults(read("status=Available"), "status=Available", defaults);
assert.equal(start.pageSize, 50);
assert.equal(start.sort, "status_since");
assert.equal(start.status, "Available");

// The URL wins, key by key.
assert.equal(withListDefaults(read("pageSize=10"), "pageSize=10", defaults).pageSize, 10);
assert.equal(withListDefaults(read("pageSize=10"), "pageSize=10", defaults).sort, "status_since");
assert.equal(withListDefaults(read("sort=created_at"), "sort=created_at", defaults).sort, "created_at");
assert.equal(withListDefaults(read("sort=created_at"), "sort=created_at", defaults).pageSize, 50);
// An old bookmarked page_size counts as the URL naming a size.
assert.equal(withListDefaults(read("page_size=100"), "page_size=100", defaults).pageSize, 100);

console.log("Asset list org defaults checks passed.");
