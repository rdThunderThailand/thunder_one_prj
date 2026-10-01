# SESSIONLOG — Media Workspace request-count epic, Phase 4 + 5

**Date:** 2026-09-08 · **Branch:** `feat/caching` (FE) + `develop` (Thunder_Core, migration file untracked)

## Context

Session 3 of the request-count epic. Gate 1 decision (from session 2): do Phase 4 now
instead of deferring to Gate 2. See `docs/adr/0065-media-workspace-asks-for-what-it-draws.md`
§3 and `docs/media-library/plan-request-count.md` items 20–25.

## Phase 4 — backend migration, APPLIED to develop + prod

`Thunder_Core/supabase/migrations/20260908170000_publications_list_schedule_and_targets.sql`
(untracked in this repo, lives in Thunder_Core):

- `CREATE OR REPLACE FUNCTION public.media_publications_list` — signature unchanged, no DROP.
- Adds 4 JSON keys to each row: `starts_at`, `ends_at`, `timezone` (from the existing
  schedules LATERAL), `target_summary` = `{channels, devices}` (new sub-aggregate over
  `publication_targets`, split by `target_type`).

Applied via Supabase MCP `apply_migration` to branch project `ftfmokgphewzyxzwjitv`
(ThunderCore `develop`) and prod project `sfiefevtxalqjizdkcsw` (ThunderCore).

Post-apply verification: `md5(prosrc)` identical on both DBs and equal to the migration
file body (`d11c3e81…`); `proacl` unchanged (`{postgres=X/postgres,service_role=X/postgres}`,
no PUBLIC — CLAUDE.md §6 trap avoided since this was CREATE OR REPLACE without DROP);
`prosecdef` true; signature `(uuid, character varying)` unchanged. Live calls: develop 116
rows, prod 154/154 rows carry the new keys; rows with no Schedule return null `starts_at`/
`timezone` without erroring.

`src/app/api/core/v1/media/publications/route.ts:46` is a pass-through of the RPC result —
no backend code change, no deploy needed, the new shape was live immediately.

**The migration file is not committed to Thunder_Core yet** — needs its own commit/PR on a
Thunder_Core branch (currently sits on `develop` uncommitted).

## Phase 5 — frontend, this repo

- [types/index.ts](../src/features/media-workspace/publications/types/index.ts) —
  `PublicationListItem` gains `starts_at?`, `ends_at?`, `timezone?` (`string | null`),
  `target_summary?`.
- [todays-schedule.ts](../src/features/media-workspace/overview/todays-schedule.ts) (new) —
  `todaysSchedule()`, `targetSummary()`, `scheduleTime()`. Pulled out of the component because
  neither the non-Bangkok-timezone branch nor the split-target branch is browser-exercisable
  against current data (see Gate 2 note below).
- [todays-schedule.check.mts](../src/features/media-workspace/overview/todays-schedule.check.mts)
  (new) — `node:assert`, covers per-zone "today", earliest-first + cap 6, target split,
  legacy-row Bangkok fallback.
- [LowerOverview.tsx](../src/features/media-workspace/overview/components/LowerOverview.tsx) —
  deletes the `Promise.allSettled(rows.map(fetchPublication))` N+1. Now only `fetchChannels` +
  `fetchPublications`. This removes the last N+1 on Overview.

Gates passed: repo-wide `tsc --noEmit` clean (after `rm -rf .next/dev/types`); `eslint` clean
on changed dirs; 62/62 `*.check.mts` pass (was 61, +1 new).

## Verification (this session)

Browser, logged in as `piyapat@thunder.co.th` against dev server (:3000) → Thunder_Core (:3001)
→ ThunderCore `develop`:

- No console errors on `/media-workspace` (Overview).
- `performance.getEntriesByType('resource')` filtered to `/api/proxy/` showed exactly 3
  requests: `now-next`, `publications?status=active`, `channels` — **no per-publication N+1**,
  confirms the fetch removal actually took effect end-to-end, not just in the diff.
- Today's Schedule panel renders without crashing — empty state ("No scheduled publications
  for today") because develop has no Schedule matching today, not because of an error.
- Now Playing / Next Up / Needs Attention / Channel Health all render correctly (regression
  check for the Overview panels this touches indirectly).

**Not verified:** the non-Bangkok-timezone branch and the split channel+device target branch
of `todays-schedule.ts` — `media_core.schedules` has only `Asia/Bangkok` (1 distinct tz on both
DBs) and zero Publications target both Channels and Devices at once. Coverage for those two
branches is the `.check.mts` only; testing them against real UI data needs seeded rows, which
is a DB write requiring separate R0 approval — flagged, not done silently.

## Gate 2 — items 26, 27, 29 (this session)

item 28 decision (user, this session): accept `todays-schedule.check.mts` as the proof for the
two branches real data can't exercise (non-`Asia/Bangkok` timezone, split Channel+Device
target). No seed data written — that would be a separate R0 approval. PR stays Draft.

### 26 — gates

`rm -rf .next/dev/types` → `npx tsc --noEmit`: clean. `npx eslint src/features/media-workspace`:
0 errors (1 pre-existing `no-img-element` warning in `CompositionLibraryPreview.tsx`, unrelated).
All 62 `*.check.mts` under `src/`: pass.

### 27 — functional pass (browser, logged in as `piyapat@thunder.co.th`, dev server :3000 → Core
:3001 → ThunderCore `develop`)

- Composition editor (`.../layouts/af896984-…`, 3 Zones): all three Zones show "Bound", no
  console errors.
- Publications list (`.../publications/manage`): Drafts (10) / Active (2) / Inactive (104) tabs
  all render; detail panel for an active row shows Schedule (`starts_at`/`ends_at`/`timezone`)
  correctly.
- Publication wizard: selected an existing Approved asset (`KFC-small.jpg`) at the Content step,
  advanced through Channels → Schedule → Review & Publish — the asset stayed selected at every
  step through "5 of 5 steps completed". Did not click Publish. The draft this created
  (autosaved on step advance) was deleted afterward via the list's own delete control.
- Compositions list (`.../layouts`): 6 rows with preview thumbnails render.
- Overview parity: Now & Next page showed `Playback Confirmed: 0`; Overview's Now Playing showed
  "No playback confirmed" and no `LIVE` badge anywhere — consistent, `LIVE` only ever attaches to
  a `confirmed` row.

No console errors on any of the above.

### 29 — re-measured proxy request counts (same method as Phase 0: `/api/proxy/` resource
timings, fresh nav, this tenant on `develop`)

| surface | baseline (Phase 0) | now | note |
|---|---|---|---|
| `/media-workspace` Overview | 75 | **3** | both N+1s (Program cards + LowerOverview) gone |
| Composition editor (`b993132c-…`) | 19 | **11** | Playlist-detail N+1 collapsed ×11→×3 (one call per Zone referencing it, not deduped further — out of this epic's scope) |
| Publications list (`.../manage`) | 3 | **1** | three status-filtered list calls collapsed into one |
| Wizard step 1, no draft (`.../create`) | 4 | **4** | unchanged — this route wasn't touched |

### 29 (cont.) — the return-visit number, measured

The first pass skipped this one; it is the number Gate item 30 actually turns on, so it was
measured properly afterwards. Client-side navigation only (clicking the sidebar links), because
a full page load resets `performance` resource timings and would not reproduce the path.

Path: editor (`b993132c-…`) → Playlists → Layouts (compositions list) → same composition.

| metric | baseline (Phase 0) | now |
|---|---|---|
| Round trip, editor → playlists → editor | 36 | **39** |
| Return editor load, in isolation | ≈19 | **20**, drain 15.25s |

**The round trip did not improve.** The Playlist-detail N+1 did shrink (`/media/playlists/{id}`
×14 → ×6), but `/media/videos/preview-urls` grew (×5 → ×12, the compositions list gained rows
since the baseline was taken), and the two roughly cancel.

**New finding — client-side navigation double-fetches everything.** In the isolated return
editor load, every catalogue read fires exactly twice:

| read | hard page load | SPA return |
|---|---|---|
| `/media/layouts?kind=template` | ×1 | **×2** |
| `/media/videos?page=1&page_size=200` | ×1 | **×2** |
| `/media/playlists` | ×1 | **×2** |
| `/media/folders?scope=composition` | ×1 | **×2** |
| `/media/compositions/{id}` | ×1 | **×2** |
| `/media/tags` | ×2 | ×2 |

Not editor-specific: the Playlists page leg shows `?include_drafts=true` ×2 and
`folders?scope=playlist` ×2, and the compositions list leg shows `compositions?page=1…` ×2, in
the same round trip.

**Root cause: React StrictMode, dev only. Not a bug.** Established by:

1. Reproduced in a clean browser tab (the tab used for the first measurements had been open
   ~13h through many HMR reconnects, so it was not trusted): fresh tab, hard load of the editor
   = 12 requests, every catalogue read ×1; SPA return to the same editor = 20, every catalogue
   read ×2, drain 12.31s. Same result, so the doubling is not tab state.
2. The gap between each doubled pair is **3–4 ms** — an immediate mount → unmount → remount,
   not a dependency-driven refetch. `/media/playlists/{id}` shows it as two batches of 3, at
   877 ms and 1764 ms: the same N+1 re-running after the remount.
3. Walking the React fiber tree from `<main>` up to `HostRoot` finds a **Mode fiber (tag 8)**
   directly under the root, wrapping the whole app — `reactStrictMode` is not set in
   `next.config.ts`, so the App Router default (`true`) applies.

StrictMode double-invokes effects on mount in development. It does not do so on the initial
hydration mount, which is exactly why a hard load shows ×1 and a client navigation shows ×2.
A production build does not double-invoke at all.

**So dev-mode return-visit numbers overstate the real cost by roughly 2×**, and there is no
redundant-fetch defect to fix. Not proven to the last inch — that would take setting
`reactStrictMode: false` and restarting the dev server (the user's own 13h-old process, left
untouched) — but StrictMode present + 3–4 ms gaps + the hydration asymmetry all agree.

### 30 — the Gate: **Phase 7 does not start**

Decided by the user this session, on the numbers above.

Once the StrictMode doubling is discounted, a **production** return to the editor is ~12
requests — the same as a first load, because nothing is reused. That is ADR P4 exactly, and it
is what Phase 7 exists to address. Of those ~12, the four reads Phase 7 would cache
(`layouts?kind=template`, `videos?page_size=200`, `playlists`, `folders?scope=composition`) are
**4**. So Phase 7 buys a warm return of ~8 instead of ~12.

Against that: a new `catalogue-cache.ts`, the subscriber seam, an explicit `invalidate()` at
every mutation site, login/logout clearing, a freshness window, a check file, and a second ADR —
plus the security constraint that `requestApi` must stay uncached or one operator's session can
be served to another (plan item 32). **Four requests is not worth that surface.**

No timing claim is made either way: every drain figure here is from `next dev`, which is not
representative of production, so "does it feel slow" was not measurable in this session.

Note the earlier reasoning in this session was wrong and is corrected here: the double-fetch was
first read as a redundant-fetch defect worth fixing *instead of* Phase 7, on numbers taken in a
stale browser tab. It is a dev-mode artifact; there is no such fix to do, and no work is queued
from it.

No second ADR is written. Per plan item 30, ADR 0065 §6 remains the record of why no cache was
built. Phase 7 and Phase 8 stay unstarted.

## Next

- Nothing is queued from the double-fetch finding — it is StrictMode, dev only.
- If Phase 7 is ever revisited, measure a **production build** first; `next dev` numbers cannot
  answer the gate's "is it comfortable" question.
- PR — one PR for the whole epic, opens Draft (item 28's two branches are `.check.mts`-only).
  Ask Thai or English first.
- Thunder_Core migration file already committed this session, on
  `feat/publications-schedule-targets-migration` (branched off `develop`) — still needs its own
  PR in that repo.
