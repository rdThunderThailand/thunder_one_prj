/**
 * Runnable check for basic info limits:
 *
 *     node src/features/publications/basic-info-limits.check.mts
 */
import assert from "node:assert/strict";
import { PUBLICATION_LIMITS } from "../../../config/limits.ts";
import { makeDefaultScheduleForm } from "./schedule.ts";
import { stripHtmlTags } from "./sanitize.ts";
import { validateStep, validateBasicInfo } from "./step-validation.ts";
import type { DraftFields } from "./store/usePublicationDraftStore.ts";
import type { PublicationTypeId } from "./mock-data.ts";

// 1. stripHtmlTags removes HTML tags
assert.equal(
  stripHtmlTags("<script>alert(1)</script>ลดราคา"),
  "alert(1)ลดราคา"
);

// 2. stripHtmlTags leaves plain Thai text untouched
assert.equal(stripHtmlTags("ลดราคา 50%"), "ลดราคา 50%");

const baseDraft: DraftFields = {
  publicationId: null,
  idempotencyKey: "idem-key-1",
  step: 1,
  basicInfo: {
    campaignId: "camp-1",
    publicationType: "image",
    name: "Summer promo",
    description: "",
    priorityId: "normal",
    language: "th",
    tags: [],
  },
  assetItems: [],
  playlistId: null,
  compositionId: null,
  channelIds: [],
  scheduleForm: makeDefaultScheduleForm(),
};

// 3. validateStep(1, draft) with description: "" -> valid === true
const resEmpty = validateStep(1, baseDraft);
assert.equal(resEmpty.valid, true);

// 4. validateStep(1, draft) with description length === descriptionMaxLength -> valid === true
const validDescription = "a".repeat(PUBLICATION_LIMITS.descriptionMaxLength);
const resMax = validateStep(1, {
  ...baseDraft,
  basicInfo: { ...baseDraft.basicInfo, description: validDescription },
});
assert.equal(resMax.valid, true);

// 5. validateStep(1, draft) with description length === descriptionMaxLength + 1 -> valid === false with over-limit message
const overDescription = "a".repeat(PUBLICATION_LIMITS.descriptionMaxLength + 1);
const resOver = validateStep(1, {
  ...baseDraft,
  basicInfo: { ...baseDraft.basicInfo, description: overDescription },
});
assert.equal(resOver.valid, false);

const expectedErrorMessage = `คำอธิบายยาวเกิน ${PUBLICATION_LIMITS.descriptionMaxLength} ตัวอักษร`;
assert.ok(
  resOver.errors.includes(expectedErrorMessage),
  `Expected error array to contain "${expectedErrorMessage}"`
);


// validateBasicInfo assertion 1: all valid fields → no errors
const res1 = validateBasicInfo(baseDraft.basicInfo);
assert.deepEqual(res1, {});

// validateBasicInfo assertion 2: empty name → name error
const res2 = validateBasicInfo({ ...baseDraft.basicInfo, name: "" });
assert.equal(res2.name, "กรุณากรอกชื่อ Publication");

// validateBasicInfo assertion 3: name at exact limit → no name error
const nameAtLimit = "a".repeat(PUBLICATION_LIMITS.nameMaxLength);
const res3 = validateBasicInfo({ ...baseDraft.basicInfo, name: nameAtLimit });
assert.equal(res3.name, undefined);

// validateBasicInfo assertion 4: name one char over limit → name error contains the limit number
const nameOverLimit = "a".repeat(PUBLICATION_LIMITS.nameMaxLength + 1);
const res4 = validateBasicInfo({ ...baseDraft.basicInfo, name: nameOverLimit });
assert.ok(
  res4.name?.includes(String(PUBLICATION_LIMITS.nameMaxLength)),
  `Expected name error to mention ${PUBLICATION_LIMITS.nameMaxLength}`
);

// validateBasicInfo assertion 5: empty campaignId → campaignId error
const res5 = validateBasicInfo({ ...baseDraft.basicInfo, campaignId: "" });
assert.equal(res5.campaignId, "กรุณาเลือก Campaign");

// validateBasicInfo assertion 6: campaignId not in provided list → availability error
const res6 = validateBasicInfo(
  { ...baseDraft.basicInfo, campaignId: "camp-gone" },
  { campaignIds: ["camp-1"] }
);
assert.equal(res6.campaignId, "Campaign ที่เลือกไว้ไม่มีอยู่แล้ว กรุณาเลือกใหม่");

// validateBasicInfo assertion 7: campaignId in provided list → no error
const res7 = validateBasicInfo(
  { ...baseDraft.basicInfo, campaignId: "camp-1" },
  { campaignIds: ["camp-1"] }
);
assert.equal(res7.campaignId, undefined);

// validateBasicInfo assertion 8: campaignId not in list but no ctx → availability skipped, no error
const res8 = validateBasicInfo({ ...baseDraft.basicInfo, campaignId: "camp-gone" });
assert.equal(res8.campaignId, undefined);

// validateBasicInfo assertion 9: unknown publicationType → publicationType error
const res9 = validateBasicInfo({
  ...baseDraft.basicInfo,
  publicationType: "widget" as PublicationTypeId,
});
assert.equal(res9.publicationType, "กรุณาเลือกประเภท Publication");

// validateBasicInfo assertion 10: regression — validateStep(1, ...) with two args still works
const res10 = validateStep(1, {
  ...baseDraft,
  basicInfo: { ...baseDraft.basicInfo, name: "", campaignId: "" },
});
assert.equal(res10.valid, false);
assert.ok(res10.errors.includes("กรุณาเลือก Campaign"));
assert.ok(res10.errors.includes("กรุณากรอกชื่อ Publication"));

// Step 2 keeps the existing behavior for asset-based types.
assert.equal(validateStep(2, { ...baseDraft, assetItems: [{ media_asset_id: "asset-1", duration_seconds: 10 }] }).valid, true);

// A composition publication needs a Composition picked (ADR 0049 §5) — the operator-facing
// error still says "Layout" (ADR 0052 §1) even though the field is compositionId.
const compositionDraft = {
  ...baseDraft,
  basicInfo: { ...baseDraft.basicInfo, publicationType: "composition" as const },
};
assert.equal(validateStep(2, compositionDraft).valid, false);
assert.ok(validateStep(2, compositionDraft).errors.includes("กรุณาเลือก Layout"));
assert.equal(validateStep(2, { ...compositionDraft, compositionId: "composition-1" }).valid, true);

console.log("basic-info-limits.check.mts — all assertions passed");
