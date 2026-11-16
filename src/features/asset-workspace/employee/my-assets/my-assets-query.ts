// My Assets (EMP-02): URL → Core `/me/assets` query, and the filter choices. Pure, so its .check.mts runs with node.
import type { AssetStatus } from "../../domain/asset-status.ts";
import { readAssetListQuery, type AssetListQuery, type AssetSearchParams } from "../../services/assets-list-query.ts";

/** Tabs (employee README M1): All / Assigned / In Maintenance; no Retired. */
export const MY_ASSET_TABS = [
  { key: "all", label: "All" },
  { key: "assigned", label: "Assigned" },
  { key: "in-maintenance", label: "In Maintenance" },
] as const;

const TAB_STATUS: Record<string, AssetStatus | undefined> = { assigned: "Assigned", "in-maintenance": "In Maintenance" };

/** Keys the page reads from its URL; custody is forced by Core, so it is never read or sent. */
const URL_KEYS = ["q", "category_id", "location_id", "condition", "page", "pageSize"] as const;

/** `null` = the URL is invalid (e.g. a hand-edited id); the page shows the error state. */
export function myAssetsQuery(sp: AssetSearchParams): AssetListQuery | null {
  const input: AssetSearchParams = {};
  for (const key of URL_KEYS) input[key] = sp[key];
  const tab = typeof sp.tab === "string" ? sp.tab : undefined;
  input.status = tab ? TAB_STATUS[tab] : undefined;
  const parsed = readAssetListQuery(input);
  return parsed.success ? parsed.data : null;
}

export interface FilterChoice {
  value: string;
  label: string;
}

/** Category and Location choices from the assets the caller holds (no `/me` filters route).
 *  shortcut: built from the first 200 held assets; add a `/me/assets/filters` route if employees ever hold more. */
export function choicesFrom(rows: { asset_category_id: string | null; category_name: string | null; location_id: string | null; location_name: string | null }[]) {
  const unique = (pairs: [string | null, string | null][]): FilterChoice[] => {
    const map = new Map<string, string>();
    for (const [id, name] of pairs) if (id) map.set(id, name || "Unnamed");
    return [...map].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label));
  };
  return {
    categories: unique(rows.map((row) => [row.asset_category_id, row.category_name])),
    locations: unique(rows.map((row) => [row.location_id, row.location_name])),
  };
}
