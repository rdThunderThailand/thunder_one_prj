import { fetchPlaylist, requestApi } from "@/lib/api/media-api";
import type { PlaylistStatus, Transition } from "../types";

// Reads (fetchPlaylist, fetchPlaylists) live in src/lib/api/media-api.ts — see
// docs/adr/0020 — since publications reads playlists too and a feature service
// isn't a legal import target from outside the feature. Re-exported here so
// existing call sites in this feature keep working unchanged.
export { fetchPlaylist, fetchPlaylists } from "@/lib/api/media-api";

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

/**
 * There is no duplicate endpoint for playlists (publications have one, playlists never
 * needed it until now) — the copy is composed from the two writes the wizard already
 * makes. It lands as a draft on purpose: if the items call fails, a half-copied playlist
 * is unfinished rather than something a screen could pick up.
 */
export async function duplicatePlaylist(
  sourceId: string,
  name: string
): Promise<{ playlistId: string; itemsCopied: boolean }> {
  const source = await fetchPlaylist(sourceId);
  const { playlist_id } = await upsertPlaylist({
    name,
    status: "draft",
    metadata: source.metadata,
    idempotencyKey: crypto.randomUUID(),
  });

  if (source.items.length === 0) return { playlistId: playlist_id, itemsCopied: true };

  try {
    await setPlaylistItems(
      playlist_id,
      [...source.items]
        .sort((a, b) => a.position - b.position)
        .map((item, index) => ({
          media_asset_id: item.media_asset_id,
          position: index,
          // Omitted, not null: that is how the backend is told to fall back to the
          // asset's own duration.
          ...(item.duration_seconds != null ? { duration_seconds: item.duration_seconds } : {}),
          transition: item.transition,
        }))
    );
    return { playlistId: playlist_id, itemsCopied: true };
  } catch {
    return { playlistId: playlist_id, itemsCopied: false };
  }
}

/**
 * Hard delete (Thunder_Core migration 097). The RPC refuses while any publication still
 * points at the playlist, so a caller must surface that message — see `describeDeleteError`.
 */
export async function deletePlaylist(id: string): Promise<void> {
  await requestApi<unknown>("DELETE", `/media/playlists/${id}`);
}

/** Replaces the playlist's items wholesale — positions must already be 0-based and dense. */
export async function setPlaylistItems(
  id: string,
  items: PlaylistItemPayload[]
): Promise<{ item_count?: number; revision?: number }> {
  return requestApi("PUT", `/media/playlists/${id}/items`, { items });
}
