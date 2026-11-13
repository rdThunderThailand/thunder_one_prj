import { assignmentEventKey } from "./assignment-history.ts";
import { assetReturnBlock } from "./assignment-return.ts";
import { assetTransferBlock } from "./assignment-transfer.ts";
import type { AssetDetail } from "../services/asset-profile-contract.ts";
import type { ProfileAssignmentEvent } from "../services/asset-assignments-profile-api.ts";

type ProfileCustody = Pick<AssetDetail, "lifecycleStatus" | "condition" | "custody">;

export function profileAssignmentActions(asset: ProfileCustody) {
  const transfer = assetTransferBlock(asset);
  const returned = assetReturnBlock(asset);
  return {
    assign: asset.lifecycleStatus === "Available" && !asset.custody,
    transfer: transfer === "condition_blocks_transfer" ? "Return it instead"
      : transfer ? "Transfer is available only for Assigned assets."
      : asset.condition === "Good" || asset.condition === "Fair" ? null
        : "The asset condition could not be verified. View the asset before transferring.",
    return: returned ? "Only Assigned assets with a current custodian can be returned." : null,
  };
}

/** The API is newest-first. Compare the period opening instant, not the event timestamp. */
export function currentProfileAssignmentKey(events: ProfileAssignmentEvent[], custody: AssetDetail["custody"]) {
  if (!custody?.since) return undefined;
  const since = Date.parse(custody.since);
  const current = events.find((event) => event.action !== "Return"
    && event.to?.type === custody.type && event.to.id === custody.id
    && event.custodyPeriod?.endedAt === null && Date.parse(event.custodyPeriod.startedAt) === since);
  return current ? assignmentEventKey(current) : undefined;
}
