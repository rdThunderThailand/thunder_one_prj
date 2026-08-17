# 0020 — A playlist has one full-page detail view, and Step 5 previews the playlist it publishes

## Context

Two gaps, one shared cause: nothing in the app renders a playlist's contents.

**Step 5 of Create Publication shows an empty Content Preview for playlist publications.**
`ReviewPublishStep.tsx:73` resolves the preview from `assetItems[0]` only. A playlist publication
never fills `assetItems` — it stores a single `playlistId` on the draft store, which
`step-validation.ts:31` and `publish-eligibility.ts:31` both read, and Step 5 does not. The result
is a blank thumbnail and no name on the last screen before publishing, exactly where the operator
is meant to confirm what goes to the screens.

**There is no playlist detail route.** `src/app/(dashboard)/playlists/` holds `page.tsx` and
`create/` and nothing else. Details are shown by `PlaylistDetailPanel`, a side panel on the list
page, which renders status, type, item count, total duration, resolution, creator and description —
but **not one media item**. The one place in the app that lists a playlist's items today is
`PublicationDetailPage.tsx:316-345`, and it prints the raw `media_asset_id` when `title` is empty.

So Step 5 has nothing to link to, and `/playlists` has no way to answer "what is actually in this
playlist".

What exists to build on, verified 2026-08-17:

- `fetchPlaylist(id)` returns `items[]` with `media_asset_id`, `title`, `position`,
  `duration_seconds`, `transition` — no dimensions, no file size, no kind.
- `resolveCoverAssetId()` (`metadata.ts:131`) falls back to the lowest-position item when no cover
  is set, so a cover is always resolvable from a detail response.
- `MediaThumb` + `usePreviewUrls` already render asset thumbnails from ids, batched.
- `fetchMediaAssets()` (`media-api.ts:88`) is an unpaginated `GET /media/videos` returning
  `MediaAsset[]` with `file.file_size_bytes`, `width`, `height`, `file.original_filename`.
- Per ADR 0019, `width`/`height` are populated only for assets uploaded after that change; every
  pre-existing asset has them NULL.
- The system has no equivalent of the reference UI's Special Play, Interactive Playlist or
  Transform Effect — there is no column or metadata key for any of them.
- `fetchPlaylist` is defined **twice** with identical bodies (`playlists-api.ts:20`,
  `publications-api.ts:195`), differing only in the `PlaylistDetail` type each returns; the
  publications copy is a weaker duplicate (`status?: string`, `transition?: string`, no `revision`,
  `metadata` or `created_by`).

## Decision

**A playlist gets one canonical full-page detail view at `/playlists/[playlistId]`, and it is the
only surface that renders a playlist's contents. Step 5's Content Preview reads the draft's
`playlistId` and links there.**

### 1. `/playlists/[playlistId]` replaces the detail panel

`PlaylistDetailPanel.tsx` is deleted. Clicking a row in `/playlists` navigates to the new route
instead of opening a panel; the panel's Edit and Archive/Activate actions move to the new page's
`PageHeader` actions.

Layout follows the reference screenshot's information architecture — two columns, preview and
properties on the left, item table on the right — built from this app's own primitives
(`PageHeader`, `Card`, `Badge`, `MediaThumb`), not the reference's visual style.

The page is read-only. Editing a playlist stays in the wizard (`/playlists/create?id=`), which
already owns validation, `expected_revision` and draft handling.

**Left column**

- Preview frame: clicking a row in the item table plays that item there — `<video controls>` for
  video, still image for image. On load it shows the resolved cover.
- Properties, from what the system actually stores: Status, Playlist Type, Items, Total Duration,
  Resolution (`metadata.info.resolution`, the playlist's output profile), Frame Rate, Play Mode,
  Repeat, Transition, Media Fit, Audio, Created By, Created At, Description.

**Right column — item table**

Columns: `#` (position), thumbnail, name, resolution, size, length, transition. Name, resolution
and size come from joining `fetchMediaAssets()` on `media_asset_id`; the join also supplies
`original_filename` so a title-less item no longer prints a UUID. Resolution renders `—` for assets
that predate ADR 0019.

A totals row closes the table: `N Files · <size> · <duration>`. When any item's asset is missing
from the join, the size renders as `13 MB+` with a tooltip stating the count is incomplete — an
understated total that admits it, rather than a wrong total that does not.

**Loading and failure**

`fetchPlaylist` and `fetchMediaAssets` are issued in parallel and rendered progressively: the table
appears as soon as the playlist arrives (position, thumbnail, length, transition), and the joined
columns fill in when the asset list lands. If the asset call fails the page degrades to `—` in
those columns instead of failing.

Failures are distinguished via `classifyApiError`: `403` renders `<NoAccess />`, `404` renders a
"playlist not found" card with a link back to `/playlists`, anything else renders the error with a
retry. The route is shareable, so "you may not see this" and "this does not exist" must not collapse
into one message.

### 2. Step 5 Content Preview

When `publicationType === "playlist"`, `ReviewPublishStep` calls `fetchPlaylist(playlistId)` on
mount and replaces the asset File block with: cover thumbnail, playlist name, status badge, and
`N items · <total duration>`. The name links to `/playlists/[playlistId]` with `target="_blank"`,
so the wizard's unsaved-draft guard (commit `469ae6b`) never fires from a preview click.

The playlist's name and cover are **not** copied into the draft store. Doing so would change the
shape persisted in localStorage and require a key version bump, and every draft already in a
browser would still lack the new fields.

Non-playlist publication types keep their existing asset preview unchanged.

### 3. One `fetchPlaylist`

The publications copy and its duplicate `PlaylistDetail` / `PlaylistItem` types are deleted.
`PlaylistDetail`, `PlaylistItem` and the types they depend on move to `src/types/domain.ts`;
`features/playlists/types` re-exports them so existing imports keep working.

Playlist **reads** — `fetchPlaylist` and `fetchPlaylists` — move to `src/lib/api/media-api.ts`.
Playlist **writes** — `upsertPlaylist`, `setPlaylistItems` — stay in
`features/playlists/services/playlists-api.ts`. The line is "anyone may read a playlist, only its
own feature writes one": publications already imports `fetchPlaylists` across the feature boundary
(`AssetLibraryStep.tsx:34`), which is the same problem as the duplicated `fetchPlaylist` and is
fixed by the same move.

This lands as its own commit, before the feature work.

## Alternatives rejected

**Keep the detail panel alongside the new page**, panel as quick peek with a "View details" link.
Two surfaces rendering the same data means every future playlist field is added twice. The panel
holds nothing the full page cannot show.

**No new route** — link Step 5 to `/playlists?selected=<id>` and open the existing panel. Shortest
diff, but the panel still needs an item table added, and a publication's content would have no
addressable URL.

**Skip the asset join**, showing only what `PlaylistDetail` carries. Cheaper by one request, but the
totals row needs file sizes, and without `original_filename` a title-less item shows a UUID — the
exact defect visible in `PublicationDetailPage` today.

**Play the whole playlist in sequence** in the preview frame. Needs a sequencer, transition
handling and preloading — a distinct project, not part of "show me what is in this playlist".

**Make the detail page editable** (add/remove/reorder items, as the reference UI's Add Media /
Publish buttons do). That is a second editor competing with the wizard, duplicating revision
handling and validation.

**Copy playlist name and cover into the publication draft store** instead of fetching in Step 5 —
rejected for the localStorage versioning cost described above.

**Delete the publications `fetchPlaylist` and import from `features/playlists`** rather than moving
reads to `media-api.ts`. Simpler, but leaves a feature→feature import as the sanctioned pattern.

**Move all of `playlists-api.ts` into `media-api.ts`.** Turns the shared transport module into a
dumping ground for every feature's API surface.

## Consequences

- `/playlists` rows become navigations, not selections; the list page loses its selected-row state.
- The detail page issues two requests per view. `GET /media/videos` is unpaginated, so its cost
  grows with the asset library; if that becomes a problem the join moves server-side into the
  playlist detail RPC.
- The resolution column is mostly `—` until the library turns over with post-ADR-0019 uploads.
- Anything reading `PlaylistDetail` from publications now gets the stricter playlist types
  (`PlaylistStatus`, `Transition` instead of `string`). All three call sites only read, so the
  narrowing is safe.
