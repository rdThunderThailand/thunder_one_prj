# Session Log — Playlist Publication Full Preview — 2026-09-29

## Change

Publication detail now offers Full Preview when a Playlist is attached, and the saved Publication preview route loads that Playlist into the existing one-Zone stage. Composition preview remains unchanged. Publications without supported content still do not show the link.

## Root cause

The saved Publication preview route only resolved `composition.id`. Playlist Publications have `playlist.id` instead, so a direct `/preview/publication/{id}` request failed. The detail page also hid the preview link for them.

## Verification

- `node src/features/media-workspace/preview/publication-preview-target.check.mts`: failed on Playlist before the fix, passed after it.
- Targeted ESLint: passed.
- `next typegen` then `tsc --noEmit`: passed.
- `git diff --check`: passed.
- `npm run build`: passed with network access. The first sandboxed attempt was blocked while fetching Google Fonts (`Geist Mono`, `Manrope`), not by code.

## Pending

- Authenticated browser acceptance on the local branch for saved Playlist and Composition Publications.
- No commit, push, deploy, or production data change performed.
