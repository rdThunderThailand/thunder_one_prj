// Reports page values (PO 05 §4.13.5 · §4.5 · §4.9). Warranty buckets are computed by Core on the
// Asia/Bangkok date from the current warranty's end date: Expiring Soon = ends within 90 days.

export const REPORT_TABS = [
  { key: "summary", label: "Asset Summary" },
  { key: "lifecycle", label: "Lifecycle & Condition" },
  { key: "inventory", label: "Inventory" },
  { key: "warranty", label: "Warranty" },
] as const;

export const INVENTORY_RESULTS = ["Verified", "Mismatch", "Not Found", "Unexpected"] as const;
export type InventoryResult = (typeof INVENTORY_RESULTS)[number];

export const SESSION_STATUSES = ["Draft", "In Progress", "Completed", "Closed", "Cancelled"] as const;
export type SessionStatus = (typeof SESSION_STATUSES)[number];

export const WARRANTY_STATUSES = ["Active", "Expiring Soon", "Expired", "No Warranty"] as const;
export type WarrantyStatus = (typeof WARRANTY_STATUSES)[number];

/** Age from the purchase date to `today` (both YYYY-MM-DD, Asia/Bangkok): "2y 3m", "5m", "< 1m".
 *  `null` without a purchase date or when it is after today. */
export function assetAge(purchaseDate: string | null, today: string): string | null {
  if (!purchaseDate) return null;
  const [py, pm, pd] = purchaseDate.slice(0, 10).split("-").map(Number);
  const [ty, tm, td] = today.split("-").map(Number);
  const months = (ty - py) * 12 + (tm - pm) - (td < pd ? 1 : 0);
  if (!Number.isFinite(months) || months < 0) return null;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (!years) return rest ? `${rest}m` : "< 1m";
  return rest ? `${years}y ${rest}m` : `${years}y`;
}

// ── Lifecycle tab, provisional (2026-11-04) ──────────────────────────
// PO has not defined these; the user chose the Figma layout and our proposed rules until PO answers:
//   Poor Condition   = Damaged + Unusable
//   Near End of Life = age ≥ 80% of `assets.expected_life_months` (assets without it are not counted)
//   Age              = from Acquisition Date (`purchase_date`, 03 §2.4; Lead 2026-11-04), assets without it not counted
// Core computes them (planned Core PR 7); the FE only shows what Core sends.

export const AGE_BUCKETS = ["< 1 yr", "1–3 yrs", "3–5 yrs", "5–7 yrs", "7+ yrs"] as const;
export type AgeBucket = (typeof AGE_BUCKETS)[number];

export const ATTENTION_ISSUES = ["Near End of Life", "Poor Condition", "Warranty Expiring"] as const;
export type AttentionIssue = (typeof ATTENTION_ISSUES)[number];

/** Provisional: Damaged + Unusable. */
export const POOR_CONDITIONS = ["Damaged", "Unusable"] as const;

/** Months → "3.8 years" (one decimal); `null` → null. */
export function formatAverageAge(months: number | null): string | null {
  if (months === null || !Number.isFinite(months)) return null;
  return `${(Math.round((months / 12) * 10) / 10).toFixed(1)} years`;
}

/** Largest `limit` rows by total, the rest summed into one "Others" row (id "others"). */
export function topWithOthers<K extends string>(
  rows: { id: string; name: string; counts: Partial<Record<K, number>> }[],
  limit: number,
): { id: string; name: string; counts: Partial<Record<K, number>> }[] {
  const total = (counts: Partial<Record<K, number>>) => Object.values<number | undefined>(counts).reduce<number>((sum, n) => sum + (n ?? 0), 0);
  const sorted = [...rows].sort((a, b) => total(b.counts) - total(a.counts));
  if (sorted.length <= limit + 1) return sorted;
  const others: Partial<Record<K, number>> = {};
  for (const row of sorted.slice(limit)) {
    for (const [key, n] of Object.entries(row.counts) as [K, number | undefined][]) others[key] = (others[key] ?? 0) + (n ?? 0);
  }
  return [...sorted.slice(0, limit), { id: "others", name: "Others", counts: others }];
}
