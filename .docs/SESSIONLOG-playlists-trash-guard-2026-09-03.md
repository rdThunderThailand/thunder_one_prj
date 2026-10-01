# Session Log: Playlists Trash Guard

Date: 2026-09-03

## Scope

- Diagnosed why `/media-workspace/playlists?folder=trash` showed the normal playlist list.
- Added a frontend guard so Trash only renders playlists explicitly marked soft-deleted.

## Root Cause

- The playlists page selected the trash dataset when `folder=trash`.
- The page trusted the backend response from `fetchPlaylists(true, true)` as already trash-only.
- When the running Core response ignored or did not support `trash=true`, it returned the normal active list, so the UI rendered all playlists in Trash.

## Changes

- Added optional `deleted_at` to `PlaylistListItem`.
- Added `filterTrashedPlaylists()` in `folder-filtering.ts`.
- Applied that guard in `usePlaylistsListData()` before storing the trash dataset.
- Added a regression assertion that active rows do not pass through the trash guard.

## Verification

- `node src/features/media-workspace/playlists/folder-filtering.check.mts` passed.
- `pnpm exec eslint src/features/media-workspace/playlists src/types/domain.ts` passed.
- `pnpm exec tsc --noEmit` passed.
- Browser check on `http://localhost:3000/media-workspace/playlists?folder=trash` passed:
  - table row count was 0 for the current dataset.
  - `ถังขยะว่าง` was visible.
  - normal active playlist names were not visible.

## Notes

- Browser verification did not submit any write actions.
- Core should still return `deleted_at` on playlist list rows for real trashed playlists to render in the frontend Trash view.
