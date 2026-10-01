# Session Log: Playlists Full-height Card

Date: 2026-09-03

## Scope

- Keep the `/media-workspace/playlists` list card full height even when the selected folder is empty.

## Change

- Added the same `min-h-[calc(100dvh-8rem)]` root height used by the Layouts list page.

## Verification

- `pnpm exec eslint src/features/media-workspace/playlists/components/PlaylistsListPage.tsx` passed.
- `pnpm exec tsc --noEmit` passed.
- `git diff --check` passed.
- Browser check on `http://localhost:3000/media-workspace/playlists?folder=63be838c-6916-4e23-acec-1a7344b08029` passed:
  - empty folder state remained visible.
  - card height measured 829px in a 1151px viewport.
  - card bottom reached 1115px, leaving only the app bottom bar/spacing.
