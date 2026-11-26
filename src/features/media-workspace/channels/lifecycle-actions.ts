import type { BlockingProgram, ChannelLifecycle, ChannelListItem } from "./types";

export type LifecycleActions = {
  canDeactivate: boolean;
  canActivate: boolean;
  activateBlockedReason: string | null;
  canDelete: boolean;
  /** Why Deactivate and Delete are off while Programs are live or scheduled; `null` otherwise. */
  blockedReason: string | null;
};

/** ADR 0099 / 0129: only an Active Channel holds a device reservation, so only it can be a Program target. */
export function canBeProgramTarget(channel: Pick<ChannelListItem, "lifecycle">): boolean {
  return channel.lifecycle === "active";
}

/**
 * Which lifecycle actions the card and the row menu offer, from the Channel's lifecycle (ADR 0122
 * rule 3, ADR 0129). Delete is open to every lifecycle; Core refuses a Channel that was ever
 * used, and the dialog shows that refusal (the list has no `blockingPrograms`, pass `[]` there).
 */
export function lifecycleActionsFor({
  lifecycle,
  hasPlayer,
  blockingPrograms,
}: {
  lifecycle: ChannelLifecycle;
  hasPlayer: boolean;
  blockingPrograms: BlockingProgram[];
}): LifecycleActions {
  const isBlocked = blockingPrograms.length > 0;
  return {
    canDeactivate: lifecycle === "active" && !isBlocked,
    canActivate: lifecycle !== "active" && hasPlayer,
    activateBlockedReason: lifecycle !== "active" && !hasPlayer ? "Select a Player first" : null,
    canDelete: !isBlocked,
    blockedReason: isBlocked
      ? `Locked while these Programs are live or scheduled: ${blockingPrograms.map((program) => program.name).join(", ")}`
      : null,
  };
}
