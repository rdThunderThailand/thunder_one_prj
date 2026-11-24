import assert from "node:assert/strict";
import type { PlaylistListItem } from "@/types/domain";
import { defaultPlaylistPickerFilters, filterPlaylistPickerItems } from "./playlist-picker-filter.ts";

const rows: PlaylistListItem[] = [
  { id: "a", name: "Summer Promo", status: "active", item_count: 3, total_duration_seconds: 90, created_by: { id: "u1", display_name: "Kantida" }, tags: [{ id: "t1", name: "Promo" }] },
  { id: "b", name: "Lobby Loop", status: "draft", item_count: 1, total_duration_seconds: 20, created_by: { id: "u2", display_name: "Nattapong" } },
];

assert.deepEqual(filterPlaylistPickerItems(rows, { ...defaultPlaylistPickerFilters, query: "promo" }).map((row) => row.id), ["a"]);
assert.deepEqual(filterPlaylistPickerItems(rows, { ...defaultPlaylistPickerFilters, creatorId: "u2" }).map((row) => row.id), ["b"]);
assert.deepEqual(filterPlaylistPickerItems(rows, { ...defaultPlaylistPickerFilters, tagId: "t1", minDuration: "60", maxDuration: "120" }).map((row) => row.id), ["a"]);
console.log("playlist-picker-filter checks passed");
