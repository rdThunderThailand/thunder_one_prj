# Plan — Media Workspace request count

Implements `docs/adr/0065-media-workspace-asks-for-what-it-draws.md`.

Phases 1–2 are frontend deletion, touch no Overview surface, and can ship on their own.
Phase 3 changes Overview with no backend cost; its contracts are settled in ADR §2 and §3.
Phases 4–5 are behind **Gate 1** (re-measure after Phase 3) because Phase 4 is the only
irreversible step here. Phases 7–8 are behind **Gate 2** (a measurement pass, plus a second
ADR).

## Phase 0 — branch and baseline

1. **Branch from `dev`, not `main`.** `origin/main` does not contain
   `useCompositionEditorData.ts`, the seam Phase 2 edits. `dev` carries the layoutV3 merge (PR #61)
   and the Layout editor/library rework (PR #62) on top of it, and that rework touches
   `CompositionEditorPage` — the same file Phase 2 edits — so branching off `feat/layoutV3`
   instead would guarantee a conflict on it. `feat/caching` is cut from `dev`; rebase onto `main`
   after `dev` merges.
2. **Do not sweep the working tree.** Anything modified that is not this work is the user's to
   commit on their own branch — never a silent prerequisite of this one. The docs files are
   untracked and follow the checkout.
3. Baseline before any code change, on a dev server. Ask before driving the browser, and offer
   the checklist alternative. **This replaces every estimate in the ADR's table** — those came
   from the call graph, and detail reads run in parallel, so counts are not wall-clock cost.
   Record request count **and** time to first content into
   `.docs/SESSIONLOG-request-count-2026-09-08.md` as taken:
   - `/media-workspace` (Overview) — including what the 60s poll adds over two minutes, and the
     `usePlaylistPreview` / `usePreviewUrls` calls the two Program cards make
   - `/media-workspace/layouts/<id>` (Composition editor)
   - `/media-workspace/publications/manage`
   - `/media-workspace/publications/create`
   - editor → playlists → editor: the **second** editor load
4. **Now & Next parity capture, at one instant, before any mapper is written.** Record side by
   side what `selectNowPlaying` / `selectNextProgram` return today and the raw
   `GET /media/now-next?horizon_minutes=180&include_idle=false` body. `NowNextPage` carries a
   dev-only demo fallback for *two* conditions — the endpoint erroring, and every row coming back
   with no `current` and no `upcoming` — and its production error path reads "backend read model
   is not available yet". That fallback exists because both happen. If the endpoint returns
   nothing for this tenant while the current selector still finds a Now Playing, Phase 3 would
   silently empty the headline card of Overview, and the plan would not notice until Gate 2.
   A parity mismatch here stops Phase 3 and goes back to the ADR.

## Phase 1 — dedupe what is duplicated (P2) — ships alone

5. `publications-api.ts`: let `fetchPublications()` take an optional status. The route already
   passes `p_status: null` when the param is absent and the RPC returns every row — no backend
   change.
6. `PublicationsListPage` and `PlaylistPanelTabs`: one call, filter by status in
   the client. Filter on **`status`**, not `effective_status` — the RPC's own predicate is
   `pub.status = p_status` while it emits both keys, and `isPastPublication` applies
   `effective_status` as a second, separate layer; filtering on the derived key silently changes
   which rows land in the Active tab. **This drops per-status partial availability**: today
   `Promise.allSettled` keeps two tabs usable when one call fails, and three error states exist
   for that. Collapse them to one loader with one error state, per ADR §1 — do not leave three
   error states fed by one call.
7. Publication wizard: the wizard owns `assets`, `reloadAssets(): Promise<MediaAsset[]>`,
   **`assetsLoading` and `assetsError`**, and passes all four to `AssetLibraryStep`.
   - Passing only an array breaks upload: the child's `useAssetUpload` callback awaits
     `loadAssets()` before selecting the new Asset, and without a shared reload the uploaded
     Asset never reaches the state the preview, eligibility and review steps read.
   - Passing no error state breaks failure: `AssetLibraryStep` owns `setLoading`/`setError`
     today, while `usePublishDraft` swallows the same read with `.catch(() => [])` and has no
     error state at all. Lifting the loader without lifting those two turns a failed Asset read
     into an empty-looking library — exactly the silent-empty failure this phase forbids for the
     Publications tabs.
   - `dropUnapprovedItems` reconciliation moves to whoever owns the load.
8. `CompositionsListPage.openPreview` is **left alone** — see ADR §4. There is no batch-by-ids
   Asset read, so resolving "only what the preview references" turns one request into N, and
   `PreviewStage` needs Asset metadata for missing `duration_seconds` anyway.

## Phase 2 — Composition editor N+1 (P1) — ships alone

9. `useCompositionEditorData`: remove the `Promise.all(allPlaylists.map(async …))` block and
   the `.then((slices) => …)` that absorbs it. The `setPlaylistPreviewAssetIds`
   seeding from `cover_asset_id` stays — it is the replacement.
10. `absorbPlaylistDetails` and `hydratePlaylist` stay; `loadCompositionDraft` and `setBinding`
   become their only writers, which they already were in practice.
11. **Fix the hydration guard in the same commit — the deletion is broken without it.**
    `setBinding` calls `hydratePlaylist` only when `playlistPreviewAssetIds[id]` is absent, but
    the list load seeds that map from `cover_asset_id` for every Playlist — and the RPC's value
    falls back to the first item, so **nearly every Playlist has one**. Today the bulk fetch hides this;
    after the bulk fetch is removed the guard would block hydration for almost every newly bound Playlist, giving a
    cover image with empty `items` and no playback settings.
    Guard on the detail map instead: `!Object.hasOwn(data.playlistItemsById, next.playlistId)`.
    Pair it with an in-flight `Set` ref inside `hydratePlaylist`. Two reasons: `hydratePlaylist`
    catches and discards its failure without writing a key, so a failed read would re-fire on
    every subsequent `setBinding` for that Playlist, unbounded; and binding twice in quick
    succession reads state that has not committed yet, firing the same request twice. The bulk
    fetch masks both today. On success the key is always written — `PlaylistDetail.items` is a
    required array, so an empty Playlist still records `[]`.

Verify: open a Composition with bound Zones — the canvas still previews each Zone's content, and
every Playlist row in the picker still shows its cover. **Then bind a Zone to a Playlist that was
never opened in this session and does have items** — the canvas must show its items and playback
settings, not just a cover. Expected ~98 → ~6.

## Contracts — settled 2026-09-08, recorded in ADR §2 and §3

12. **Now & Next adapter** (ADR §2): request `horizon_minutes=180&include_idle=false`; fold rows
    **by Publication**, rank by rows occupied; ties break by name; a `merged_loop` contributes its
    first Publication labelled `+N more`; target counts are rows occupied, split Channels /
    Devices, and mean scheduled occupancy not confirmation; nothing upcoming inside 3 hours reads
    "No upcoming program in the next 3 hours". Widening the endpoint horizon is deferred.
13. **Publications list contract** (ADR §3): `starts_at`, `ends_at`, `timezone`, and a target
    summary **split by `target_type`**. The panel renders `X Channels · Y Devices`, correcting
    today's mislabelled combined count.
14. There is no interim shared loader for Overview: it would be discarded by Phases 4–5, and could
    not honour "the poll must not re-run an N+1" while `LowerOverview` still needs detail.

## Phase 3 — Now Playing from Now & Next

15. Write the mapper as a pure function with a runnable `*.check.mts` (`node:assert`, no runner)
    covering: one Publication on several rows, a `merged_loop` occurrence, a tie on the ranking
    key, an empty result, a Next Up beyond the horizon, a `current` set that is entirely
    `not_confirmed`, and a mixed set. Contract in ADR §2.
16. `ProgramStatusCards` reads `/media/now-next?horizon_minutes=180&include_idle=false` and maps
    it: Now Playing from rows reporting `playback_state === "confirmed"` only (so `LIVE` never
    labels a stale screen), Next Up by earliest `opens_at`, plus the `+N more` label and the
    3-hour empty state. Do not duplicate Now & Next's resolution rules — priority suppression,
    merged equal-priority loops, heartbeat freshness — per ADR §2.
17. Define what the cards show when that one request fails or returns no rows — the whole of
    Overview's headline now rests on it, where previously a per-Publication read could partly
    succeed. They render their existing empty state with a distinguishable message, never a
    skeleton that never resolves, and never the dev-only demo data `NowNextPage` uses.
18. **Delete `usePlaylistPreview` and `usePreviewUrls` from the card.** The mapper passes the
    `thumbnail_url` Now & Next already returns. Without this the card has no `playlist.id` to
    resolve a cover from, and the obvious repair — fetching Publication detail for one — puts the
    N+1 straight back.
19. The 60s poll now refreshes one request.

## Gate 1 — re-measure Overview before paying for a migration

Phase 3 removes one of Overview's two per-Publication N+1s and costs nothing irreversible.
Phase 4 is the only step in this plan that cannot be undone. Measure before paying for it:

- re-measure Overview's request count and time to first content after Phase 3
- if Overview is comfortable, **Phases 4–5 join Gate 2**: they wait there for a decision
  alongside Phase 7, rather than being spent up front
- if it is not, Phase 4 proceeds with the approval step below

`LowerOverview` still reads per-Publication detail until Phase 5, so its share of the cost is the
number this gate is reading.

## Phase 4 — the migration (R0 — stop and ask, only past Gate 1)

20. `CREATE OR REPLACE FUNCTION public.media_publications_list(...)` — **no `DROP FUNCTION`**.
    The signature `(uuid, character varying DEFAULT NULL) RETURNS jsonb` is unchanged and only
    the JSON body grows, so a drop would open a window where the function does not exist and
    re-grant EXECUTE to PUBLIC that the original had revoked.
21. Extend the existing LATERAL to select `timezone` alongside `starts_at`/`ends_at`, emit all
    three, and add a target aggregate **split by `target_type`** into channel and device counts
    (ADR §3).
22. **Stop and get approval before applying.** Show the exact SQL, the function, and the project.
23. Capture the ACL before and after (`pg_proc.proacl`); re-grant nothing beyond what was there.
24. Apply to `develop` first, then prod, via Supabase MCP `apply_migration`. Auto-mode blocks MCP
    writes — if denied, stop and ask rather than routing around it. Dump `prosrc` afterwards and
    diff it against the migration file.

## Phase 5 — LowerOverview reads the list (after Phase 4 is live)

25. Add the new fields to `PublicationListItem`. `LowerOverview` filters and formats "today" from
    the list rows' `timezone` and renders `X Channels · Y Devices`; its per-Publication detail
    fetch goes away, and with it the last N+1 on Overview.

## Gate 2 — measure, then decide on caching

26. `rm -rf .next/dev/types` then `npx tsc --noEmit`, and lint. (Stale route types hide errors.)
27. Functional pass — **always**, whatever has shipped so far:
    - Composition editor: bound Zones preview, Playlist covers render
    - Publications list and the Playlist detail panel show draft, active and cancelled rows, and
      a failed load reports once rather than leaving a tab silently empty
    - Publication wizard: upload an Asset mid-wizard — it is selectable, and still present at the
      preview, eligibility and review steps
    - Compositions list preview still renders its content
    - Overview's Now Playing, Next Up, device health and recent activity match
      `/media-workspace/publications` for the same instant, and `LIVE` appears only for a
      `confirmed` row
28. Functional pass — **only once Phases 4–5 have shipped.** If Gate 1 deferred them, these are
    not checked here; they move to the pass that follows whenever those phases land:
    - Overview's today's-schedule panel filters and formats correctly for a Schedule in a
      timezone other than `Asia/Bangkok` — the reason the `timezone` field was added at all
    - that panel shows the split count: a Publication targeting Channels and Devices reads
      `X Channels · Y Devices`, not one combined "Channels" number
29. Re-measure every Phase 0 number; append to the SESSIONLOG.
30. **Gate.** If moving around Media Workspace is comfortable, stop — ADR §6 is the record of why
    no cache was built. Only if return visits still hurt does Phase 7 start, and only after a
    second ADR carrying this gate's re-measured numbers is accepted. That ADR must settle:
    - **the subscriber seam** — name it (`useCatalogueResource(resource, fetcher)`, plus the exact
      call sites converted) or drop stale-while-revalidate entirely and delete the subscriber
      mechanism with it; a plain `async` function receives a stale value once and can never be
      told the background refresh landed, so without that seam the subscriber set is dead weight
    - **whether stale-first earns its complexity at all**, given that the freshness window step
      in Phase 7 is what removes repeat requests, with no notification machinery
31. PR opens as **Draft** unless every check ran and passed. Claude never marks it ready.

## Phase 7 — gated on the second ADR: cache exactly four catalogue reads

New file: `src/lib/api/catalogue-cache.ts`.

32. Wrap **only** `fetchLayouts`, `fetchMediaAssets`, `fetchPlaylists`, `fetchContentFolders`.
    Do **not** touch `requestApi`: it serves `GET /session` for `asset-intelligence`
    (`assets-api`'s `getCurrentTenantId`) and member reads for `people/personnel`, so a path-keyed cache there can
    hand operator A's session and catalogue to operator B after a client-side re-login.
33. One resource union — `type Catalogue = "layouts" | "assets" | "playlists" | "folders"` — is
    the vocabulary everywhere: the cache key's first segment and `invalidate`'s only argument. No
    API path ever reaches the cache in any argument.
34. `Map` keyed by that `Catalogue` value plus the call's arguments, holding settled values and
    in-flight promises so two components mounting at once share one request. A per-key subscriber
    set exists **only if the second ADR chose stale-while-revalidate**; if it chose the freshness
    window alone, the subscriber half is deleted rather than built, `invalidate` only drops the
    entry, and the check file loses its notification and background-refresh cases.
35. `invalidate(catalogue)` is called **explicitly** by each mutation with the catalogue it
    dirties — `playlists-api.ts` calls `invalidate("playlists")`, `upload-api.ts` calls
    `invalidate("assets")`. Never derive the target from the mutation URL.
36. `clearCatalogueCache()` on login (`LoginForm.tsx`) and logout (`UserMenu.tsx`).
37. A short freshness window (start at 30s) inside which a hit does **not** refetch — without it,
    return-visit request count is unchanged and only time-to-content moves.
38. One `src/lib/api/catalogue-cache.check.mts` with `node:assert`, no runner: dedupe, freshness
    window suppresses the refetch, explicit invalidation drops the entry, `clearCatalogueCache`
    empties. Three further cases only if the subscriber set was built — stale hit notifies,
    invalidation notifies, failed background refresh keeps the old value.

## Phase 7 checks

39. Functional pass — the cache changes what a page shows after a mutation:
    - rename a Playlist → list and Composition picker both show the new name
    - upload an Asset → appears in the library and in the Zone picker
    - move a Playlist to a Folder → the folder rail updates
    - bind a Zone to a Playlist never opened → items and playback still load
    - log out, log in as another operator → no catalogue or session from the first
    - Now & Next still reflects current airing state and is never served stale
40. Re-measure; append to the SESSIONLOG. PR stays Draft unless every check passed.

## Phase 8 — deferred: pagination

Not in this branch. `media-library-page` is the pattern — `fetchMediaAssetPage`, page size 12,
250 ms debounce. Revisit past roughly 500 Assets or 300 Playlists, per ADR §8.

## Out of scope

Caching `fetchPreviewUrls`; persisting any cache across reloads; every page outside Media
Workspace; any Thunder_Core change beyond Phase 4.
