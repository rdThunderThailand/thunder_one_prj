import assert from "node:assert/strict";
import { flattenFolders, pickerFolderCounts, pickerFolderMatcher } from "./picker-folder.ts";

const folders = [
  { id: "corp", parent_id: null, name: "Corporate" },
  { id: "corp-hr", parent_id: "corp", name: "HR" },
  { id: "promo", parent_id: null, name: "Promotion" },
];
const rows = ["corp", "corp-hr", "corp-hr", "promo", null, undefined];

assert.deepEqual(pickerFolderCounts(rows, folders), { all: 6, uncategorized: 2, corp: 3, "corp-hr": 2, promo: 1 });
assert.equal(pickerFolderMatcher("corp", folders)("corp-hr"), true);
assert.equal(pickerFolderMatcher("corp-hr", folders)("corp"), false);
assert.equal(pickerFolderMatcher("uncategorized", folders)(undefined), true);
assert.deepEqual(flattenFolders(folders).map(({ folder, depth }) => `${depth}:${folder.id}`), ["0:corp", "1:corp-hr", "0:promo"]);
console.log("picker-folder ok");
