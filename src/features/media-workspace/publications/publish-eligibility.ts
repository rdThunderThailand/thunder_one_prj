import type { DraftFields } from "./store/usePublicationDraftStore.ts";
import type { MediaAsset, PublicationSchedule, ScheduleConflict } from "./types/index.ts";
import type { ProgramContent, ProgramEditState } from "./program-edit.ts";
import type { ChannelListItem } from "../channels/types/index.ts";
import { draftToSchedule, isDraftValid, scheduleToDraft, validateDraft } from "./schedule-preset.ts";
import { DEFAULT_TIMEZONE } from "./schedule.ts";
import { targetsFromSelection } from "./draft-mapping.ts";

export type EligibilityStatus = "pass" | "fail" | "unknown";

export type EligibilityCheckId = "content" | "targets" | "schedule" | "policy" | "conflicts";

export interface EligibilityCheck {
  id: EligibilityCheckId;
  status: EligibilityStatus;
}

export interface EligibilityResult {
  checks: EligibilityCheck[];
  canPublish: boolean;
  /** The first failing gating check, worded for a tooltip. Null when nothing definite blocks. */
  blockReason: string | null;
}

/** The wire shape of a Program, so the wizard and the Edit page share one gate (ADR 0002). */
export type ProgramGateInput = Pick<ProgramEditState, "name" | "targets" | "schedule"> & {
  content: Pick<ProgramContent, "type" | "playlistId" | "compositionId"> & { items: { media_asset_id: string }[] };
};

export function programGateInputFromDraft(draft: DraftFields, channels: ChannelListItem[]): ProgramGateInput {
  return {
    name: draft.basicInfo.name,
    content: {
      type: draft.basicInfo.publicationType,
      playlistId: draft.playlistId,
      compositionId: draft.compositionId,
      items: draft.assetItems,
    },
    targets: targetsFromSelection(draft.channelIds, draft.groupIds, draft.groupNamesById, channels),
    schedule: isDraftValid(draft.schedule) ? draftToSchedule(draft.schedule) : null,
  };
}

/** The saved schedule if it passes the wizard's rules on `today`/`nowTime` in its own timezone, else null. */
export function strictWireSchedule(
  schedule: PublicationSchedule | null,
  today: string,
  nowTime: string,
): PublicationSchedule | null {
  if (!schedule) {
    return null;
  }
  const timezone = schedule.timezone || DEFAULT_TIMEZONE;
  const errors = validateDraft(scheduleToDraft(schedule, today, timezone), today, nowTime);
  return Object.keys(errors).length === 0 ? schedule : null;
}

export interface PriorityConflictSummary {
  higherPriorityCount: number;
  lowerPriorityCount: number;
  equalPriorityCount: number;
  /** Equal-priority overlaps where either side is a Composition — one screen cannot show both,
   *  so only the most recently activated Publication airs for the overlap (ADR 0068). */
  exclusiveOverlapCount: number;
}

export function summarizePriorityConflicts(conflicts: ScheduleConflict[]): PriorityConflictSummary {
  let higherPriorityCount = 0;
  let lowerPriorityCount = 0;
  let equalPriorityCount = 0;
  let exclusiveOverlapCount = 0;

  for (const conflict of conflicts) {
    if (conflict.blocks) {
      exclusiveOverlapCount += 1;
    }
    if (conflict.would_be_suppressed) {
      higherPriorityCount += 1;
    } else if (conflict.would_suppress) {
      lowerPriorityCount += 1;
    } else {
      equalPriorityCount += 1;
    }
  }

  return {
    higherPriorityCount,
    lowerPriorityCount,
    equalPriorityCount,
    exclusiveOverlapCount,
  };
}

export function isAllGatingPassed(checks: EligibilityCheck[]): boolean {
  return ["content", "targets", "schedule"].every(
    (id) => checks.find((check) => check.id === id)?.status === "pass",
  );
}

export function computeEligibility(params: {
  program: ProgramGateInput;
  basicInfoOk: boolean;
  /** Null skips the library lookup: an item then counts as found (the Edit page holds no library). */
  assets: MediaAsset[] | null;
  loadingRefs: boolean;
  conflicts?: ScheduleConflict[];
  conflictsError?: string | null;
  checkingConflicts?: boolean;
}): EligibilityResult {
  const { program, basicInfoOk, assets, loadingRefs, conflicts, conflictsError, checkingConflicts } = params;
  const { content } = program;

  let contentCheckStatus: EligibilityStatus;
  if (content.type === "playlist") {
    contentCheckStatus = content.playlistId ? "pass" : "fail";
  } else if (content.type === "composition") {
    // Without this branch the else below reads a composition's empty items as
    // "no content" and marks it ineligible — its content lives on the Composition, not here
    // (ADR 0049 §5).
    contentCheckStatus = content.compositionId ? "pass" : "fail";
  } else if (content.items.length === 0) {
    contentCheckStatus = "fail";
  } else {
    // Every held item must resolve against the loaded library; an unresolved one reads as
    // "unknown" until the library load finishes. Approval is no longer a gate (ADR 0073).
    const allFound =
      assets === null || content.items.every((item) => assets.some((a) => a.id === item.media_asset_id));
    contentCheckStatus = allFound ? "pass" : "unknown";
  }

  // The caller decides how strict the schedule is: the gate only asks whether one was handed in.
  const scheduleCheckStatus: EligibilityStatus = program.schedule !== null ? "pass" : "fail";
  // A Channel picked directly and one reached through a Channel Group are independent
  // intents (ADR 0074 §6) — either alone is a complete target selection.
  const channelsCheckStatus: EligibilityStatus = program.targets.length > 0 ? "pass" : "fail";
  const policyCheckStatus: EligibilityStatus = "unknown";
  // ADR 0068: an overlap warns, it never refuses. The check still flags that conflicts exist so
  // the checklist shows it, but it is read as advice rather than a gate. No input reads as unknown.
  const conflictsCheckStatus: EligibilityStatus =
    checkingConflicts || conflictsError || !conflicts
      ? "unknown"
      : conflicts.some((conflict) => conflict.would_be_suppressed)
        ? "fail"
        : "pass";

  const checks: EligibilityCheck[] = [
    { id: "content", status: contentCheckStatus },
    { id: "targets", status: channelsCheckStatus },
    { id: "schedule", status: scheduleCheckStatus },
    { id: "policy", status: policyCheckStatus },
    { id: "conflicts", status: conflictsCheckStatus },
  ];

  // Content, schedule and channels only — conflicts are advisory (ADR 0068), so the button no
  // longer waits on a result that cannot block anything.
  const canPublish = basicInfoOk && !loadingRefs && isAllGatingPassed(checks);

  // First definite failure, in the order an operator fixes them. "unknown" never names a reason.
  let blockReason: string | null = null;
  if (!basicInfoOk) {
    blockReason = "Give this Program a name before publishing.";
  } else if (contentCheckStatus === "fail") {
    blockReason = "Choose content for this Program before publishing.";
  } else if (channelsCheckStatus === "fail") {
    blockReason = "Choose at least one Channel or Channel Group before publishing.";
  } else if (scheduleCheckStatus === "fail") {
    blockReason = "Set a schedule that starts today or later before publishing.";
  }

  return {
    checks,
    canPublish,
    blockReason,
  };
}
