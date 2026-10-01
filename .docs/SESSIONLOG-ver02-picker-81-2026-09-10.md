# SESSIONLOG — ver02 Create wizard: Playlist Picker (#80) commit + Layout Picker (#81)

Date: 2026-09-10
Branch: `feat/pubflow-picker`

## Starting point

Continuation of `/tmp/handoff-ver02-playlist-picker-80-2026-09-10.md`. #79 committed
(`139851b`, unpushed). #80 code sat uncommitted in the working tree with one open design
fork (Playlist Category filter).

## Decisions

- **Category filter (both pickers): deferred.** The frontend Playlist and Composition
  contracts have no `category` field. Both pickers render Category disabled as
  `Not available`, tracked as a backend/data-contract dependency. Introducing a real
  category is a data-model fork for a later ticket.
- **No separate plan doc for #81.** `docs/publications/ver02/plan-create-wizard.md` Frame 1.3
  is the spec; a second file would only restate it.
- **ContentStep composition carve-out removed.** Pre-ver02, `ContentStep` replaced the whole
  step with `<CompositionPicker/>` (inline card grid reading the store) when
  `publicationType === "composition"`. ver02 Frame 1 keeps the three branch cards for every
  type, so `ContentStep` now always renders `AssetLibraryStep` and `CompositionPicker.tsx`
  is deleted (was its only consumer).

## Changes

### #80 — committed `b3ff94d`

- `components/AssetLibraryStep.tsx` — Playlist branch opens `PlaylistPickerModal`.
- `components/PlaylistPickerModal.tsx` — staged single-select modal.
- `playlist-picker-filter.ts` + `.check.mts` — query/status/creator/tag/duration filter.

### #81 — committed `3c947ac`

- `composition-picker-filter.ts` + `.check.mts` — query/status/orientation/aspectRatio
  filter, plus `publishableCompositions()` (drops drafts, mirrors the Playlist picker).
- `components/CompositionPickerModal.tsx` — staged single-select modal mirroring
  `PlaylistPickerModal`. Wireframe tiles built inline from `previewZones` +
  `referenceResolution`; detail panel shows aspect, orientation, `bound/zone` count and
  zone-name list from `fetchComposition`.
- `components/AssetLibraryStep.tsx` — Layout branch enabled, opens `CompositionPickerModal`,
  `changeBranch` handles `"composition"`, `Create Layout ↗` link.
- `components/ContentStep.tsx` — always renders `AssetLibraryStep`.
- `components/CompositionPicker.tsx` — deleted.

## Verification

- `node …/playlist-picker-filter.check.mts` — pass (re-run).
- `node …/composition-picker-filter.check.mts` — pass (4 asserts).
- Targeted ESLint on all touched files — 0 errors (1 pre-existing-style `<img>` warning in
  `CompositionPickerModal`, same pattern as `CompositionLibraryPreview`).
- `tsc --noEmit` — no new errors; still fails only on the pre-existing `furthestStep`
  errors in `basic-info-limits.check.mts`, `hooks/usePublishDraft.ts`,
  `next-transition.check.mts`, `publish-eligibility.check.mts`, `resume-prompt.check.mts`.
- **Browser (#81), authenticated, deployed develop backend** — `/media-workspace/publications/create`
  via client-side nav (hard-nav lands on Overview). Opened Layout Picker: `page_size=200`
  first returned 400 (list endpoint max is 50) → changed to `pageSize: 50`, then 200 OK,
  loaded 2 Layouts with zone-media wireframes. Selected a Composition, detail panel showed
  aspect `1920x1080` / landscape / `3/3 bound` / zone names. Clicked Select, returned to the
  wizard with the control reading `เปลี่ยน Layout`; reopened and the choice was restaged;
  search filter narrowed the list while keeping the staged item. No Save/Draft/Publish used.
- **Browser (#80)** — not re-run this session; the picker code is unchanged since the prior
  session's verification recorded in the #80 handoff, and the `ContentStep` change does not
  touch the Playlist path.

## Not done / next

- Both commits are **unpushed**.
- #81 `pageSize: 50` is the endpoint ceiling — page through it only if a tenant exceeds 50
  Layouts (`ponytail:` comment in the file).
- Category-filter backend contract for both pickers remains a future data-model fork.
- Frame 1 "Create new Playlist / Layout" still just opens the editor in a new tab; the
  editor-side Publish action + seed param (plan Frame 1) is a separate piece of work.
