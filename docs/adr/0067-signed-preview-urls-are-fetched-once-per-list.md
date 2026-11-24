# Signed preview URLs are fetched once per list, not once per card

**Status:** accepted · 2026-09-09
**Extends:** `0065-media-workspace-asks-for-what-it-draws.md` §1 (the P1 pattern) and §8 (pagination)

## Context

`0065` removed three list-then-read-each-row N+1s and was measured on `next dev` as request
counts only. The first production measurement — taken on `app.thunderone.asia` on 2026-09-09,
after the function region was pinned to `sin1` and the epic had shipped — found a fourth N+1 of
the same shape that `0065` never surveyed, because it does not read a list endpoint at all: it
signs preview URLs.

| Page | `0065` estimate | measured | of which `preview-urls` |
|---|---|---|---|
| Media Library | 2 | **14** | 12 |
| Compositions list | 2 | **6** | 4 |

Every figure `0065` states for the pages it *did* change held or came in lower. The gap is
confined to signing.

`0065` §8 calls Media Library "the model the others should follow". That is true of its
pagination and its debounce, and false of its signing: the page reads one page of 12 Assets in
one request and then signs those same 12 one at a time.

### The mechanism

`fetchPreviewUrls` is already a batch endpoint — `POST /media/videos/preview-urls` with an `ids`
array. `usePreviewUrls` de-duplicates the ids handed to *one* hook instance and remembers what it
already asked for, but that memory is a `useRef` per component instance and is not shared between
instances. So a card that calls the hook with its own id issues its own request, and a list of N
cards issues N requests against an endpoint built to answer all N at once.

### The project already decided this, twice

Two call sites batch at the list and pass URLs down as props:

- `PlaylistsTable` collects every row's cover into one memoised, de-duplicated array, under a
  comment that states the intent outright: "One signing call for every cover on the page, not one
  per row."
- `AssetLibraryStep` collects its filtered Assets *and* its filtered Playlists' covers into one
  array, and `publications/AssetCard` takes `previewUrl` / `thumbnailUrl` as props.

Two call sites do not:

- `assets/AssetCard` calls `usePreviewUrls([asset.id])` for itself. There are two files named
  `AssetCard` — the one under `publications/` receives URLs, the one under `assets/` fetches its
  own. Same component role, opposite data flow.
- `CompositionLibraryPreview` batches the zones *within* one card but is rendered per row by
  `CompositionsTable`, so the batching stops at the row boundary.

This is not a fork between two defensible designs. It is one decided pattern with two call sites
that predate it.

## Decision

1. **A component rendered once per row or per card never calls `usePreviewUrls`.** The list or
   page component that owns the rows collects every id it will draw, calls the hook once, and
   passes `previewUrl` / `thumbnailUrl` down as props.

2. **Calling the hook with a single id is correct when the component has one instance per page.**
   A detail page, a selected-item panel, a preview stage — these stay as they are. The rule is
   about multiplicity, not about array length. Named so nobody "fixes" them: `media-detail-page`,
   `PlaylistPropertiesPane`, `PlaylistSidePanel`, `ScheduleStep`, `ReviewPublishStep`,
   `PlaylistPreviewPanel`.

3. **The id array passed to the hook is memoised and de-duplicated** — `useMemo` over a `Set`, as
   `PlaylistsTable` does. The hook's effect depends on array identity, so an array rebuilt each
   render re-enters the effect on every render; only the instance's `requested` ref stops that
   from becoming repeat traffic. Memoising is what makes the guard unnecessary rather than
   load-bearing.

4. **Scope of the correction:** `assets/AssetCard` takes URLs as props and `media-library-page`
   batches for the page; `CompositionLibraryPreview` takes URLs as props and `CompositionsTable`
   batches for the table. Nothing else changes.

## Rejected alternatives

- **Coalesce inside `usePreviewUrls`** — a module-level queue that merges ids requested within a
  microtask and a cache shared across instances. It would fix every present and future call site
  without touching a component, which is its real attraction. Rejected because it introduces
  shared mutable state whose invalidation and auth-change teardown must then be designed and
  maintained — the exact cost `0065` §7 refuses to pay on shared transport — to replace a pattern
  the codebase already applies correctly in two places. The leaf components stay dumb either way;
  only one of the two options adds a mechanism.

- **A shared cache for signed URLs** — `0065` §7 excludes `fetchPreviewUrls` from the catalogue
  cache because a POST over a variable id set needs a sorted-id key and a signature expiry. That
  reasoning is untouched by this ADR and still holds. Batching needs neither: it makes one call
  where there were twelve, and caches nothing.

- **Accept the cost** — twelve parallel requests complete in ~3.2 s at 33 Assets, which is
  survivable today. Rejected because the count is a direct multiple of the page size, so it makes
  `0065` §8's "raise the page size when the catalogue grows" the change that makes the page worse.

## Consequences

- Media Library is expected to drop from 14 requests to 3, and the Compositions list from 6 to 3
  — to be confirmed by measurement against the production build, not asserted here.
- `assets/AssetCard` gains the props `publications/AssetCard` already has. The two files still
  differ in the rest of their surface and are not merged by this ADR.
- No backend change, no migration, no new dependency, no new mechanism.
- Independent of the open question of moving first-paint fetches into Server Components: the
  batching lives in the list component either way, and does not constrain that decision.
- One long tail is recorded but not addressed here: on the Composition editor, a single
  `preview-urls` call took 4.8 s against ~350 ms for its siblings on the same page. It is a
  latency question about one request, not a count question, and it needs its own measurement.
