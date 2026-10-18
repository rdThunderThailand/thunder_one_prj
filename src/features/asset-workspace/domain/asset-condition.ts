import type { AssetStatus } from "./asset-status.ts";

/** Spec v1.1.5 §4.4 — condition values and which ones each status accepts. */
export const ASSET_CONDITIONS = ["Good", "Fair", "Damaged", "Unusable"] as const;
export type AssetCondition = (typeof ASSET_CONDITIONS)[number];

export const CONDITIONS_BY_STATUS: Record<AssetStatus, readonly AssetCondition[]> = {
  Available: ["Good", "Fair"],
  Assigned: ["Good", "Fair", "Damaged"],
  "In Maintenance": ["Fair", "Damaged", "Unusable"],
  Retired: ["Good", "Fair", "Damaged", "Unusable"],
  // Disposed keeps whatever condition the asset had; nothing edits it.
  Disposed: ["Good", "Fair", "Damaged", "Unusable"],
};

export function isConditionAllowed(status: AssetStatus, condition: AssetCondition): boolean {
  return CONDITIONS_BY_STATUS[status].includes(condition);
}

/** Damaged and Unusable assets cannot be transferred (§4.3). */
export function isTransferBlockedBy(condition: AssetCondition): boolean {
  return condition === "Damaged" || condition === "Unusable";
}
