# Session log — ticket status audit and the 19/20 plans (2026-08-28)

Branch `feat/layout`, two commits, **not pushed**:

- `8d19d7e docs(layouts): plan custom resolution and target-geometry preview`
- `f4f1e48 docs(layouts): correct ticket status against production`

Documents only. No `src/` change this session, so nothing was browser-verified and nothing needed to
be.

## What happened

Ticket 19 (custom resolution) and Ticket 20 (target-geometry preview + full tab) were scrutinised
against the code and against production, rewritten, and each given a ticket file. Eleven design gaps
were closed in ADR 0050, ADR 0051, `CONTEXT.md` and the two plans — the load-bearing ones being: the
preview tab's route has no auth unless it repeats `getSession()` itself (this repo has no
middleware); preview must reload by **Composition** id because a Layout carries no items; the
`(dashboard)` layout would wrap a preview tab in Sidebar/Topbar chrome; and `aspect_ratio` must be
GCD-reduced or new Layouts read `1920:1080` beside legacy `16:9`.

Five ticket statuses were wrong and now match production, checked read-only via Supabase MCP against
`sfiefevtxalqjizdkcsw`. 04 and 05 said `ready-for-agent` while their migrations were live; 09 said
its frontend was uncommitted (it is `4b6d9d7`); 15 said in progress though the merged editor ships;
10 was blocked and is not any more.

## Where the fleet actually stands

Production has **0 composition Publications**. Every composition path — the publish type, activation,
the overlap block, the geometry advisory — is shipped and has never run on real data.
`publication_snapshot_zones` holds 110 rows, all one-Zone snapshots from `image` / `playlist` /
`video`.

`media_job_poll` in production already joins `publication_snapshot_zones`, but only to reach snapshot
items, which it flattens into the existing `v_slots`. **No `zones[]` key is emitted.** No screen has
ever received a multi-Zone payload.

## Execute in this order

**1. Ticket 10 — `zones[]` in the job poll.** Just unblocked. This is the bottleneck: 15, 16, 19 and
20 are all authoring and preview work on a path that still cannot reach a screen, and 10 is the only
ticket that changes that. Cross-repo (Thunder_Core `media_job_poll` + the jobs route here, which
today signs only `result.slots` and would return `file.url = null` for every asset in a zoned
payload).

**R0 — it rewrites an activation-adjacent function that is live in production. Rehearse on
`develop`, get approval before touching production, and remember `DROP FUNCTION` before
`CREATE OR REPLACE` if the signature moves.** Worth Opus.

Do not report playback as verified from a correct payload: rendering lives in the player repo.

**2. Ticket 19 — custom resolution and responsive canvas.** Frontend only, no migration, no blockers,
and the plan is task-by-task with the baseline already verified. This is pure execution — start it on
Sonnet, and it can run in parallel with 10 since they share no files.

**3. Ticket 20 — target geometry profiles and full preview tab.** Also ready, also frontend only, but
heavier: step 1 extracts the player out of `PlaybackPreviewModal`, which all three existing preview
mount points depend on. Run 19 first or in parallel, never interleaved with it in the same working
tree.

**4. Residuals worth closing while nearby.**

- Ticket 16 — the failed-layout-fetch path is still unverified; it cannot be blocked from the browser
  surface that was available.
- Ticket 06 — verified on `develop` but never pushed, and the `republish` HTTP route has not been
  exercised in isolation.

**5. Not startable here.** 18 needs player-repo work; 17 waits on 18 plus a fleet readiness threshold
nobody has set; 13 needs the player repo and a three-monitor customer; 08 is deferred by ADR 0054.

## Rules that bit this work and will bite again

- Ticket checkboxes are not maintained — only 07 and 12 have any ticked. Trust `**Status:**` and the
  code, not the boxes.
- This repo has no `middleware.ts`. Auth is `src/app/(dashboard)/layout.tsx` calling `getSession()`,
  which redirects `/login` itself and returns `"forbidden"` for a tenant-less account.
- Every `.env` points at production. Reads are safe; anything else is R0.
