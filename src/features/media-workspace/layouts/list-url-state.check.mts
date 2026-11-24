/** Run: node src/features/media-workspace/layouts/list-url-state.check.mts */
import assert from "node:assert/strict";
import { readListState, writeListState, type ListState } from "./list-url-state.ts";

const DEFAULT_STATE: ListState = {
  filters: { query: "", status: "all" },
  sort: { key: "updated", dir: "desc" },
  page: 1,
  perPage: 10,
};

// Round-trip
const customState: ListState = {
  filters: { query: "hello", status: "active" },
  sort: { key: "name", dir: "asc" },
  page: 2,
  perPage: 50,
};
const qs = writeListState(customState);
assert.deepEqual(readListState(new URLSearchParams(qs)), customState);

// Empty URLSearchParams() reads back to exactly DEFAULT_STATE
assert.deepEqual(readListState(new URLSearchParams()), DEFAULT_STATE);

// Garbage input falls back to defaults without throwing
const garbageParams = new URLSearchParams("status=nonsense&sort=xyz&page=-5&per=999&dir=sideways");
assert.deepEqual(readListState(garbageParams), DEFAULT_STATE);

// Valid dir but invalid sort -> both fall back (unrecognised sort key resets dir with it)
const mismatchParams = new URLSearchParams("sort=xyz&dir=asc");
assert.deepEqual(readListState(mismatchParams).sort, { key: "updated", dir: "desc" });

// writeListState(DEFAULT_STATE) returns empty string — untouched page keeps a clean URL
assert.equal(writeListState(DEFAULT_STATE), "");

console.log("list-url-state.check.mts — all assertions passed");
