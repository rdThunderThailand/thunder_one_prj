// Client-side tag filtering for the playlists list — the Tags-tab counterpart to
// folder-filtering.ts. `media_playlists_list` returns each row's `tags` (Thunder_Core #41),
// so the Tags tab's list and its counts are derived from those rows rather than the
// tenant's full vocabulary: a tag no Playlist uses does not appear (ADR 0060 §8a).
// Kept pure — checkable with node:assert, see tag-filtering.check.mts.

import type { PlaylistListItem } from "./types";

export type TagCount = { id: string; name: string; count: number };

/** Tags actually used by the given playlists, with per-tag counts, sorted by name. */
export function tagCounts(playlists: readonly PlaylistListItem[]): TagCount[] {
  const byId = new Map<string, TagCount>();
  for (const playlist of playlists) {
    for (const tag of playlist.tags ?? []) {
      const existing = byId.get(tag.id);
      if (existing) existing.count += 1;
      else byId.set(tag.id, { id: tag.id, name: tag.name, count: 1 });
    }
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function filterByTag(playlists: readonly PlaylistListItem[], tagId: string): PlaylistListItem[] {
  return playlists.filter((playlist) => (playlist.tags ?? []).some((tag) => tag.id === tagId));
}
