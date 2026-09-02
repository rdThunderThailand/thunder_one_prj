// Everything the playlists list page derives from one dataset: the ownership tab, the
// filter row, the summary cards and the page slice. Kept out of the component so the
// whole lot is checkable without React — see list-filtering.check.mts.

import { decodeMetadata } from "./metadata.ts";
import { playlistDisplayStatus } from "./status-display.ts";
import type { PlaylistListItem, PlaylistStatus, PlaylistType } from "./types";

export type OwnershipTab = "all" | "mine";

/** What the list's Type column and filter show — distinct from `PlaylistType`
 *  (standard/dynamic, an unrelated metadata concept the create wizard still owns). */
export const CONTENT_TYPES = ["video", "image", "mixed"] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

export type ListFilters = {
  tab: OwnershipTab;
  /** Null while the session hasn't resolved — "My Playlists" then matches nothing. */
  currentUserId: string | null;
  query: string;
  status: PlaylistStatus | "all";
  type: ContentType | "all";
  campaignId: string | "all";
};

/** Rows written before the wizard stored a type read as standard — same default the
 *  table has always displayed, so the filter can never hide a row the column shows. */
export function playlistType(playlist: PlaylistListItem): PlaylistType {
  return decodeMetadata(playlist.metadata).info.playlistType ?? "standard";
}

/** Video / Image / Mixed, derived from the distinct asset kinds the playlist's items
 *  hold (Thunder_Core migration 20260902160000) — null for a playlist with no items or
 *  for a row a stale backend hasn't caught up to yet, rendered as "—". */
export function playlistContentType(playlist: PlaylistListItem): ContentType | null {
  const kinds = new Set(playlist.item_kinds ?? []);
  if (kinds.size === 0) return null;
  if (kinds.size > 1) return "mixed";
  return kinds.has("video") ? "video" : "image";
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
    if (filters.status !== "all" && playlistDisplayStatus(p) !== filters.status) return false;
    if (filters.type !== "all" && playlistContentType(p) !== filters.type) return false;
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
  const summary: Summary = { total: playlists.length, active: 0, inactive: 0, draft: 0 };
  for (const p of playlists) summary[playlistDisplayStatus(p)] += 1;
  return summary;
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

export const SORT_KEYS = ["name", "type", "campaign", "duration", "status", "updated"] as const;
export type SortKey = (typeof SORT_KEYS)[number];
export type SortDir = "asc" | "desc";
export type Sort = { key: SortKey; dir: SortDir };
export const DEFAULT_SORT: Sort = { key: "updated", dir: "desc" };

const STATUS_ORDER: Record<PlaylistStatus, number> = { active: 0, inactive: 1, draft: 2 };

/** null means "empty" — sortPlaylists always pushes empty values to the bottom,
 *  regardless of direction, instead of letting them flip to the top on desc. */
function sortValue(
  playlist: PlaylistListItem,
  key: SortKey,
  campaignNames: Record<string, string>
): string | number | null {
  switch (key) {
    case "name":
      return playlist.name;
    case "type":
      return playlistContentType(playlist);
    case "campaign":
      return campaignNames[playlistCampaignId(playlist) ?? ""] || null;
    case "duration":
      return playlist.total_duration_seconds ?? null;
    case "status":
      return STATUS_ORDER[playlistDisplayStatus(playlist)];
    case "updated": {
      const ms = Date.parse(playlist.updated_at ?? playlist.created_at ?? "");
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

export function sortPlaylists(
  playlists: PlaylistListItem[],
  sort: Sort,
  campaignNames: Record<string, string>
): PlaylistListItem[] {
  const dirMultiplier = sort.dir === "asc" ? 1 : -1;

  return [...playlists].sort((a, b) => {
    const cmp = compareValues(
      sortValue(a, sort.key, campaignNames),
      sortValue(b, sort.key, campaignNames),
      dirMultiplier
    );
    if (cmp !== 0) return cmp;
    return a.name.localeCompare(b.name) || a.id.localeCompare(b.id);
  });
}
