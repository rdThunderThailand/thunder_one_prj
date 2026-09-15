import type { CoreMemberRow } from "@/features/people/personnel";

/**
 * The homepage's real cross-App stats — 3 of 8 tiles across the top stat
 * row and org-overview row (see `HomeStatTilesRow`/`OrgOverviewRow`).
 * `totalHeadcount`/`newHiresThisMonth` come from People's own real roster
 * fetch (`getMembers`); `totalAssets` from Asset Intelligence's real
 * `getAssetSummary`. Every other tile on this page stays mock — no real
 * "needs attention" asset status, no real display/request counts exist
 * anywhere in this app yet (see `mock-data.ts`'s own comments for exactly
 * what and why).
 */
export interface HomeStats {
  totalHeadcount: number;
  newHiresThisMonth: number;
  totalAssets: number | null;
}

/** "This calendar month" — matches the exact logic `PersonnelPage`/
 *  `people/overview` already use for their own new-hires tile, duplicated
 *  here rather than imported since neither exposes it through its own
 *  public `index.ts` barrel. */
function isThisMonth(dateStr: string | null, now: Date): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return !Number.isNaN(d.getTime()) && d.getUTCFullYear() === now.getUTCFullYear() && d.getUTCMonth() === now.getUTCMonth();
}

export function computeHomeStats(
  memberRows: CoreMemberRow[],
  memberCount: number,
  totalAssets: number | null,
  now: Date
): HomeStats {
  return {
    totalHeadcount: memberCount,
    newHiresThisMonth: memberRows.filter((row) => isThisMonth(row.start_date, now)).length,
    totalAssets,
  };
}
