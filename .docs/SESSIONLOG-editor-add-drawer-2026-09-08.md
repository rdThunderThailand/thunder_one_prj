# SESSIONLOG — editor Add-content drawer: keep mounted between opens

**Date:** 2026-09-08 · **Branch:** `feat/caching` (rides in the request-count epic PR)
**Scope:** UX + request-count polish on `AddItemDrawer`, spotted while reviewing the epic.
Not part of the ADR 0065 plan.

## Problem

Both editors rendered the drawer as `{open && <AddItemDrawer/>}`, so every close unmounted it:

- `fetchContentFolders("asset")` + `fetchTags()` (the `useEffect` in `AddItemDrawer`) fired on
  **every open**, not once per editor session
- every in-drawer filter reset on close — `AssetPicker`'s search / kind / folder / tag, plus the
  drawer's Media/Playlists tab and playlist search
- no transition — `fixed inset-0` popped in and out

## Change

`src/features/media-workspace/playlists/components/AddItemDrawer.tsx`
- new `open: boolean` prop; component stays mounted and toggles `opacity-0` + `pointer-events-none`
  + `inert` when closed, with `transition-transform` / `translate-x-full` for a 200ms slide
- `hasOpened` latch (set during render, not in an effect — avoids the sync-setState-in-effect
  ESLint rule): the drawer returns `null` until its first open, so `AssetPicker` →
  `usePreviewUrls` does not fire `POST /media/videos/preview-urls` on editors nobody adds to
- folder/tag `useEffect` now gated on `hasOpened`, so it runs once, on first open
- new `close()` wrapper clears only `staged` + `playlistId` (keeping them would re-offer assets
  the commit just added); all filter state persists

Call sites — `PlaylistEditorPage.tsx`, `compositions/components/ZoneContentPicker.tsx`:
`{open && <AddItemDrawer/>}` → `<AddItemDrawer open={…} />`.

## Verification — browser, dev server :3000 → :3001 → ThunderCore `develop`, logged in as
`piyapat@thunder.co.th`. Fresh tab per page (the pre-existing tab hits the known pending-Suspense
state). Proxy requests read from `performance.getEntriesByType('resource')`.

### Playlist editor (`/media-workspace/playlists/2ff237ff-…`)

| step | result |
|---|---|
| editor loads, drawer never opened | **0** proxy requests after clear — latch holds, `preview-urls` never fires |
| first "Add Item" | `media/folders` ×1, `media/tags` ×1 |
| set search `predator` + folder `QA_Temp_Renamed`, close, reopen | search **+ folder both retained**; **0** new requests |
| closed-state DOM | element present, `opacity-0` + `inert` + `pointer-events-none` |

### Layout editor (`/media-workspace/layouts/b993132c-…`, `ZoneContentPicker`)

| step | result |
|---|---|
| first "Add Media or Playlist" | `media/folders` ×1, `media/tags` ×1, `media/videos/preview-urls` ×2 |
| switch to Playlists tab + search `boss`, close, reopen | **Playlists tab still active**, search `boss` retained; **0** new requests |
| open drawer, stage `KFC-small.jpg`, "Add 1 Asset" | drawer closes, `READY TO ADD / KFC-small.jpg` appears in the zone staging shelf — `commit()` → `close()` path intact |
| slide-in classes | `transition-transform` + `translate-x-0` present when open |

No console errors on any step. `rm -rf .next/dev/types && npx tsc --noEmit` clean; `eslint` on
the three files clean. Nothing was saved to any DB — the layout add was left as an unsaved draft.

## Not done

- No `.check.mts` — the change is component render/state wiring, no pure logic to extract.
- `staged` still resets on close (intended).
