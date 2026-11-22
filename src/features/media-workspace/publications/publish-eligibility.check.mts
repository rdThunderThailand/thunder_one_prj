/**
 * Runnable check for publish eligibility:
 *
 *     node src/features/media-workspace/publications/publish-eligibility.check.mts
 *
 * ADR 0068: a schedule overlap warns, it never refuses. Publish is gated only on
 * content, targets and schedule — conflicts are advisory, so they can
 * be "fail" or "unknown" while canPublish stays true. Covers the conflict
 * buckets summarizePriorityConflicts must produce for the warning copy.
 */
import assert from "node:assert/strict";
import {
  computeEligibility,
  programGateInputFromDraft,
  strictWireSchedule,
  summarizePriorityConflicts,
  type ProgramGateInput,
} from "./publish-eligibility.ts";
import { applyPreset, defaultScheduleDraft, draftToSchedule } from "./schedule-preset.ts";
import { validateStep } from "./step-validation.ts";
import type { DraftFields } from "./store/usePublicationDraftStore.ts";
import type { MediaAsset, ScheduleConflict } from "./types/index.ts";
import type { ChannelListItem } from "../channels/types/index.ts";

const validDraft: DraftFields = {
  publicationId: null,
  idempotencyKey: "idem-key-1",
  step: 4,
  furthestStep: 4,
  basicInfo: {
    publicationType: "image",
    name: "Summer promo",
    description: "",
    priorityId: "normal",
    tags: [],
  },
  assetItems: [{ media_asset_id: "asset-1", duration_seconds: 10 }],
  playlistId: null,
  compositionId: null,
  channelIds: ["screen-1"],
  groupIds: [],
  groupNamesById: {},
  schedule: defaultScheduleDraft(),
};

const channels: ChannelListItem[] = [
  {
    id: "screen-1",
    name: "Screen 1",
    description: null,
    lifecycle: "active",
    status: "active",
    category: "dooh",
    channel_type: null,
    location: null,
    player: null,
    health: null,
    output_kind: "screen",
    display_config: null,
    groups: [],
    expected_orientation: null,
    expected_resolution: null,
    default_playlist: null,
    revision: 1,
    updated_at: "2026-08-21T00:00:00Z",
  },
];

const approvedAsset: MediaAsset = { id: "asset-1", approval_status: "approved" };

const base = {
  draft: validDraft,
  assets: [approvedAsset],
  conflicts: [] as ScheduleConflict[],
  conflictsError: null as string | null,
  loadingRefs: false,
  checkingConflicts: false,
};

// The wizard path: the draft adapts to the wire shape, basic info comes from the step validator.
const fromDraft = (params: {
  draft: DraftFields;
  assets: MediaAsset[];
  conflicts: ScheduleConflict[];
  conflictsError: string | null;
  loadingRefs: boolean;
  checkingConflicts: boolean;
}) => {
  const { draft, ...rest } = params;
  return computeEligibility({
    program: programGateInputFromDraft(draft, channels),
    basicInfoOk: validateStep(2, draft).valid,
    ...rest,
  });
};

const statusOf = (result: ReturnType<typeof computeEligibility>, id: (typeof result.checks)[number]["id"]) =>
  result.checks.find((check) => check.id === id)?.status;

// Everything passing is the only combination that should allow Publish.
assert.equal(fromDraft(base).canPublish, true);

// --- conflict-service-failure: advisory only (ADR 0068) — flags "unknown" but never blocks ---
const conflictFailure = fromDraft({ ...base, conflictsError: "Network Error" });
assert.equal(statusOf(conflictFailure, "conflicts"), "unknown");
assert.equal(conflictFailure.canPublish, true);

// Still in flight is also advisory — Publish no longer waits on a conflict result.
const stillChecking = fromDraft({ ...base, checkingConflicts: true });
assert.equal(statusOf(stillChecking, "conflicts"), "unknown");
assert.equal(stillChecking.canPublish, true);

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
  blocks: false,
};

// Same-tier publications append to the playback loop — overlap is advisory, Publish allowed.
const withSamePriority = fromDraft({ ...base, conflicts: [samePriorityConflict] });
assert.equal(statusOf(withSamePriority, "conflicts"), "pass");
assert.equal(withSamePriority.canPublish, true); // but it never blocks

// A higher-priority draft suppresses the lower tier and is allowed to publish.
const lowerPriorityConflict: ScheduleConflict = {
  ...samePriorityConflict,
  publication_id: "pub-low",
  name: "Low promo",
  priority: "low",
  would_suppress: true,
};
const withLowerPriority = fromDraft({ ...base, conflicts: [lowerPriorityConflict] });
assert.equal(statusOf(withLowerPriority, "conflicts"), "pass");
assert.equal(withLowerPriority.canPublish, true);

// ADR 0068: a draft that would be suppressed by a higher tier still publishes — it just
// will not air during those windows (the higher-priority override behaviour is unchanged).
const higherPriorityConflict: ScheduleConflict = {
  ...samePriorityConflict,
  publication_id: "pub-high",
  name: "High promo",
  priority: "high",
  would_be_suppressed: true,
};
const withHigherPriority = fromDraft({ ...base, conflicts: [higherPriorityConflict] });
assert.equal(statusOf(withHigherPriority, "conflicts"), "fail");
assert.equal(withHigherPriority.canPublish, true);

// Mixed priorities: still advisory, still publishable.
const withMixedPriorities = fromDraft({
  ...base,
  conflicts: [lowerPriorityConflict, samePriorityConflict, higherPriorityConflict],
});
assert.equal(statusOf(withMixedPriorities, "conflicts"), "fail");
assert.equal(withMixedPriorities.canPublish, true);
assert.deepEqual(
  summarizePriorityConflicts([lowerPriorityConflict, samePriorityConflict, higherPriorityConflict]),
  {
    higherPriorityCount: 1,
    lowerPriorityCount: 1,
    equalPriorityCount: 1,
    exclusiveOverlapCount: 0,
  }
);

// --- ADR 0068: equal-priority overlap where either side is a Composition still publishes,
// but only the most recently activated publication airs for the overlap ---
const exclusiveOverlap: ScheduleConflict = {
  ...samePriorityConflict,
  publication_id: "pub-layout",
  name: "Menu board",
  blocks: true,
};

const withExclusiveOverlap = fromDraft({ ...base, conflicts: [exclusiveOverlap] });
assert.equal(statusOf(withExclusiveOverlap, "conflicts"), "pass");
assert.equal(withExclusiveOverlap.canPublish, true);

// `blocks` is counted on its own axis and does not stop the equal-priority tally.
assert.deepEqual(summarizePriorityConflicts([samePriorityConflict, exclusiveOverlap]), {
  higherPriorityCount: 0,
  lowerPriorityCount: 0,
  equalPriorityCount: 2,
  exclusiveOverlapCount: 1,
});

// --- invalid schedule ---
const invalidSchedule = fromDraft({
  ...base,
  draft: {
    ...validDraft,
    schedule: { ...validDraft.schedule, startDate: "" },
  },
});
assert.equal(statusOf(invalidSchedule, "schedule"), "fail");
assert.equal(invalidSchedule.canPublish, false);

// --- content gate: empty selection fails, unresolved asset id is "unknown" (not silently passed) ---
const noContent = fromDraft({ ...base, draft: { ...validDraft, assetItems: [] } });
assert.equal(statusOf(noContent, "content"), "fail");
assert.equal(noContent.canPublish, false);

const unresolvedAsset = fromDraft({ ...base, assets: [] }); // asset-1 not found in list
assert.equal(statusOf(unresolvedAsset, "content"), "unknown");
assert.equal(unresolvedAsset.canPublish, false);

// Approval is no longer a content gate (ADR 0073) — a resolvable asset passes regardless of status.
const unapprovedAsset = fromDraft({
  ...base,
  assets: [{ id: "asset-1", approval_status: "pending" }],
});
assert.equal(statusOf(unapprovedAsset, "content"), "pass");
assert.equal(unapprovedAsset.canPublish, true);

// --- composition content gate: without this branch the assets fallthrough marks a
// composition draft ineligible even though its content lives on the Composition (ADR 0049 §5) ---
const compositionNoPick = fromDraft({
  ...base,
  draft: {
    ...validDraft,
    basicInfo: { ...validDraft.basicInfo, publicationType: "composition" },
    assetItems: [],
    compositionId: null,
  },
});
assert.equal(statusOf(compositionNoPick, "content"), "fail");
assert.equal(compositionNoPick.canPublish, false);

const compositionPicked = fromDraft({
  ...base,
  draft: {
    ...validDraft,
    basicInfo: { ...validDraft.basicInfo, publicationType: "composition" },
    assetItems: [],
    compositionId: "composition-1",
  },
});
assert.equal(statusOf(compositionPicked, "content"), "pass");
assert.equal(compositionPicked.canPublish, true);

// --- targets gate ---
const noChannels = fromDraft({ ...base, draft: { ...validDraft, channelIds: [] } });
assert.equal(statusOf(noChannels, "targets"), "fail");
assert.equal(noChannels.canPublish, false);

// A Group-only target is a complete selection too (ADR 0074 §6) — no direct Channel needed.
const groupOnly = fromDraft({
  ...base,
  draft: { ...validDraft, channelIds: [], groupIds: ["g-1"] },
});
assert.equal(statusOf(groupOnly, "targets"), "pass");
assert.equal(groupOnly.canPublish, true);

// --- policy row is deliberately neutral in Phase 1 (no Approval Workflow) ---
assert.equal(statusOf(fromDraft(base), "policy"), "unknown");

// --- loadingRefs blocks Publish even when every check already passes ---
assert.equal(fromDraft({ ...base, loadingRefs: true }).canPublish, false);

// --- wire shape (the Edit page): the gate reads ProgramGateInput directly ---
const wire: ProgramGateInput = {
  name: "Summer promo",
  content: { type: "image", playlistId: null, compositionId: null, items: [{ media_asset_id: "asset-1" }] },
  targets: [{ target_type: "channel", channel_id: "screen-1" }],
  schedule: draftToSchedule(defaultScheduleDraft()),
};
const gate = (over: Partial<Parameters<typeof computeEligibility>[0]> = {}) =>
  computeEligibility({ program: wire, basicInfoOk: true, assets: null, loadingRefs: false, ...over });

const TARGETS_BLOCK = "Choose at least one Channel or Channel Group before publishing.";
const SCHEDULE_BLOCK = "Set a schedule that starts today or later before publishing.";

assert.equal(gate().canPublish, true);
assert.equal(gate().blockReason, null);

const noTargets = gate({ program: { ...wire, targets: [] } });
assert.equal(noTargets.canPublish, false);
assert.equal(statusOf(noTargets, "targets"), "fail");
assert.equal(noTargets.blockReason, TARGETS_BLOCK);

const wireComposition = (compositionId: string | null): ProgramGateInput => ({
  ...wire,
  content: { type: "composition", playlistId: null, compositionId, items: [] },
});
assert.equal(statusOf(gate({ program: wireComposition("c1") }), "content"), "pass");
assert.equal(statusOf(gate({ program: wireComposition(null) }), "content"), "fail");

const wireHtml: ProgramGateInput = { ...wire, content: { ...wire.content, type: "html" } };
assert.equal(statusOf(gate({ program: wireHtml }), "content"), "pass");

// assets: null skips the library lookup; a loaded library that lacks the item reads "unknown".
assert.equal(statusOf(gate({ assets: null }), "content"), "pass");
const unresolvedWire = gate({ assets: [] });
assert.equal(statusOf(unresolvedWire, "content"), "unknown");
assert.equal(unresolvedWire.blockReason, null);

const noSchedule = gate({ program: { ...wire, schedule: null } });
assert.equal(statusOf(noSchedule, "schedule"), "fail");
assert.equal(noSchedule.blockReason, SCHEDULE_BLOCK);

// Order: basic info first, even when targets are also empty.
assert.equal(
  gate({ basicInfoOk: false, program: { ...wire, targets: [] } }).blockReason,
  "Give this Program a name before publishing.",
);

// No conflict inputs: advisory "unknown", never a block.
assert.equal(statusOf(gate(), "conflicts"), "unknown");

// loadingRefs blocks without naming a reason.
const loadingWire = gate({ loadingRefs: true });
assert.equal(loadingWire.canPublish, false);
assert.equal(loadingWire.blockReason, null);

// --- adapter ---
const invalidDraftSchedule = programGateInputFromDraft(
  { ...validDraft, schedule: { ...validDraft.schedule, startDate: "" } },
  channels,
);
assert.equal(invalidDraftSchedule.schedule, null);

const mixedTargets = programGateInputFromDraft({ ...validDraft, channelIds: ["a"], groupIds: ["g"] }, channels).targets;
assert.deepEqual(mixedTargets.map((t) => t.target_type), ["channel", "group"]);

// --- strictWireSchedule: a Core default (starts at creation, in the past) is refused;
// every mode the UI saves survives the round trip when it starts today or later ---
const TODAY = "2026-11-22";
const NOW = "10:00";
const future = defaultScheduleDraft("2026-11-23");
assert.equal(strictWireSchedule(null, TODAY, NOW), null);
assert.equal(strictWireSchedule(draftToSchedule(defaultScheduleDraft("2026-11-10")), TODAY, NOW), null);

const futureSchedules = {
  continuousNoEnd: draftToSchedule(applyPreset(future, "continuous", "2026-11-23")),
  continuousWithEnd: draftToSchedule({ ...applyPreset(future, "continuous", "2026-11-23"), endDate: "2026-11-30", endTime: "12:00" }),
  weekly: draftToSchedule(applyPreset(future, "weekdays", "2026-11-23")),
  monthly: draftToSchedule(applyPreset(future, "monthly", "2026-11-23")),
  dates: draftToSchedule({ ...applyPreset(future, "custom-days", "2026-11-23"), dates: ["2026-11-23", "2026-11-25"] }),
};
for (const [mode, schedule] of Object.entries(futureSchedules)) {
  assert.deepEqual(strictWireSchedule(schedule, TODAY, NOW), schedule, mode);
}

console.log("publish-eligibility.check.mts — all assertions passed");
