// Pure function — no React — determines the empty-state cause from the current
// filter/tab context. Checkable with node:assert like the rest of the feature.

import { DEFAULT_STATE } from "./list-url-state.ts";
import type { FilterState } from "./components/PlaylistsFilters.tsx";
import type { OwnershipTab } from "./list-filtering.ts";

export type EmptyCause = "no-playlists" | "no-match" | "no-mine";

/** True when any filter differs from the defaults that readListState produces.
 *  Imports DEFAULT_STATE directly so there is only one copy of the defaults. */
export function hasActiveFilters(filters: FilterState): boolean {
  const def = DEFAULT_STATE.filters;
  return (
    filters.query !== def.query ||
    filters.status !== def.status ||
    filters.type !== def.type ||
    filters.campaignId !== def.campaignId
  );
}

export function emptyCause(args: {
  totalCount: number;      // playlists.length (unfiltered)
  mineCount: number;
  tab: OwnershipTab;
  hasActiveFilters: boolean;
}): EmptyCause {
  if (args.totalCount === 0) return "no-playlists";
  if (args.hasActiveFilters) return "no-match";
  if (args.tab === "mine" && args.mineCount === 0) return "no-mine";
  return "no-match";
}
