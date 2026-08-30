import assert from "node:assert/strict";
import { folderPath, foldersByParent } from "./folder-tree.ts";

const folders = foldersByParent([
  { id: "campaigns", parent_id: null, name: "Campaigns" },
  { id: "2026", parent_id: "campaigns", name: "2026" },
  { id: "archive", parent_id: null, name: "Archive" },
]);

assert.deepEqual(folders.get(null)?.map((folder) => folder.id), ["archive", "campaigns"]);
assert.deepEqual(folders.get("campaigns")?.map((folder) => folder.id), ["2026"]);
const tree = [...(folders.get(null) ?? []), ...(folders.get("campaigns") ?? [])];
assert.equal(folderPath(tree, "2026"), "Campaigns / 2026");
assert.equal(folderPath(tree, null), "Uncategorized");
console.log("folder-tree.check.mts: all assertions passed");
