"use client";

import { usePlaylistDraftStore } from "../store/usePlaylistDraftStore";
import { setPlaylistItems, upsertPlaylist } from "../services/playlists-api";
import { encodeMetadata } from "../metadata";
import { resolveDraftStatus } from "../resolve-draft-status";

/** The backend rejection that means "this draft id is no longer usable" — the row
 *  was deleted, or moved out of 'draft' from elsewhere. Matched on message because
 *  the proxy only forwards `{ error: string }`. Same shape as publications'
 *  isStaleDraftError in usePublishDraft.ts. */
export function isStaleDraftError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : "";
  return msg.includes("playlist not found for this tenant");
}

/** Writes the whole draft — name, metadata and items — in one cycle. Used by
 *  Next, by the Save Draft button, and by the final submit; only `activate`
 *  differs between them. Throws on failure so the caller can decide between the
 *  revision-conflict banner and an inline error. */
export function usePlaylistDraftSave() {
  const persistDraft = async ({ activate }: { activate: boolean }): Promise<string> => {
    const current = usePlaylistDraftStore.getState();
    const existingId = current.playlistId ?? current.editingId;
    const metadata = encodeMetadata({ info: current.info, playback: current.playback });

    let playlistId: string;
    try {
      const res = await upsertPlaylist({
        name: current.name.trim(),
        status: resolveDraftStatus(existingId, activate),
        metadata,
        playlistId: existingId,
        expectedRevision: current.revision,
        idempotencyKey: current.idempotencyKey,
      });
      playlistId = res.playlist_id;
      current.setPlaylistId(res.playlist_id);
      current.setRevision(res.revision);
    } catch (err) {
      if (!isStaleDraftError(err)) throw err;
      // Re-mint first: reusing the old key would resolve the retry back to the
      // same dead row instead of creating a fresh draft.
      current.resetIdempotencyKey();
      current.setPlaylistId(null);
      current.setRevision(null);
      const res = await upsertPlaylist({
        name: current.name.trim(),
        status: resolveDraftStatus(null, activate),
        metadata,
        idempotencyKey: usePlaylistDraftStore.getState().idempotencyKey,
      });
      playlistId = res.playlist_id;
      usePlaylistDraftStore.setState({ editingId: null });
      current.setPlaylistId(res.playlist_id);
      current.setRevision(res.revision);
    }

    const itemsRes = await setPlaylistItems(
      playlistId,
      usePlaylistDraftStore.getState().items.map((item, index) => ({
        media_asset_id: item.mediaAssetId,
        position: index,
        ...(item.durationSeconds != null ? { duration_seconds: item.durationSeconds } : {}),
        transition: item.transition,
      }))
    );
    // set_items bumps revision server-side; dropping it makes the next save
    // conflict with itself.
    if (typeof itemsRes.revision === "number") current.setRevision(itemsRes.revision);

    return playlistId;
  };

  return { persistDraft };
}
