// Playlists list state (tab/filters/sort/page) round-tripped through the URL query
// string so refresh, back/forward and copy-paste all reproduce the same view — see
// docs/adr/0027-playlist-list-url-state.md. Kept pure so it's checkable without React.

import { PLAYLIST_STATUSES, PLAYLIST_TYPES, type PlaylistStatus, type PlaylistType } from "./types/index.ts";
import { SORT_KEYS, DEFAULT_SORT, type OwnershipTab, type Sort, type SortKey } from "./list-filtering.ts";
import type { FilterState } from "./components/PlaylistsFilters.tsx";

export const PER_PAGE_OPTIONS = [10, 25, 50] as const;

export type ListState = {
  tab: OwnershipTab;
  filters: FilterState;
  sort: Sort;
  page: number;
  perPage: number;
};

const DEFAULT_STATE: ListState = {
  tab: "all",
  filters: { query: "", status: "all", type: "all", campaignId: "all" },
  sort: DEFAULT_SORT,
  page: 1,
  perPage: 10,
};

function oneOf<T extends string>(values: readonly T[], raw: string | null): T | null {
  return values.includes(raw as T) ? (raw as T) : null;
}

export function readListState(params: URLSearchParams): ListState {
  const tab: OwnershipTab = params.get("tab") === "mine" ? "mine" : "all";
  const query = params.get("q") ?? "";
  const status = oneOf<PlaylistStatus>(PLAYLIST_STATUSES, params.get("status")) ?? "all";
  const type = oneOf<PlaylistType>(PLAYLIST_TYPES, params.get("type")) ?? "all";
  const campaignId = params.get("campaign") || "all";

  // Key and dir travel together: an unrecognised (or absent) key resets dir too, so a
  // stray "dir" param can never survive without its matching "sort" param.
  const sortKey = oneOf<SortKey>(SORT_KEYS, params.get("sort"));
  const sort: Sort =
    sortKey === null ? DEFAULT_SORT : { key: sortKey, dir: oneOf(["asc", "desc"] as const, params.get("dir")) ?? DEFAULT_SORT.dir };

  const pageRaw = Number.parseInt(params.get("page") ?? "", 10);
  const page = Number.isInteger(pageRaw) && pageRaw >= 1 ? pageRaw : 1;

  const perRaw = Number.parseInt(params.get("per") ?? "", 10);
  const perPage = (PER_PAGE_OPTIONS as readonly number[]).includes(perRaw) ? perRaw : 10;

  return { tab, filters: { query, status, type, campaignId }, sort, page, perPage };
}

/** Only writes keys that differ from the default, so an untouched list page keeps a
 *  clean "/playlists" URL. */
export function writeListState(state: ListState): string {
  const params = new URLSearchParams();

  if (state.tab !== DEFAULT_STATE.tab) params.set("tab", state.tab);
  if (state.filters.query !== DEFAULT_STATE.filters.query) params.set("q", state.filters.query);
  if (state.filters.status !== DEFAULT_STATE.filters.status) params.set("status", state.filters.status);
  if (state.filters.type !== DEFAULT_STATE.filters.type) params.set("type", state.filters.type);
  if (state.filters.campaignId !== DEFAULT_STATE.filters.campaignId) params.set("campaign", state.filters.campaignId);

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
