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
  const conflictsCheckStatus: EligibilityStatus =
    checkingConflicts || conflictsError
      ? "unknown"
      : conflicts.length === 0
      ? "pass"
      : "fail";

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
