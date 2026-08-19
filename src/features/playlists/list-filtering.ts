// Everything the playlists list page derives from one dataset: the ownership tab, the
// filter row, the summary cards and the page slice. Kept out of the component so the
// whole lot is checkable without React — see list-filtering.check.mts.

import { decodeMetadata } from "./metadata.ts";
import type { PlaylistListItem, PlaylistStatus, PlaylistType } from "./types";

export type OwnershipTab = "all" | "mine";

export type ListFilters = {
  tab: OwnershipTab;
  /** Null while the session hasn't resolved — "My Playlists" then matches nothing. */
  currentUserId: string | null;
  query: string;
  status: PlaylistStatus | "all";
  type: PlaylistType | "all";
  campaignId: string | "all";
};

/** Rows written before the wizard stored a type read as standard — same default the
 *  table has always displayed, so the filter can never hide a row the column shows. */
export function playlistType(playlist: PlaylistListItem): PlaylistType {
  return decodeMetadata(playlist.metadata).info.playlistType ?? "standard";
}

export function playlistCampaignId(playlist: PlaylistListItem): string | undefined {
  return decodeMetadata(playlist.metadata).info.campaignId;
}

export function filterPlaylists(
  playlists: PlaylistListItem[],
  filters: ListFilters
): PlaylistListItem[] {
  const needle = filters.query.trim().toLowerCase();
  return playlists.filter((p) => {
    if (filters.tab === "mine" && p.created_by?.id !== filters.currentUserId) return false;
    if (filters.status !== "all" && p.status !== filters.status) return false;
    if (filters.type !== "all" && playlistType(p) !== filters.type) return false;
    if (filters.campaignId !== "all" && playlistCampaignId(p) !== filters.campaignId) return false;
    if (needle && !p.name.toLowerCase().includes(needle)) return false;
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

export type Summary = { total: number; active: number; inactive: number; draft: number };

export function summarize(playlists: PlaylistListItem[]): Summary {
  return {
    total: playlists.length,
    active: playlists.filter((p) => p.status === "active").length,
    inactive: playlists.filter((p) => p.status === "inactive").length,
    draft: playlists.filter((p) => p.status === "draft").length,
  };
}

/** `media_core.playlists` is UNIQUE (tenant_id, name), so a duplicate has to pick a name
 *  no existing playlist holds — the list page already has every name in memory, which is
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
