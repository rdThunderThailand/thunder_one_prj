// Playlists list state (folder/filters/sort/page) round-tripped through the URL query
// string so refresh, back/forward and copy-paste all reproduce the same view — see
// docs/adr/0027-playlist-list-url-state.md. Kept pure so it's checkable without React.

import { PLAYLIST_STATUSES, type PlaylistStatus } from "./types/index.ts";
import {
  CONTENT_TYPES,
  SORT_KEYS,
  DEFAULT_SORT,
  type ContentType,
  type Sort,
  type SortKey,
} from "./list-filtering.ts";
import type { FilterState } from "./components/PlaylistsFilters.tsx";

export const PER_PAGE_OPTIONS = [10, 25, 50] as const;

/** Folder rail selection (#38 / #40): a folder id, or one of the three virtual
 *  collections. Absent from the URL means "all". */
export type Collection = "all" | "uncategorized" | "trash" | (string & {});

export type ListState = {
  collection: Collection;
  /** Tags-tab selection (#41) — mutually exclusive with `collection` by construction:
   *  writeListState never emits both `folder` and `tag`, and readListState treats a
   *  present `tag` param as clearing the folder selection back to "all". */
  tagId: string | null;
  filters: FilterState;
  sort: Sort;
  page: number;
  perPage: number;
};

export const DEFAULT_STATE: ListState = {
  collection: "all",
  tagId: null,
  filters: { query: "", status: "all", type: "all" },
  sort: DEFAULT_SORT,
  page: 1,
  perPage: 10,
};

function oneOf<T extends string>(values: readonly T[], raw: string | null): T | null {
  return values.includes(raw as T) ? (raw as T) : null;
}

export function readListState(params: URLSearchParams): ListState {
  const tagId = params.get("tag");
  const collection: Collection = tagId ? "all" : params.get("folder") || "all";
  const query = params.get("q") ?? "";
  const status = oneOf<PlaylistStatus>(PLAYLIST_STATUSES, params.get("status")) ?? "all";
  const type = oneOf<ContentType>(CONTENT_TYPES, params.get("type")) ?? "all";

  // Key and dir travel together: an unrecognised (or absent) key resets dir too, so a
  // stray "dir" param can never survive without its matching "sort" param.
  const sortKey = oneOf<SortKey>(SORT_KEYS, params.get("sort"));
  const sort: Sort =
    sortKey === null ? DEFAULT_SORT : { key: sortKey, dir: oneOf(["asc", "desc"] as const, params.get("dir")) ?? DEFAULT_SORT.dir };

  const pageRaw = Number.parseInt(params.get("page") ?? "", 10);
  const page = Number.isInteger(pageRaw) && pageRaw >= 1 ? pageRaw : 1;

  const perRaw = Number.parseInt(params.get("per") ?? "", 10);
  const perPage = (PER_PAGE_OPTIONS as readonly number[]).includes(perRaw) ? perRaw : 10;

  return { collection, tagId, filters: { query, status, type }, sort, page, perPage };
}

/** Only writes keys that differ from the default, so an untouched list page keeps a
 *  clean "/playlists" URL. */
export function writeListState(state: ListState): string {
  const params = new URLSearchParams();

  // A tag selection wins the URL: never write `folder` alongside `tag`, so the two can
  // never disagree on a copy-pasted link.
  if (state.tagId) params.set("tag", state.tagId);
  else if (state.collection !== DEFAULT_STATE.collection) params.set("folder", state.collection);
  if (state.filters.query !== DEFAULT_STATE.filters.query) params.set("q", state.filters.query);
  if (state.filters.status !== DEFAULT_STATE.filters.status) params.set("status", state.filters.status);
  if (state.filters.type !== DEFAULT_STATE.filters.type) params.set("type", state.filters.type);

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
