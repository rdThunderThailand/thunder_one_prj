import type { ChannelCategory, ChannelFilters, ChannelLifecycle } from "./types/index.ts";
import { SORT_KEYS, DEFAULT_SORT, type Sort, type SortKey } from "./list-filtering.ts";

export const PER_PAGE_OPTIONS = [10, 25, 50] as const;

export type ListState = { filters: ChannelFilters; sort: Sort; page: number; perPage: number };

export const DEFAULT_STATE: ListState = {
  filters: { search: "", category: "all", lifecycle: "all" },
  sort: DEFAULT_SORT,
  page: 1,
  perPage: 10,
};

function oneOf<T extends string>(values: readonly T[], raw: string | null): T | null {
  return values.includes(raw as T) ? (raw as T) : null;
}

const CATEGORIES: ChannelCategory[] = ["dooh", "in_store", "online", "social"];
const LIFECYCLES: ChannelLifecycle[] = ["draft", "active", "inactive"];

export function readListState(params: URLSearchParams): ListState {
  const search = params.get("q") ?? "";
  const category = oneOf<ChannelCategory>(CATEGORIES, params.get("tab")) ?? "all";
  const lifecycle = oneOf<ChannelLifecycle>(LIFECYCLES, params.get("lifecycle")) ?? "all";

  // Key and dir travel together: an unrecognised (or absent) key resets dir too, so a
  // stray "dir" param can never survive without its matching "sort" param.
  const sortKey = oneOf<SortKey>(SORT_KEYS, params.get("sort"));
  const sort: Sort =
    sortKey === null
      ? DEFAULT_SORT
      : { key: sortKey, dir: oneOf(["asc", "desc"] as const, params.get("dir")) ?? DEFAULT_SORT.dir };

  const pageRaw = Number.parseInt(params.get("page") ?? "", 10);
  const page = Number.isInteger(pageRaw) && pageRaw >= 1 ? pageRaw : 1;

  const perRaw = Number.parseInt(params.get("per") ?? "", 10);
  const perPage = (PER_PAGE_OPTIONS as readonly number[]).includes(perRaw) ? perRaw : 10;

  return { filters: { search, category, lifecycle }, sort, page, perPage };
}

/** Only writes keys that differ from the default, so an untouched list page keeps a
 *  clean "/channels" URL. */
export function writeListState(state: ListState): string {
  const params = new URLSearchParams();

  if (state.filters.search !== DEFAULT_STATE.filters.search) params.set("q", state.filters.search);
  if (state.filters.category !== DEFAULT_STATE.filters.category) params.set("tab", state.filters.category);
  if (state.filters.lifecycle !== DEFAULT_STATE.filters.lifecycle) params.set("lifecycle", state.filters.lifecycle);

  // dir is only meaningful alongside its key (see readListState) — write both together
  // whenever either differs from default, so a non-default dir never gets stranded.
  if (state.sort.key !== DEFAULT_SORT.key || state.sort.dir !== DEFAULT_SORT.dir) {
    params.set("sort", state.sort.key);
    params.set("dir", state.sort.dir);
  }

  if (state.page !== DEFAULT_STATE.page) params.set("page", String(state.page));
  if (state.perPage !== DEFAULT_STATE.perPage) params.set("per", String(state.perPage));

  return params.toString();
}
