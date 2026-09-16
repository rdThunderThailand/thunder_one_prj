// Client-side folder filtering for the playlists list. `media_playlists_list` returns
// every row (see the ponytail note in PlaylistsListPage), so the folder rail's filter
// and its subtree-inclusive counts are computed here rather than server-side.
// Kept pure — checkable with node:assert, see folder-filtering.check.mts.

import { folderSubtreeIds } from "../content-library/folder-tree.ts";
import type { FolderCollection } from "../content-library/ContentFolderRail.tsx";
import type { ContentFolder } from "../../../types/domain.ts";
import type { PlaylistListItem } from "./types";

/** Rows in the given collection: "all" → everything, "uncategorized" → no folder,
 *  a folder id → that folder and everything nested under it. "trash" is a separate
 *  dataset and is treated as "all" here. */
export function filterByCollection(
  playlists: PlaylistListItem[],
  collection: FolderCollection,
  folders: ContentFolder[]
): PlaylistListItem[] {
  if (collection === "all" || collection === "trash") return playlists;
  if (collection === "uncategorized") return playlists.filter((p) => !p.folder_id);
  const subtree = folderSubtreeIds(folders, collection);
  return playlists.filter((p) => p.folder_id != null && subtree.has(p.folder_id));
}

/** Defensive client guard for Trash: a stale Core can ignore `trash=true` and return
 *  the normal active list. Rows marked `deleted_at` are definitely trashed; rows
 *  missing from the active dataset are also trash even when Core omits `deleted_at`. */
export function filterTrashedPlaylists(
  playlists: PlaylistListItem[],
  activePlaylists: PlaylistListItem[] = []
): PlaylistListItem[] {
  const activeIds = new Set(activePlaylists.map((p) => p.id));
  return playlists.filter((p) => p.deleted_at != null || !activeIds.has(p.id));
}

/** Count by collection key ("all" | "uncategorized" | folderId), folders subtree-inclusive. */
export function folderCounts(
  playlists: PlaylistListItem[],
  folders: ContentFolder[]
): Record<string, number> {
  const direct = new Map<string, number>();
  let uncategorized = 0;
  for (const p of playlists) {
    if (p.folder_id == null) uncategorized += 1;
    else direct.set(p.folder_id, (direct.get(p.folder_id) ?? 0) + 1);
  }
  const counts: Record<string, number> = { all: playlists.length, uncategorized };
  for (const folder of folders) {
    let total = 0;
    for (const id of folderSubtreeIds(folders, folder.id)) total += direct.get(id) ?? 0;
    counts[folder.id] = total;
  }
  return counts;
}
