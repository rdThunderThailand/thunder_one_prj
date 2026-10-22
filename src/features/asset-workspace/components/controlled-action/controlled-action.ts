import { actionsFor, type AssetActionKey } from "../../domain/asset-actions.ts";
import { isConditionAllowed, type AssetCondition } from "../../domain/asset-condition.ts";
import { findTransition, STATUS_TRANSITIONS, type AssetStatus } from "../../domain/asset-status.ts";
import {
  assignBlock,
  returnBlock,
  statusAfterReturn,
  transferBlock,
  type CustodyBlock,
  type CustodyState,
  type CustodyTarget,
} from "../../domain/custody.ts";

/**
 * Step logic for ControlledActionDialog (P1-08). Every rule comes from the domain tables;
 * nothing here may decide a move the domain does not allow. No React so the check script runs it.
 */
export type ControlledActionKey = Exclude<AssetActionKey, "print_label">;

export const ACTION_LABELS: Record<ControlledActionKey, string> = {
  assign: "Assign",
  return: "Return",
  transfer: "Transfer",
  move_location: "Move location",
  change_status_condition: "Change status or condition",
  retire: "Retire",
  dispose: "Dispose",
};

export interface ActionAsset extends CustodyState {
  label: string;
  location: string | null;
}

export interface ActionDraft {
  custody: CustodyTarget | null;
  location: string;
  status: AssetStatus;
  condition: AssetCondition;
  reason: string;
}

export type ActionField = "custody" | "location" | "status" | "condition" | "reason";

const FIELDS: Record<ControlledActionKey, readonly ActionField[]> = {
  assign: ["custody", "reason"],
  transfer: ["custody", "reason"],
  return: ["condition", "reason"],
  move_location: ["location", "reason"],
  change_status_condition: ["status", "condition", "reason"],
  retire: ["reason"],
  dispose: ["reason"],
};

export function fieldsFor(action: ControlledActionKey): readonly ActionField[] {
  return FIELDS[action];
}

export function initialDraft(asset: ActionAsset): ActionDraft {
  return { custody: null, location: "", status: asset.status, condition: asset.condition, reason: "" };
}

/** The current status (condition-only change) plus every move Change Status may make from it. */
export function statusOptions(asset: ActionAsset): AssetStatus[] {
  const moves = STATUS_TRANSITIONS.filter((row) => row.from === asset.status && row.via === "change_status_condition");
  return [asset.status, ...moves.map((row) => row.to)];
}

export function nextStatus(action: ControlledActionKey, asset: ActionAsset, draft: ActionDraft): AssetStatus {
  switch (action) {
    case "assign":
      return "Assigned";
    case "return":
      return statusAfterReturn(draft.condition);
    case "change_status_condition":
      return draft.status;
    case "retire":
      return "Retired";
    case "dispose":
      return "Disposed";
    default:
      return asset.status;
  }
}

/**
 * Change Status/Condition always carries a Reason, condition-only included (02 §3.2, AC-020).
 * Other actions need one only when the status moves and that transition says so (05 §4.13.3).
 */
export function isReasonRequired(action: ControlledActionKey, asset: ActionAsset, draft: ActionDraft): boolean {
  if (action === "change_status_condition") return true;
  const to = nextStatus(action, asset, draft);
  if (to === asset.status) return false;
  return findTransition(asset.status, to)?.requiresReason ?? false;
}

const BLOCK_MESSAGES: Record<CustodyBlock, string> = {
  has_custody: "This asset already has a custodian. Use Transfer instead.",
  not_assignable: "This asset cannot be assigned in its current status.",
  no_custody: "This asset has no custodian.",
  not_assigned: "Only assigned assets can do this.",
  condition_blocks_transfer: "Damaged or unusable assets cannot be transferred. Return it instead.",
};

/** Why the action cannot start at all for this asset, or null. */
export function actionBlock(action: ControlledActionKey, asset: ActionAsset): string | null {
  if (!actionsFor(asset.status).includes(action)) return `${ACTION_LABELS[action]} is not available for ${asset.status} assets.`;
  const block =
    action === "assign" ? assignBlock(asset) : action === "return" ? returnBlock(asset) : action === "transfer" ? transferBlock(asset) : null;
  return block ? BLOCK_MESSAGES[block] : null;
}

/** Problems that keep Next/Confirm disabled, in field order; empty means valid. */
export function validateDraft(action: ControlledActionKey, asset: ActionAsset, draft: ActionDraft): string[] {
  const block = actionBlock(action, asset);
  if (block) return [block];

  const errors: string[] = [];
  const fields = fieldsFor(action);
  const to = nextStatus(action, asset, draft);

  if (fields.includes("custody")) {
    const label = draft.custody?.label.trim() ?? "";
    if (!label) errors.push("Enter who receives the asset.");
    else if (draft.custody?.type === asset.custody?.type && label === asset.custody?.label) errors.push("Choose a different custodian.");
  }
  if (fields.includes("location")) {
    const location = draft.location.trim();
    if (!location) errors.push("Enter the new location.");
    else if (location === asset.location) errors.push("Choose a different location.");
  }
  if (action === "change_status_condition") {
    if (!statusOptions(asset).includes(draft.status)) errors.push(`${asset.status} cannot move to ${draft.status}.`);
    else if (draft.status === asset.status && draft.condition === asset.condition) errors.push("Change the status or the condition.");
    else if (findTransition(asset.status, draft.status)?.requiresNoCustody && asset.custody) {
      errors.push("Return the asset before making it Available.");
    }
  }
  if (fields.includes("condition") && !isConditionAllowed(to, draft.condition)) {
    errors.push(`${draft.condition} is not allowed for ${to} assets.`);
  }
  if (isReasonRequired(action, asset, draft) && !draft.reason.trim()) errors.push("Enter a reason.");
  return errors;
}

export interface ActionSubmission {
  action: ControlledActionKey;
  from: AssetStatus;
  to: AssetStatus;
  condition: AssetCondition;
  custody: CustodyTarget | null;
  location: string | null;
  reason: string | null;
}

export function toSubmission(action: ControlledActionKey, asset: ActionAsset, draft: ActionDraft): ActionSubmission {
  const fields = fieldsFor(action);
  const custody = fields.includes("custody") && draft.custody ? { ...draft.custody, label: draft.custody.label.trim() } : null;
  return {
    action,
    from: asset.status,
    to: nextStatus(action, asset, draft),
    condition: fields.includes("condition") ? draft.condition : asset.condition,
    custody,
    location: fields.includes("location") ? draft.location.trim() : null,
    reason: draft.reason.trim() || null,
  };
}
