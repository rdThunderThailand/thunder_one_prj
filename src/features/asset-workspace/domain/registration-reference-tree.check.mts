import assert from "node:assert/strict";
import { referenceTree, searchTree, treePath, treeReference } from "./registration-reference-tree.ts";

const A = "aaaaaaaa-0000-4000-8000-000000000001";
const B = "aaaaaaaa-0000-4000-8000-000000000002";
const C = "AAAAAAAA-0000-4000-8000-000000000003";
const D = "aaaaaaaa-0000-4000-8000-000000000004";
const row = (id: string, name: string, parentId: string | null, status = "Active", isSerialRequired = false) =>
  ({ id, name, code: name.toUpperCase(), parentId, status, isSerialRequired, tag: isSerialRequired ? "Serial" : null });

const tree = referenceTree([
  row(A, "IT Accessory", null),
  row(C, "Mouse", B, "Active", true),
  row(B, "Computer", A),
  row(D, "Old", null, "Inactive"),
]);

assert.deepEqual(tree.children.get("")?.map((item) => item.name), ["IT Accessory"]);
assert.deepEqual(tree.children.get(A)?.map((item) => item.name), ["Computer"]);
assert.equal(tree.byId.has(D), false, "inactive rows are never offered");
assert.deepEqual(treePath(tree, C), [A, B, C.toLowerCase()], "ids are lower-cased and ordered top-down");
assert.deepEqual(treePath(tree, "missing"), []);

const mouse = tree.byId.get(C.toLowerCase())!;
assert.deepEqual(treeReference(tree, mouse, "categories"), {
  id: C.toLowerCase(), name: "Mouse", code: "MOUSE", parent_id: B, parent: { id: B, name: "Computer" }, is_serial_required: true,
});
const site = referenceTree([{ id: A, name: "Site", code: "", parentId: null, status: "Active", isSerialRequired: false, tag: "Building" }]);
assert.deepEqual(treeReference(site, site.byId.get(A)!, "locations"),
  { id: A, name: "Site", code: null, parent_id: null, parent: null, location_type: "Building" });
assert.deepEqual(searchTree(tree, "  mou ").map((item) => item.name), ["Mouse"]);
assert.deepEqual(searchTree(tree, "  "), []);

// Active child of an inactive parent is lifted to the top level; a parent loop does not hang.
const lifted = referenceTree([row(A, "Child", D), row(D, "Gone", null, "Inactive")]);
assert.deepEqual(lifted.children.get("")?.map((item) => item.name), ["Child"]);
const loop = referenceTree([row(A, "One", B), row(B, "Two", A)]);
assert.ok(treePath(loop, A).length <= 2);

console.log("registration-reference-tree: ok");
