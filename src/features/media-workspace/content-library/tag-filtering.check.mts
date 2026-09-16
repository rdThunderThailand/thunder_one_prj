import assert from "node:assert/strict";
import { filterByTag, tagCounts } from "./tag-filtering.ts";

const items = [
  { id: "one", tags: [{ id: "b", name: "Beta" }, { id: "a", name: "Alpha" }] },
  { id: "two", tags: [{ id: "a", name: "Alpha" }] },
  { id: "three", tags: [] },
];

assert.deepEqual(tagCounts(items), [
  { id: "a", name: "Alpha", count: 2 },
  { id: "b", name: "Beta", count: 1 },
]);
assert.deepEqual(filterByTag(items, "a").map((item) => item.id), ["one", "two"]);

console.log("shared tag filtering: all checks passed");
