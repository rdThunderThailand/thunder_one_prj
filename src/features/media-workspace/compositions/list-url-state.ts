// Compositions list state (filters/sort/page) round-tripped through the URL query string so
// refresh, back/forward and copy-paste all reproduce the same view. Mirrors
// src/features/media-workspace/layouts/list-url-state.ts.

import { COMPOSITION_STATUSES, type CompositionStatus } from "./types/index.ts";
import { SORT_KEYS, DEFAULT_SORT, type ListFilters, type Sort, type SortKey } from "./list-filtering.ts";

export const PER_PAGE_OPTIONS = [10, 25, 50] as const;

export type ListState = {
  filters: ListFilters;
  sort: Sort;
  page: number;
  perPage: number;
};

export const DEFAULT_STATE: ListState = {
  filters: { query: "", status: "all" },
  sort: DEFAULT_SORT,
  page: 1,
  perPage: 10,
};

function oneOf<T extends string>(values: readonly T[], raw: string | null): T | null {
  return values.includes(raw as T) ? (raw as T) : null;
}

export function readListState(params: URLSearchParams): ListState {
  const query = params.get("q") ?? "";
  const status = oneOf<CompositionStatus>(COMPOSITION_STATUSES, params.get("status")) ?? "all";

  const sortKey = oneOf<SortKey>(SORT_KEYS, params.get("sort"));
  const sort: Sort =
    sortKey === null ? DEFAULT_SORT : { key: sortKey, dir: oneOf(["asc", "desc"] as const, params.get("dir")) ?? DEFAULT_SORT.dir };

  const pageRaw = Number.parseInt(params.get("page") ?? "", 10);
  const page = Number.isInteger(pageRaw) && pageRaw >= 1 ? pageRaw : 1;

  const perRaw = Number.parseInt(params.get("per") ?? "", 10);
  const perPage = (PER_PAGE_OPTIONS as readonly number[]).includes(perRaw) ? perRaw : 10;

  return { filters: { query, status }, sort, page, perPage };
}

export function writeListState(state: ListState): string {
  const params = new URLSearchParams();

  if (state.filters.query !== DEFAULT_STATE.filters.query) params.set("q", state.filters.query);
  if (state.filters.status !== DEFAULT_STATE.filters.status) params.set("status", state.filters.status);

  if (state.sort.key !== DEFAULT_SORT.key || state.sort.dir !== DEFAULT_SORT.dir) {
    params.set("sort", state.sort.key);
    params.set("dir", state.sort.dir);
  }

  if (state.page !== DEFAULT_STATE.page) params.set("page", String(state.page));
  if (state.perPage !== DEFAULT_STATE.perPage) params.set("per", String(state.perPage));

  return params.toString();
}
