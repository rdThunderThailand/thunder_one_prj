import assert from "node:assert/strict";
import { DEFAULT_STATE, readListState, writeListState, type ListState } from "./list-url-state.ts";

const custom: ListState = {
  collection: "folder-a",
  tagId: null,
  filters: { query: "lobby", status: "active", kind: "template", content: "incomplete", usage: "used", referenceResolution: "1920x1080" },
  sort: { key: "name", dir: "asc" },
  page: 2,
  perPage: 25,
};

assert.deepEqual(readListState(new URLSearchParams(writeListState(custom))), custom);

// Ticket 29: a tag selection survives the round trip, so browser back returns to the
// filtered list rather than to an empty one.
const tagged: ListState = { ...DEFAULT_STATE, tagId: "6f1e7d2c-0000-4000-8000-000000000001", page: 3 };
assert.deepEqual(readListState(new URLSearchParams(writeListState(tagged))), tagged);
assert.ok(writeListState(tagged).includes("tag=6f1e7d2c-0000-4000-8000-000000000001"));
assert.deepEqual(readListState(new URLSearchParams()), DEFAULT_STATE);
assert.deepEqual(readListState(new URLSearchParams("status=bad&kind=bad&sort=bad&page=0&per=99")), DEFAULT_STATE);
assert.equal(writeListState(DEFAULT_STATE), "");
console.log("composition list-url-state.check.mts — all assertions passed");
