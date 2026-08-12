import { requestApi } from "@/lib/api/media-api";
import type { PlaylistDetail, PlaylistListItem, PlaylistStatus, Transition } from "../types";

/** `includeDrafts` defaults to `false` so a caller that forgets to opt in never
 *  leaks drafts into the publication content picker — an unfinished playlist
 *  must never be selectable for scheduling. */
export async function fetchPlaylists(includeDrafts = false): Promise<PlaylistListItem[]> {
  const path = includeDrafts ? "/media/playlists?include_drafts=true" : "/media/playlists";
  const data = await requestApi<{ playlists?: PlaylistListItem[] } | PlaylistListItem[]>(
    "GET",
    path
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

export type UpsertPlaylistInput = {
  name: string;
  status?: PlaylistStatus;
  metadata?: Record<string, unknown>;
  playlistId?: string | null;
  /** Only meaningful on an update — a fresh draft (POST) has no revision to
   *  race against yet. `media_playlist_upsert` skips the check when omitted. */
  expectedRevision?: number | null;
  /** Only sent on create: an update already addresses the row by id and
   *  never needs a dedupe key. */
  idempotencyKey?: string;
};

export async function upsertPlaylist(
  input: UpsertPlaylistInput
): Promise<{ playlist_id: string; revision: number }> {
  const body: Record<string, unknown> = { name: input.name.trim() };
  if (input.status) body.status = input.status;
  if (input.metadata) body.metadata = input.metadata;

  if (input.playlistId) {
    if (input.expectedRevision != null) body.expected_revision = input.expectedRevision;
    return requestApi("PATCH", `/media/playlists/${input.playlistId}`, body);
  }
  if (input.idempotencyKey) body.idempotency_key = input.idempotencyKey;
  return requestApi("POST", "/media/playlists", body);
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
): Promise<{ item_count?: number; revision?: number }> {
  return requestApi("PUT", `/media/playlists/${id}/items`, { items });
}
