import { ASSIGN_REASON_MAX } from "./assignment-assign.ts";

type AssetLocation = { lifecycleStatus: string; location: { id: string } | null };
type MoveFailure = { code: string; uncertain: boolean };

export function canMoveAsset(asset: AssetLocation) {
  return ["Available", "Assigned", "In Maintenance"].includes(asset.lifecycleStatus);
}

export function moveLocationErrors(asset: AssetLocation, locationId: string | null, reason: string) {
  return {
    locationId: !locationId ? "Choose a location." : asset.location?.id.toLowerCase() === locationId.toLowerCase()
      ? "Choose a different location." : undefined,
    reason: reason.trim().length > ASSIGN_REASON_MAX ? `Use ${ASSIGN_REASON_MAX} characters or fewer.` : undefined,
  };
}

export function moveLocationBody(expectedUpdatedAt: string, locationId: string, reason: string) {
  const note = reason.trim();
  return { expectedUpdatedAt, locationId, ...(note ? { reason: note } : {}) };
}

export function moveLocationNeedsReload({ code, uncertain }: MoveFailure) {
  return uncertain || ["STALE", "INVALID_STATE", "NOT_FOUND"].includes(code);
}

export function moveLocationFailureText({ code, uncertain }: MoveFailure) {
  if (uncertain) return "The location may have been updated. Reload to check before trying again.";
  switch (code) {
    case "STALE": return "This asset was changed by someone else. Reload to see the latest.";
    case "INVALID_STATE": return "This asset's location or status changed. Reload to check.";
    case "NOT_FOUND": return "The asset or destination is no longer available. Reload to check.";
    case "VALIDATION": return "Some details were rejected. Check the destination and reason.";
    case "PERMISSION_DENIED": return "You don't have permission to move this asset.";
    case "UNAUTHENTICATED": return "Your session has expired. Sign in again to continue.";
    default: return "Couldn't move this asset. Check your connection and retry.";
  }
}
