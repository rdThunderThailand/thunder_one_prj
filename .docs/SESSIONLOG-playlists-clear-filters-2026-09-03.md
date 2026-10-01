# Session Log: Playlists Clear Filters Label

Date: 2026-09-03

## Scope

- Renamed the playlist filters reset button from `Clear all` to `Clear filters`.
- Removed `Clear filters` from the Trash view.
- Added an `Empty Trash` button in the Trash view with a confirmation modal.
- `Empty Trash` permanently deletes trash rows that can be deleted and skips playlists locked by publication history.

## Verification

- `pnpm exec eslint src/features/media-workspace/playlists/components/PlaylistsListPage.tsx src/features/media-workspace/playlists/components/PlaylistsFilters.tsx`
- `pnpm exec tsc --noEmit`
- `rg -n "Clear all|Clear filters" src/features/media-workspace/playlists/components/PlaylistsFilters.tsx`
