# 0027 — Playlists list state (tab/filters/sort/page) lives in the URL query string

> **Superseded in part by [0047](0047-list-url-state-history-navigation.md):** the
> `replaceState`-only write in "Decision" below left Back/Forward with no history entries to
> navigate; 0047 replaces it with push/replace via a shared hook while keeping everything else
> here (URL as source of truth, read-once via `readListState`, no `nuqs`) unchanged.

## Context

`PlaylistsListPage.tsx` holds tab, filters, sort, and pagination entirely in `useState`.
Refreshing the page, hitting browser Back after opening a playlist, or copying the URL to
someone else all lose that state — the view resets to defaults every time.

`fetchPlaylists(true)` (`src/lib/api/media-api.ts`) already returns the full playlist list with
no server-side `limit`/`offset`/`sort` params; filtering and pagination were already client-side
before this change, so adding sort to that same client-side pipeline (`filterPlaylists` →
`sortPlaylists` → `paginate`, all in `list-filtering.ts`) required no backend change.

## Decision

Persist `{ tab, filters, sort, page, perPage }` in the URL query string.

- **Read once on mount** via `useSearchParams()`, through a pure `readListState()`
  (`list-url-state.ts`) that validates every value against the same unions the rest of the
  feature already uses (`PLAYLIST_STATUSES`, `PLAYLIST_TYPES`, `SORT_KEYS`,
  `PER_PAGE_OPTIONS`) — an unrecognised or hand-edited query value falls back to its default
  instead of reaching component state.
- **Written back with `window.history.replaceState`**, not `router.replace()` — a plain history
  write doesn't trigger a Next.js navigation/re-render on every keystroke or filter change, so no
  debouncing is needed, and it doesn't push one history entry per filter change (which would make
  Back annoying to use).
- `useSearchParams()` requires a `<Suspense>` boundary, so `src/app/(dashboard)/playlists/page.tsx`
  now wraps `<PlaylistsListPage>` in one (same pattern already used by `/playlists/create`).

## Alternatives considered

- **`sessionStorage`** — doesn't survive a fresh tab, and doesn't make the URL shareable (the
  stated goal). Also would still need the same `<Suspense>`-avoiding read-once pattern for no
  benefit over query params.
- **`localStorage`** — same shareability gap, plus it leaks a filter set across sessions/devices
  the user may not remember setting, and (per this project's known pitfall) any future change to
  the stored shape needs a versioned key or old drafts rehydrate into a crash.
- **`nuqs`** — would give typed query-param state for free, but this repo has zero existing
  URL-state usage and a hard "no new dependency if a few lines suffice" rule; `list-url-state.ts`
  is ~70 lines and fully covered by `list-url-state.check.mts`.

## Consequences

Sorting stays client-side as long as `fetchPlaylists()` returns the unpaginated list. If the
list ever moves to server-side pagination, `sortPlaylists()` and this URL-state scheme both need
revisiting — the sort/page params would need to drive the fetch instead of slicing an in-memory
array.
