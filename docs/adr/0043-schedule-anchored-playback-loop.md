# Schedule-anchored playback loop

**Status:** accepted (2026-08-24) — supersedes ADR 0042 on the anchor question only

Media Devices in a Channel with Synchronized Playback enabled compute their position in the
playback loop from a shared server clock and a **loop anchor derived from the Schedule that owns
the loop's first slot**, instead of the Unix epoch:

```
phase_seconds = (server_now_unix_seconds − loop_anchor_unix_seconds) mod loop_duration_seconds
```

`loop_anchor_at` is added to the `media_job_poll` response alongside `server_now`. Every other
input the Device already has (ADR 0042).

## Why ADR 0042 is being revisited, not replaced

ADR 0042 correctly separated two different problems and deliberately declined to solve one of
them:

- **Cross-Device alignment** — two Media Devices holding the same content occupy the same position
  in the loop. This is what "Synchronized Playback" means per `CONTEXT.md`, and ADR 0042 solves it
  completely: the anchor is a constant, so it cancels out when comparing any two Devices. This ADR
  does not touch that guarantee — see "What does not change" below.
- **Loop start alignment with the Schedule** — a Publication's first slot should begin playing at
  the wall-clock moment its Schedule says it starts. ADR 0042 explicitly withdrew this ("A
  Publication that becomes active does not begin at its first slot; the loop is entered wherever
  the epoch phase falls. Acceptable for signage, and the price of an anchor that never moves.").

Production feedback (from the signage/player team, `TIME_SYNC_BACKEND_RECOMMENDATION.md`,
2026-08-24) reports both symptoms:

1. Media Devices in the same Channel drift out of alignment with each other.
2. A Publication does not start at its first clip when its Schedule window opens.

Symptom 1 is unaffected by the anchor — see "What does not change." Symptom 2 is exactly what ADR
0042 named and accepted as a cost. This ADR revisits that one cost, because the signage team has
since confirmed it is felt in production, not merely theoretical.

## What does not change

Cross-Device alignment (symptom 1) is not an anchor problem and this ADR does not touch it. For any
two Devices A and B sharing an anchor `A`:

```
phase_A − phase_B = ((T_A − A) − (T_B − A)) mod L = (T_A − T_B) mod L
```

`A` cancels regardless of its value — epoch, a Schedule's `starts_at`, or any other constant gives
identical cross-Device skew. What actually causes symptom 1, and is out of scope for this ADR:

- Drift between a Device's playback position and the phase it should be at, accumulated between
  poll cycles (~60 s) — addressed by resync cadence, see the player integration doc.
- `loop_duration_seconds` disagreeing between Devices in one Channel, i.e. the two Devices do not
  actually hold the same content — the existing direct-target guard (ADR 0042 decision 5) and the
  `loop_duration_seconds` telemetry (ADR 0042 decision 4) already exist to catch this.

## Considered options

- **Keep the Unix epoch (status quo, ADR 0042):** rejected for the loop-start-alignment case only.
  Simple and provably safe against symptom 1, but production confirms the cost — the loop enters at
  an arbitrary phase — is not acceptable to the signage team.
- **`schedules.recurrence->>'daily_start'` (evaluated in `schedules.timezone`) as the anchor:**
  considered and rejected as the primary anchor. It is wall-clock-derived and therefore stable
  under poll timing the same way the epoch is, but a query against production
  (`sfiefevtxalqjizdkcsw`, 2026-08-24) found 97 of 98 `schedules` rows have `recurrence = '{}'`.
  This anchor would be `null` for essentially every Schedule that exists today, solving the problem
  for 1 row out of 98. Retained as an override, not the default — see Decisions.
- **`min(starts_at)` across the poll payload (considered and rejected by ADR 0042):** still
  rejected, for the reason ADR 0042 gave, refined here — `media_job_poll` filters slots by
  `now() >= s.starts_at` and the recurrence window, so the slot set changes during the day. An
  anchor drawn from the *live* slot set moves independently of any single Schedule's own start
  time, which defeats the purpose of anchoring to "when this Schedule starts."
- **`starts_at` of the Schedule whose Publication owns the loop's first slot (chosen):** the
  Schedule's own `starts_at` is a fixed value the moment that Schedule is created — it does not
  move as slots are filtered in and out during the day, unlike the rejected `min(starts_at)`
  option above. It changes only when the *identity* of the first-slot Publication changes, which is
  the same event that already changes `loop_duration_seconds` and reshuffles every
  `start_offset_seconds` (ADR 0042 Consequences: "Adding or removing a Publication ... jumps the
  phase for every Device in the Channel at once. This is inherent ... and is not treated as a
  defect."). This anchor adds no new class of instability — it moves exactly when the loop already
  jumps for an unrelated reason.

## Decisions

1. **Anchor.** `loop_anchor_at` = `starts_at` of the Schedule belonging to the Publication whose
   slot has `start_offset_seconds = 0` in the current poll response (i.e., the first slot in
   `items_ordered`, ordered as `media_job_poll` already orders them).
2. **Override.** If that Schedule's `recurrence` carries a `daily_start`, `loop_anchor_at` is
   instead today's `daily_start` evaluated in `schedules.timezone` — this is strictly more correct
   when available (it moves the anchor to the actual daily air time rather than the Schedule row's
   creation-time `starts_at`), so it takes priority whenever present. Today this applies to 1 of 98
   Schedules; the field is defined generally so it applies automatically as more Schedules adopt
   `daily_start`.
3. **Empty loop.** When a Channel has no slots (`v_slots = '[]'::jsonb`), `loop_anchor_at` is
   `null`. There is no first-slot Schedule to anchor to, and no phase calculation is meaningful
   without slots.
4. **Field name: `loop_anchor_at`.** The signage/player team's recommendation proposed
   `timeline_start_at`. Thunder One has no "Timeline" concept in `CONTEXT.md`; introducing the term
   for one field would create a second vocabulary for the same thing `CONTEXT.md` already calls the
   playback loop. `schedule_start_at` was also considered and rejected — it invites the reader to
   assume the value always equals `schedules.starts_at` verbatim, which is false whenever decision
   2's override applies. `loop_anchor_at` names what the field actually is (the anchor point of the
   playback loop) without binding its definition to one table or column.
5. **No new schema.** `loop_anchor_at` is computed inside `media_job_poll` from data the function
   already joins (`schedules.starts_at`, `schedules.recurrence`, `schedules.timezone`) and added to
   the existing `jsonb` response. No column, no migration to backfill, no `DROP FUNCTION` hazard —
   consistent with ADR 0042 decision 4's reasoning for why `phase_error_ms` went into the existing
   heartbeat payload instead of a new one.
6. **Resync cadence (player-side, non-negotiable for this anchor to hold).** A Device must
   recompute `phase_seconds` at every slot boundary, not only on "clip ended" events and not only
   once per poll. Documented in `Thunder_Core/docs/media/player-time-sync-integration.md`,
   surfaced here because it is a precondition of decision 1 remaining true between polls: a
   Device that free-runs on its own playback clock between polls re-accumulates the same drift
   this ADR's anchor does not touch (see "What does not change").

## Consequences

- Everything in ADR 0042's Consequences section still holds: loop-length changes still jump phase
  for every Device in a Channel at once, `next_poll_after_seconds` jitter still means Devices can
  hold different content for up to ~65 s after a Publication activates or cancels, and the
  direct-target guard is unchanged.
- `loop_anchor_at` changes whenever the identity of the loop's first-slot Publication changes. This
  is the same trigger that already changes `loop_duration_seconds`, so it introduces no new
  observable instability — a Device already re-derives its whole loop model at that moment.
- Symptom 1 (cross-Device drift) is **not** addressed by this ADR. It is tracked separately via
  decision 6 (resync cadence) and the existing `phase_error_ms` / `loop_duration_seconds`
  telemetry (ADR 0042 decision 4), which this ADR's companion UI work (Channel detail page) now
  surfaces to operators instead of only being queryable in the database.
- `phase_error_ms` values observed in production as of 2026-08-24 (two Devices, both reporting
  exactly `−1147` ms several hours apart) are noted as unverified — identical values across
  unrelated heartbeats several hours apart are inconsistent with genuine playback drift and are
  flagged in the player integration doc as needing confirmation that the reported value reflects
  actual playback position rather than a static or miscomputed number.
