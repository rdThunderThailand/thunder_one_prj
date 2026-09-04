/** Run: node src/features/media-workspace/playlists/folder-filtering.check.mts */
import assert from "node:assert/strict";
import { filterByCollection, filterTrashedPlaylists, folderCounts } from "./folder-filtering.ts";
import type { ContentFolder } from "../../../types/domain.ts";
import type { PlaylistListItem } from "./types";

const folder = (id: string, parent_id: string | null): ContentFolder => ({ id, parent_id, name: id });

// tree:  a ─ a1 ─ a11
//        b
const folders: ContentFolder[] = [folder("a", null), folder("a1", "a"), folder("a11", "a1"), folder("b", null)];

const row = (id: string, folder_id: string | null): PlaylistListItem =>
  ({ id, name: id, status: "active", item_count: 0, folder_id });

const playlists = [row("p-a", "a"), row("p-a1", "a1"), row("p-a11", "a11"), row("p-b", "b"), row("p-none", null), row("p-none2", null)];

// "all" and "trash" pass everything through.
assert.equal(filterByCollection(playlists, "all", folders).length, 6);
assert.equal(filterByCollection(playlists, "trash", folders).length, 6);

// "uncategorized" — rows with no folder.
assert.deepEqual(filterByCollection(playlists, "uncategorized", folders).map((p) => p.id), ["p-none", "p-none2"]);

// a folder id — that folder plus its whole subtree.
assert.deepEqual(filterByCollection(playlists, "a", folders).map((p) => p.id), ["p-a", "p-a1", "p-a11"]);
assert.deepEqual(filterByCollection(playlists, "a1", folders).map((p) => p.id), ["p-a1", "p-a11"]);
assert.deepEqual(filterByCollection(playlists, "b", folders).map((p) => p.id), ["p-b"]);

// Trash must not show active rows when a stale backend ignores `trash=true`.
assert.deepEqual(
  filterTrashedPlaylists([
    row("active", null),
    { ...row("trashed", null), deleted_at: "2026-09-03T08:00:00.000Z" },
  ], [row("active", null)]).map((p) => p.id),
  ["trashed"]
);

// Core may return trash rows without `deleted_at`; if they are no longer in
// the active dataset they still belong in Trash.
assert.deepEqual(
  filterTrashedPlaylists([
    row("active", null),
    row("trashed-without-deleted-at", null),
  ], [row("active", null)]).map((p) => p.id),
  ["trashed-without-deleted-at"]
);

// counts: subtree-inclusive for folders, plus the two virtual collections.
assert.deepEqual(folderCounts(playlists, folders), {
  all: 6,
  uncategorized: 2,
  a: 3,
  a1: 2,
  a11: 1,
  b: 1,
});

console.log("folder-filtering.check.mts — all assertions passed");
