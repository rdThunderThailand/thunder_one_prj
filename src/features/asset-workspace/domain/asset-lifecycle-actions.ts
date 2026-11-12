import type { AssetDetail } from "../services/asset-profile-contract.ts";
import { CONDITIONS_BY_STATUS, type AssetCondition } from "./asset-condition.ts";

export const CHANGE_STATUS_STEPS = ["Details", "Review", "Confirm"];
export const CHANGE_STATUS_TITLE = "Change Status / Condition";
export const CHANGE_STATUS_SUBTITLE = "Update the asset's status and/or condition.";
export const LIFECYCLE_TEXT_MAX = 500;

const targets = {
  Available: ["Available", "In Maintenance"],
  Assigned: ["Assigned", "In Maintenance"],
  "In Maintenance": ["In Maintenance", "Available"],
  Retired: ["Retired"],
} as const;
export type LifecycleTarget = keyof typeof targets;
export type ChangeStatusDraft = { status: string; condition: string; reason: string; notes: string };

export function allowedTargets(asset: Pick<AssetDetail, "lifecycleStatus">): readonly LifecycleTarget[] {
  return Object.hasOwn(targets, asset.lifecycleStatus) ? targets[asset.lifecycleStatus as LifecycleTarget] : [];
}

export function allowedConditions(status: string): readonly AssetCondition[] {
  return Object.hasOwn(targets, status) ? CONDITIONS_BY_STATUS[status as LifecycleTarget] : [];
}

export function endsCustody(asset: Pick<AssetDetail, "lifecycleStatus" | "custody">, status: string) {
  return asset.lifecycleStatus === "In Maintenance" && status === "Available" && asset.custody !== null;
}

export function changeStatusErrors(asset: AssetDetail, draft: ChangeStatusDraft) {
  const validStatus = allowedTargets(asset).some((status) => status === draft.status);
  return {
    status: validStatus ? null : "Choose an allowed status.",
    condition: allowedConditions(draft.status).some((condition) => condition === draft.condition)
      ? null : `Choose a condition allowed for ${draft.status}.`,
    change: asset.lifecycleStatus === draft.status && asset.condition === draft.condition
      ? "Nothing to change: pick a different status or condition." : null,
    reason: !draft.reason.trim() ? "Enter a reason."
      : draft.reason.trim().length > LIFECYCLE_TEXT_MAX ? "Enter 500 characters or fewer." : null,
    notes: draft.notes.length > LIFECYCLE_TEXT_MAX ? "Enter 500 characters or fewer." : null,
  };
}

export function changeStatusBody(updatedAt: string, draft: ChangeStatusDraft, fileIds: string[]) {
  const notes = draft.notes.trim();
  return {
    expectedUpdatedAt: updatedAt,
    status: draft.status,
    condition: draft.condition,
    reason: draft.reason.trim(),
    ...(notes && { notes }),
    ...(fileIds.length && { evidenceFileIds: fileIds }),
  };
}

export function lifecycleNeedsReload(code?: string, uncertain = false) {
  return uncertain || code === "STALE" || code === "INVALID_STATE" || code === "NOT_FOUND";
}
