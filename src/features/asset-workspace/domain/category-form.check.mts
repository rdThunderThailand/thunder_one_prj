/** Run: node src/features/asset-workspace/domain/category-form.check.mts */
import assert from "node:assert/strict";
import { activeCategoryParents, categoryCreateFeedback, characterCount, emptyCategoryDraft, validateCategoryDraft } from "./category-form.ts";
import type { AssetCategory } from "./asset-category.ts";

const seededId = "c1111111-1111-1111-1111-111111111111";
assert.equal(emptyCategoryDraft.isSerialRequired, false);
const empty = validateCategoryDraft({ ...emptyCategoryDraft, name: "  " });
assert.ok(!empty.ok && empty.fields.name);
const normalized = validateCategoryDraft({ ...emptyCategoryDraft, name: "  Computer  ", code: " lap-01 ", description: "  Laptops  ", parentId: seededId });
assert.deepEqual(normalized, { ok: true, input: {
  name: "Computer", code: "lap-01", parentId: seededId, description: "Laptops", isSerialRequired: false,
} });
const generated = validateCategoryDraft({ ...emptyCategoryDraft, name: "Display", code: "   " });
assert.deepEqual(generated, { ok: true, input: { name: "Display", parentId: null, description: null, isSerialRequired: false } });
if (generated.ok) {
  assert.equal("code" in generated.input, false, "Core generates the code; frontend never guesses it");
  assert.equal("status" in generated.input, false, "new status is owned by Core");
}
for (const [field, value] of [
  ["name", "x".repeat(256)], ["code", "a".repeat(101)], ["code", "contains spaces"],
  ["code", "CAT/1"], ["parentId", "../../other-tenant"], ["description", "x".repeat(501)],
] as const) {
  const invalid = validateCategoryDraft({ ...emptyCategoryDraft, name: "Valid", [field]: value });
  assert.ok(!invalid.ok && invalid.fields[field], field);
}
assert.ok(validateCategoryDraft({ ...emptyCategoryDraft, name: "อุปกรณ์", code: "CAT_A-01", isSerialRequired: true }).ok);
assert.ok(validateCategoryDraft({ ...emptyCategoryDraft, name: "😀".repeat(255), description: "😀".repeat(500) }).ok,
  "character limits match PostgreSQL code points rather than UTF-16 units");
assert.equal(characterCount("😀"), 1);

const parent = (name: string, status: "Active" | "Inactive"): AssetCategory => ({
  id: seededId, name, status, code: "CAT-A", parentId: null, parent: null, description: null,
  isSerialRequired: false, ownAssetCount: 0, assetCount: 0, childCount: 0, updatedAt: "2026-11-07T00:00:00Z",
});
const options = Object.freeze([parent("Zulu", "Active"), parent("Inactive", "Inactive"), parent("Alpha", "Active")]);
assert.deepEqual(activeCategoryParents(options).map((category) => category.name), ["Alpha", "Zulu"]);
assert.equal(options[0].name, "Zulu", "sorting does not mutate read data");
assert.ok(categoryCreateFeedback(409, "DUPLICATE_NAME", null, false).fields.name);
assert.ok(categoryCreateFeedback(409, "DUPLICATE_CODE", null, false).fields.code);
assert.ok(categoryCreateFeedback(400, "INVALID_PARENT", null, false).fields.parentId);
for (const details of [{ parentId: ["private SQL detail"] }, { fieldErrors: { parentId: ["private SQL detail"] } }]) {
  const feedback = categoryCreateFeedback(400, "VALIDATION", details, false);
  assert.ok(feedback.fields.parentId);
  assert.ok(!JSON.stringify(feedback).includes("private SQL detail"));
}
assert.equal(Object.keys(categoryCreateFeedback(400, "VALIDATION", { unexpected: ["secret"] }, false).fields).length, 0);
assert.ok(categoryCreateFeedback(401, "UNAUTHENTICATED", null, false).message.includes("Sign in"));
assert.ok(categoryCreateFeedback(403, "PERMISSION_DENIED", null, false).message.includes("kept"));
assert.ok(categoryCreateFeedback(502, "UPSTREAM_FAILED", null, true).message.includes("Check the category list"));
console.log("Category draft, payload, Unicode limits, active parents, and safe field feedback checks passed.");
