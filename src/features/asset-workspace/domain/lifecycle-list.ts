// Lifecycle & Warranty page, Lifecycle tab (batch FE 01–02): tab parsing, tiles and the row menu.
import { canMoveAsset } from "./assignment-move-location.ts";
import { lifecycleMenu } from "./asset-lifecycle-actions.ts";

export const LW_BASE = "/asset-workspace/lifecycle-warranty";
export const LW_TABS = [
  { key: "lifecycle", label: "Lifecycle" },
  { key: "warranty", label: "Warranty" },
] as const;
export type LwTab = (typeof LW_TABS)[number]["key"];

/** FE 01: unknown or missing `tab` falls back to Lifecycle. */
export function readLwTab(value: unknown): LwTab {
  return value === "warranty" ? "warranty" : "lifecycle";
}

/** Core keys the Lifecycle tab forwards to `assets/list` (Core answers 400 to unknown keys). */
export const LIFECYCLE_FILTER_KEYS = ["q", "status", "condition", "category_id", "location_id", "custody_type", "custody_id"] as const;
export const LIFECYCLE_CLEAR = Object.fromEntries(LIFECYCLE_FILTER_KEYS.map((key) => [key, undefined]));

/** The Core query for one Lifecycle URL; the server and the browser build the same one. Other keys stay out. */
export function lifecycleListQuery(search: string): string {
  const params = new URLSearchParams(search);
  const query = new URLSearchParams();
  for (const key of [...LIFECYCLE_FILTER_KEYS, "page", "pageSize"]) {
    const values = params.getAll(key);
    if (values.length === 1 && values[0]) query.set(key, values[0]);
  }
  return query.toString();
}

// Q4: Condition Issues = Damaged or Unusable, Disposed left out (Disposed is view only, PO 05 §4.2).
const ISSUE_FILTER = { status: "Available,Assigned,In Maintenance,Retired", condition: "Damaged,Unusable" };
export const LIFECYCLE_TILES = [
  { key: "In Maintenance", filter: { status: "In Maintenance", condition: undefined } },
  { key: "Retired", filter: { status: "Retired", condition: undefined } },
  { key: "Disposed", filter: { status: "Disposed", condition: undefined } },
  { key: "Condition Issues", filter: ISSUE_FILTER },
] as const;
export type LifecycleTileKey = (typeof LIFECYCLE_TILES)[number]["key"];

/** Q5: a tile sets its filter; clicking it again while that exact filter is on clears status and condition. */
export function lifecycleTileUpdate(key: LifecycleTileKey, current: { status?: string; condition?: string }) {
  const { filter } = LIFECYCLE_TILES.find((tile) => tile.key === key)!;
  const active = (current.status ?? undefined) === filter.status && (current.condition ?? undefined) === filter.condition;
  return active ? { status: undefined, condition: undefined } : { ...filter };
}

export type RowMenuItem = { key: string; label: string; href: string; reason: string | null };
type MenuRow = { id: string; status: string; custody: { id: string } | null };

/** Q1/Q3/Q20/Q33: the profile's existing lifecycle rules; Disposed rows only open the asset (PO 05 §4.11). */
export function lifecycleRowMenu(row: MenuRow): RowMenuItem[] {
  const base = `/asset-workspace/assets/${encodeURIComponent(row.id)}`;
  const view = { key: "view", label: "View Details", href: base, reason: null };
  if (row.status === "Disposed") return [view];
  // lifecycleMenu only checks whether a custodian exists.
  const rules = lifecycleMenu({ lifecycleStatus: row.status, custody: row.custody as never });
  const reason = (action: string) => rules.find((item) => item.action === action)?.reason ?? null;
  return [
    view,
    { key: "change-status", label: "Change Status", href: `${base}/change-status`, reason: reason("change-status") },
    { key: "change-condition", label: "Change Condition", href: `${base}/change-status`, reason: reason("change-status") },
    {
      key: "move-location", label: "Move Location", href: `${base}?tab=location&action=move-location`,
      reason: canMoveAsset({ lifecycleStatus: row.status, location: null }) ? null : "Only Available, Assigned or In Maintenance",
    },
    { key: "retire", label: "Retire", href: `${base}/retire`, reason: reason("retire") },
    { key: "dispose", label: "Dispose", href: `${base}/dispose`, reason: reason("dispose") },
  ];
}
