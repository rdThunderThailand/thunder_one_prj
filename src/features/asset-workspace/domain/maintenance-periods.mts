/** FE 08 (owner option B): maintenance periods read from status changes; no maintenance store exists yet. */
export type StatusChangeLike = {
  id: string; at: string; fromStatus: string | null; toStatus: string | null; reason: string | null; actorName: string | null;
};
export type MaintenancePeriod = {
  id: string; startedAt: string; startedBy: string | null; reason: string | null;
  endedAt: string | null; endedBy: string | null; returnedTo: string | null;
};

const IN_MAINTENANCE = "In Maintenance";

/** Newest first. A period opens when the status becomes In Maintenance and closes on the next change away from it. */
export function maintenancePeriods(changes: readonly StatusChangeLike[]): MaintenancePeriod[] {
  const periods: MaintenancePeriod[] = [];
  let open: MaintenancePeriod | null = null;
  for (const change of [...changes].sort((a, b) => a.at.localeCompare(b.at))) {
    if (change.fromStatus === change.toStatus) continue; // condition-only change
    if (change.toStatus === IN_MAINTENANCE) {
      open = { id: change.id, startedAt: change.at, startedBy: change.actorName, reason: change.reason, endedAt: null, endedBy: null, returnedTo: null };
      periods.push(open);
    } else if (open && change.fromStatus === IN_MAINTENANCE) {
      Object.assign(open, { endedAt: change.at, endedBy: change.actorName, returnedTo: change.toStatus });
      open = null;
    }
  }
  return periods.reverse();
}

/** Whole days between two ISO times, at least 1 day once it has started (a same-day repair counts as 1). */
export function maintenanceDays(startedAt: string, endedAt: string | null, now = Date.now()): number {
  const end = endedAt ? Date.parse(endedAt) : now;
  return Math.max(1, Math.ceil((end - Date.parse(startedAt)) / 86_400_000));
}
