// Lifecycle & Warranty page, Warranty tab (batch FE 03): tiles, filter keys and the row menu.
import { WARRANTY_STATUSES, type WarrantyStatus } from "./report.ts";
import type { RowMenuItem } from "./lifecycle-list.ts";

/** Core keys the Warranty tab forwards to `warranties` (Core answers 400 to unknown keys). */
export const WARRANTY_LIST_KEYS = ["q", "status", "provider", "warranty_type"] as const;
export const WARRANTY_CLEAR = Object.fromEntries(WARRANTY_LIST_KEYS.map((key) => [key, undefined]));

export const WARRANTY_TILE_LABEL: Record<WarrantyStatus, string> = {
  Active: "Active Warranty",
  "Expiring Soon": "Expiring Soon (≤ 90 days)",
  Expired: "Expired",
  "No Warranty": "No Warranty Record",
};
export const WARRANTY_TILES = WARRANTY_STATUSES;

/** Q5: a tile sets the status filter; clicking the active tile clears it. */
export function warrantyTileUpdate(status: WarrantyStatus, current?: string) {
  return { status: current === status ? undefined : status };
}

type MenuRow = { assetId: string; warrantyId?: string | null };

/** Q17/Q24: view, add, edit the current record (greyed when there is none), history on the profile. */
export function warrantyRowMenu(row: MenuRow): RowMenuItem[] {
  const base = `/asset-workspace/assets/${encodeURIComponent(row.assetId)}`;
  return [
    { key: "view", label: "View Asset", href: base, reason: null },
    { key: "add", label: "Add Warranty", href: `${base}/warranty/new`, reason: null },
    {
      key: "edit", label: "Edit Current Warranty",
      href: row.warrantyId ? `${base}/warranty/${encodeURIComponent(row.warrantyId)}/edit` : base,
      reason: row.warrantyId ? null : "No current warranty",
    },
    { key: "history", label: "Warranty History", href: `${base}?tab=warranty`, reason: null },
  ];
}
