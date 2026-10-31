/** Run: node src/features/asset-workspace/domain/registration.check.mts */
import assert from "node:assert/strict";
import { newRegistrationState, registrationPayload, registrationStateSchema } from "./registration-draft.ts";
import { firstInvalidRegistrationStep, locationPath, registrationErrors } from "./registration-validation.ts";
import { isCalendarDate } from "./registration-warranty-dates.ts";
import { registrationOptionsSchema } from "../services/asset-registration-contract.ts";
import { readRegistrationDraft, registrationDraftKey, removeRegistrationDraft, saveRegistrationDraft } from "../services/asset-registration-draft-storage.ts";

import { newWarranty, warrantyErrors } from "./registration-warranties.ts";

const category = "33333333-3333-4333-8333-333333333333";
const location = "44444444-4444-4444-8444-444444444444";
const person = "55555555-5555-4555-8555-555555555555";
const options = registrationOptionsSchema.parse({
  categories: [{ id: category, name: "Display", is_serial_required: true }],
  locations: [{ id: location, name: "Lobby", parent_location_id: null, location_type: "office" }],
  persons: [{ id: person, name: "Example user" }], orgUnits: [], initialConditions: ["Good", "Fair"],
  canOverrideSerial: false, tagGeneration: { modes: ["manual", "automatic"], allocatedOn: "creation" },
  submission: { method: "POST", path: "/assets", canSubmit: false, reason: "REGISTRATION_UNAVAILABLE" },
});

const legacyId = "12345678-1234-0234-1234-123456789abc";
const legacyOptions = {
  ...options,
  categories: [{ ...options.categories[0], id: legacyId }],
  locations: [{ ...options.locations[0], id: legacyId, parent_location_id: legacyId }],
  persons: [{ ...options.persons[0], id: legacyId }],
  orgUnits: [{ id: legacyId, name: "Legacy unit", parent_department_id: legacyId }],
};
assert.equal(registrationOptionsSchema.safeParse(legacyOptions).success, true);
for (const id of ["not-a-uuid", "12345678-1234-0234-1234-123456789abg", ""]) {
  assert.equal(registrationOptionsSchema.safeParse({ ...legacyOptions, categories: [{ ...legacyOptions.categories[0], id }] }).success, false);
}

assert.equal(isCalendarDate("2026-04-31"), false);
assert.equal(isCalendarDate("2024-02-29"), true);

const state = newRegistrationState();
assert.equal(firstInvalidRegistrationStep(state.draft, options), 0);
Object.assign(state.draft, { name: " Lobby display ", categoryId: category, locationId: location, serialNumber: " SN-001 " });
assert.equal(firstInvalidRegistrationStep(state.draft, options), null);
assert.ok(registrationErrors({ ...state.draft, serialNumber: "" }, options, 1).serialNumber);
assert.ok(registrationErrors({ ...state.draft, tagMode: "manual" }, options, 0).assetCode);
assert.ok(registrationErrors({ ...state.draft, custodyType: "person", custodyId: location }, options, 2).custodyId);
assert.ok(registrationErrors({ ...state.draft, categoryId: location }, options, 1).categoryId);
assert.ok(registrationErrors({ ...state.draft, condition: "Fair" }, { ...options, initialConditions: ["Good"] }, 0).condition);
const warranty = { ...newWarranty(), provider: " Provider ", startDate: "2024-02-29", endDate: "2025-02-28", isCurrent: true };
assert.ok(registrationErrors({ ...state.draft, warranties: [newWarranty()] }, options, 3).warranties);
assert.ok(registrationErrors({ ...state.draft, warranties: [{ ...warranty, isCurrent: false }] }, options, 3).warranties);
assert.ok(registrationErrors({ ...state.draft, warranties: [warranty, { ...warranty, clientId: crypto.randomUUID() }] }, options, 3).warranties);
assert.ok(warrantyErrors({ ...warranty, endDate: "2024-02-28" }).endDate);
assert.ok(warrantyErrors({ ...warranty, startDate: "2025-02-29" }).startDate);
assert.deepEqual(warrantyErrors({ ...warranty, startDate: "", endDate: "" }), {});
Object.assign(state.draft, { custodyType: "person", custodyId: person, warranties: [warranty] });
assert.equal(firstInvalidRegistrationStep(state.draft, options), null);
const payload = JSON.parse(JSON.stringify(registrationPayload(state.draft)));
assert.equal(payload.name, "Lobby display");
assert.equal(payload.serial_number, "SN-001");
assert.equal(payload.warranties[0].is_current, true);
assert.equal(payload.warranties[0].end_date, "2025-02-28");
assert.deepEqual(payload.initial_custody, { target_type: "person", target_user_id: person });
for (const excluded of ["asset_code", "status", "tenant_id", "brand", "photos", "warranty_years"]) assert.equal(excluded in payload, false);
assert.equal("warranty" in JSON.parse(JSON.stringify(registrationPayload({ ...state.draft, warranties: [] }))), false);
assert.equal(locationPath(location, { ...options, locations: [{ ...options.locations[0], parent_location_id: location }] }), "Lobby");
assert.equal(registrationStateSchema.safeParse({ ...state, step: 99 }).success, false);
assert.equal(registrationStateSchema.safeParse({ ...state, step: 4, editing: true }).success, false);

// A fake tab store checks round trips and failures without touching real browser storage.
const values = new Map<string, string>();
Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: {
  getItem: (key: string) => values.get(key) ?? null,
  setItem: (key: string, value: string) => values.set(key, value),
  removeItem: (key: string) => values.delete(key),
} });
const key = registrationDraftKey("tenant-a", "user-a");
assert.notEqual(key, registrationDraftKey("tenant-b", "user-a"));
assert.notEqual(key, registrationDraftKey("tenant-a", "user-b"));
assert.equal(saveRegistrationDraft(key, state), true);
assert.deepEqual(readRegistrationDraft(key).state, state);
const invalidDateState = { ...state, draft: { ...state.draft, purchaseDate: "12026-01-15" } };
assert.equal(saveRegistrationDraft(key, invalidDateState), true);
assert.equal(readRegistrationDraft(key).state?.draft.purchaseDate, "12026-01-15");
assert.ok(registrationErrors(invalidDateState.draft, options, 3).purchaseDate);
values.set(key, '{"draft":"corrupt"}');
assert.equal(readRegistrationDraft(key).state, null);
assert.equal(values.has(key), false);
const legacy = { ...state, draft: { ...state.draft, warrantyEnabled: true, warrantyProvider: "Old Provider", warrantyType: "Old type", warrantyStart: "2024-01-15", warrantyEnd: "2027-01-14", warrantyYears: "3", warrantyCurrent: false, warrantyTerms: "Old coverage", warrantyReference: "OLD-001" } };
values.set(key, JSON.stringify(legacy));
const migrated = readRegistrationDraft(key).state!;
assert.equal(migrated.draft.warranties[0].provider, "Old Provider");
assert.equal(migrated.draft.warranties[0].endDate, "2027-01-14");
assert.equal(migrated.draft.warranties[0].isCurrent, false);
assert.equal(readRegistrationDraft(key).state?.draft.warranties[0].clientId, migrated.draft.warranties[0].clientId);
assert.equal("warrantyYears" in migrated.draft, false);
values.set(key, JSON.stringify({ ...legacy, draft: { ...legacy.draft, warrantyEnabled: false } }));
const excluded = readRegistrationDraft(key).state!;
assert.equal(excluded.draft.warranties.length, 0);
assert.equal(excluded.draft.savedWarranty?.provider, "Old Provider");
assert.equal(registrationStateSchema.safeParse({ ...state, draft: { ...state.draft, warranties: [warranty, warranty] } }).success, false);
assert.equal(removeRegistrationDraft(key), true);
Object.defineProperty(globalThis, "sessionStorage", { configurable: true, get() { throw new Error("Storage blocked"); } });
assert.equal(readRegistrationDraft(key).unavailable, true);
assert.equal(saveRegistrationDraft(key, state), false);
assert.equal(removeRegistrationDraft(key), false);
console.log("Registration checks passed: dates, references, payload boundaries and isolated session drafts.");
