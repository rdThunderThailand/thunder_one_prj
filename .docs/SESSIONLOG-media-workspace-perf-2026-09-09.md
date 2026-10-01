# SESSIONLOG — Media Workspace performance: region pin, hidden-tab polling, preview-URL batching

**Date:** 2026-09-09 · **Branches:** `fix/perf` (PR #72, merged) → `perf/preview-urls-batching` (PR #73, merged)
**Trigger:** user asked what else to do about page-load time / DB-backend load, reading the
2026-09-08 request-count epic's session log.

## What this session did

1. Read `.docs/SESSIONLOG-request-count-epic-ship-2026-09-08.md` and `docs/adr/0065-*.md`, gave
   an opinion (not just options) on what to do next, ranked by cost/benefit.
2. Found and fixed the Vercel function region: `thunder_one_prj` had no `vercel.json`, so its
   proxy ran on the platform default (`iad1`, Virginia) while Thunder_Core and Supabase are both
   `ap-southeast-1`. Pinned to `sin1`.
3. Fixed two 60s polls (`ProgramStatusCards`, `NowNextPage`) that ignored tab visibility — found
   and fixed a self-inflicted bug mid-verification (see §3 below).
4. Did the ADR 0065 §6 production measurement that was never done — request counts on
   `app.thunderone.asia`, not `next dev`.
5. That measurement surfaced a fourth N+1 ADR 0065 never covered: signed preview URLs fetched
   per-card instead of per-list. Wrote ADR 0067, fixed it, re-measured on production.
6. Committed a fix to the wrong branch (`hotfix/priority-pub` instead of the intended feature
   branch) and recovered without losing or clobbering anything — see §5.

## 1 — Region pin (`b884411`, PR #72)

`vercel.json` had never existed for this repo. Measured on `app.thunderone.asia` before the fix
(median TTFB, 8 samples): the proxy route with **no upstream call at all**
(`/api/proxy/__config`) took 386ms against 188ms for a static page — pure Singapore↔Virginia
network cost. The full proxy→Thunder_Core path took 786ms against 423ms hitting Thunder_Core
directly.

After deploy: `/__config` dropped to 150ms, the full path to 240ms. `x-vercel-id` went from
`sin1::iad1::...` (double-hop) to `sin1::sin1::...`. This was free — a 4-line file, no code
change, and the biggest single win of the day by a wide margin.

## 2 — Hidden-tab polling (`922a313`, PR #72)

`ProgramStatusCards` (Overview) and `NowNextPage` both `setInterval(load, 60_000)` with no
visibility check — a tab left open all day polls forever. `useDeliveryProgress` already had this
pattern; borrowed the idea without its adaptive-interval machinery.

**Self-inflicted bug, caught during verification, not after:** the first version gated the
*mount* fetch behind `document.hidden` too, not just the recurring poll. A tab opened while
hidden (or, as it turned out, this browser tool's own tab when not fronted) would never fetch
anything until a `visibilitychange` fired. Caught it live in-browser (Now & Next page stuck on
"Loading Now & Next…" with zero requests), fixed by splitting the always-runs mount call from the
gated poll/visibilitychange calls. Verified after the fix: 60s+ hidden → zero new requests;
flip to visible → request fires immediately; mount while hidden → still loads.

## 3 — ADR 0065 §6 production measurement

First-ever production request-count measurement for this ADR (previous numbers were all
`next dev`). Logged into `app.thunderone.asia`, measured via `performance.getEntriesByType`
per page:

| Page | ADR 0065 estimate | measured |
|---|---|---|
| Overview | ~handful | 3 |
| Now & Next | 1 | 1 |
| Publications list | 1 | 1 |
| Compositions list ("Layouts") | 2 | 6 |
| Composition editor | ~6 | 11 (3 zones bound → 3 legitimate `playlists/{id}` reads, not the old N+1) |
| Playlist editor | 1–4 | 5 |
| Media Library | 2 | 14 |
| Publication wizard (step 1) | 5 | 4 |

Everything ADR 0065 §1 actually changed (Overview, Publications list, Publication wizard) met or
beat its estimate. The two misses — Media Library and Compositions list — both trace to the same
mechanism, not two separate bugs (see §4).

One outlier recorded but not investigated: a single `preview-urls` call on the Composition editor
took 4.8s against ~350ms for its siblings on the same page. Latency, not count — needs its own
look, not fixed here.

## 4 — ADR 0067: preview URLs batched at the list

Traced Media Library's 14 (est. 2) and Compositions list's 6 (est. 2) to the same cause:
`usePreviewUrls` is a batch hook (`POST /media/videos/preview-urls` with an `ids` array) called
once per card instead of once per list. The codebase already had the correct pattern in two
places (`PlaylistsTable`, `AssetLibraryStep` — batch ids at the list, pass URLs down as props);
`assets/AssetCard` and `CompositionLibraryPreview` didn't follow it.

User asked to write the ADR before fixing, even after being told the fix looked like "no real
fork" — right call in hindsight for the paper trail, and the ADR ended up short (no live design
decision, just naming the existing pattern and the two alternatives considered and rejected:
coalescing inside the hook, and a shared URL cache).

Fixed both call sites (`d5e1c57` → PR #73):
- `assets/AssetCard` now takes `previewUrl`/`thumbnailUrl` as props; `media-library-page` batches
  all ids on the page once.
- `CompositionLibraryPreview` now takes `previews` as a prop; `CompositionsTable` (both table and
  grid render modes) batches all zone-cover ids across every row once.

**Verified on dev server (localhost, pointed at production data) before merge:**
- Media Library: 14 → 3 requests. Thumbnails render for 9/12 assets; the other 3 were already
  broken — traced to a pre-existing 70-byte placeholder PNG on Supabase Storage from old test
  data (`ZZTEST-MU04...`), confirmed with a direct `curl` to the signed URL. Not caused by this
  change.
- Compositions list: 6 → 4 requests, but `preview-urls` fired **twice** instead of once. Flagged
  as likely React Strict Mode's dev-only double-invoke (the hook already carries a comment about
  this exact hazard) and explicitly marked unverified against production in the PR.

**Verified on production after merge:**
- Media Library: 3 requests, `preview-urls` ×1. Matches dev.
- Compositions list: navigating by typed URL hit the empty-`<main>` bug (§6) and showed 0
  requests; navigating by clicking the sidebar link showed 3 requests (compositions, folders,
  `preview-urls` ×1) — confirming the double-fire was in fact Strict Mode / dev-only, not a real
  production issue.

## 5 — Wrong-branch commit, caught and recovered

Committed the ADR 0067 fix while the checkout had silently moved to `hotfix/priority-pub` (the
user's own, unrelated branch — created fresh off `dev` after PR #72 merged, no prior commits of
its own). Caught it by checking `git branch --show-current` right after the commit landed —
should have checked *before* committing, per the standing rule from an earlier session that this
checkout moves branches mid-session.

Recovery, no data lost: created `perf/preview-urls-batching` at the stray commit, hard-reset
`hotfix/priority-pub` back to its pre-commit tip (`b302320`, its creation point — confirmed via
`git reflog show hotfix/priority-pub`, which showed nothing before that commit). Told the user
plainly what happened before doing anything.

## 6 — Empty-`<main>` on hard navigation, reproduced with a correction

The 2026-09-08 session log's "long-lived tab renders into a permanently empty `<main>`, a fresh
tab renders it fine" reproduced today — but with the opposite fix. A **fresh tab** hard-navigated
straight to `/media-workspace/layouts` also rendered empty with zero API requests. Only
**client-side navigation** (landing on Overview, then clicking "Layouts" in the sidebar) actually
mounted the page and fired its fetches. Recorded as its own memory
(`thunder-one-hard-nav-empty-main-bug`) since the earlier note's advice ("open a fresh tab") no
longer reliably applies.

## Left standing

- The 4.8s outlier `preview-urls` call on the Composition editor (§3) — not investigated.
- No further N+1 sweep was done beyond what §3's measurement surfaced. Other pages in ADR 0065's
  table (Playlist editor, Publication wizard later steps, Channel editor, Full preview) were not
  re-measured after PR #73; only Media Library and Compositions list were, since they were the
  ones the fix touched.
- Fork 4 from the original conversation — moving first-paint Media Workspace fetches into Server
  Components — is still open and was deliberately not started this session (explicit "before fork
  4" instruction). It needs `grill-with-docs` per the working agreement, not a solo Sonnet/Opus
  design pass.
- Both PRs (#72, #73) are merged to `dev` and deployed to `app.thunderone.asia`. No production
  migration, no backend change, in either.
