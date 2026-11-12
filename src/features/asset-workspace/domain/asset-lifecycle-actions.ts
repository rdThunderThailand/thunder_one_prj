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

export const RETIRE_STEPS = ["Details", "Review", "Confirm"];
export const RETIRE_TITLE = "Retire Asset";
export const RETIRE_SUBTITLE = "Mark this asset as retired when it is no longer in active use.";
export type RetireDraft = { condition: string; reason: string; notes: string };

/** Q9 + decision A: Available, or In Maintenance without a holder. `blocked` keeps the form visible with Next off. */
export function retireEligibility(asset: Pick<AssetDetail, "lifecycleStatus" | "custody">) {
  if (asset.lifecycleStatus === "Retired") return { kind: "done", message: "This asset is already retired." } as const;
  if (asset.lifecycleStatus === "Disposed") return { kind: "done", message: "Disposed assets can't change." } as const;
  if (asset.lifecycleStatus === "Assigned") return { kind: "blocked", action: "return" } as const;
  if (asset.lifecycleStatus === "In Maintenance" && asset.custody) return { kind: "blocked", action: "change-status" } as const;
  if (asset.lifecycleStatus === "Available" || asset.lifecycleStatus === "In Maintenance") return { kind: "ok" } as const;
  return { kind: "done", message: "This asset can't be retired." } as const;
}

export function retireErrors(draft: RetireDraft) {
  return {
    condition: allowedConditions("Retired").some((condition) => condition === draft.condition)
      ? null : "Choose a condition at retirement.",
    reason: !draft.reason.trim() ? "Enter a reason."
      : draft.reason.trim().length > LIFECYCLE_TEXT_MAX ? "Enter 500 characters or fewer." : null,
    notes: draft.notes.length > LIFECYCLE_TEXT_MAX ? "Enter 500 characters or fewer." : null,
  };
}

export function retireBody(updatedAt: string, draft: RetireDraft, fileIds: string[]) {
  const notes = draft.notes.trim();
  return {
    expectedUpdatedAt: updatedAt,
    condition: draft.condition,
    reason: draft.reason.trim(),
    ...(notes && { notes }),
    ...(fileIds.length && { evidenceFileIds: fileIds }),
  };
}

export const DISPOSE_STEPS = ["Details", "Review", "Confirm"];
export const DISPOSE_TITLE = "Dispose Asset";
export const DISPOSE_SUBTITLE = "Permanently remove this asset from your organization.";
/** PO 05 §4.4 methods; values match Core `assets_disposal_method_check`. */
export const DISPOSAL_METHODS = [
  { value: "Sold", label: "Sold" },
  { value: "Donated", label: "Donated" },
  { value: "Scrapped-Destroyed", label: "Scrapped / Destroyed" },
  { value: "Returned to Vendor", label: "Returned to Vendor" },
  { value: "Other", label: "Other" },
] as const;
export type DisposeDraft = { method: string; reason: string; notes: string };

export function disposeBlock(asset: Pick<AssetDetail, "lifecycleStatus">) {
  if (asset.lifecycleStatus === "Retired") return null;
  return asset.lifecycleStatus === "Disposed" ? "This asset is already disposed." : "Only Retired assets can be disposed.";
}

export function disposeErrors(draft: DisposeDraft) {
  return {
    method: DISPOSAL_METHODS.some(({ value }) => value === draft.method) ? null : "Choose a disposal method.",
    reason: !draft.reason.trim() ? "Enter a reason."
      : draft.reason.trim().length > LIFECYCLE_TEXT_MAX ? "Enter 500 characters or fewer." : null,
    notes: draft.notes.length > LIFECYCLE_TEXT_MAX ? "Enter 500 characters or fewer." : null,
  };
}

export function disposeBody(updatedAt: string, draft: DisposeDraft, fileIds: string[]) {
  const notes = draft.notes.trim();
  return {
    expectedUpdatedAt: updatedAt,
    disposalMethod: draft.method,
    reason: draft.reason.trim(),
    ...(notes && { notes }),
    ...(fileIds.length && { evidenceFileIds: fileIds }),
  };
}

export type LifecycleMenuAction = "change-status" | "retire" | "dispose";

/** FE 01 More Actions availability (frame 24 table + decision A); `reason` is the muted tag on a disabled item. */
export function lifecycleMenu(asset: Pick<AssetDetail, "lifecycleStatus" | "custody">) {
  const status = asset.lifecycleStatus;
  const disposed = status === "Disposed" ? "Disposed assets can't change" : null;
  const retire = retireEligibility(asset);
  return [
    { action: "change-status", label: CHANGE_STATUS_TITLE, reason: disposed },
    {
      action: "retire",
      label: RETIRE_TITLE,
      reason: disposed ?? (retire.kind === "ok" ? null
        : retire.kind === "done" ? (status === "Retired" ? "Already retired" : "Not available")
          : retire.action === "return" ? "Return asset first" : "Change status to Available first"),
    },
    {
      action: "dispose",
      label: DISPOSE_TITLE,
      reason: status === "Retired" ? null : status === "Disposed" ? "Already disposed" : "Only available when Retired",
    },
  ] satisfies { action: LifecycleMenuAction; label: string; reason: string | null }[];
}
