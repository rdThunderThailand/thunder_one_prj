/**
 * Runnable check for basic info limits and the ver02 step re-cut (ADR 0072 §2):
 *
 *     node src/features/media-workspace/publications/basic-info-limits.check.mts
 *
 * Step map: 1 Choose Content · 2 Prepare Content · 3 Program · 4 Review · 5 Publish.
 */
import assert from "node:assert/strict";
import { PUBLICATION_LIMITS } from "../../../config/limits.ts";
import { makeDefaultScheduleForm } from "./schedule.ts";
import { stripHtmlTags } from "./sanitize.ts";
import { validateStep, validateBasicInfo } from "./step-validation.ts";
import type { DraftFields } from "./store/usePublicationDraftStore.ts";
import type { PublicationTypeId } from "./mock-data.ts";

// 1. stripHtmlTags removes HTML tags
assert.equal(stripHtmlTags("<script>alert(1)</script>ลดราคา"), "alert(1)ลดราคา");

// 2. stripHtmlTags leaves plain Thai text untouched
assert.equal(stripHtmlTags("ลดราคา 50%"), "ลดราคา 50%");

const baseDraft: DraftFields = {
  publicationId: null,
  idempotencyKey: "idem-key-1",
  step: 1,
  furthestStep: 1,
  basicInfo: {
    publicationType: "image",
    name: "Summer promo",
    description: "",
    priorityId: "normal",
    tags: [],
  },
  assetItems: [{ media_asset_id: "asset-1", duration_seconds: 10, transition: "cut" }],
  playlistId: null,
  compositionId: null,
  channelIds: [],
  scheduleForm: makeDefaultScheduleForm(),
};

// --- Step 1: Choose Content ---

// 3. image type with a selected asset → valid
assert.equal(validateStep(1, baseDraft).valid, true);

// 4. image type with nothing selected → invalid
assert.equal(validateStep(1, { ...baseDraft, assetItems: [] }).valid, false);

// 5. composition type needs a Composition (operator-facing error still says "Layout", ADR 0052 §1)
const compositionDraft = {
  ...baseDraft,
  basicInfo: { ...baseDraft.basicInfo, publicationType: "composition" as const },
  assetItems: [],
};
assert.equal(validateStep(1, compositionDraft).valid, false);
assert.ok(validateStep(1, compositionDraft).errors.includes("กรุณาเลือก Layout"));
assert.equal(validateStep(1, { ...compositionDraft, compositionId: "composition-1" }).valid, true);

// 6. playlist type needs a playlistId
const playlistDraft = {
  ...baseDraft,
  basicInfo: { ...baseDraft.basicInfo, publicationType: "playlist" as const },
  assetItems: [],
};
assert.equal(validateStep(1, playlistDraft).valid, false);
assert.equal(validateStep(1, { ...playlistDraft, playlistId: "pl-1" }).valid, true);

// --- Step 2: Prepare Content (basic info) ---

// 7. description at exact limit → valid
const validDescription = "a".repeat(PUBLICATION_LIMITS.descriptionMaxLength);
assert.equal(
  validateStep(2, { ...baseDraft, basicInfo: { ...baseDraft.basicInfo, description: validDescription } }).valid,
  true
);

// 8. description one char over limit → invalid, with the over-limit message
const overDescription = "a".repeat(PUBLICATION_LIMITS.descriptionMaxLength + 1);
const resOver = validateStep(2, {
  ...baseDraft,
  basicInfo: { ...baseDraft.basicInfo, description: overDescription },
});
assert.equal(resOver.valid, false);
assert.ok(resOver.errors.includes(`คำอธิบายยาวเกิน ${PUBLICATION_LIMITS.descriptionMaxLength} ตัวอักษร`));

// validateBasicInfo assertion 1: all valid fields → no errors
assert.deepEqual(validateBasicInfo(baseDraft.basicInfo), {});

// validateBasicInfo assertion 2: empty name → name error
assert.equal(validateBasicInfo({ ...baseDraft.basicInfo, name: "" }).name, "กรุณากรอกชื่อ Program");

// validateBasicInfo assertion 3: name at exact limit → no name error
const nameAtLimit = "a".repeat(PUBLICATION_LIMITS.nameMaxLength);
assert.equal(validateBasicInfo({ ...baseDraft.basicInfo, name: nameAtLimit }).name, undefined);

// validateBasicInfo assertion 4: name one char over limit → error mentions the limit
const res4 = validateBasicInfo({ ...baseDraft.basicInfo, name: "a".repeat(PUBLICATION_LIMITS.nameMaxLength + 1) });
assert.ok(res4.name?.includes(String(PUBLICATION_LIMITS.nameMaxLength)));

// validateBasicInfo assertion 5: unknown publicationType → publicationType error
const res5 = validateBasicInfo({
  ...baseDraft.basicInfo,
  publicationType: "widget" as PublicationTypeId,
});
assert.equal(res5.publicationType, "กรุณาเลือกประเภทคอนเทนต์");

// validateBasicInfo assertion 6: empty name surfaces through validateStep(2, ...)
const res6 = validateStep(2, { ...baseDraft, basicInfo: { ...baseDraft.basicInfo, name: "" } });
assert.equal(res6.valid, false);
assert.ok(res6.errors.includes("กรุณากรอกชื่อ Program"));

// --- Step 3: Program (targeting + schedule) ---

// 7'. no Channel selected → invalid
assert.equal(validateStep(3, baseDraft).valid, false);
assert.ok(validateStep(3, baseDraft).errors.includes("กรุณาเลือกช่องทางอย่างน้อย 1 ช่องทาง"));

// 8'. a Channel selected with a default (valid) schedule → valid
assert.equal(validateStep(3, { ...baseDraft, channelIds: ["ch-1"] }).valid, true);

// --- Steps 4 & 5: no gate ---
assert.equal(validateStep(4, { ...baseDraft, assetItems: [] }).valid, true);
assert.equal(validateStep(5, { ...baseDraft, assetItems: [] }).valid, true);

console.log("basic-info-limits.check.mts — all assertions passed");
