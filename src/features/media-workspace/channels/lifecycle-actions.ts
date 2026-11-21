import type { BlockingProgram, ChannelLifecycle } from "./types";

export type LifecycleActions = {
  canDeactivate: boolean;
  canActivate: boolean;
  activateBlockedReason: string | null;
  canDelete: boolean;
  /** Why Deactivate and Delete are off while Programs are live or scheduled; `null` otherwise. */
  blockedReason: string | null;
};

/**
 * Which lifecycle actions the card and the row menu offer, from the STORED status (ADR 0122 rule 3),
 * not the derived `lifecycle`. Delete is open to every status; Core refuses a Channel that was ever
 * used, and the dialog shows that refusal (the list has no `blockingPrograms`, pass `[]` there).
 */
export function lifecycleActionsFor({
  status,
  hasPlayer,
  blockingPrograms,
}: {
  status: ChannelLifecycle;
  hasPlayer: boolean;
  blockingPrograms: BlockingProgram[];
}): LifecycleActions {
  const isBlocked = blockingPrograms.length > 0;
  return {
    canDeactivate: status === "active" && !isBlocked,
    canActivate: status !== "active" && hasPlayer,
    activateBlockedReason: status !== "active" && !hasPlayer ? "Select a Player first" : null,
    canDelete: !isBlocked,
    blockedReason: isBlocked
      ? `Locked while these Programs are live or scheduled: ${blockingPrograms.map((program) => program.name).join(", ")}`
      : null,
  };
}
