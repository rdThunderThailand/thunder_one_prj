# Session log — v0.5.2 link regression (2026-10-01, session 12)

## Goal
Read `HANDOFF-program-after-v0.5.1-2026-10-01.md`, fix the regression it found, do item 5, release v0.5.2, verify on prod.

## What happened
1. **Regression (my own, from v0.5.1).** The route move rewrote `LIST_HREF` to `/media-workspace/now-next`; `PublicationEditPage` concatenated it with an id, so Duplicate / Publish Draft / View Published Version went to `/now-next/<id>` (404) on prod. Audit found only those 3 sites.
2. **Env trap.** The dev server on :3000 started before `.env.local` was switched back to develop, so it still targeted prod. Killed it, started Core (:3001, `develop`) and the frontend fresh.
3. **Verified on develop** (UI): View Published Version, Duplicate, Publish Draft all land on `/program/…`.
4. **Item 5.** Repointed "back to Programs" links to `/program`; merged `LIST_HREF` + `PROGRAM_HREF` into one `PROGRAM_HREF`; left Overview calendar link, Channel "Now Playing" `?q=` link and the demo detail back link on Now & Next; amended ADR 0081 Consequences. Verified Edit breadcrumb/Go Back, Detail "กลับ", Channel Group "View Programs →", Edit Channel "Go to Programs" by clicking.
5. **PRs / release (owner merged each).** #190 fix + item 5 → #191 bump 0.5.2 → #192 release `dev → main` (promotion #7) → tag `v0.5.2` on `579e496` (pushed after an explicit yes) → #193 release-table row.
6. **Prod verification (tenant `thunder_demo`).** View Published Version read-only on an Ended Program; then, after the user logged into `thunder_demo`: Duplicate, Publish Draft, Edit → Delete, Edit → End, Detail → ลบ, Detail → Cancel, Create → Cancel. A Duplicate carries "From now, no end date", so each Published copy was first re-scheduled to a one-time 2027-01-15 so nothing aired.
7. Looked into a "Create → Cancel needs two clicks" note: not a bug (resume Modal backdrop = continue).

## Verification layers
- Done: `pnpm install --frozen-lockfile`, `tsc --noEmit`, `eslint` on changed files, `next build` (all exit 0); browser UI on develop and on prod, with network log confirming DELETE / `/cancel` calls.
- Not done: links inside Detail/Create error states; Edit page Discard dialog.

## Left behind
- prod `thunder_demo`: two Ended copies `05c05db6…`, `290bf753…` (never aired).
- develop: `b6cf8b2d…` "zz-fe-d-live (Copy)" plus older `zz-fe-*` rows (user said leave).
- Dev server :3000 and Core :3001 started this session.

## Findings (not fixed, out of scope)
- A Duplicate inherits an open-ended "start now" schedule — publishing the copy airs immediately on the same targets. Possibly worth a design look (not raised as a ticket yet).

## Next
See `HANDOFF-program-after-v0.5.2-2026-10-01.md`.
