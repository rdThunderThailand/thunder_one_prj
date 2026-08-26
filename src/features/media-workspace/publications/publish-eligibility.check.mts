/**
 * Runnable check for publish eligibility:
 *
 *     node src/features/media-workspace/publications/publish-eligibility.check.mts
 *
 * Covers priority-aware schedule conflicts, invalid schedules, and conflict-
 * service failures that must block Publish as "unknown" rather than being
 * silently read as "no conflict".
 */
import assert from "node:assert/strict";
import { computeEligibility, summarizePriorityConflicts } from "./publish-eligibility.ts";
import { makeDefaultScheduleForm } from "./schedule.ts";
import type { DraftFields } from "./store/usePublicationDraftStore.ts";
import type { MediaAsset, ScheduleConflict } from "./types/index.ts";

const validDraft: DraftFields = {
  publicationId: null,
  idempotencyKey: "idem-key-1",
  step: 4,
  basicInfo: {
    campaignId: "camp-1",
    publicationType: "image",
    name: "Summer promo",
    description: "",
    priorityId: "normal",
    language: "th",
    tags: [],
  },
  assetItems: [{ media_asset_id: "asset-1", duration_seconds: 10 }],
  playlistId: null,
  compositionId: null,
  channelIds: ["screen-1"],
  scheduleForm: { ...makeDefaultScheduleForm(), schedule_type: "now" },
};

const approvedAsset: MediaAsset = { id: "asset-1", approval_status: "approved" };

const base = {
  draft: validDraft,
  assets: [approvedAsset],
  conflicts: [] as ScheduleConflict[],
  conflictsError: null as string | null,
  loadingRefs: false,
  checkingConflicts: false,
};

// Everything passing is the only combination that should allow Publish.
assert.equal(computeEligibility(base).canPublish, true);

// --- conflict-service-failure: must block, and must not read as "no conflict" ---
const conflictFailure = computeEligibility({ ...base, conflictsError: "Network Error" });
assert.equal(conflictFailure.checks[4].status, "unknown"); // conflicts is index 4
assert.equal(conflictFailure.canPublish, false);

// Still in flight is the same as failed for gating purposes — no answer yet.
const stillChecking = computeEligibility({ ...base, checkingConflicts: true });
assert.equal(stillChecking.checks[4].status, "unknown");
assert.equal(stillChecking.canPublish, false);

const samePriorityConflict: ScheduleConflict = {
  publication_id: "pub-2",
  name: "Other normal promo",
  status: "active",
  priority: "normal",
  starts_at: "2026-08-10T00:00:00Z",
  ends_at: null,
  screens: [],
  would_be_suppressed: false,
  would_suppress: false,
};

// Same-tier publications append to the playback loop, so the overlap is advisory.
const withSamePriority = computeEligibility({ ...base, conflicts: [samePriorityConflict] });
assert.equal(withSamePriority.checks[4].status, "pass");
assert.equal(withSamePriority.canPublish, true);

// A higher-priority draft suppresses the lower tier and is allowed to publish.
const lowerPriorityConflict: ScheduleConflict = {
  ...samePriorityConflict,
  publication_id: "pub-low",
  name: "Low promo",
  priority: "low",
  would_suppress: true,
};
const withLowerPriority = computeEligibility({ ...base, conflicts: [lowerPriorityConflict] });
assert.equal(withLowerPriority.checks[4].status, "pass");
assert.equal(withLowerPriority.canPublish, true);

// A draft that would be suppressed by a higher tier must remain blocked.
const higherPriorityConflict: ScheduleConflict = {
  ...samePriorityConflict,
  publication_id: "pub-high",
  name: "High promo",
  priority: "high",
  would_be_suppressed: true,
};
const withHigherPriority = computeEligibility({ ...base, conflicts: [higherPriorityConflict] });
assert.equal(withHigherPriority.checks[4].status, "fail");
assert.equal(withHigherPriority.canPublish, false);

// Any losing conflict blocks the draft, even when it also wins or ties elsewhere.
const withMixedPriorities = computeEligibility({
  ...base,
  conflicts: [lowerPriorityConflict, samePriorityConflict, higherPriorityConflict],
});
assert.equal(withMixedPriorities.checks[4].status, "fail");
assert.equal(withMixedPriorities.canPublish, false);
assert.deepEqual(
  summarizePriorityConflicts([lowerPriorityConflict, samePriorityConflict, higherPriorityConflict]),
  {
    higherPriorityCount: 1,
    lowerPriorityCount: 1,
    equalPriorityCount: 1,
    hasBlockingConflict: true,
  }
);

// --- invalid schedule: index 1 is the schedule check ---
const invalidSchedule = computeEligibility({
  ...base,
  draft: {
    ...validDraft,
    scheduleForm: { ...validDraft.scheduleForm, schedule_type: "later", start_date: "", start_time: "" },
  },
});
assert.equal(invalidSchedule.checks[1].status, "fail");
assert.equal(invalidSchedule.canPublish, false);

// --- content gate: empty selection fails, unresolved asset id is "unknown" (not silently passed) ---
const noContent = computeEligibility({ ...base, draft: { ...validDraft, assetItems: [] } });
assert.equal(noContent.checks[0].status, "fail");
assert.equal(noContent.canPublish, false);

const unresolvedAsset = computeEligibility({ ...base, assets: [] }); // asset-1 not found in list
assert.equal(unresolvedAsset.checks[0].status, "unknown");
assert.equal(unresolvedAsset.canPublish, false);

const unapprovedAsset = computeEligibility({
  ...base,
  assets: [{ id: "asset-1", approval_status: "pending" }],
});
assert.equal(unapprovedAsset.checks[0].status, "fail");
assert.equal(unapprovedAsset.canPublish, false);

// --- composition content gate: without this branch the assets fallthrough marks a
// composition draft ineligible even though its content lives on the Composition (ADR 0049 §5) ---
const compositionNoPick = computeEligibility({
  ...base,
  draft: {
    ...validDraft,
    basicInfo: { ...validDraft.basicInfo, publicationType: "composition" },
    assetItems: [],
    compositionId: null,
  },
});
assert.equal(compositionNoPick.checks[0].status, "fail");
assert.equal(compositionNoPick.canPublish, false);

const compositionPicked = computeEligibility({
  ...base,
  draft: {
    ...validDraft,
    basicInfo: { ...validDraft.basicInfo, publicationType: "composition" },
    assetItems: [],
    compositionId: "composition-1",
  },
});
assert.equal(compositionPicked.checks[0].status, "pass");
assert.equal(compositionPicked.canPublish, true);

// --- channels gate: index 2 ---
const noChannels = computeEligibility({ ...base, draft: { ...validDraft, channelIds: [] } });
assert.equal(noChannels.checks[2].status, "fail");
assert.equal(noChannels.canPublish, false);

// --- policy row is deliberately neutral in Phase 1 (no Approval Workflow) ---
assert.equal(computeEligibility(base).checks[3].status, "unknown");

// --- loadingRefs blocks Publish even when every check already passes ---
assert.equal(computeEligibility({ ...base, loadingRefs: true }).canPublish, false);

console.log("publish-eligibility.check.mts — all assertions passed");
