/**
 * Runnable check for resume-prompt logic:
 *
 *     node src/features/publications/resume-prompt.check.mts
 */
import assert from "node:assert/strict";
import { defaultScheduleDraft } from "./schedule-preset.ts";
import { hasDraftContent, hasUnfinishedDraft, shouldShowResumePrompt } from "./resume-prompt.ts";
import type { DraftFields } from "./store/usePublicationDraftStore.ts";

const baseDraft: DraftFields = {
  publicationId: null,
  idempotencyKey: "idem-key-1",
  step: 1,
  furthestStep: 1,
  basicInfo: {
    publicationType: "image",
    name: "",
    description: "",
    priorityId: "normal",
    tags: [],
  },
  assetItems: [],
  playlistId: null,
  compositionId: null,
  channelIds: [],
  groupIds: [],
  groupNamesById: {},
  schedule: defaultScheduleDraft(),
};

// 1. default/empty draft → hasDraftContent is false
assert.equal(hasDraftContent(baseDraft), false);

// 2. basicInfo.name: "Summer promo" → true
assert.equal(hasDraftContent({ ...baseDraft, basicInfo: { ...baseDraft.basicInfo, name: "Summer promo" } }), true);

// 3. basicInfo.name: "   " (whitespace only) → false
assert.equal(hasDraftContent({ ...baseDraft, basicInfo: { ...baseDraft.basicInfo, name: "   " } }), false);

// 4. basicInfo.tags: ["promo"] → true
assert.equal(hasDraftContent({ ...baseDraft, basicInfo: { ...baseDraft.basicInfo, tags: ["promo"] } }), true);

// 5. step: 2 → true
assert.equal(hasDraftContent({ ...baseDraft, step: 2 }), true);

// 6. channelIds: ["ch-1"] → true
assert.equal(hasDraftContent({ ...baseDraft, channelIds: ["ch-1"] }), true);
assert.equal(hasDraftContent({ ...baseDraft, groupIds: ["group-1"] }), true);

// 7. playlistId: "pl-1" → true
assert.equal(hasDraftContent({ ...baseDraft, playlistId: "pl-1" }), true);

// schedule cannot influence the answer: the Pick type keeps it out of the signature,
// so the compiler enforces that invariant and no runtime assertion can add to it.

// Never-saved content matters, while saved drafts rely on the saved snapshot.
const namedDraft = { ...baseDraft, basicInfo: { ...baseDraft.basicInfo, name: "Summer promo" } };
assert.equal(hasUnfinishedDraft(baseDraft, false), false);
assert.equal(hasUnfinishedDraft(baseDraft, true), false, "default schedule dirtiness is not unfinished work");
assert.equal(hasUnfinishedDraft(namedDraft, false), true);
assert.equal(hasUnfinishedDraft({ ...namedDraft, publicationId: "pub-1" }, false), false);
assert.equal(hasUnfinishedDraft({ ...namedDraft, publicationId: "pub-1" }, true), true);
assert.equal(hasUnfinishedDraft({ ...baseDraft, publicationId: "pub-1" }, true), true);

// Capture once: later edits cannot trigger a prompt for an empty arrival.
const hadUnfinishedWorkAtHydration = hasUnfinishedDraft(baseDraft, false);
assert.equal(hasUnfinishedDraft(namedDraft, true), true);
assert.equal(
  shouldShowResumePrompt({ hadUnfinishedWorkAtHydration, isEditMode: false, dismissed: false }),
  false,
);

// A dirty arrival keeps prompting until explicitly dismissed, even if later clean.
const dirtyAtHydration = hasUnfinishedDraft({ ...namedDraft, publicationId: "pub-1" }, true);
assert.equal(hasUnfinishedDraft({ ...namedDraft, publicationId: "pub-1" }, false), false);
assert.equal(
  shouldShowResumePrompt({ hadUnfinishedWorkAtHydration: dirtyAtHydration, isEditMode: false, dismissed: false }),
  true
);

// 10. three ways it goes false
assert.equal(
  shouldShowResumePrompt({ hadUnfinishedWorkAtHydration: false, isEditMode: false, dismissed: false }),
  false,
  "no content → false"
);
assert.equal(
  shouldShowResumePrompt({ hadUnfinishedWorkAtHydration: true, isEditMode: true, dismissed: false }),
  false,
  "edit mode → false"
);
assert.equal(
  shouldShowResumePrompt({ hadUnfinishedWorkAtHydration: true, isEditMode: false, dismissed: true }),
  false,
  "dismissed → false"
);

console.log("resume-prompt.check.mts — all assertions passed");
