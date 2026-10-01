# Playlist Trash Read Guard - 2026-09-03

## Scope

- Investigated why a Playlist moved to Trash disappeared from the active list but did not appear in the Trash folder.
- Tightened the frontend Trash filter so it can render soft-deleted rows even when the Core list row omits `deleted_at`.

## Finding

- Browser showed active playlist total dropping from 11 to 10 after the user's trash action, but `/media-workspace/playlists?folder=trash` still rendered 0 rows.
- Frontend proxy config points to `CORE_API_URL=http://localhost:3001`.
- Thunder_Core has the playlist trash route/migration work present as dirty/untracked files on branch `fix/playlist`, so the Trash read path is not complete from the running backend/database state.

## Change

- `filterTrashedPlaylists` now accepts the active playlist dataset.
- A row is treated as trashed when it has `deleted_at`, or when it appears in the Trash response but no longer appears in the active response.
- `usePlaylistsListData` now loads/uses the active dataset before filtering Trash rows.

## Verification

- `node src/features/media-workspace/playlists/folder-filtering.check.mts`
- `pnpm exec eslint src/features/media-workspace/playlists/folder-filtering.ts src/features/media-workspace/playlists/folder-filtering.check.mts src/features/media-workspace/playlists/use-playlists-list-data.ts`
- `pnpm exec tsc --noEmit`
- Browser read-only verification: reloaded `/media-workspace/playlists?folder=trash`; Trash still showed 0 rows while the active total was 10, confirming the remaining blocker is Core/database returning no trashed rows to the frontend.
