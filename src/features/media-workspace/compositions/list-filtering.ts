// Everything the Compositions list page derives from one dataset: the filter row, the summary
// cards and the page slice. Mirrors src/features/media-workspace/layouts/list-filtering.ts —
// same shape, minus the keys that have no meaning for a Composition.

import type { CompositionListItem, CompositionStatus } from "./types";

export type ListFilters = {
  query: string;
  status: CompositionStatus | "all";
};

export function filterCompositions(
  compositions: CompositionListItem[],
  filters: ListFilters,
): CompositionListItem[] {
  const needle = filters.query.trim().toLowerCase();
  return compositions.filter((c) => {
    if (filters.status !== "all" && c.status !== filters.status) return false;
    if (needle && !c.name.toLowerCase().includes(needle)) return false;
    return true;
  });
}

export type Page<T> = { rows: T[]; page: number; totalPages: number };

export function paginate<T>(items: T[], page: number, perPage: number): Page<T> {
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const current = Math.min(Math.max(1, Math.trunc(page)), totalPages);
  const start = (current - 1) * perPage;
  return { rows: items.slice(start, start + perPage), page: current, totalPages };
}

export type Summary = { total: number; draft: number; active: number; inactive: number };

export function summarize(compositions: CompositionListItem[]): Summary {
  const summary: Summary = { total: compositions.length, draft: 0, active: 0, inactive: 0 };
  for (const c of compositions) summary[c.status] += 1;
  return summary;
}

/** `media_core.compositions` is UNIQUE (tenant_id, name) — same helper as Layouts/Playlists. */
export function copyName(base: string, existingNames: string[]): string {
  const taken = new Set(existingNames);
  const stem = base.slice(0, 180);
  for (let n = 1; n < 100; n += 1) {
    const candidate = n === 1 ? `${stem} (Copy)` : `${stem} (Copy ${n})`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${stem} (Copy ${Date.now()})`;
}

export const SORT_KEYS = ["name", "layout", "zones", "status", "updated"] as const;
export type SortKey = (typeof SORT_KEYS)[number];
export type SortDir = "asc" | "desc";
export type Sort = { key: SortKey; dir: SortDir };
export const DEFAULT_SORT: Sort = { key: "updated", dir: "desc" };

const STATUS_ORDER: Record<CompositionStatus, number> = { draft: 0, active: 1, inactive: 2 };

function sortValue(composition: CompositionListItem, key: SortKey): string | number | null {
  switch (key) {
    case "name":
      return composition.name;
    case "layout":
      return composition.layout_name;
    case "zones":
      return composition.bound_count;
    case "status":
      return STATUS_ORDER[composition.status];
    case "updated": {
      const ms = Date.parse(composition.updated_at ?? composition.created_at ?? "");
      return Number.isNaN(ms) ? null : ms;
    }
  }
}

function compareValues(a: string | number | null, b: string | number | null, dirMultiplier: number): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  const raw = typeof a === "string" ? a.localeCompare(b as string) : a - (b as number);
  return raw * dirMultiplier;
}

export function sortCompositions(compositions: CompositionListItem[], sort: Sort): CompositionListItem[] {
  const dirMultiplier = sort.dir === "asc" ? 1 : -1;

  return [...compositions].sort((a, b) => {
    const cmp = compareValues(sortValue(a, sort.key), sortValue(b, sort.key), dirMultiplier);
    if (cmp !== 0) return cmp;
    return a.name.localeCompare(b.name) || a.id.localeCompare(b.id);
  });
}
