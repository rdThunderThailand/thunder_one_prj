import assert from "node:assert/strict";
import { assetEditDraft, assetEditPatch, assetEditFeedback, assetEditWithReason } from "./asset-edit.ts";
import { assetDetailSchema } from "../services/asset-profile-contract.ts";
import { updateAssetDetails } from "../services/asset-edit-api.ts";

const id = "11111111-1111-4111-8111-111111111111";
const categoryId = "c1111111-1111-1111-1111-111111111111";
const asset = assetDetailSchema.parse({ id, name: "Laptop", assetTag: "AST-1", serialNumber: "ABC", category: { id: categoryId, name: "IT" },
  categoryPath: [], qrValue: null, location: null, custody: null, lifecycleStatus: "Available", condition: "Good",
  acquisitionDate: "2026-01-02", registrationDate: "2026-01-02T00:00:00Z", updatedAt: "2026-11-09T10:22:33.123456+00:00", notes: "Keep" });
const draft = assetEditDraft(asset);
assert.equal(assetEditPatch(asset, draft).dirty, false);
assert.equal(assetEditPatch(asset, { ...draft, name: " Laptop " }).dirty, false);
assert.deepEqual(assetEditPatch(asset, { ...draft, notes: "" }).input, { expectedUpdatedAt: asset.updatedAt, notes: null });
assert.deepEqual(assetEditPatch(asset, { ...draft, name: "Updated" }).input, { expectedUpdatedAt: asset.updatedAt, name: "Updated" });
assert.deepEqual(assetEditPatch(asset, { ...draft, serialNumber: "", acquisitionDate: "" }).input,
  { expectedUpdatedAt: asset.updatedAt, serialNumber: null, acquisitionDate: null });
assert.equal(assetEditPatch(asset, { ...draft, acquisitionDate: "2026-02-30" }).valid, false);
assert.equal(assetEditPatch(asset, { ...draft, categoryId: "bad" }).valid, false);
assert.equal(assetEditPatch(asset, { ...draft, name: " " }).valid, false);
assert.equal(assetEditPatch(asset, { ...draft, name: "New" }).input.categoryId, undefined); // inactive category remains untouched
assert.ok(assetEditFeedback("SERIAL_REQUIRED").fields.serialNumber);
assert.ok(assetEditFeedback("INVALID_CATEGORY").fields.categoryId);
assert.equal(assetEditFeedback("PERMISSION_DENIED").message, "You don't have permission to edit assets.");
assert.match(assetEditFeedback("STALE").message, /input has been kept/);
assert.ok(assetEditFeedback("VALIDATION", { acquisitionDate: ["raw database diagnostic"] }).fields.acquisitionDate);
assert.doesNotMatch(JSON.stringify(assetEditFeedback("VALIDATION", { notes: ["secret diagnostic"] })), /secret diagnostic/);
const input = assetEditPatch(asset, { ...draft, name: "Updated" }).input;
assert.equal(assetEditWithReason(input, "ABC", "ABC", " ").input, null);
assert.equal(assetEditWithReason(input, "ABC", "ABC", " Approved exception ").input?.serialOverrideReason, "Approved exception");
assert.equal(assetEditWithReason(input, "DIFFERENT", "ABC", "Old reason").input?.serialOverrideReason, undefined);
assert.equal(assetEditWithReason(input, "ABC", null, "Unconfirmed reason").input?.serialOverrideReason, undefined);
let calls = 0;
const stale = await updateAssetDetails("context", id, input, new AbortController().signal, async () => {
  calls++; return { status: 409, data: { error: { code: "STALE" } } };
});
assert.equal(stale.ok, false);
if (!stale.ok) assert.equal(stale.code, "STALE");
assert.equal(calls, 1);
const uncertain = await updateAssetDetails("context", id, input, new AbortController().signal, async () => { throw new Error("lost response"); });
assert.equal(uncertain.ok, false);
if (!uncertain.ok) assert.equal(uncertain.uncertain, true);
const duplicate = await updateAssetDetails("context", id, input, new AbortController().signal, async () => ({ status: 409,
  data: { error: { code: "SERIAL_DUPLICATE", details: [{ id, assetTag: "AST-2", name: "Other" }] } } }));
if (duplicate.ok) assert.fail("must preserve duplicate warning");
assert.equal(duplicate.duplicates[0].assetTag, "AST-2");
console.log("asset-edit checks passed");
