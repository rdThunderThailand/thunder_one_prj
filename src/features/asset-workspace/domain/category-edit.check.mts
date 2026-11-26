import assert from "node:assert/strict";
import { categoryEditDraft, categoryEditParents, categoryEditPatch } from "./category-edit.ts";
import type { AssetCategoryDetail } from "./asset-category.ts";

const category: AssetCategoryDetail = {
  id: "c1111111-1111-1111-1111-111111111111", name: " Electronics ", code: "LEGACY CODE",
  parentId: null, parent: null, description: "Existing description", isSerialRequired: false,
  status: "Inactive", ownAssetCount: 12, assetCount: 520, childCount: 1,
  updatedAt: "2026-11-09T00:00:00.123456+00:00", children: [],
};
const draft = categoryEditDraft(category);
const unchanged = categoryEditPatch(category, draft);
assert.ok(unchanged.ok && !unchanged.dirty);
const changed = categoryEditPatch(category, { ...draft, description: "  New text  " });
assert.ok(changed.ok && changed.dirty);
assert.deepEqual(changed.input, { expectedUpdatedAt: category.updatedAt, description: "New text" });
const cleared = categoryEditPatch(category, { ...draft, description: "  " });
assert.ok(cleared.ok && cleared.input.description === null);
assert.ok(!categoryEditPatch(category, { ...draft, name: " " }).ok);
assert.ok(!categoryEditPatch(category, { ...draft, description: "x".repeat(501) }).ok);
const all = categoryEditPatch(category, { ...draft, name: "Computer", parentId: "c2222222-2222-2222-2222-222222222222", isSerialRequired: true });
assert.ok(all.ok && all.input.parentId && all.input.isSerialRequired);
assert.ok(!("code" in all.input) && !("status" in all.input));

const parent = { ...category, id: "c2222222-2222-2222-2222-222222222222", name: "Inactive parent" };
const child = { ...category, id: "c3333333-3333-3333-3333-333333333333", parentId: category.id, status: "Active" as const };
const grandchild = { ...child, id: "c4444444-4444-4444-4444-444444444444", parentId: child.id };
const other = { ...child, id: "c5555555-5555-5555-5555-555555555555", parentId: null };
const linked = { ...category, parentId: parent.id, parent: { id: parent.id, name: parent.name } };
const rows = [category, parent, child, grandchild, other];
const before = structuredClone(rows);
assert.deepEqual(categoryEditParents(rows, linked, parent.id).map((row) => row.id).sort(), [parent.id, other.id].sort());
assert.deepEqual(categoryEditParents(rows, linked, "").map((row) => row.id), [other.id]);
const rename = categoryEditPatch(linked, { ...categoryEditDraft(linked), name: "Renamed" });
assert.ok(rename.ok && !("parentId" in rename.input));
const top = categoryEditPatch(linked, { ...categoryEditDraft(linked), parentId: "" });
assert.ok(top.ok && top.input.parentId === null);
const cyclic = [{ ...category, parentId: grandchild.id }, child, grandchild, other];
assert.deepEqual(categoryEditParents(cyclic, category, "").map((row) => row.id), [other.id]);
assert.deepEqual(rows, before);
console.log("Category edit changed-field, parent exclusion, inactive-parent and cycle checks passed.");
