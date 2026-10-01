# Session log — schedule-anchored playback loop (ADR 0043)

**Date:** 2026-08-24
**Branch:** `feat/timesync-loop-anchor`

## What triggered this

The signage/player team sent `TIME_SYNC_BACKEND_RECOMMENDATION.md`, proposing a `timeline_start_at`
field on `media_job_poll` to fix reported "playback loop is out of sync" symptoms.

## Process

Ran `/mattpocock-skills:grill-with-docs` (grilling + domain-modeling) against ADR 0042, the deployed
migration (`20260824130000_synchronized_playback_epoch_phase.sql`), the player integration doc, and
live production data (project `sfiefevtxalqjizdkcsw`) — 9 rounds of questions, each answer verified
against actual code/DB before the next round.

## Key finding

The reported symptom was actually two distinct problems conflated into one:

1. **Cross-Device drift** (two Devices in a Channel out of alignment with each other) — proven
   algebraically that the anchor choice (epoch vs. schedule vs. anything else) cannot affect this;
   it cancels out when comparing any two Devices sharing an anchor. Root cause is resync cadence —
   see ADR 0043 decision 6.
2. **Loop-start misalignment** (a Publication doesn't begin at its first slot when its Schedule
   opens) — this one the anchor *does* affect; ADR 0042 named and accepted this cost explicitly.

`timeline_start_at` only addresses (2). The signage team's proposal was accepted for that half and
declined for the field name and for treating it as a fix for (1).

## What changed

- `docs/adr/0043-schedule-anchored-playback-loop.md` — new ADR, supersedes ADR 0042's anchor
  decision only (all other ADR 0042 decisions stand). Anchor changes from the Unix epoch to
  `starts_at` of the Schedule owning the loop's first slot, with a `daily_start` override when
  present.
  - First attempt at the anchor (`daily_start`-only) was rejected after querying prod: 97 of 98
    `schedules` rows have empty `recurrence`, so that anchor would be `null` for nearly everything.
- `docs/adr/0042-epoch-phase-synchronized-playback.md` — status line updated to point at 0043 for
  the superseded part.
- `Thunder_Core/supabase/migrations/20260824140000_loop_anchor_at.sql` — **not yet applied to
  prod** (R0, pending approval). Adds `loop_anchor_at` to `media_job_poll`'s response, and adds
  `sync_phase_error_ms`/`sync_loop_duration_seconds` to each device object in `channel_rows` (both
  `CREATE OR REPLACE`, no signature change, no `DROP FUNCTION` needed).
- Frontend (`thunder_one_prj`): `ChannelDevice` type, `parseChannelDevice` parser (tolerant of the
  new fields being absent — backend and frontend deploy independently), and `ChannelDetailPanel`
  now show each Device's latest `phase_error_ms` / `loop_duration_seconds` when `sync_enabled` is
  on. Latest-value only, no history table.
- `Thunder_Core/docs/media/player-time-sync-integration.md` — added `loop_anchor_at` to the
  contract, added the resync-cadence rule (recompute phase at every slot boundary, never on "clip
  ended"), added the fade-duration-must-be-inside-`duration_seconds` rule, and a section explaining
  the `timeline_start_at` decision and the `loop_anchor_at` naming to the signage team.

## Verified

- `git status --short` clean before starting; branched off `feat/layout` (which itself had zero
  commits ahead of `main`) into `feat/timesync-loop-anchor`.
- `npx tsc --noEmit -p .` clean for all touched frontend files.
- All touched `*.check.mts` files run and pass (`channel-logic`, `list-filtering`,
  `channels-logic` under publications, `channels-api-contract`, `list-url-state`).
- Two ad-hoc `execute_sql` reads against prod (`sfiefevtxalqjizdkcsw`): confirmed
  `sync_phase_error_ms`/`sync_loop_duration_seconds` are already populated (2 of 508 assets) and
  confirmed the `recurrence` distribution on `schedules` that killed the first anchor design.

## Not verified

- The `loop_anchor_at` migration has not been applied — SQL is untested against live data.
- No browser verification of the UI change yet (per CLAUDE.md, must ask before every verify point).
- No player has ever played in sync mode; the two `phase_error_ms = -1147` values currently in prod
  are flagged as unconfirmed (identical across a multi-hour gap, inconsistent with genuine drift).

## Next steps

1. Get explicit approval to `apply_migration` for `20260824140000_loop_anchor_at.sql` on
   `sfiefevtxalqjizdkcsw` (R0 — blocked pending user confirmation).
2. Ask before running a browser check of the Channel detail panel change.
3. Send the updated `player-time-sync-integration.md` to the signage/player team.
4. Commit/PR only when instructed — ask Thai vs. English for the PR per CLAUDE.md §4.
