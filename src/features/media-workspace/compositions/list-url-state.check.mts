import assert from "node:assert/strict";
import { DEFAULT_STATE, readListState, writeListState, type ListState } from "./list-url-state.ts";

const custom: ListState = {
  collection: "folder-a",
  filters: { query: "lobby", status: "active", kind: "template", content: "incomplete", usage: "used", referenceResolution: "1920x1080" },
  sort: { key: "name", dir: "asc" },
  page: 2,
  perPage: 25,
};

assert.deepEqual(readListState(new URLSearchParams(writeListState(custom))), custom);
assert.deepEqual(readListState(new URLSearchParams()), DEFAULT_STATE);
assert.deepEqual(readListState(new URLSearchParams("status=bad&kind=bad&sort=bad&page=0&per=99")), DEFAULT_STATE);
assert.equal(writeListState(DEFAULT_STATE), "");
console.log("composition list-url-state.check.mts — all assertions passed");
