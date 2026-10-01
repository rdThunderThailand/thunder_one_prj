# Playlist Preview Link Fix - 2026-09-03

## Scope

- Fixed the playlist list preview action so `/media-workspace/preview/playlist/{playlistId}` can render a saved Playlist directly.
- Preserved the existing live editor preview handoff via `previewSession`.

## Root Cause

`FullPreviewPage` treated every Playlist preview without `previewSession` as expired because Playlist preview originally only opened from the live editor. The list action linked to the correct route, but the preview page refused to load by id.

## Change

- Added by-id Playlist loading in `FullPreviewPage`.
- Reused `fetchPlaylist`, `decodeMetadata`, and `playlistPreviewStage` so the saved Playlist route uses the same one-zone preview payload as the editor handoff.

## Verification

- `node src/features/media-workspace/preview/playlist-preview.check.mts`
- `pnpm exec eslint src/features/media-workspace/preview/FullPreviewPage.tsx src/features/media-workspace/playlists/components/PlaylistsTable.tsx`
- `pnpm exec tsc --noEmit`
- Browser: clicked the first preview icon on `/media-workspace/playlists`; it navigated to `/media-workspace/preview/playlist/8064d28c-26cd-4d4a-84c4-13d0a39d6358` and rendered `Preview Playlist`, timeline items, controls, and playlist information with no console errors.
