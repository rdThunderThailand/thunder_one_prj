# Handoff — multi-zone Layout/Composition track · 2026-08-28

## Intent

Both PRs for the multi-zone Layout/Composition track have merged. This session's remaining
open items are either done, or blocked on the player team. Continue by closing the two small
items still ours, then watch for the player team's Phase 1 to unblock the rest.

## Context and paths

- **`thunder_one_prj#18`** merged into `dev` at `2026-08-28T12:59:24Z`.
- **`Thunder_Core#41`** merged into `develop` at `2026-08-28T12:58:55Z` (merged first, as required —
  the frontend PR expects the server route it carries).
- **Confirmed live on `develop`:** `Thunder_Core/src/app/api/core/v1/media/player/jobs/route.ts`
  now imports and calls `signableSlots` (`src/app/api/core/v1/media/player/jobs/signable-slots.ts`),
  which walks both `result.slots` and `result.zones[].slots`. This was the blocker keeping every
  zoned-payload asset at `file.url = null`; it's closed as of this merge.
- **`Thunder_Core#38`** closed (not merged) — its content (`014_restore_auth_fkey.sql` +
  session log) was already byte-identical on `feat/layout`, folded into `#41`.
- Ticket docs: `docs/layouts/tickets/01–20*.md`. Contract: `docs/layouts/contract-v2-zones.md`.
  Player hand-off replies: `docs/layouts/contract-v2-zones-player-reply.md` and `-reply-2.md`.
- Supabase projects: `sfiefevtxalqjizdkcsw` (production), `ftfmokgphewzyxzwjitv` (develop) — see
  `[Thunder_Core .env points at production]` memory before assuming which one `.env` targets;
  it changes.

## What's already done this session (don't re-derive)

- **Ticket 06** (drift indicator): `republish` HTTP route exercised in isolation via browser —
  forced drift by re-saving a Layout, confirmed the banner, clicked re-publish, got `200 OK` from
  `POST .../publications/{id}/republish`, banner cleared. No residual left.
- **Ticket 18** (`profile_required`): migration applied to **production**
  (`20260828160000_profile_required_geometry.sql`). Post-apply `pg_get_functiondef` md5 matches
  develop byte-for-byte (`1027002b…`), one overload, grants `service_role` + owner only. **SQL-layer
  only** — no live device heartbeat was exercised against production, matching the ticket's own
  acceptance criterion (end-to-end targets `develop` against a real player build, not production).

## Constraints

- **No new scope.** This track's code is complete; do not add features. The only legitimate work
  left under our control is documentation status and, eventually, the `dev`/`develop` → `main`/
  production promotion of what's already merged (that promotion is its own decision, not assumed
  here).
- **Do not apply anything to production** without going through the R0 approval flow (state what
  will change, show the exact SQL, wait for explicit yes) — same as this session did for ticket 18.
- **Do not fabricate player-side progress.** Tickets 10 end-to-end, 13, 17, and 18's end-to-end
  clause are blocked on the player team (Windows/Android repos), not on anything in this repo.
  Don't attempt to simulate or mark them done from this side.
- Keep `.docs/SESSIONLOG-*.md` / `.docs/HANDOFF-*.md` convention — new file per session, not
  appended. `.docs/` is gitignored; these are local continuity aids, not committed artifacts.

## Acceptance criteria for the next session's opening move

- [ ] Re-confirm `git log --oneline -1 origin/develop -- .../jobs/route.ts` still shows
      `signableSlots` wired in (catches any accidental revert) — one command, report the commit hash.
- [ ] Check whether the player team has started Phase 1 (parsing `zones[]`) — if they've sent a new
      status doc, read it before doing anything else; if not, no action needed, just note it in the
      next SESSIONLOG.
- [ ] If a design decision surfaces (e.g. ticket 17's fleet-readiness threshold), stop and grill per
      CLAUDE.md §1 — do not pick a number unilaterally.
- [ ] If asked to promote `dev`/`develop` to `main`/production, treat that as its own R0 conversation
      with its own approval — this handoff does not pre-authorize it.

## Out of scope

- Any new Layout/Composition feature work — the track is feature-complete.
- Ticket 08 (capability enforcement) and ticket 13 (player span-all-displays) — both deliberately
  deferred/owned elsewhere; don't pick them up speculatively.
- Rewriting or re-verifying anything already marked `[x]` in the ticket docs without a concrete
  reason (a regression report, a new player question) to re-open it.
