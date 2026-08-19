/**
 * Runnable check for resume-prompt logic:
 *
 *     node src/features/publications/resume-prompt.check.mts
 */
import assert from "node:assert/strict";
import { makeDefaultScheduleForm } from "./schedule.ts";
import { hasDraftContent, shouldShowResumePrompt } from "./resume-prompt.ts";
import type { DraftFields } from "./store/usePublicationDraftStore.ts";

const baseDraft: DraftFields = {
  publicationId: null,
  idempotencyKey: "idem-key-1",
  step: 1,
  basicInfo: {
    campaignId: "",
    publicationType: "image",
    name: "",
    description: "",
    priorityId: "normal",
    language: "th",
    tags: [],
  },
  assetItems: [],
  playlistId: null,
  channelIds: [],
  scheduleForm: makeDefaultScheduleForm(),
};

// 1. default/empty draft → hasDraftContent is false
assert.equal(hasDraftContent(baseDraft), false);

// 2. basicInfo.name: "Summer promo" → true
assert.equal(hasDraftContent({ ...baseDraft, basicInfo: { ...baseDraft.basicInfo, name: "Summer promo" } }), true);

// 3. basicInfo.name: "   " (whitespace only) → false
assert.equal(hasDraftContent({ ...baseDraft, basicInfo: { ...baseDraft.basicInfo, name: "   " } }), false);

// 4. basicInfo.campaignId: "camp-1" → true
assert.equal(hasDraftContent({ ...baseDraft, basicInfo: { ...baseDraft.basicInfo, campaignId: "camp-1" } }), true);

// 5. step: 2 → true
assert.equal(hasDraftContent({ ...baseDraft, step: 2 }), true);

// 6. channelIds: ["ch-1"] → true
assert.equal(hasDraftContent({ ...baseDraft, channelIds: ["ch-1"] }), true);

// 7. playlistId: "pl-1" → true
assert.equal(hasDraftContent({ ...baseDraft, playlistId: "pl-1" }), true);

// scheduleForm cannot influence the answer: the Pick type keeps it out of the signature,
// so the compiler enforces that invariant and no runtime assertion can add to it.

// 9. shouldShowResumePrompt with hadContentAtHydration true, not edit mode, not dismissed → true
assert.equal(
  shouldShowResumePrompt({ hadContentAtHydration: true, isEditMode: false, dismissed: false }),
  true
);

// 10. three ways it goes false
assert.equal(
  shouldShowResumePrompt({ hadContentAtHydration: false, isEditMode: false, dismissed: false }),
  false,
  "no content → false"
);
assert.equal(
  shouldShowResumePrompt({ hadContentAtHydration: true, isEditMode: true, dismissed: false }),
  false,
  "edit mode → false"
);
assert.equal(
  shouldShowResumePrompt({ hadContentAtHydration: true, isEditMode: false, dismissed: true }),
  false,
  "dismissed → false"
);

console.log("resume-prompt.check.mts — all assertions passed");
