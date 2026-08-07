/**
 * Runnable check for basic info limits:
 *
 *     node src/features/publications/basic-info-limits.check.mts
 */
import assert from "node:assert/strict";
import { PUBLICATION_LIMITS } from "../../config/limits.ts";
import { makeDefaultScheduleForm } from "./schedule.ts";
import { stripHtmlTags } from "./sanitize.ts";
import { validateStep } from "./step-validation.ts";
import type { DraftFields } from "./store/usePublicationDraftStore.ts";

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

console.log("basic-info-limits.check.mts — all assertions passed");
