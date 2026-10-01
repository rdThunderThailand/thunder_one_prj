# Session log — time sync design fork closed (2026-08-24)

Continuation of the handoff at `HANDOFF-time-sync-2026-08-24.md`. That session had no MCP access to
the production Supabase project; this one did. Goal was to verify four assumptions against
production data, close the remaining design fork, and write the ADR.

Branch: `feat/timesync`. Nothing committed, nothing pushed, no migration applied.

## Production verification (project `sfiefevtxalqjizdkcsw`, read-only SQL via MCP)

All four handoff checks were run. Two passed, one revealed a much bigger problem than expected, one
turned out to be unrunnable.

| Check | Result |
|---|---|
| `schedules` cardinality | **Clean.** 94 rows across 94 distinct `publication_id`. Every active Publication has a Schedule. |
| Membership drift | **None.** Every `channel_devices` row has matching `publish_job_targets` for its Channel's active Publications. |
| Direct-target collision | **Confirmed, and it is the dominant usage pattern, not an edge case.** |
| Payload equality across two Devices in one Channel | **Could not run — the scenario does not exist in production.** |

Numbers behind the last two:

- `publication_targets`: 100 rows, **88 `device` / 12 `channel`**.
- Three Channels exist. Only `2b04af6b` ("Channel for Screen 3-4") has two Media Devices.
- Every active Publication reaching either of those two Devices is a **direct** target. Not one
  arrived via the Channel, and the two Devices share **zero** Publications — 8 and 9 respectively,
  fully disjoint. There is no live case of two Devices in one Channel holding the same content.
- Applying a strict "no direct Publication on a synchronized Channel" precondition to today's data
  would block all three Channels (7, 5 and 17 conflicting active Publications).

Caveat: the data is named `BOEtest`, `Test_Loading_state`, `test monitor 3` and similar. It is the
production project, but it reflects how the team exercises the system, not proven customer usage.

## Facts read from the live `prosrc`, not from migration files

- `media_job_poll` returns no server time. Confirmed.
- `next_poll_after_seconds` is `55 + floor(random()*11)` — Devices refresh independently, so two
  members of one Channel can hold different payloads for up to ~65 s after any content change.
- `top_tier` is computed per Device from that Device's own item set, which is the mechanism by which
  a higher-priority direct Publication makes one Device play entirely different content.
- Schedule `recurrence` carries `daily_start`/`daily_end`, so the slot set changes during the day.
  This is what killed the `min(starts_at)` anchor.
- `DISTINCT ON (pub.id, pi.position)` orders by `pub.id, pi.position, pj.created_at DESC, pjt.id` —
  no Schedule tiebreaker, as the handoff suspected.
- `media_heartbeat(p_device_token text, p_payload jsonb)` — payload is already `jsonb`, so new fields
  need no signature change and the `DROP FUNCTION` overload hazard does not apply.
- Guard points exist and are named: `public.media_publication_activate(uuid, uuid, uuid)` and
  `media_core.channel_set_devices(uuid, uuid, uuid[])`.
- `channel_devices.role` allows `primary|backup`; all four rows are `primary`. `CONTEXT.md` says a
  Channel has no primary/backup relationship — glossary is right, column is vestigial.
- `channel_device_reservations.media_device_id` is `UNIQUE`, confirming a Media Device belongs to at
  most one active Channel, so a per-Channel toggle is unambiguous.

## Decisions taken this session (grilling rounds 2 and 3)

Round 1 of the grilling happened in the prior session; six decisions were already approved there.
Prod data reopened one of them and added four more questions. All were approved as recommended.

1. **Anchor changed from `min(starts_at)` to the Unix epoch.** This reverses approved decision 2 from
   the prior session. Reason: recurrence windows change the slot set mid-day, so `min(starts_at)`
   moves on a schedule and two Devices polling either side of a boundary compute different anchors.
   A fixed epoch removes the anchor from the payload entirely.
2. **Poll skew accepted and documented.** Synchronized Playback guarantees phase alignment given
   identical content; it does not guarantee simultaneous content change.
3. **`loop_duration_seconds` added to the heartbeat** alongside `phase_error_ms`. `phase_error_ms`
   alone cannot detect content divergence, because each Device is correctly aligned to its own loop.
4. **Direct-target guard is forward-only.** Activation of a direct-target Publication against a
   synchronized Channel is blocked; enabling the toggle on a Channel that already has conflicts is
   allowed after showing the operator the list. A hard precondition would make the feature
   impossible to enable on any existing Channel.
5. **`channel_devices.role` is not read** by synchronized playback. Column left alone; dropping it is
   a separate cleanup.
6. **Glossary:** `Synchronized Playback` rewritten; `Sync Degraded` and `Channel Group` deleted. Both
   were marked provisional and never accepted.

Two R2 calls made without asking: `clock_timestamp()` rather than `now()` for `server_now`, and
appending `s.id` to the `DISTINCT ON` `ORDER BY` instead of adding a `UNIQUE` constraint on
`schedules.publication_id`.

## Files changed

- `docs/adr/0042-epoch-phase-synchronized-playback.md` — new.
- `docs/adr/0041-server-anchored-synchronized-playback.md` — status changed to superseded, with a
  note on why it is retained.
- `CONTEXT.md` — `Synchronized Playback` rewritten; `Sync Degraded` and `Channel Group` removed.

Checked for dangling references to the deleted terms: no code references. The two remaining mentions
(`docs/adr/0036`, `docs/superpowers/plans/2026-08-20-channel-management-ui.md`) both list Channel
Groups as out of scope, which stays consistent.

## Verification status — read this before claiming anything works

- All findings above are **SQL-level only**, obtained through the Supabase MCP. **Nothing was
  verified through an HTTP endpoint** and no browser testing was done or offered.
- **No code has been written yet.** ADR 0042 describes intended behavior; none of it is implemented.
- The payload-equality check remains **unverified** and cannot be verified against current production
  data. Confirming it requires creating a Channel-targeted Publication active on both Devices of
  `2b04af6b` — a production write, R0, needs approval first.

## Next

Implementation per ADR 0042: `sync_enabled` column and migration (write is R2, applying to
production is R0), `media_job_poll` changes (`server_now`, sync flag, `ORDER BY` tiebreaker),
heartbeat fields, the activation guard, and the Channel editor toggle. No design forks remain open.

Open draft PRs from the prior session are still open: `thunder_one_prj` #13, `Thunder_Core` #35.
