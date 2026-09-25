import type { AssetSummary } from "@/features/asset-intelligence/assets";
import type { CoreMemberRow } from "@/features/people/personnel";
import type { ChannelHealthSummary } from "./services/channels-api";

/**
 * Every number on the homepage's stat tiles and org-overview row. Each field
 * is `null` when its source fetch failed — tiles render "-" for it, never a
 * placeholder number. Sources:
 * - `totalHeadcount`/`newHiresThisMonth` — People's roster (`getMembers`).
 * - `totalAssets`/`assetsNeedingCare` — Asset Intelligence's
 *   `GET /tenants/:id/assets/summary`. "Needs care" is Core's derived
 *   `In Progress` status (maintenance / critical / ต้องซ่อม / installing —
 *   thunder_core_API's normalizeAssetStatus); there is no separate
 *   "attention" flag on a Core asset.
 * - `displaysTotal`/`displaysOnline` — Media Workspace channels by player
 *   health (`services/channels-api.ts`), same rollup as Media's Overview.
 *
 * Not here on purpose: Thunder Care request counts ("คำขอที่รออนุมัติ",
 * "คำขอที่เปิดอยู่") — Core has no requests/work-order endpoint, so those
 * tiles show "-" rather than a number.
 */
export interface HomeStats {
  totalHeadcount: number | null;
  newHiresThisMonth: number | null;
  totalAssets: number | null;
  assetsNeedingCare: number | null;
  displaysTotal: number | null;
  displaysOnline: number | null;
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
  members: { rows: CoreMemberRow[]; count: number } | null,
  assetSummary: AssetSummary | null,
  channels: ChannelHealthSummary | null,
  now: Date
): HomeStats {
  return {
    totalHeadcount: members ? members.count : null,
    newHiresThisMonth: members ? members.rows.filter((row) => isThisMonth(row.start_date, now)).length : null,
    totalAssets: assetSummary ? assetSummary.total : null,
    assetsNeedingCare: assetSummary
      ? (assetSummary.byStatus.find((s) => s.status === "In Progress")?.count ?? 0)
      : null,
    displaysTotal: channels ? channels.total : null,
    displaysOnline: channels ? channels.online : null,
  };
}
