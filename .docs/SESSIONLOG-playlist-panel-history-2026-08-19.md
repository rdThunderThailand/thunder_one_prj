# Session Log — Playlist Side Panel: Schedule/History Split

**Date:** 2026-08-19
**Branch:** feat/playlistOverview

## What

The playlist side panel's Schedule tab listed every publication pointing at a playlist —
draft, scheduled, active, ended, cancelled — all mixed together, ranked by `status`
(stored intent) instead of `effective_status` (clock-aware). Result: an `ended`
publication still stored as `status: "active"` ranked as if live and floated to the top.

The panel's History tab already existed but was a static placeholder
("ยังไม่มีประวัติการแก้ไข").

This session split the two: Schedule now shows only live publications
(draft/scheduled/active), History shows past ones (ended/cancelled), sorted
most-recent-first.

## Changes

- `src/features/publications/publication-status.ts` — added `isPastPublication()`,
  lifting the "past" rule (`effective_status === "ended" || status === "cancelled"`,
  ADR 0015) that was previously inlined only in `PublicationsListPage.tsx`.
- `src/features/publications/publication-status.check.mts` — new, covers all three
  functions in this file.
- `src/features/playlists/components/PlaylistPanelTabs.tsx` — refactored:
  `usePlaylistPublications` hook (shared fetch), `PageNav` and `PublicationRow`
  (shared UI), `ScheduleTab` (live only, rank fixed to read `effective_status`),
  new `HistoryTab` (past only, sorted by `updated_at ?? created_at` desc). Now uses
  `publicationDisplayStatus`/`publicationStatusColor` instead of hardcoded
  `effective_status ?? status` + `color="zinc"`. 283 lines, under the 300-line cap.
- `src/features/playlists/components/PlaylistSidePanel.tsx` — History tab now renders
  `<HistoryTab playlistId={playlist.id} />` instead of the static placeholder.
- `src/features/publications/components/PublicationsListPage.tsx` — swapped its inline
  active/inactive split for `isPastPublication`, same behavior, single source of truth.

## Verification

- `node src/features/publications/publication-status.check.mts` — pass
- `pnpm tsc --noEmit` — pass
- `pnpm lint` — pass (caught and fixed one `react-hooks/set-state-in-effect` violation
  introduced mid-edit: a sync `setState` in the fetch effect that wasn't needed since
  `Tabs` already remounts the subtree via `key={playlist.id}`)
- **Browser: not verified this session.** User was given a manual checklist to run:
  1. `/playlists` → open a playlist with both live and past publications → Schedule
     tab shows no ended/cancelled rows, active sorts first; History tab shows only
     ended/cancelled, newest `updated_at` first.
  2. Playlist with zero publications → both tabs show empty text, no errors.
  3. `/publications` Active/Inactive tabs still split the same way as before
     (regression check on the `isPastPublication` swap).

Per working agreement, this is unverified at the browser layer — PR should open as
Draft until the checklist above is run.

## Not done / out of scope

- No backend/RPC changes — `effective_status` already comes from the API.
- No new `?status=ended` query param — `ended` already comes bundled with `active`.
- No `starts_at`/`ends_at` added to rows — the list item still lacks these fields
  (would need one detail call per publication; flagged as a ponytail note already in
  the code before this session).
- No new ADR — this follows the existing ADR 0015 rule, doesn't introduce a new one.
