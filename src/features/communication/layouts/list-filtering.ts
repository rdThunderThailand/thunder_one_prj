// Everything the Layouts list page derives from one dataset: the filter row, the summary
// cards and the page slice. Kept out of the component so the whole lot is checkable
// without React — see list-filtering.check.mts. Mirrors
// src/features/communication/playlists/list-filtering.ts, minus the keys that have no
// meaning for a Layout: no ownership tab, no type filter, no campaign filter.

import type { LayoutListItem, LayoutStatus } from "./types";

export type ListFilters = {
  query: string;
  status: LayoutStatus | "all";
};

export function filterLayouts(layouts: LayoutListItem[], filters: ListFilters): LayoutListItem[] {
  const needle = filters.query.trim().toLowerCase();
  return layouts.filter((l) => {
    if (filters.status !== "all" && l.status !== filters.status) return false;
    if (needle && !l.name.toLowerCase().includes(needle)) return false;
    return true;
  });
}

export type Page<T> = { rows: T[]; page: number; totalPages: number };

/** Clamps the page itself so narrowing a filter can never strand the view on an empty
 *  page — the component reads the clamped number back instead of resetting state in an
 *  effect (which the lint rules forbid anyway). */
export function paginate<T>(items: T[], page: number, perPage: number): Page<T> {
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const current = Math.min(Math.max(1, Math.trunc(page)), totalPages);
  const start = (current - 1) * perPage;
  return { rows: items.slice(start, start + perPage), page: current, totalPages };
}

export type Summary = { total: number; active: number; inactive: number };

export function summarize(layouts: LayoutListItem[]): Summary {
  const summary: Summary = { total: layouts.length, active: 0, inactive: 0 };
  for (const l of layouts) summary[l.status] += 1;
  return summary;
}

/** `media_core.layouts` is UNIQUE (tenant_id, name), same as playlists — same helper
 *  solves the same problem: the list page already has every name in memory, which is
 *  cheaper and clearer than provoking a unique violation and parsing it back. */
export function copyName(base: string, existingNames: string[]): string {
  const taken = new Set(existingNames);
  // 200 is the column's limit; leave room for the longest suffix this can append.
  const stem = base.slice(0, 180);
  for (let n = 1; n < 100; n += 1) {
    const candidate = n === 1 ? `${stem} (Copy)` : `${stem} (Copy ${n})`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${stem} (Copy ${Date.now()})`;
}

export const SORT_KEYS = ["name", "aspectRatio", "zones", "status", "updated"] as const;
export type SortKey = (typeof SORT_KEYS)[number];
export type SortDir = "asc" | "desc";
export type Sort = { key: SortKey; dir: SortDir };
export const DEFAULT_SORT: Sort = { key: "updated", dir: "desc" };

const STATUS_ORDER: Record<LayoutStatus, number> = { active: 0, inactive: 1 };

/** null means "empty" — sortLayouts always pushes empty values to the bottom, regardless
 *  of direction, instead of letting them flip to the top on desc. */
function sortValue(layout: LayoutListItem, key: SortKey): string | number | null {
  switch (key) {
    case "name":
      return layout.name;
    case "aspectRatio":
      return layout.aspect_ratio;
    case "zones":
      return layout.zone_count;
    case "status":
      return STATUS_ORDER[layout.status];
    case "updated": {
      const ms = Date.parse(layout.updated_at ?? layout.created_at ?? "");
      return Number.isNaN(ms) ? null : ms;
    }
  }
}

/** Empty values sort last no matter the direction — only non-empty comparisons flip
 *  with `dirMultiplier`, so switching direction never sends a "—" row to the top. */
function compareValues(a: string | number | null, b: string | number | null, dirMultiplier: number): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  const raw = typeof a === "string" ? a.localeCompare(b as string) : a - (b as number);
  return raw * dirMultiplier;
}

export function sortLayouts(layouts: LayoutListItem[], sort: Sort): LayoutListItem[] {
  const dirMultiplier = sort.dir === "asc" ? 1 : -1;

  return [...layouts].sort((a, b) => {
    const cmp = compareValues(sortValue(a, sort.key), sortValue(b, sort.key), dirMultiplier);
    if (cmp !== 0) return cmp;
    return a.name.localeCompare(b.name) || a.id.localeCompare(b.id);
  });
}
