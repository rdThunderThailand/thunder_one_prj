import { transferBlock, type CustodyBlock } from "./custody.ts";
import { isTransferBlockedBy, type AssetCondition } from "./asset-condition.ts";
import type { AssetStatus } from "./asset-status.ts";
import type { AssignTarget } from "./assignment-assign.ts";

type Holder = { type: "person" | "org_unit"; id: string; name: string | null };
type AssetLike = { lifecycleStatus: string; condition: string | null; custody: Holder | null };

export const TRANSFER_STEPS = ["Transfer Details", "Review", "Confirm"];

export function assetTransferBlock(asset: AssetLike): CustodyBlock | null {
  return transferBlock({
    status: asset.lifecycleStatus as AssetStatus, condition: asset.condition as AssetCondition,
    custody: asset.custody && { type: asset.custody.type, id: asset.custody.id, label: asset.custody.name ?? "" },
  });
}

export function transferBlockText(block: CustodyBlock) {
  if (block === "no_custody") return { title: "This asset has no custodian", body: "Use Assign to give it to someone." };
  if (block === "condition_blocks_transfer") {
    return { title: "This asset can't be transferred", body: "Damaged or Unusable assets are returned, not transferred." };
  }
  return { title: "This asset can't be transferred", body: "Only Assigned assets can be transferred." };
}

export function isCurrentHolder(holder: Holder | null, target: AssignTarget | null) {
  return Boolean(holder && target && holder.type === target.type && holder.id === target.id);
}

/** Core takes Good / Fair only; Damaged / Unusable go through Return. */
export function conditionBlocksTransfer(condition: string | null) {
  return condition !== null && isTransferBlockedBy(condition as AssetCondition);
}

export function transferBody(input: {
  updatedAt: string; target: AssignTarget; condition: string; locationId: string | null; currentLocationId: string | null;
  reason: string; fileIds: string[];
}) {
  const reason = input.reason.trim();
  const move = input.locationId && input.locationId !== input.currentLocationId;
  return {
    expectedUpdatedAt: input.updatedAt, target: { type: input.target.type, id: input.target.id }, condition: input.condition,
    ...(move ? { newLocationId: input.locationId } : {}), ...(reason ? { reason } : {}),
    ...(input.fileIds.length ? { evidenceFileIds: input.fileIds } : {}),
  };
}

export function transferOutcomes(targetName: string | null, current: string | null, next: string | null) {
  return [
    "Current assignment will be closed",
    `New assignment will be created for ${targetName ?? "the chosen custodian"}`,
    next && next !== current ? `Location will be updated to ${next}` : `Location stays ${current ?? "unchanged"}`,
    "Status stays Assigned",
  ];
}
