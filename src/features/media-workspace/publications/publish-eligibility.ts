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
  hasBlockingConflict: boolean;
}

export function summarizePriorityConflicts(conflicts: ScheduleConflict[]): PriorityConflictSummary {
  let higherPriorityCount = 0;
  let lowerPriorityCount = 0;
  let equalPriorityCount = 0;

  for (const conflict of conflicts) {
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
    hasBlockingConflict: higherPriorityCount > 0,
  };
}

export function isAllGatingPassed(checks: EligibilityCheck[]): boolean {
  return [0, 1, 2, 4].every((idx) => checks[idx]?.status === "pass");
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
  const priorityConflicts = summarizePriorityConflicts(conflicts);
  const conflictsCheckStatus: EligibilityStatus =
    checkingConflicts || conflictsError
      ? "unknown"
      : priorityConflicts.hasBlockingConflict
      ? "fail"
      : "pass";

  const checks: EligibilityCheck[] = [
    { status: contentCheckStatus },
    { status: scheduleCheckStatus },
    { status: channelsCheckStatus },
    { status: policyCheckStatus },
    { status: conflictsCheckStatus },
  ];

  const basicInfoOk = validateStep(1, draft).valid;
  const gateChecks = [checks[0], checks[1], checks[2], checks[4]];
  const canPublish = basicInfoOk && !loadingRefs && gateChecks.every((c) => c.status === "pass");

  return {
    checks,
    canPublish,
  };
}
