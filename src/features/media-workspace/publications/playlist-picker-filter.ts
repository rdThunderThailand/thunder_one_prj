import { playlistDisplayStatus } from "../playlists/status-display.ts";
import type { PlaylistListItem, PlaylistStatus } from "@/types/domain";

export type PlaylistPickerFilters = {
  query: string;
  status: PlaylistStatus | "all";
  creatorId: string;
  tagId: string;
  minDuration: string;
  maxDuration: string;
};

export const defaultPlaylistPickerFilters: PlaylistPickerFilters = {
  query: "",
  status: "all",
  creatorId: "",
  tagId: "",
  minDuration: "",
  maxDuration: "",
};

export function filterPlaylistPickerItems(
  playlists: PlaylistListItem[],
  filters: PlaylistPickerFilters
): PlaylistListItem[] {
  const query = filters.query.trim().toLowerCase();
  const min = filters.minDuration === "" ? null : Number(filters.minDuration);
  const max = filters.maxDuration === "" ? null : Number(filters.maxDuration);

  return playlists.filter((playlist) => {
    if (filters.status !== "all" && playlistDisplayStatus(playlist) !== filters.status) return false;
    if (filters.creatorId && playlist.created_by?.id !== filters.creatorId) return false;
    if (filters.tagId && !playlist.tags?.some((tag) => tag.id === filters.tagId)) return false;
    if (min !== null && Number.isFinite(min) && (playlist.total_duration_seconds ?? 0) < min) return false;
    if (max !== null && Number.isFinite(max) && (playlist.total_duration_seconds ?? 0) > max) return false;
    if (query && ![playlist.name, playlist.created_by?.display_name, ...(playlist.tags?.map((tag) => tag.name) ?? [])].some((value) => value?.toLowerCase().includes(query))) return false;
    return true;
  });
}
