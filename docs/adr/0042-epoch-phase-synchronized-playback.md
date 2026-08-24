# Epoch-phase synchronized playback

**Status:** accepted (2026-08-24) — supersedes ADR 0041

Media Devices in a Channel with synchronized playback enabled compute their position in the
playback loop from a shared server clock and a fixed universal epoch, with no coordination between
Devices and no readiness handshake:

```
phase_seconds = (server_now_unix_seconds) mod loop_duration_seconds
```

`server_now` is added to the `media_job_poll` response; every other input the Device already has.
This replaces the capability-gated, READY-gated, Channel-Group-scoped design in ADR 0041 with one
column, two poll fields, two heartbeat fields, and one activation guard.

The prior art is the Aurora player, which shipped `(now − startTime) % totalDuration` on Windows and
Android. This ADR keeps that algorithm and removes its two weak points: the dependency on device NTP
(`time.google.com`, with silent fallback to the device clock) and the master/slave UDP `Local` sync
mode, which existed only because Aurora had no shared server time.

## What "synchronized" means here

Two Media Devices in one Channel that hold **the same content** occupy the same position in the
playback loop. That is the entire guarantee.

It is deliberately *not*:

- **A skew budget.** ADR 0041 promised 250 ms pairwise alignment. That number is withdrawn — nothing
  in this design measures or enforces it. `phase_error_ms` in the heartbeat exists to find out what
  the real number is, not to gate anything on it.
- **Simultaneous content change.** `media_job_poll` returns `next_poll_after_seconds` as
  `55 + random()*11`, so two Devices refresh at independent times. When content changes — a
  Publication is activated or cancelled, or a Schedule's `daily_start`/`daily_end` window opens or
  closes — the two Devices hold different payloads for up to ~65 s, then converge. Accepted.
- **A guarantee that Devices in a Channel hold the same content.** See the direct-target guard below.

## Considered options

- **Anchor on `min(starts_at)` across the poll payload:** rejected. `media_job_poll` filters slots by
  `now() >= s.starts_at` and by the recurrence window, so the slot set — and therefore
  `min(starts_at)` — changes during the day, not only when an operator publishes. Two Devices that
  poll either side of a window boundary compute different anchors. A fixed epoch has no such failure
  mode and needs no anchor field in the payload at all.
- **Device NTP (Aurora's approach):** rejected. It adds an external dependency and fails open to the
  device clock, which is the exact uncertainty the whole design is trying to remove. The poll
  response is already a round trip the Device makes every minute.
- **ADR 0041's capability negotiation, READY gate, and common cutover instant:** rejected as
  unnecessary. Those mechanisms coordinate Devices with each other. With a shared server clock and a
  universal epoch, Devices need no coordination — each one computes the same answer independently.
- **Aurora's `mediaSyncType: Local` (master/slave over UDP 15000) and `playerSyncGroup`:** rejected
  for the same reason, and this also settles ADR 0041's Channel Group: no synchronization boundary
  above Channel is needed.

## Decisions

1. **Time source.** `server_now` in the `media_job_poll` response, from `clock_timestamp()` — not
   `now()`, which returns transaction start time.
2. **Anchor.** The Unix epoch. Nothing is stored and nothing is negotiated.
3. **Toggle.** `media_core.channels.sync_enabled boolean NOT NULL DEFAULT false`, surfaced in the
   Channel editor and echoed in the poll payload. The default means deploying this changes no live
   playback.
4. **Observability.** The Device reports `phase_error_ms` and `loop_duration_seconds` in the existing
   `media_heartbeat` payload. That payload is already `jsonb`, so no function signature changes and
   no `DROP FUNCTION` hazard. `loop_duration_seconds` is load-bearing: two members of one Channel
   reporting different loop lengths is the only server-side signal that their content has diverged —
   `phase_error_ms` alone cannot detect it, because each Device is correctly aligned to its own loop.
5. **Member equality.** Synchronized playback treats every Media Device in a Channel as equal and
   never reads `media_core.channel_devices.role`. That column allows `primary`/`backup`, but the
   Channel definition has no such relationship and no row has ever used `backup`. Removing the
   column is a separate cleanup, out of scope here.

## The direct-target guard

A Publication may target a Media Device directly, bypassing the Channel. Such a Device receives extra
slots: its `loop_duration_seconds` changes, every `start_offset_seconds` shifts, and — because
`media_job_poll` computes `top_tier` per Device from that Device's own item set — a direct
Publication at a higher Publication Priority makes the Device play entirely different content from
its Channel peers. Synchronization breaks with nothing to show for it.

This is not an edge case. In production, 88 of 100 `publication_targets` rows are direct, and the
only Channel with two members is driven entirely by direct Publications whose content sets are
completely disjoint between the two Devices.

The guard is therefore **forward-only**:

- `public.media_publication_activate` rejects activation of a Publication with a `device` target when
  that Media Device belongs to a Channel with `sync_enabled = true`. The error names the Channel and
  the two ways out: disable synchronization, or target the Channel instead.
- `media_core.channel_set_devices` applies the same rule when a Media Device is added to a
  synchronized Channel.
- **Enabling `sync_enabled` is not blocked.** The editor lists the conflicting active Publications
  first and the operator confirms. A hard precondition would be cleaner, but every Channel that
  exists today carries active direct Publications (7, 5 and 17 respectively), so a hard precondition
  makes the feature impossible to turn on for anyone. Pre-existing conflicts are tolerated and
  detected after the fact by decision 4.

## Consequences

- Adding or removing a Publication changes `loop_duration_seconds` and therefore jumps the phase for
  every Device in the Channel at once. This is inherent to a modulus over loop length and is not
  treated as a defect.
- A Publication that becomes active does not begin at its first slot; the loop is entered wherever
  the epoch phase falls. Acceptable for signage, and the price of an anchor that never moves.
- `media_job_poll`'s `DISTINCT ON (pub.id, pi.position)` has no Schedule tiebreaker in its
  `ORDER BY`, so a second `schedules` row for one Publication would make the chosen `starts_at`
  arbitrary per Device. Production is clean (94 Schedules across 94 Publications) and every write
  site is delete-then-insert-one, so instead of adding a `UNIQUE` constraint the fix is to append
  `s.id` to the existing `ORDER BY` while that function is being changed anyway.
- The withdrawn ADR 0041 terms `Sync Degraded` and `Channel Group` are removed from `CONTEXT.md`.
  Both were provisional and never accepted. ADR 0041 is retained: its analysis of mixed-repeat
  behavior, timezone-versus-phase, and direct targeting is still the reference for why those problems
  exist.
