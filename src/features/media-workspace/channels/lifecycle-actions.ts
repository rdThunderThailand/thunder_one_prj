import type { ChannelLifecycle } from "./types";

export type LifecycleActions = {
  canDeactivate: boolean;
  canActivate: boolean;
  activateBlockedReason: string | null;
  canDelete: boolean;
};

/**
 * Which lifecycle actions the card and the row menu offer, from the STORED status (ADR 0122 rule 3),
 * not the derived `lifecycle`. Delete for non-Drafts waits for the Core change in ADR 0122 phase 1.
 */
export function lifecycleActionsFor({
  status,
  hasPlayer,
}: {
  status: ChannelLifecycle;
  hasPlayer: boolean;
}): LifecycleActions {
  const canActivate = status !== "active" && hasPlayer;
  return {
    canDeactivate: status === "active",
    canActivate,
    activateBlockedReason: status !== "active" && !hasPlayer ? "Select a Player first" : null,
    canDelete: status === "draft",
  };
}
