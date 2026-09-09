import type { DraftFields } from "./store/usePublicationDraftStore";
import type { MediaAsset, ScheduleConflict } from "./types";
import { validateStep } from "./step-validation.ts";

export type EligibilityStatus = "pass" | "fail" | "unknown";

export interface EligibilityCheck {
  status: EligibilityStatus;
}

export interface EligibilityResult {
  checks: EligibilityCheck[];
  canPublish: boolean;
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
  return [0, 1, 2].every((idx) => checks[idx]?.status === "pass");
}

export function computeEligibility(params: {
  draft: DraftFields;
  assets: MediaAsset[];
  conflicts: ScheduleConflict[];
  conflictsError: string | null;
  loadingRefs: boolean;
  checkingConflicts: boolean;
}): EligibilityResult {
  const { draft, assets, conflicts, conflictsError, loadingRefs, checkingConflicts } = params;

  let contentCheckStatus: EligibilityStatus;
  if (draft.basicInfo.publicationType === "playlist") {
    contentCheckStatus = draft.playlistId ? "pass" : "fail";
  } else if (draft.basicInfo.publicationType === "composition") {
    // Without this branch the else below reads a composition draft's empty assetItems as
    // "no content" and marks it ineligible — its content lives on the Composition, not here
    // (ADR 0049 §5).
    contentCheckStatus = draft.compositionId ? "pass" : "fail";
  } else if (draft.assetItems.length === 0) {
    contentCheckStatus = "fail";
  } else {
    let allFound = true;
    let allApproved = true;

    for (const item of draft.assetItems) {
      const found = assets.find((a) => a.id === item.media_asset_id);
      if (!found) {
        allFound = false;
        break;
      }
      if (found.approval_status !== "approved") {
        allApproved = false;
      }
    }

    if (!allFound) {
      contentCheckStatus = "unknown";
    } else if (allApproved) {
      contentCheckStatus = "pass";
    } else {
      contentCheckStatus = "fail";
    }
  }

  const scheduleCheckStatus: EligibilityStatus = validateStep(4, draft).valid ? "pass" : "fail";
  const channelsCheckStatus: EligibilityStatus = validateStep(3, draft).valid ? "pass" : "fail";
  const policyCheckStatus: EligibilityStatus = "unknown";
  // ADR 0068: an overlap warns, it never refuses. The check still flags that conflicts exist so
  // the checklist shows it, but it is read as advice rather than a gate.
  const conflictsCheckStatus: EligibilityStatus =
    checkingConflicts || conflictsError ? "unknown" : conflicts.length > 0 ? "fail" : "pass";

  const checks: EligibilityCheck[] = [
    { status: contentCheckStatus },
    { status: scheduleCheckStatus },
    { status: channelsCheckStatus },
    { status: policyCheckStatus },
    { status: conflictsCheckStatus },
  ];

  const basicInfoOk = validateStep(1, draft).valid;
  // Content, schedule and channels only — conflicts are advisory (ADR 0068), so the button no
  // longer waits on a result that cannot block anything.
  const gateChecks = [checks[0], checks[1], checks[2]];
  const canPublish = basicInfoOk && !loadingRefs && gateChecks.every((c) => c.status === "pass");

  return {
    checks,
    canPublish,
  };
}
