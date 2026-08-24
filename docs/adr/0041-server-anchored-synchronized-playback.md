# Server-anchored synchronized playback

**Status:** superseded by ADR 0042 (2026-08-24) — never accepted; proposed 2026-08-21

> Superseded by `docs/adr/0042-epoch-phase-synchronized-playback.md`, which reaches synchronized
> playback with a shared server clock and a fixed epoch instead of the capability contract, READY
> gate, and Channel Group boundary proposed below. Retained because its analysis of mixed-repeat
> behavior, timezone-versus-phase, and direct targeting is still the reference for why those
> problems exist. Do not implement from this document.

Thunder One will synchronize playback from a stable server-time anchor, not from a database counter
that is updated continuously and not from the moment each Media Device happens to receive a poll
response. The target is no more than 250 ms of pairwise visual skew between any two participating
Media Devices, not merely 250 ms per Device against the server anchor and not frame-accurate
video-wall synchronization. This ADR extends ADR 0031's player timeline contract, partially
supersedes its per-device shuffle and resume behavior inside synchronized boundaries, and preserves
ADR 0039's frozen Channel target snapshots.

## Scope status

This ADR bundles several independently large decisions. Not all are committed at the same
confidence, and accepting the document is not a commitment to build every part at once:

- **Committed now** (the load-bearing core for the 250 ms pairwise target inside a single Channel):
  the server-time anchor, timeline identity/version, the explicit capability contract, and the
  prepare/READY/common-cutover flow.
- **Direction, pending** (accepted as intended architecture, but each is separable and expected to
  be validated or split into its own decision before implementation): the Channel Group boundary and
  its persistence/epoch model, the wake-to-poll transport behind the Cancel SLO, deterministic
  shuffle, and the idempotent desired-state enable/disable API.

The open validation that gates the committed core is recorded under Consequences.

## Context

`media_job_poll` already returns a deterministic timeline containing `loop_duration_seconds` and
per-slot offsets, but each player currently starts its loop when it receives that response. Polls
are intentionally staggered, so two Media Devices with the same timeline are not synchronized.
The response has no authoritative server time, timeline identity, version or common activation
instant.

The old-system idea of storing a value that continually counts upward points at the right need—a
shared position—but stores the wrong fact. Elapsed time is derived from an immutable instant. A
mutable counter would create write load, races and stale copies of information already represented
by time.

## Decision

### One stable anchor defines the playback phase

Each synchronization boundary owns one resolved timeline stream. A Channel is the boundary unless
it belongs to a sync-enabled Channel Group, in which case that group is the boundary. Identity and
version are scoped to that boundary: every composition change produces a monotonically increasing
version in the same stream. Each authoritative version has one immutable anchor. Loop and once
timelines derive phase differently:

```text
elapsed = max(0, estimated_server_now - timeline_anchor_at)

loop phase = elapsed mod loop_duration_seconds
once phase = min(elapsed, loop_duration_seconds), then hold the final frame
```

Every resolved timeline version uses its common `effective_at` as `timeline_anchor_at`, so its first
visible phase begins at zero regardless of how many Publications it merges or how long preparation
took. `activated_at` remains evidence of the operator's Publish action, while Schedule instants
determine when preparation and cutover should be attempted; neither is borrowed as the boundary
anchor. A poll/prepare contract carries enough server-time information for the player to estimate
clock offset and then advances locally with a monotonic clock between samples. No row is updated
every second.

Schedule timezone and playback phase remain separate concerns. `schedules.timezone` determines
local wall-clock recurrence eligibility. Once an absolute instant is selected, synchronized phase
uses server time; two locations in different timezones change frames at the same instant. A
requirement to play at 09:00 local time in each country is multiple Publications, each with its own
Schedule, not one synchronized timeline.

Every daily or weekly recurrence occurrence is a new resolved boundary version. Preparation begins
five minutes before `occurrence.opens_at`, and that occurrence starts at phase zero with
`effective_at = occurrence.opens_at`. Its payload carries `valid_until = occurrence.closes_at` (or
an earlier instant when another schedule/priority boundary will change the composition). A player
must stop that version at `valid_until` even while offline; outer `schedule.ends_at` is not a proxy
for the current recurrence close.

If a Publication is activated less than five minutes before, or during, an open occurrence,
preparation starts immediately and the version receives a new future `effective_at`. If that
cutover cannot occur before `occurrence.closes_at`, the occurrence is recorded as missed and its
expired content never starts.

### The synchronization boundary is a Channel, optionally widened by a Channel Group

All Media Devices in one Channel participate automatically. A Channel Group is a named management
and synchronization boundary that an operator may explicitly enable; it is not a Publication
target. Publications continue to target Channels so the `channel | device` target contract and
ADR 0039 snapshot semantics remain intact.

Every payload carries `channel_id`, `boundary_id`, `boundary_assignment_epoch`, `timeline_id` and
`timeline_version`. The assignment epoch is monotonic per Channel and increments whenever that
Channel moves from its own boundary into a Group boundary or back out. A player accepts only the
highest assignment epoch it has observed for that Channel, then compares versions inside the
assigned stream. This orders delayed payloads across boundary-ID changes; versions from different
streams are never compared directly.

When synchronization is enabled for a Channel Group:

- a Channel may belong to at most one sync-enabled group, although it may belong to multiple
  ordinary groups;
- a Publication must target all member Channels or none of them; the UI may offer to select all,
  but must not add targets silently;
- direct Media Device targets inside the boundary are refused;
- every member receives one resolved timeline, identity, version and anchor.

The same direct-target rule applies to an ordinary Channel: a Media Device in any committed Channel
may be targeted only through that Channel. Direct-device Publications remain available only for a
standalone/unassigned Media Device. This preserves one composition per automatic Channel boundary.

These all-or-none, direct-target and repeat-compatibility rules amend ADR 0040's Publish eligibility:
a priority-eligible Draft is still blocked if it would split a synchronized boundary or mix repeat
modes in its resolved timeline. All `loop` Publications share the loop; all `once` Publications
play the resolved sequence once and hold its final frame; mixing `loop` with `once` is refused with
the conflicting Publications identified. This resolves ADR 0031's previously undefined mixed-
repeat seam.

Enabling group synchronization is blocked until all member Channels are committed and holding
their Media Device reservations (not Draft or retired), all Media Devices have reported the
required capabilities, no Active/Scheduled Publication or non-terminal preparation directly targets
a member Media Device, and current Active/Scheduled Publications satisfy the all-or-none and repeat-
compatibility rules. Historical Ended/Cancelled Publications do not block. A synchronization
reservation covers `Preparing`, `Enabled` and `Disabling` so two groups cannot concurrently claim
one Channel. The refusal identifies every blocking Channel, Publication and Media Device.

### Capability support is explicit

The server does not infer synchronization support from the optional free-form `app_version`.
Players report a protocol version and capability flags such as:

```json
{
  "player_protocol_version": 2,
  "capabilities": [
    "timeline_sync_v1",
    "timeline_prepare_v1",
    "monotonic_clock_v1",
    "timeline_seek_v1",
    "deterministic_shuffle_v1"
  ]
}
```

A player sends its complete capability set at every boot with build/protocol identity and
`reported_at`; a new report replaces the previous set rather than merging into it. If build or app
identity changes without a fresh report, capability becomes unknown/unsupported. Offline time alone
does not erase the last-known set, but a reconnecting player refreshes it before joining the
synchronized subset.

A Media Device with no capability report is treated as unsupported until it proves otherwise.
Within an ordinary Channel, capable members synchronize as a subset while a legacy member keeps the
additive legacy playback contract; the Channel is `Sync Degraded` and the operator sees which
player requires an upgrade. Cross-Channel synchronization cannot be enabled until every member has
reported support.

### Prepare, READY and common cutover are separate from playback delivery

`delivered` proves only that files reached a Media Device; it does not prove that the exact
timeline is decoded, time-aligned and ready for a coordinated start. A READY report identifies the
exact timeline ID/version and confirms all expected Asset checksums, a decoded/prebuffered first
slot, required capabilities and `clock_uncertainty_ms <= 100`. This 100 ms bound is an assumed target,
not a measured one: no current Media Device reports clock quality (devices report only a free-form
`app_version`), so whether real player hardware can reach it over the real network is unverified and
is the load-bearing risk recorded under Consequences.

For Publish Now, the system waits up to 120 seconds for currently online capable members, then
assigns one future `effective_at`. Offline devices do not block. For Scheduled playback, a separate
prepare manifest becomes available five minutes before every `occurrence.opens_at`; signed URLs are
refreshed when required. Future content does not enter the authoritative playback timeline merely
to support preload.

The current authoritative timeline continues playing during preparation and until the common
cutover—never a black screen. At the deadline, ready devices start together; unready or offline
devices join the current phase when ready and make the boundary `Sync Degraded` meanwhile. This is
also the rule when zero devices are READY: the Publication and new timeline still become
authoritative, the UI reports `0 ready`, and every device late-joins when able.

### Players correct phase without continuously disturbing playback

A late-joining Media Device seeks to the current phase. `timeline_seek_v1` is required for
synchronized participation. A player that does not report it is legacy/unsupported; a player that
reports it but fails a seek at runtime becomes `Sync Degraded`, stops the incorrectly phased clip
and joins at the next slot boundary rather than starting the Playlist from the beginning. Each
player derives a conservative bound:

```text
phase_error_bound_ms = abs(phase_error_ms) + clock_uncertainty_ms
```

Limiting this bound to 125 ms per Device guarantees that two Devices at opposite extremes remain
within the 250 ms pairwise target. Drift correction follows these thresholds:

- at or below 125 ms: aligned; no correction;
- above 125 ms through 500 ms: `Sync Degraded`; correct at the next slot boundary;
- above 500 ms: `Sync Degraded`; hard seek immediately.

READY's `clock_uncertainty_ms <= 100` leaves at least 25 ms of phase-error budget before cutover.

Playback-rate adjustment is deferred because it introduces audio and rendering complexity without
being necessary for the accepted alignment target. In synchronized playback, each Publication's
shuffle permutation is derived from
`hash(timeline_id, timeline_version, publication_id, loop_index)`. When several same-tier
Publications share one resolved loop, each permutes only its own slots, so the pre-shuffle canonical
order the protocol pins is the resolved merge order the server already emits (today `media_job_poll`
migration 099 orders slots by `start_offset_seconds, activated_at, publication_id, position`);
without pinning that order two capable players could shuffle from different baselines and diverge.
The player protocol must pin the canonical slot ordering, hash, PRNG and permutation algorithm;
language-runtime random functions are not interchangeable. Per-device resume state is ignored; continuity comes from the shared
timeline phase and anchor.

During a network outage, a player keeps the cached authoritative timeline running from its last
clock estimate only until that version's `valid_until`, then enters the existing no-content/idle
state; a Channel Default Playlist is not fallback playback (ADR 0039). An empty timeline or
`loop_duration_seconds = 0` has no modulo phase and also enters idle safely.

While synchronized, a player reports health with its normal 55–65 second poll:
`timeline_id`, `timeline_version`, `phase_error_ms`, `clock_uncertainty_ms` and `last_aligned_at`.
Health becomes `Sync Degraded` when `phase_error_bound_ms` exceeds 125 ms, no health report is
received for two expected poll cycles (at most about 130 seconds), a player misses readiness, or a
required capability is absent. During preparation, the two-second poll cadence provides READY
progress separately.

### Timeline changes are versioned and coordinated

Ordinary content or priority changes produce a higher timeline version and one common
`effective_at`. The previous version remains authoritative until that instant. Cancelling one
Publication produces a higher resolved boundary version without that Publication; a boundary
tombstone is used when no authoritative timeline remains. In both cases, the highest observed
version prevents delayed prepare or cutover messages from restoring older content.

Urgent content prioritizes message speed over alignment. It opens a five-second readiness window,
then freezes the ready subset and assigns `effective_at = server_now + 2 seconds`. Ready capable
devices switch at that instant; unready devices may keep the previously displayed timeline as a
temporary visual fallback and late-join the current phase when ready. If the ready subset is empty,
the new version still becomes authoritative and every device late-joins. The boundary remains
`Sync Degraded` until aligned. Multiple same-tier urgent Publications keep the existing behavior of
sharing one playback loop.

This temporary stale visual is a narrow exception to ADR 0040's lower-tier suppression: the
authoritative desired timeline contains only the urgent tier, but an unready capable player may
display its last prepared frame/timeline until it can join. A legacy player continues its existing
poll-and-start-on-receipt Urgent behavior and cannot phase-join; its presence keeps the Channel
`Sync Degraded`.

Cancel has a five-second control-plane SLO only for a currently wake-reachable device, measured
from the server commit of `cancelled_at` until the player reports `cancel_applied`. A push mechanism
only wakes the player to poll immediately; poll remains the sole source of timeline truth. A device
that is merely heartbeat-online but not wake-reachable falls back to the existing 55–65 second
poll. Offline devices have no bounded receipt time but cannot restore an older version after
receiving the higher resolved version or tombstone. This wake-to-poll path amends the fixed-interval
Phase 1 decision in `.docs/adr/0001-hybrid-poll-device-communication.md` without making push a
second source of timeline truth.

### Channel Group changes preserve active snapshots and history

Channel Group membership changes are blocked while an Active or Scheduled Publication, or a
non-terminal synchronization preparation for a Publication, touches any member of its boundary.
Existing Publication targets are never rewritten. The error returns the blockers the operator
must cancel or wait for.

A Channel Group uses `Active ↔ Archived` plus an independent synchronization setting. It can be
hard-deleted only if it has never produced a synchronized timeline and has no historical reference;
otherwise it is archived. Every membership, synchronization and archive mutation is transactional,
uses `revision`/`expected_revision`, returns `409` on a stale revision, and is recorded in the audit
trail. An overwrite after a metadata or membership revision conflict is explicit and audited; it
cannot bypass an in-flight synchronization transition or any safety/eligibility gate.

Enabling synchronization prepares a common cutover. Disabling it emits a new timeline version that
takes effect at the next loop boundary for a `loop` timeline. A `once` timeline has no next loop
boundary, so disabling it uses a common `effective_at = server_now + 2 seconds`, including while it
is holding the final frame. Enabling a Group increments each member Channel's assignment epoch and
assigns the Group stream; disabling increments it again and creates one new per-Channel stream for
each member. Both retain the old displayed timeline until cutover; Cancel and Urgent retain their
emergency behavior.

### Enable and disable commands are idempotent desired-state operations

The API accepts an explicit desired state—never a blind toggle—and an idempotency key. The first
state change creates one transition operation. Replaying the same key and request returns that
operation; a different key requesting the same in-flight desired state coalesces into it. Asking
for the already-effective state is a no-op with no revision bump or duplicate audit event. Reusing
one key for a different request is a `409`.

An opposite command during `Preparing` or `Disabling` is rejected as `409 Already in progress`
with the current operation ID and state. The UI disables the opposite action until the operation
finishes; the operator then refetches the latest revision and sends a new command. Commands are not
queued to run after their original context has passed.

Desired setting, transition operation state and synchronization health are separate concepts.
`Preparing` is not `Enabled`, and `Sync Degraded` does not mean the enable operation failed.

## Considered options

- **Continuously update a counter column:** rejected because elapsed time is derived from an
  immutable anchor and a counter adds writes, drift and races.
- **Let each player start when it receives a poll:** rejected because staggered polling guarantees
  visible phase differences.
- **Trust the Media Device clock without a server estimate:** rejected because the current player
  contract already avoids relying on device wall clocks and cannot bound skew.
- **Make Channel Group a Publication target:** rejected because it duplicates target semantics,
  expands the current `channel | device` contract and weakens ADR 0039's frozen snapshot model.
- **Wait for every configured Media Device:** rejected because one offline device could prevent
  playback indefinitely.
- **Infer support from `app_version`:** rejected because it is optional, unvalidated and does not
  prove any particular capability.
- **Preserve alignment before showing Urgent content:** rejected because emergency message latency
  matters more than temporary degradation.
- **Expose a toggle command:** rejected because duplicate requests can reverse the requested state.
- **Queue an opposite command during preparation:** rejected because it may execute much later,
  after the operator's context and intent have changed.

## Consequences

- The player protocol needs explicit capabilities, server-time estimation, timeline identity and
  version, READY and synchronization-health reports.
- The backend needs preparation/transition operations, versioned tombstones, idempotency storage,
  Channel Group persistence and server validation of group membership/target rules.
- **Open validation (load-bearing risk):** the whole design hangs on real Media Devices reaching
  `clock_uncertainty_ms <= 100` over the production network. If they cannot, no device passes READY
  and every boundary stays permanently `Sync Degraded`—the feature degrades to "never synchronized."
  A spike must measure achievable clock uncertainty on real player hardware before the 100 ms READY
  gate and the derived 125 ms/250 ms budgets are treated as firm; the numbers may need to move.
- The current additive payload compatibility rule keeps legacy players from crashing, but cannot
  make them synchronized; the server must wait for an explicit capability report.
- A wake-to-poll transport is required to meet the five-second wake-reachable Cancel SLO, but the
  transport itself is deliberately not selected here. It must not become a second source of
  playback truth.
- The at-most-250 ms pairwise target is suitable for signage, not frame-locked video walls. A
  future frame-level requirement needs a different hardware/time-distribution decision such as
  PTP, genlock or a local coordinator.
- This ADR defines architecture and product behavior only. It does not authorize schema changes,
  migrations, deployment, player rollout or production writes.
