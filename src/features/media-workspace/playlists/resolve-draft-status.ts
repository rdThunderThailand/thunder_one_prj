import type { PlaylistStatus } from "./types";

/** Which `status` a save should send. `undefined` is meaningful, not a gap:
 *  `upsertPlaylist` omits a falsy status from the body and `media_playlist_upsert`
 *  then leaves the column untouched — that is how a draft save on an already
 *  published playlist avoids demoting it back to 'draft'. */
export function resolveDraftStatus(
  existingId: string | null,
  activate: boolean
): PlaylistStatus | undefined {
  if (activate) return "active";
  return existingId ? undefined : "draft";
}
