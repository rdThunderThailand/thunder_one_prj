# SESSIONLOG — ticket 06 drift indicator (2026-08-27)

Ticket: `docs/layouts/tickets/06-drift-indicator.md` · Decided by ADR 0049 §7/§11 and, for the fork
found in this session, the new ADR 0053.

## The design fork that appeared mid-ticket

The ticket was assessed as pure execute (no fork pending, ADR 0049 covers §7/§11). Checklist item 5 —
"the action offered is re-publish" — turned out to have no mechanism behind it: there is no
`republish` / `reactivate` / revert-to-draft RPC anywhere, and `media_publication_activate` opens with
`IF v_status <> 'draft' THEN RAISE EXCEPTION 'Already active'`. Ticket 05 rehearsed the republish
*behaviour* by forcing `status` back to `draft` with a direct `UPDATE`, which is not something an
operator can reach.

First recommendation was to relax that guard (shortest diff, no duplicated SQL). **That was wrong**
and was withdrawn after reading the client: `usePublishDraft.publishNow`
(`src/features/media-workspace/publications/hooks/usePublishDraft.ts:307`) catches
`kind === "already-active"` and treats it as success — it is the idempotence signal for a publish
that timed out with the transaction already committed. Relaxing the guard turns that retry into a
silent duplicate publish.

Decision taken (ADR 0053): a separate `media_publication_republish` that reverts to draft and
**delegates to `media_publication_activate`** in the same transaction. `activate` is untouched, and no
materialization SQL is duplicated.

## Second finding: `media_publication_get` cannot count to two

Once re-publish is real, a Publication routinely holds more than one Job. `media_job_poll` has always
handled that (`DISTINCT ON (pub.id) … ORDER BY pj.created_at DESC, pj.id DESC`).
`media_publication_get` did not: it joined `publish_jobs` on `publication_id` with no ordering and
read the row with `SELECT … INTO`, so `job_status` and the whole per-device delivery table came from
an arbitrary Job. Corrected to the same newest-Job rule in the same migration.

Audited every other reader of `publish_jobs` for the same fault:

| function | verdict |
|---|---|
| `media_job_poll` | safe — newest-Job rule already |
| `media_publication_download_report`, `media_playback_log`, `media_job_ack` | safe — Job resolved from the `target_id` the player carries |
| `media_publication_cancel` | safe — touches no Job |
| `media_publications_list` | safe — no Job join |
| `media_publication_retry_targets` | **operates on every Job of the Publication.** After a re-publish it re-opens targets on the superseded Job. Invisible (poll serves only the newest Job, and `get` now reads only the newest) and out of ticket 06's scope. Recorded in ADR 0053, Consequences. Not fixed. |

## What was written

**Thunder_Core** (branch `feat/layout`, not committed)
- `supabase/migrations/20260827120000_republish_and_drift_read.sql` — `media_publication_republish`
  (new) + `media_publication_get` (newest Job, plus `drift_check`)
- `src/app/api/core/v1/media/publications/[id]/republish/route.ts` — thin passthrough, same shape as
  the `activate` and `cancel` routes

**thunder_one_prj** (branch `feat/layout`, not committed)
- `docs/adr/0053-republish-in-place.md`
- `src/features/media-workspace/publications/publication-drift.ts` — `publicationDrift()`, returns
  every level that changed, naming the Zone and Playlist for level three
- `src/features/media-workspace/publications/publication-drift.check.mts`
- `src/features/media-workspace/publications/types/index.ts` — `drift_check` on `PublicationDetail`
- `src/features/media-workspace/publications/services/publications-api.ts` — `republishPublication`
- `src/features/media-workspace/publications/components/PublicationDetailPage.tsx` — the indicator
  card, `describeDrift`, and the two-step re-publish action

`hasLayoutZoneDrift` needed no work: it was already gone with ticket 03's rewrite, and nothing
imports it. Only a comment in `compositions/zone-bindings.ts:6` still names it, explaining why.

## Verified

- `publication-drift.check.mts` — **passes.** Eight cases: settled, drift at each of the three levels
  separately, all three at once (four findings, ordered), a flat Publication (`drift_check` null and
  absent), a non-active Publication at both `draft` and `cancelled`, and a pre-drift-columns snapshot.
- `npx tsc --noEmit` in `thunder_one_prj` — clean (`.next/dev/types` cleared first).
- `npx eslint src/features/media-workspace/publications/` — clean.
- `Thunder_Core` tsc — no error naming the new route. The repo-wide count is not clean and never has
  been; gated on the changed file only.
- Migration applied to **develop** (`ftfmokgphewzyxzwjitv`) and checked there:
  - `media_publication_republish` and `media_publication_get` have exactly **one overload each**
  - grants: `service_role` may execute `republish`; `anon` and `authenticated` may not
  - `media_publication_get` on the ticket-05 composition Publication
    `7b6cb708-bceb-4a0d-b266-a5e10e1f821e` (2 Jobs already) returns a populated `drift_check`:
    `composition_revision` 2 = 2, `layout_updated_at` identical, both Zones (`Main`, `Side`,
    both bound to Playlist "Boss test") recorded 10 = live 10 → **not drifted, correctly**
  - the `targets` array matches the newest Job's target set

### Browser, run by the operator against develop

Publication `7b6cb708-…`, Composition `af896984-…` (Zones `Main` and `Side`, both bound to the one
Playlist "Boss test", so a single Playlist edit is expected to flag both).

- **A pass** — no indicator before anything was edited.
- **B pass, with an unrelated defect found** — the item's duration was changed and survived a reload.
  Getting there needed the canonical `/media-workspace/playlists/create?…`; the `Edit` affordance in
  the Playlist list links to `/playlists/create?…`, which 404s. See "Found in passing" below.
- **C pass** — exactly two bullets, `Main` and `Side`, both naming Playlist "Boss test". No
  Composition bullet and no Layout bullet. This is level three isolated, which is the level the
  ticket singles out as not optional.
- **D pass** — the action is two-step: `เผยแพร่ซ้ำ` → `ยืนยันเผยแพร่ซ้ำ?` / `ไม่`.
- **E pass** — after confirming, the indicator cleared, `Job Status` went to `pending`,
  `Activated At` became 8/27/2026 11:03:02 AM, and the URL and Publication id were unchanged.
- **F pass** — an active flat Publication is never flagged.

### Database, after the browser run

Read back for `7b6cb708-…`: **three** Jobs, one per activation.

| Job created (UTC) | snapshot | zones | items | recorded `playlist_revision` per Zone |
|---|---|---|---|---|
| 02:58:27 | `fdcb930f…` | 2 | 6 | `[10, 10]` |
| 03:09:32 | `f1eab3e9…`'s `bccf0569…` | 2 | 6 | `[10, 10]` |
| 04:03:02 | `15182a70…` | 2 | 6 | `[12, 12]` |

The third row is the browser re-publish — 04:03:02 UTC is 11:03:02 ICT, the `Activated At` seen on
screen. The two older snapshots still carry `[10, 10]`: **immutable, as ADR 0045 §3 requires**, while
the new one recorded the Playlist's current revision, which is why the indicator cleared. Structure
is identical across all three (2 Zones, 6 items), so re-publish reproduced the snapshot rather than
degrading it.

## Committed

Both repos, branch `feat/layout`, **not pushed**:

- `Thunder_Core@361c428` — `feat(media-publication): add re-publish and read the newest job`
  (migration + `republish` route only)
- `thunder_one_prj@1dac6c5` — `feat(media-workspace): flag a drifted Publication and offer
  re-publish` (ADR 0053, `publication-drift.ts`/`.check.mts`, types, api client, UI)

`src/proxy.ts` (someone else's login-loop fix, pre-existing before this session) was left unstaged in
both commits, as were the two playlist-link files once the background 404 fix started touching them
(see "Found in passing" below).

## Production apply

Applied `20260827120000_republish_and_drift_read.sql` to **production** (`sfiefevtxalqjizdkcsw`), same
file as develop, verbatim. Verified after apply:

- `media_publication_republish` and `media_publication_get` each have exactly **one overload**
- grants: `service_role` may execute `republish`; `anon` and `authenticated` may not
- production had **0** composition Publications before and after — no row affected
- `media_publication_get` called live against an existing active flat Publication
  (`86d085ac-834a-4ae9-818e-fbb1ff98b436`) returns normally: `status: active`, `job_status: pending`,
  `drift_check: null` (correct — no Composition), no exception

**Not verified on production**: nothing through the browser and nothing through the `republish` HTTP
route — there is no composition Publication on production yet to exercise either against. The change
is additive and SQL-checked only.

## NOT verified

- ~~**G — a composition Publication in `draft` was never opened in the browser**~~ **CLOSED
  2026-08-27** (later session). develop still has no natural composition draft, so the one active
  composition Publication `7b6cb708-…` was reverted to `draft` by direct `UPDATE` and its Zone
  Playlist "Boss test" bumped 12 → 13, giving a populated `drift_check` (both Zones recorded 12 vs
  live 13) on a `draft` row. Browser at `/media-workspace/publications/7b6cb708-…`: page rendered,
  status `draft`, and **no "มีการแก้ไขหลังเผยแพร่" card, no re-publish button, no Zone bullets** —
  the client `status !== "active"` guard holds at the user layer. develop restored immediately
  after: `revision` back to 12, `status` back to `active`, newest recorded revision 12 = live 12
  (not drifted, exact prior state).
- The `republish` HTTP route (Thunder_Core's own route handler, as opposed to the RPC it calls) has
  never been hit directly — the browser run went through it, but no isolated check (e.g. curl) exists.

Still unverified overall: the `republish` route in isolation. Scenario G no longer blocks a
non-Draft PR (closed 2026-08-27).

## Found in passing — spun off, not part of this ticket's commits

`/playlists/create?id=…` is built without the `/media-workspace` prefix in two places, while the only
route that exists is `src/app/(dashboard)/(application)/media-workspace/playlists`:

- `src/features/media-workspace/playlists/components/PlaylistSidePanel.tsx:162`
- `src/features/media-workspace/playlists/components/PlaylistsListPage.tsx:150`

The same files get it right elsewhere (`PlaylistsListPage.tsx:195`, `PlaylistDetailPage.tsx:143`), so
this is two stale literals, not a routing decision. Spun off as a separate background session
(`task_b8f19ddb`) — **left running, not merged, uncommitted** at the end of this session. It has since
also touched `PlaylistPanelTabs.tsx`, unseen by this session. Check its state before doing anything
else with those three files.

## Left for the operator to decide

The drift indicator is on the **detail page only**. The checklist says "The Publication read path"
(singular — `media_publication_get`) and its browser step is detail-shaped, so that is what was built.
Story 29 in the spec ("told **which Publications** no longer match") reads as the list page. Adding it
there means either duplicating the comparison in SQL or carrying the full recorded/live payload on
every list row. Not done, not decided.

## Next

1. Commit both repos (nothing is committed yet; `src/proxy.ts` in `thunder_one_prj` is someone
   else's login-loop fix and must not be staged with this work).
2. Ask before applying `20260827120000_republish_and_drift_read.sql` to production.
3. Close G the first time a composition draft exists on develop — ticket 10 will create one.
