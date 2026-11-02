// Overview widget rules (docs: E:\ThunderOne\docs\asset-ws-overview-fe-checklist.md §1).
// Pure so the check file can run them without Next.
import type { AssetStatus } from "./asset-status.ts";

/** The KPI tiles. Disposed is out of the active register, so it has no tile and no share of Total. */
const KPI_STATUSES = ["Available", "Assigned", "In Maintenance", "Retired"] as const satisfies readonly AssetStatus[];

/** Share of Total, one decimal; 0 when Total is 0. */
const pct = (n: number, total: number) => (total > 0 ? Math.round((n / total) * 1000) / 10 : 0);

export function kpiFromCounts(counts: Partial<Record<AssetStatus, number>>) {
  const total = KPI_STATUSES.reduce((sum, status) => sum + (counts[status] ?? 0), 0);
  const tiles = KPI_STATUSES.map((status) => {
    const count = counts[status] ?? 0;
    return { status, count, percent: pct(count, total) };
  });
  return { total, tiles };
}

export interface BreakdownInput {
  id: string;
  label: string;
  count: number;
}

export interface BreakdownRow {
  /** `null` for the Others and Unassigned buckets, which have no single filter target. */
  id: string | null;
  label: string;
  count: number;
  percent: number;
}

const BREAKDOWN_TOP = 6;

/**
 * Top 6 by count, then Others (the rest), then Unassigned (Total minus everything counted).
 * Empty buckets are dropped. Category and Location share this rule.
 */
export function breakdown(items: BreakdownInput[], total: number): BreakdownRow[] {
  const sorted = items.filter((i) => i.count > 0).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  const top = sorted.slice(0, BREAKDOWN_TOP);
  const others = sorted.slice(BREAKDOWN_TOP).reduce((sum, i) => sum + i.count, 0);
  const assigned = sorted.reduce((sum, i) => sum + i.count, 0);
  const unassigned = Math.max(total - assigned, 0);

  const rows: BreakdownRow[] = top.map((i) => ({ id: i.id, label: i.label, count: i.count, percent: pct(i.count, total) }));
  if (others > 0) rows.push({ id: null, label: "Others", count: others, percent: pct(others, total) });
  if (unassigned > 0) rows.push({ id: null, label: "Unassigned", count: unassigned, percent: pct(unassigned, total) });
  return rows;
}

export const ATTENTION_WARRANTY_DAYS = 30;
export const ATTENTION_LIMIT = 5;

export interface AttentionRow {
  assetId: string;
  assetName: string;
  assetTag: string | null;
  category: string | null;
  location: string | null;
  reason: "Warranty expiring" | "In Maintenance";
  /** Warranty: end date. In Maintenance: the day it entered the status. ISO date. */
  date: string;
}

/** Warranty and maintenance rows in one list, soonest/oldest date first, top 5. */
export function attentionRows(warranty: AttentionRow[], maintenance: AttentionRow[]): AttentionRow[] {
  return [...warranty, ...maintenance].sort((a, b) => a.date.localeCompare(b.date)).slice(0, ATTENTION_LIMIT);
}
