import assert from "node:assert/strict";
import { readListState, writeListState, type ListState } from "./list-url-state.ts";

const DEFAULT_STATE: ListState = {
  collection: "all",
  tagId: null,
  filters: { query: "", status: "all", type: "all" },
  sort: { key: "updated", dir: "desc" },
  page: 1,
  perPage: 10,
};

// Round-trip
const customState: ListState = {
  collection: "folder-123",
  tagId: null,
  filters: { query: "hello", status: "active", type: "video" },
  sort: { key: "name", dir: "asc" },
  page: 2,
  perPage: 50,
};
const qs = writeListState(customState);
assert.deepEqual(readListState(new URLSearchParams(qs)), customState);

// Empty URLSearchParams() reads back to exactly DEFAULT_STATE
assert.deepEqual(readListState(new URLSearchParams()), DEFAULT_STATE);

// Garbage input falls back to defaults without throwing
const garbageParams = new URLSearchParams("status=nonsense&sort=xyz&page=-5&per=999&dir=sideways&type=invalid");
assert.deepEqual(readListState(garbageParams), DEFAULT_STATE);

// Valid dir but invalid sort -> both fall back
const mismatchParams = new URLSearchParams("sort=xyz&dir=asc");
assert.deepEqual(readListState(mismatchParams).sort, { key: "updated", dir: "desc" });

// Removed ownership tabs are ignored; folder is now the only collection dimension.
assert.equal(readListState(new URLSearchParams("tab=mine")).collection, "all");
assert.equal(writeListState({ ...DEFAULT_STATE }), "");

// Folder collection round-trips through the `folder` param; "all" stays out of the URL.
assert.equal(writeListState({ ...DEFAULT_STATE, collection: "trash" }), "folder=trash");
assert.equal(readListState(new URLSearchParams("folder=uncategorized")).collection, "uncategorized");
assert.equal(readListState(new URLSearchParams()).collection, "all");

// writeListState(DEFAULT_STATE) returns empty string
assert.equal(writeListState(DEFAULT_STATE), "");

// #41: a tag selection round-trips through `tag`, and wins over `folder` — the two are
// mutually exclusive by construction, never both written.
assert.equal(writeListState({ ...DEFAULT_STATE, tagId: "tag-1" }), "tag=tag-1");
assert.equal(
  writeListState({ ...DEFAULT_STATE, collection: "folder-123", tagId: "tag-1" }),
  "tag=tag-1"
);
assert.deepEqual(readListState(new URLSearchParams("tag=tag-1")), { ...DEFAULT_STATE, tagId: "tag-1" });
// A `tag` param clears the folder selection back to "all", even if `folder` is also present
// (a hand-edited URL) — `tag` always wins.
assert.deepEqual(
  readListState(new URLSearchParams("folder=uncategorized&tag=tag-1")),
  { ...DEFAULT_STATE, tagId: "tag-1" }
);

console.log("list-url-state.check.mts — all assertions passed");
