# Session log — Channel ADR set & monitoring plan (2026-08-20)

Branch `feat/playlistOverview`. **Documentation only** — no application code, no Thunder_Core
change, no migration run, no production write.

## What happened

Started as a `/scrutinize` of the single-file draft `docs/adr/0030-channel-endpoints-and-monitoring.md`
(~20 decisions, no citations, no rejected alternatives). Three review rounds against production
evidence turned it into four ADRs plus a plan.

## Files

| file | state |
| --- | --- |
| `docs/adr/0030-channel-endpoints-and-monitoring.md` | **deleted** (superseded draft, was untracked) |
| `docs/adr/0030-channel-endpoint-membership-and-active-exclusivity.md` | new |
| `docs/adr/0033-channel-lifecycle-retirement-and-concurrency.md` | new |
| `docs/adr/0034-channel-display-expectation-and-target-snapshot.md` | new |
| `docs/adr/0035-channel-monitoring-policy-alerts-and-remote-operations.md` | new |
| `docs/channels/plan-channels-monitoring.md` | new |
| `CONTEXT.md` | edited — `locations` correction + ADR cross-references |

Numbering is non-contiguous: 0031 (playback behavior) and 0032 (playlist output profile) were taken
by concurrent playlist work during the review.

## What the review actually found (production, `sfiefevtxalqjizdkcsw`, 2026-08-19/20)

Every one of these contradicted the draft and none was visible from the repo alone:

1. `channels_status_check` allows `active|inactive` only — the draft's `Draft` state had nowhere to
   live.
2. `channel_devices.role` is `NOT NULL DEFAULT 'primary'` with a `CHECK (primary|backup)` — the
   draft said "no primary/backup" while the constraint enforced one.
3. `channel_devices.device_id` → **`assets(id)`**, not `public.devices`. Both tables exist.
4. `public.locations` exists and `channels.location_id` references it — the draft presented Location
   as an open decision and `CONTEXT.md:46` claimed the table did not exist.
5. **`public.media_sweep_device_offline()` is live on cron `*/5`** and has produced 56
   `device_offline` incidents. The draft proposed building alerting from scratch.
6. `alert_rules` has **0 rows** and all 56 incidents have `rule_id IS NULL` — the live producer never
   reads the rules table.
7. **Bug the design would have introduced:** the sweep resolves with `WHERE status = 'OPEN'`. Adding
   an `ACKNOWLEDGED` state without widening that clause strands acknowledged incidents open forever.
8. An eight-table notification stack exists unused; `notification_inbox` already has
   `entity_type`/`entity_id`, `notification_rules` already has recipient strategy + cooldown.
9. No table records a per-delivery attempt → `notification_deliveries` is the one genuinely new
   table the feature needs.
10. No `%channel%` function exists — Channel API is greenfield, so no `DROP FUNCTION` dance on first
    create.
11. `src/types/domain.ts:4`'s `ChannelType` has **zero consumers**, so trimming `"other"` is free.

## Decisions worth remembering

- Media Operator gains Channel create/edit/activate + device assignment; Device master data stays
  with the Administrator. This **reverses** the previous `CONTEXT.md` policy — recorded in ADR 0030
  with rationale rather than silently edited into the glossary.
- Exclusivity is a `channel_device_reservations` table with `UNIQUE (media_device_id)`, chosen over
  a denormalised flag and over an RPC pre-check (which races).
- ADR 0034 **deliberately diverges from ADR 0019**: orientation mismatch blocks at
  device↔Channel assignment, although 0019 rejected orientation special-casing for
  content↔playlist. Different boundary, different cost of being wrong.
- Concurrency reuses ADR 0003 exactly, including the non-obvious part: the message must start with
  `Already ` or `EXPECTED_ERROR` turns the 409 into a 500.
- Cron cadence is a ceiling: `*/5` + 5-minute threshold ⇒ a policy threshold under 5 minutes has no
  effect, and recovery lands 5–10 minutes late.

## Not verified

Player command polling / at-most-once / screenshot upload / post-restart `Completed`; Email provider
configuration; Player local watchdog; Thunder_Core capability enforcement; consumers of
`channel_devices.role` in Thunder_Core; per-Organization Audit Log retention. All tracked as release
gates in the plan, §12.

## Second review round — eight corrections applied

A read-only review after the first draft found eight real defects. All were verified and fixed:

1. **Blocker.** Deactivate released reservations while Publications kept running — reopening the
   double-playback path ADR 0034 closes from the other side. Deactivation is now blocked while an
   Active or Scheduled Publication targets the Channel.
2. **Blocker.** `channels.status` DEFAULT is `'active'` in production. The first draft declined to
   change it with a reason that was simply wrong ("so no existing row moves" — changing a default
   never moves rows). Now `SET DEFAULT 'draft'`, so a direct insert cannot create a live Channel
   that skipped validation.
3. **Blocker.** Migration order was unrunnable: data was updated to `online` before the CHECK
   allowing `online` was written. Now expand → migrate → narrow.
4. **Major.** "Only two new tables" was false. `public.device_telemetry_latest` is the only
   telemetry storage; no history, screenshot or command table exists. Seven new tables, and History
   is split out of 14.1's shippable core because it needs Player telemetry.
5. **Major.** Missing from the matrix: `default_playlist_id`, Channel Type vocabulary, monitoring
   override shape, category column naming. Type became a reference table (not a CHECK), the column
   rename `channel_type → channel_category` is explicit, policy overrides are nullable typed columns
   with `>= 5` enforced in the constraint.
6. **Major.** Reservation FK was `ON DELETE CASCADE` to `assets` — now `RESTRICT`. Also recorded the
   pre-existing hole: `channel_devices_device_id_fkey` already cascades today.
7. **Major.** Notification idempotency key had no event phase (resolution would collide with open)
   and relied on a nullable column — **PostgreSQL treats NULLs as distinct in a unique index**, so
   `NO_RECIPIENT` retries would never dedupe. Now `event_phase` + `phase_seq` and a partial index
   pair.
8. **Minor.** ADR 0030 cited 0031 for the activation transaction (correct is 0033); the quiet-hours
   question was still open (now decided: high severity pierces, recorded on the delivery row).

**One review point was wrong and is not a fix:** `output-profile.ts:4` cites 0032 for the *playlist*
Output Profile, which is correct. The earlier claim that it needed a correction was a misreading on
my part — no code change is needed.

## Note on this file

`.gitignore:43` ignores `.docs`, so this log stays local and will not appear in a commit. That is
the repo's existing arrangement, not something this session changed.
