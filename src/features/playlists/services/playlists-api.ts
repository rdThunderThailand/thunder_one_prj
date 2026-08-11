import { requestApi } from "@/lib/api/media-api";
import type { PlaylistDetail, PlaylistListItem, PlaylistStatus, Transition } from "../types";

type PlaylistWrite = {
  name: string;
  status?: PlaylistStatus;
  /** ponytail: dropped by the deployed route's zod schema until the Phase 2 migration lands
   *  (docs/playlists/plan-playlist-ui.md) — sending it early is harmless, not an error. */
  metadata?: Record<string, unknown>;
};

export async function fetchPlaylists(): Promise<PlaylistListItem[]> {
  const data = await requestApi<{ playlists?: PlaylistListItem[] } | PlaylistListItem[]>(
    "GET",
    "/media/playlists"
  );
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object" && Array.isArray(data.playlists)) {
    return data.playlists;
  }
  return [];
}

export async function fetchPlaylist(id: string): Promise<PlaylistDetail> {
  return requestApi<PlaylistDetail>("GET", `/media/playlists/${id}`);
}

export async function createPlaylist(body: PlaylistWrite): Promise<{ playlist_id: string }> {
  return requestApi<{ playlist_id: string }>("POST", "/media/playlists", body);
}

export async function updatePlaylist(
  id: string,
  body: PlaylistWrite
): Promise<{ playlist_id: string }> {
  return requestApi<{ playlist_id: string }>("PATCH", `/media/playlists/${id}`, body);
}

/** What `PUT /{id}/items` accepts — `duration_seconds` is omitted (not null) to let the
 *  backend fall back to the asset's own duration. */
export type PlaylistItemPayload = {
  media_asset_id: string;
  position: number;
  duration_seconds?: number;
  transition?: Transition;
};

/** Replaces the playlist's items wholesale — positions must already be 0-based and dense. */
export async function setPlaylistItems(
  id: string,
  items: PlaylistItemPayload[]
): Promise<{ item_count?: number }> {
  return requestApi<{ item_count?: number }>("PUT", `/media/playlists/${id}/items`, { items });
}
