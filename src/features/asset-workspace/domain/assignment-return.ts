import { ASSET_CONDITIONS, type AssetCondition } from "./asset-condition.ts";
import { returnBlock, statusAfterReturn } from "./custody.ts";
import type { AssetStatus } from "./asset-status.ts";

export const RETURN_STEPS = ["Return Details", "Review", "Confirm"];
type AssetLike = { lifecycleStatus: string; custody: { type: "person" | "org_unit"; id: string; name: string | null } | null };

export function returnCondition(value: unknown): AssetCondition | null {
  return ASSET_CONDITIONS.find((condition) => condition === value) ?? null;
}

export function assetReturnBlock(asset: AssetLike) {
  // Return eligibility ignores condition; all four canonical values are accepted at submission.
  return returnBlock({
    status: asset.lifecycleStatus as AssetStatus, condition: "Good",
    custody: asset.custody && { ...asset.custody, label: asset.custody.name ?? "" },
  });
}

export function returnNeedsReload(save: { code?: string; uncertain?: boolean }) {
  return Boolean(save.uncertain || ["STALE", "INVALID_STATE", "NOT_FOUND"].includes(save.code ?? ""));
}

export function returnBody(input: { updatedAt: string; condition: AssetCondition; reason: string; fileIds: string[] }) {
  const reason = input.reason.trim();
  return {
    expectedUpdatedAt: input.updatedAt, condition: input.condition,
    ...(reason ? { reason } : {}), ...(input.fileIds.length ? { evidenceFileIds: input.fileIds } : {}),
  };
}

/** PO frames 21 / 22 "What will happen?" (no date: the return takes effect on Confirm). */
export function returnOutcomes() {
  return [
    "Current custodian will be closed",
    { text: "Asset status will be updated based on condition", sub: ["Good / Fair → Available", "Damaged / Unusable → In Maintenance"] },
  ];
}

export { statusAfterReturn };
