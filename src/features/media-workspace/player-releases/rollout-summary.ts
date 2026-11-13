// ADR 0029 §4: what the Rollout page tells the operator about a production rollout. Counts per status come from
// rollout-device-status.ts, so the summary and the table cannot disagree.

/** Free in-flight slots, never below zero (a lowered cap can leave more devices in flight than the cap). */
export const freeSlots = (inFlight: number, cap: number) => Math.max(0, cap - inFlight);

/** Failures and timeouts both count towards the failure limit; at the limit Core pauses the rollout itself. */
export function failureBudget(failed: number, timedOut: number, limit: number) {
  const used = failed + timedOut;
  return { used, limit, isAtLimit: used >= limit };
}

/** Plain-language reason Core paused the rollout on its own, or null for a manual pause or no pause. */
export function pauseReasonText(reason: string | null): string | null {
  if (reason === "failure_limit") return "Paused automatically: too many devices failed to update.";
  return null;
}
