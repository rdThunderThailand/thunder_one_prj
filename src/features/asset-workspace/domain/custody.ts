import { isTransferBlockedBy, type AssetCondition } from "./asset-condition.ts";
import type { AssetStatus } from "./asset-status.ts";

/** Spec v1.1.5 §4.3 — custody goes to a person or an organizational unit, never a location. */
export interface CustodyTarget {
  type: "person" | "org_unit";
  id: string;
  label: string;
}

export interface CustodyState {
  status: AssetStatus;
  condition: AssetCondition;
  custody: CustodyTarget | null;
}

const NON_ASSIGNABLE: readonly AssetStatus[] = ["In Maintenance", "Retired", "Disposed"];

export type CustodyBlock = "has_custody" | "not_assignable" | "no_custody" | "not_assigned" | "condition_blocks_transfer";

/** Assign needs no active custody; an assigned asset goes through Transfer instead. */
export function assignBlock(asset: CustodyState): CustodyBlock | null {
  if (asset.custody) return "has_custody";
  if (NON_ASSIGNABLE.includes(asset.status)) return "not_assignable";
  return null;
}

export function returnBlock(asset: CustodyState): CustodyBlock | null {
  if (!asset.custody) return "no_custody";
  if (asset.status !== "Assigned") return "not_assigned";
  return null;
}

export function transferBlock(asset: CustodyState): CustodyBlock | null {
  if (!asset.custody) return "no_custody";
  if (asset.status !== "Assigned") return "not_assigned";
  if (isTransferBlockedBy(asset.condition)) return "condition_blocks_transfer";
  return null;
}

/** Good/Fair go back to Available; Damaged/Unusable go to In Maintenance for inspection. */
export function statusAfterReturn(condition: AssetCondition): AssetStatus {
  return isTransferBlockedBy(condition) ? "In Maintenance" : "Available";
}
