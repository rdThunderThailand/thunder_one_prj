/** Run: node src/features/playlists/list-empty-state.check.mts */
import assert from "node:assert/strict";
import { emptyCause, hasActiveFilters } from "./list-empty-state.ts";

// -- hasActiveFilters --

const defaultFilters = { query: "", status: "all" as const, type: "all" as const };
assert.equal(hasActiveFilters(defaultFilters), false, "default filters should not be active");
assert.equal(hasActiveFilters({ ...defaultFilters, query: "foo" }), true, "non-empty query → active");
assert.equal(hasActiveFilters({ ...defaultFilters, status: "active" }), true, "non-default status → active");
assert.equal(hasActiveFilters({ ...defaultFilters, type: "video" }), true, "non-default type → active");

// -- emptyCause --

// no-playlists: totalCount === 0 takes top precedence over everything
assert.equal(
  emptyCause({ totalCount: 0, hasActiveFilters: true }),
  "no-playlists",
  "totalCount=0 → no-playlists even if filters are active"
);

// no-match: hasActiveFilters takes next precedence
assert.equal(
  emptyCause({ totalCount: 5, hasActiveFilters: true }),
  "no-match",
  "hasActiveFilters → no-match"
);

// no-match: default fallthrough (totalCount > 0, no active filters)
assert.equal(
  emptyCause({ totalCount: 5, hasActiveFilters: false }),
  "no-match",
  "no active filters, rows.length===0 → no-match fallthrough"
);

console.log("list-empty-state.check.mts — all assertions passed");
