# 0089 — Playback Proof records Player-reported outcomes, never expected plays

Status: proposed (2026-10-08, grilling session on the "Playback Proof — Key User Flow" board; scrutiny
round 1 applied). Spec for the Player team: `docs/media-workspace/spec-playback-proof-player-contract.md`.
Plan: `docs/media-workspace/plan-playback-proof.md`.

## Context

The board draws a Playback Proof page under Reports: KPI cards "Scheduled (Media Events) / Played /
Missed / Playback Rate 98.8%", a table of single plays with Channel, Program, Source, Media, Result and
Duration, a detail drawer, links into Channel / Program / Source / Media, and an Export button. The
Monitoring nav group (Live View, Alerts, System Health) is crossed out on the board: this is not a NOC.

Facts established before deciding (2026-10-08, Thunder_Core `origin/develop` and ThunderCore prod):

- `media_core.playback_logs` already exists (migration 048) with `device_id`, `media_asset_id`,
  `played_at`, `duration_played_seconds`, and since ADR 0045 the pair `publication_snapshot_id` +
  `snapshot_zone_id`. The Player writes it through `POST /api/core/v1/media/player/playback` →
  `media_playback_log(p_device_token, p_batch)`. The batch is all-or-nothing: one invalid entry rolls
  the whole batch back. The route's zod schema is a plain `z.object`, which strips unknown keys, and
  `z.array` has no maximum.
- Prod holds 32,221 rows, 9 devices, 2 tenants, 2026-09-16 → 2026-10-06, only 38 rows in the last
  7 days. **0 rows carry a `publication_snapshot_id`** — no Player sends it today. `media_job_poll`
  hands the ids over only on the Layout path (top-level `publication_snapshot_id`, per-Zone
  `snapshot_zone_id`); the flat path emits neither, and its slots carry only `publication_id`, although
  a flat loop can merge several Publications and every item already has a snapshot Zone internally. 1,466 rows have
  `duration_played_seconds = 0`.
- There is no read RPC or route, no outcome column (every row means "played"), and no uniqueness:
  prod already holds **2,071 surplus rows** in 2,069 groups duplicated on `(device_id, media_asset_id,
  played_at)` across 6 devices — same duration, median 0.08 s apart, i.e. Player resends.
- There is no "expected media event" anywhere. Knowing what *should* have played means simulating every
  Zone loop on every Device second by second, including priority suppression (ADR 0068), synchronized
  phase (ADR 0042/0074) and shuffle, whose order is unknowable server-side.
- The Channel that drives a Player is `media_core.channel_device_reservations` (`media_device_id`
  UNIQUE), which is what `media_job_poll` reads; `channel_devices` lets a Draft Channel share a Device.
  All 9 devices with entries have a reservation.
- FKs on `playback_logs`: `device_id` and `tenant_id` CASCADE, `media_asset_id` RESTRICT,
  `snapshot_zone_id` SET NULL. A snapshot disappears only with its Publication, and
  `media_publication_delete` deletes Drafts only, which never have a snapshot; Asset purge refuses an
  Asset that was ever materialized (ADR 0045 §10). So the snapshot an entry names is never deleted today.
- Day boundaries: the Calendar cuts days at fixed +07:00 (ADR 0085 §2); every server read model
  returns `display_timezone`, today hard-coded to `Asia/Bangkok`.

## Decision

1. **Evidence only, two outcomes.** A Playback Proof entry is one *slot* the Player tried to play: one
   Asset, one start time, the seconds it ran, and an outcome — `played`, or `failed` with a reason.
   Retries inside one slot are one entry; a slot that recovers is `played`, one that is skipped after the
   Player gives up is `failed`. There is **no `missed`** and no expected-event model.
2. **No percentage.** KPI cards are counts: Plays, Failed, Airtime (sum of seconds), Screens reporting
   (Channels with at least one entry in range). No playback or success rate and no delta versus the
   previous period: a rate whose denominator silently omits dark screens reads better than the truth.
3. **Attribution only from the Player.** Program, Source and Zone come from the
   `publication_snapshot_id` + `snapshot_zone_id` the Player reports, validated as today. To make that
   possible `media_job_poll` puts both ids on **every slot**, flat and Layout paths alike (additive; the
   existing top-level and per-Zone fields stay). When absent the
   entry is **Unattributed** — never matched to a Program by looking at which Jobs were `playing` at that
   time, because the same Asset in two overlapping Programs would be credited to the wrong one, and a
   wrong proof is worse than none. Existing rows stay Unattributed. Attribution relies on the invariant
   above (a snapshot with proof is never deleted); any future change that lets a non-Draft Publication be
   deleted must first stop the `snapshot_zone_id` SET NULL from erasing proof.
4. **Channel frozen at ingest.** New column `playback_logs.channel_id`, written by `media_playback_log`
   from `channel_device_reservations` at insert time; no reservation gives `null`, shown as the Device
   name with no Channel. Existing rows are backfilled once in the same migration from today's
   reservations — no permanent read-time fallback. Moving a Player later does not rewrite history.
5. **Failure reason is a small enum.** `failure_reason ∈ {decode_error, file_missing, file_corrupt,
   playback_stalled, other}`, required when `outcome = failed` and forbidden otherwise (CHECK), plus an
   optional `failure_message` (Player text, ≤ 500 chars). The page shows a label mapped from the enum; the
   raw message appears only in the CSV, for support.
6. **Backward-compatible, idempotent ingest.**
   - An entry without `outcome` is `played`, so current Players keep working. The route schema gains
     `outcome`, `failure_reason`, `failure_message` and caps a batch at 500 entries.
   - Uniqueness `UNIQUE NULLS NOT DISTINCT (device_id, media_asset_id, played_at, snapshot_zone_id)` —
     the Zone is part of the key so two Zones starting the same Asset at the same instant are both kept —
     with `ON CONFLICT DO NOTHING`, so a resend after a lost response is harmless. The RPC returns
     `logged` (rows actually inserted) and `duplicates`.
   - Before the index can exist, the existing duplicates are removed keeping the oldest row per key:
     **2,071 rows on prod** (develop counted when applied). This delete is R0 and needs its own approval.
   - A rejected batch (4xx) must be dropped by the Player, not retried; only network errors and 5xx are
     retried. Otherwise one bad entry wedges an offline queue forever (spec §3).
7. **One row per entry, server-paged.** 50 per page, default last 7 days, any range ≤ 92 days, filters:
   date range, Channel Group or Channel (the Now & Next picker), Program (with an "Unattributed" choice),
   media name search. No Source filter: Source follows from Program. Day boundaries use the server's
   `display_timezone`. New index `(tenant_id, played_at DESC)`; tenant isolation inside every read RPC.
8. **Snapshot shown, current linked.** The drawer shows what aired: the Program, Source and Media the
   entry's snapshot points at, and the snapshot's own Zone name. A snapshot does not freeze Program or
   Source *names*, so those are read as they are now. Its Open
   buttons go to existing routes for the *current* Channel / Program / Source / Media, with "may have
   changed since it aired" on Source; a Source or Media in Trash disables its button rather than hiding
   it, and Media in Trash keeps its rows with an "In Trash" badge (Media cannot be deleted outright while
   proof references it — FK RESTRICT). No new detail pages.
9. **CSV export of the current filter**, server-generated, with UTC ISO and local time columns. More
   than 50,000 matching entries is refused with "narrow the range" rather than silently truncated — a
   proof file that is missing rows without saying so is worse than none. No PDF.
10. **Placement.** Route `/media-workspace/playback-proof`, replacing the disabled "Reports" item under
    Reports & Analytics. The Monitoring group is untouched. Every role that can read Channels can read
    Playback Proof, Viewer included.

## Considered options

- **Played vs Expected per event (the board as drawn).** Rejected: it needs an expected-play engine that
  cannot predict shuffle and is the NOC this feature is meant not to be.
- **Played + schedule coverage** (hours a Program was due on a Channel vs hours with entries, built on
  the Calendar's effective schedule). Deferred to v2: it is the only honest way to see dark screens, and
  is worth building once entries are attributed.
- **Inferring Program from Jobs at read or ingest time.** Rejected (§3).
- **Resolving Channel at read time only.** Rejected (§4): history would follow a Player's moves.
- **Storing an unverifiable snapshot as Unattributed instead of rejecting the batch.** Rejected: it hides
  Player bugs; dropping a rejected batch (§6) bounds the loss to one batch.

## Consequences

- Until Players send snapshot ids, every entry is Unattributed and the Program filter only finds new
  rows. Until they send `failed` entries, Failed is always 0; FE must be tested with develop fixtures.
- A dark screen produces no entry of any kind; Playback Proof cannot show it. That is v2 coverage.
- Open: 1,466 existing `played` rows ran 0 seconds. They count as Plays and add nothing to Airtime until
  the Player team says what a 0-second play means.
- The device FK still cascades; tracked as rdThunderThailand/Thunder_Core#181, decided together with retention
  (there is no purge on `playback_logs` and none is added here).
