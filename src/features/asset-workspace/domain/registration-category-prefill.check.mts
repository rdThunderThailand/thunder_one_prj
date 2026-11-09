import assert from "node:assert/strict";
import { initialRegistrationState, needsCategoryDraftChoice } from "./registration-category-prefill.ts";
import { newRegistrationState, registrationPayload } from "./registration-draft.ts";
import { registrationOptionsSchema } from "../services/asset-registration-contract.ts";
import { registrationErrors } from "./registration-validation.ts";
import { categoryRegistrationHref } from "./category-detail.ts";

const options = registrationOptionsSchema.parse({
  referenceSelectors: { pageSize: 25, maxPageSize: 100, search: { enabled: true, debounceMs: 300, maxLength: 200 },
    categories: { path: "/categories", hierarchical: true }, locations: { path: "/locations", hierarchical: true },
    orgUnits: { path: "/org-units", hierarchical: true }, persons: { path: "/persons", hierarchical: false, pagination: "cursor" } },
  initialConditions: ["Good", "Fair"], tagGeneration: { modes: ["automatic", "manual"], allocatedOn: "creation" },
  serialOverride: { field: "serial_override_reason", maxLength: 1000, reasonIsConfirmation: true },
  submission: { method: "POST", path: "/assets", canSubmit: false, reason: "REGISTRATION_UNAVAILABLE" },
});
const category = { id: "c1111111-1111-1111-1111-111111111111", name: "CCTV", is_serial_required: true };
const normal = initialRegistrationState(null, options);
assert.equal(normal.draft.categoryId, "");
assert.equal(normal.draft.selectedReferences.categories, null);
assert.equal(normal.draft.tagMode, "automatic");
assert.equal(normal.draft.condition, "Good");
assert.equal(normal.step, 0);
const prefilling = initialRegistrationState(null, options, category);
assert.equal(prefilling.draft.categoryId, category.id);
assert.deepEqual(prefilling.draft.selectedReferences.categories, category);
assert.equal(prefilling.step, normal.step, "the normal wizard steps are not skipped");
const ruleOptions = { ...options, referenceValidation: { categories: { id: category.id, status: "valid" as const } } };
assert.ok(registrationErrors(prefilling.draft, ruleOptions, 1).serialNumber, "required serial rule still applies");
assert.equal(registrationPayload(prefilling.draft).asset_category_id, category.id);
const saved = newRegistrationState();
saved.draft.name = "Saved laptop";
saved.draft.categoryId = "other";
saved.draft.serialNumber = "KEEP-ME";
saved.step = 3;
const before = structuredClone(saved);
assert.strictEqual(initialRegistrationState(saved, options), saved);
assert.strictEqual(initialRegistrationState(saved, options, category), saved);
assert.deepEqual(saved, before, "prefill must not change any saved draft field or step");
assert.equal(needsCategoryDraftChoice(category, saved.draft.categoryId, true, false), true);
assert.equal(needsCategoryDraftChoice(category, category.id, true, false), false);
assert.equal(needsCategoryDraftChoice(category, "other", false, false), false);
assert.equal(needsCategoryDraftChoice(category, "other", true, true), false, "locked/uncertain recovery cannot be discarded through prefill");
assert.equal(needsCategoryDraftChoice(undefined, "other", true, false), false);
const target = new URL(categoryRegistrationHref(category.id), "http://localhost");
assert.equal(target.pathname, "/asset-workspace/assets/register");
assert.equal(target.searchParams.get("mode"), "single");
assert.equal(target.searchParams.get("category_id"), category.id);
const changed = { ...prefilling.draft, categoryId: "different" };
assert.equal(registrationPayload(changed).asset_category_id, "different", "preselection does not lock the category");
assert.deepEqual(category, { id: category.id, name: "CCTV", is_serial_required: true });
console.log("Normal and category-prefilled registration initialization, draft precedence, serial validation, recovery locks and navigation checks passed.");
