# Playlist Create Modal - 2026-09-03

## Scope

- Changed the `+ Create Playlist` action on `/media-workspace/playlists` from direct navigation to a create modal.
- The modal asks for Playlist name and destination Folder before advancing.

## Change

- Added `CreatePlaylistDialog`.
- `Next` creates a draft Playlist, optionally moves it into the selected Folder, then opens the saved Playlist editor route.
- Defaults the modal Folder to the currently selected folder when the list is already inside a real folder; otherwise it starts as Uncategorized.

## Verification

- `pnpm exec eslint src/features/media-workspace/playlists/components/CreatePlaylistDialog.tsx src/features/media-workspace/playlists/components/PlaylistsListPage.tsx`
- `pnpm exec tsc --noEmit`
- Browser: clicked `+ Create Playlist` on `/media-workspace/playlists`; modal showed `Playlist name`, `Folder`, and `Next`. `Next` was disabled while the name was blank and enabled after entering a name. Did not click `Next` during browser verification because it creates a draft Playlist record.
