# SESSIONLOG: Playlists List Sorting + URL State Persistence — 19 August 2026

## Session summary

Implemented two interconnected features for the playlists list page (`/playlists`) to meet scope of **ticket 86d3xxp90** (1.3 Page Initialization) and complete phase B1:
1. **Click-to-sort column headers** — all 6 columns (Name, Type, Campaign, Duration, Status, Last Updated) with asc/desc toggle; empty values always rank last regardless of direction.
2. **URL-persisted filter/sort/page state** — tab, filters, sort direction, and pagination all round-trip through query strings so refresh, browser back/forward, and copy-paste URLs all reproduce the same view.
3. **Schedule/History tab split** — ended/cancelled publications move to History tab per ADR 0015 lifecycle grouping, reusing shared `isPastPublication` predicate.
4. **Architectural records** — ADR 0027 documents URL-state design; ADR 0026 (Grid view scope cut) also completed during session.

## Work completed (technical)

### Core features
- `sortPlaylists()` in `list-filtering.ts` — pure comparator for 6 columns, null-last ordering (both asc/desc), tie-breaker on name+id
- `SortHeader` component in `PlaylistsTable.tsx` — clickable headers with aria-sort, ▲/▼ arrows, hover states
- `list-url-state.ts` — read/write query string to/from structured state; validation against `PLAYLIST_STATUSES`, `PLAYLIST_TYPES`, `SORT_KEYS`, `PER_PAGE_OPTIONS`
- `PlaylistsListPage.tsx` — `useSearchParams()` one-time init, `history.replaceState` effect for back-forward safety, `handleSortChange` logic (default direction: desc for updated/duration, asc for rest)
- `src/app/(dashboard)/playlists/page.tsx` — added `<Suspense>` boundary (required by `useSearchParams()`)

### Tests & quality
- `list-filtering.check.mts` — added sort assertions (asc/desc, empty values, status lifecycle order, campaign by resolved name, tie-breaker stability, no-mutate check)
- `list-url-state.check.mts` — new (round-trip, garbage input, defaults, empty URL)
- `pnpm tsc --noEmit` ✅ · `pnpm lint` ✅
- Refactored playlists types barrel import (`src/features/playlists/types/index.ts`) from `@/types/domain` to relative path so check.mts files can run under bare `node` (path aliases unavailable outside bundler)

### Secondary (continuation from prior session)
- `PlaylistsTable.tsx` Schedule/History split — ended/cancelled items now in History tab
- `PlaylistSidePanel.tsx` + `PlaylistsListPage.tsx` — wired HistoryTab component
- `publication-status.ts` + `publication-status.check.mts` — added `isPastPublication` predicate, reused in Publications list

### Documentation
- **ADR 0027**: URL query string for list state (why not sessionStorage/localStorage/nuqs, why `history.replaceState` vs `router.replace`)
- **ADR 0026**: Grid view scope cut from ticket 86d3xxp9k (explains why no card layout exists)

## Work completed (integration)

### Commits (feat/playlistOverview branch)
1. **c9f751b** `feat(playlists): sortable columns and URL-persisted list state`
   - 9 files changed, 390 insertions(+), 27 deletions(-)
   - All sorting logic, URL state round-trip, SortHeader component, types barrel import fix
2. **3811be0** `feat(playlists): move ended/cancelled publications to History tab`
   - 5 files changed, 160 insertions(+), 63 deletions(-)
   - Schedule/History tab split, isPastPublication predicate, side panel integration
3. **0e126a2** `docs(playlists): add ADR for Grid view scope decision (ticket 86d3xxp9k)`
   - 1 file changed, 41 insertions(+)

### PR status
- **PR #9** (feat/playlistOverview → dev) — **still Draft** after browser verification (per working agreement §3: verify ไม่ครบ → Draft)
  - 3 commits stacked
  - All checks pass (tsc, lint, both check.mts files)
  - Browser checklist verified ✅:
    - 6 columns clickable, asc/desc toggle with arrows
    - Empty values sort last both directions
    - Status rows by lifecycle (active→inactive→draft), not alphabetical
    - Campaign sorts by resolved name not id
    - Tie-breaker stable
    - Refresh preserves tab/filter/sort/page
    - Browser back/forward retains view
    - Copy URL reproduces view
    - Garbage URL params fall back to defaults cleanly
    - Filter change resets to page 1

## Decisions & trade-offs

### URL query params over sessionStorage/localStorage
- **Why**: refresh-safe, shareable (copy URL), back-forward native, no new dependency
- **Alternatives rejected**: sessionStorage (fresh-tab vulnerable), localStorage (session bleed + versioning debt), nuqs (unnecessary dependency for 70-line pure module)
- **Note**: sorting stays client-side because `fetchPlaylists()` returns full unpaginated list; revisit if list moves to server-side pagination

### `window.history.replaceState` over `router.replace`
- Avoids triggering Next.js navigation on every keystroke
- No debounce needed
- Doesn't pollute browser history with filter-change entries

### Types barrel relative import
- Required so `list-url-state.check.mts` can run under plain `node` (no path-alias resolution)
- Behaviour in production (via Next bundler) unchanged — both forms resolve to same file

## Blockers & decisions during session

**agy timeout** (gemini-3.1-pro-high): Dispatched 30min ago, got partial implementation (list-filtering + PlaylistsTable) with issues:
- Messy switch statement with debugging comments left in code
- SortHeader component referenced but never defined
- Empty values buggy (weren't forced last)
- Used `as any` in check.mts
- Import paths used path alias instead of relative

**Resolution**: Rewrote `sortPlaylists()` cleanly, added missing `SortHeader`, fixed types barrel import, fixed test suite. Finished in-session. Learning: timeout risk on initial code-generation; rollback and patch > redispatch.

## Next steps (out of scope, recorded for continuity)

1. **PR #9 ready state** — awaits user confirmation of browser checklist before flipping from Draft → Ready for review
2. **Merge to dev** — after review approval (currently on feature branch)
3. **Timeline completion** — schedule/history + sorting + URL state together close out ticket 86d3xxp90 phase B1
4. **Remaining work** (separate tickets):
   - Advanced filters (More Filters dropdown) — ADR 0026 already scoped out
   - Shared with Me tab — out of scope per existing ADR
   - Server-side pagination (if list scales beyond current) — affects sort/filter strategy

## Artifacts created

- `.docs/SESSIONLOG-playlist-sorting-2026-08-19.md` (this file)
- `docs/adr/0027-playlist-list-url-state.md` (architecture decision)
- `docs/adr/0026-playlist-list-no-grid-view.md` (scope clarification)
- 2 new check.mts files with full test coverage
