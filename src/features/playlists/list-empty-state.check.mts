/** Run: node src/features/playlists/list-empty-state.check.mts */
import assert from "node:assert/strict";
import { emptyCause, hasActiveFilters } from "./list-empty-state.ts";

// -- hasActiveFilters --

const defaultFilters = { query: "", status: "all" as const, type: "all" as const, campaignId: "all" };
assert.equal(hasActiveFilters(defaultFilters), false, "default filters should not be active");
assert.equal(hasActiveFilters({ ...defaultFilters, query: "foo" }), true, "non-empty query → active");
assert.equal(hasActiveFilters({ ...defaultFilters, status: "active" }), true, "non-default status → active");
assert.equal(hasActiveFilters({ ...defaultFilters, type: "standard" }), true, "non-default type → active");
assert.equal(hasActiveFilters({ ...defaultFilters, campaignId: "c-1" }), true, "non-default campaignId → active");

// -- emptyCause --

// no-playlists: totalCount === 0 takes top precedence over everything
assert.equal(
  emptyCause({ totalCount: 0, mineCount: 0, tab: "mine", hasActiveFilters: true }),
  "no-playlists",
  "totalCount=0 → no-playlists even if filters are active"
);

// no-match: hasActiveFilters takes next precedence
assert.equal(
  emptyCause({ totalCount: 5, mineCount: 3, tab: "all", hasActiveFilters: true }),
  "no-match",
  "hasActiveFilters → no-match"
);

// no-mine: tab===mine and mineCount===0 (and no active filters)
assert.equal(
  emptyCause({ totalCount: 5, mineCount: 0, tab: "mine", hasActiveFilters: false }),
  "no-mine",
  "mine tab, mineCount=0, no filters → no-mine"
);

// no-match: fallthrough when filters are active on mine tab
assert.equal(
  emptyCause({ totalCount: 5, mineCount: 0, tab: "mine", hasActiveFilters: true }),
  "no-match",
  "mine tab with active filters → no-match (filters have higher precedence than no-mine)"
);

// no-match: default fallthrough (totalCount > 0, no active filters, tab=all)
assert.equal(
  emptyCause({ totalCount: 5, mineCount: 5, tab: "all", hasActiveFilters: false }),
  "no-match",
  "all tab, no active filters, rows.length===0 → no-match fallthrough"
);

console.log("list-empty-state.check.mts — all assertions passed");
