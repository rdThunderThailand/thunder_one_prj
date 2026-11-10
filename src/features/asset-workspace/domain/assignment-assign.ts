import { assignBlock, type CustodyBlock } from "./custody.ts";
import type { AssetStatus } from "./asset-status.ts";
import type { AssetCondition } from "./asset-condition.ts";

export const ASSIGN_REASON_MAX = 500;
export const ASSIGN_EVIDENCE_MAX = 5;
export type AssignTarget = { type: "person" | "org_unit"; id: string; name: string; secondary: string | null };
type AssetLike = { id: string; lifecycleStatus: string; condition: string | null; custody: { type: "person" | "org_unit"; id: string; name: string | null } | null };

/** FE 02: the list route starts with Select Asset; the profile route already knows the asset. */
export function assignSteps(selectAsset: boolean) {
  return [...(selectAsset ? ["Select Asset"] : []), "Assign Details", "Review", "Confirm"];
}

export function assignOrigin(from: string | undefined, assetId: string | null) {
  if (from === "assignments" || !assetId) return { href: "/asset-workspace/assignments", label: "Assignments" };
  return { href: `/asset-workspace/assets/${encodeURIComponent(assetId)}`, label: "Asset Profile" };
}

export function assetAssignBlock(asset: AssetLike): CustodyBlock | null {
  return assignBlock({
    status: asset.lifecycleStatus as AssetStatus, condition: asset.condition as AssetCondition,
    custody: asset.custody && { type: asset.custody.type, id: asset.custody.id, label: asset.custody.name ?? "" },
  });
}

export function assignBlockText(block: CustodyBlock) {
  return block === "has_custody"
    ? { title: "This asset already has a custodian", body: "Use Transfer to give it to someone else." }
    : { title: "This asset can't be assigned", body: "Only Available assets can be assigned." };
}

/** Evidence goes through the existing asset uploads: PDFs as documents, JPEG / PNG as photos. */
export function evidenceKind(file: Pick<File, "type">): "photo" | "document" | null {
  if (file.type === "application/pdf") return "document";
  return file.type === "image/jpeg" || file.type === "image/png" ? "photo" : null;
}

export function assignBody(input: { updatedAt: string; target: AssignTarget; reason: string; fileIds: string[] }) {
  const reason = input.reason.trim();
  return {
    expectedUpdatedAt: input.updatedAt, target: { type: input.target.type, id: input.target.id },
    ...(reason ? { reason } : {}), ...(input.fileIds.length ? { evidenceFileIds: input.fileIds } : {}),
  };
}

export function assignOutcomes(targetName: string | null, location: string | null) {
  return [
    `A new assignment will be created for ${targetName ?? "the chosen custodian"}`,
    "Status changes to Assigned",
    `Location stays ${location ?? "unchanged"}`,
  ];
}
