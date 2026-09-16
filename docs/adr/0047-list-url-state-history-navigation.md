# 0047 — Shared push/replace history hook for list-page URL state

## Context

`docs/adr/0027-playlist-list-url-state.md` put Playlists' filter/sort/page state in the URL,
written back with `window.history.replaceState`. Layouts and Channels copied the same
`list-url-state.ts` pattern (`LayoutsListPage.tsx`, `ChannelsListPage.tsx`).

`replaceState` never creates a new history entry, so browser Back on any of the three list
pages leaves the page entirely instead of undoing the last filter/sort/page change — there is
no entry to land on. Channels additionally had no popstate handling at all, and wrote a bare
`"?"` into the URL when state was at its default instead of a clean path.

This surfaced in Task 8 Step 3 browser verification of `docs/layouts/plan-layout-execution.md`
(2026-08-25, item 2: "Search, status filter and sort each change the rows and the URL; ... back/
forward works").

## Decision

Add `src/hooks/use-list-url-state.ts`, a hook shared by all three list pages that:

- writes the URL via `pushState` for most changes, so Back has something to land on;
- writes via `replaceState` while the change is a run of consecutive search-box edits, so
  typing a query doesn't push one history entry per keystroke — `nextHistoryOp()` (the pure,
  checkable core) treats a "search edit" as a change where `q` itself differs and every key
  other than `q`/`page` is unchanged (a query edit carries its own `page` reset along, but a
  pure page change is a step of its own), and pushes only the first edit in a run;
- carries its mount bookkeeping inside that same pure function rather than in the effect, so
  a check can drive whole interaction sequences. The mount flag is consumed on the first call
  whether or not a write happened: consuming it only on a write meant that landing on an
  already-clean URL wrote nothing at mount, left the flag set, and swallowed the user's first
  real interaction into a `replaceState` — leaving Back nothing to return to. That defect
  shipped and was caught in browser verification;
- listens for `popstate` and calls a page-supplied `restore()` that reads
  `window.location.search` back through the page's own `readListState()`. `pushState` doesn't
  update `useSearchParams()`, so `restore()` must read `window.location` directly, not the
  Next.js hook;
- writes the pathname (not `"?"`) when the state is at its default, fixing Channels'
  pre-existing bug of a bare `?` surviving a reset.

`ListState` itself stays three separate types (Layouts/Playlists/Channels have real shape
differences — `tab`, `type`, `campaignId` only exist for Playlists; Channels' `category` reuses
the `tab` URL key for an unrelated meaning). Only the push/replace/popstate *rule*, which
operates on the query string alone, is shared. `read/writeListState` remain per-feature.

Each page now looks like:

```ts
const restore = useCallback(() => {
  const s = readListState(new URLSearchParams(window.location.search));
  setFilters(s.filters); setSort(s.sort); setPage(s.page); setPerPage(s.perPage);
}, []);
useListUrlState(writeListState({ filters, sort, page, perPage }), restore);
```

## Alternatives considered

- **A debounce timer on the search input, then `pushState` on every change.** Rejected: needs a
  timer, a cleanup, and a flush-on-blur/unmount to avoid losing the last few keystrokes on
  navigation — `nextHistoryOp`'s run-coalescing gets the same one-step-per-search-session
  result from a pure function with no timer at all.
- **`router.push()` instead of raw `history.pushState`.** Rejected per ADR 0027's original
  reasoning, which still holds: a Next.js navigation re-renders/refetches on every change,
  where these pages already hold their full dataset in memory and only need the address bar and
  browser history to reflect the current view.
- **Merging `list-url-state.ts` into one generic module across the three features.** Rejected:
  the three `ListState` shapes genuinely differ; a generic version would need per-feature type
  parameters and key-mapping config that costs more lines than the current ~70-line-each
  duplication, which is fully covered by each feature's own `list-url-state.check.mts`.
- **`nuqs`.** Same reasoning as ADR 0027 — no new dependency for what a small hook covers.

## Consequences

- Supersedes the `replaceState`-only write in ADR 0027's Decision section; everything else in
  0027 (URL as source of truth, read-once via `readListState`, validation against unions,
  rejection of `sessionStorage`/`localStorage`/`nuqs`) is unchanged.
- If any list page later moves to server-side pagination, `useListUrlState` doesn't need to
  change — it only ever sees the query string, not how rows are fetched.
