# A Program that reaches no screen shows Failed, and Retry asks the Players to poll

**Status:** proposed · 2026-11-13
**Source:** follow-up to the 2026-11-12 Live-badge hotfix (Thunder_Core#375, migration `20261112113935`); owner decisions 2026-11-13; reviewed the same day
**Related:** `0080` (display status), `0018` Core (cancel reaches Players by realtime poke)

## Context

ADR 0080 derives five badges (Draft, Publishing, Scheduled, Live, Ended) in
`media_core.publication_display_status`. A `failed` target counts as finished, so a Program whose
newest-Job targets have all failed has nothing waiting and falls through to **Live**, although no
screen plays it. The 2026-11-12 hotfix closed the same gap for offline devices: with nothing playing, a
target still waiting keeps the badge on Publishing. It left all-failed reading Live.

On prod on 2026-11-13, two active Programs have every target failed, both on online devices with
`retry_count` 0. "69673 Mortorway Outbound" is in its open window and has read Live since it failed on
2026-10-26. "Copy_39545 - 2 Phuket_20260108" has an ended window and reads Ended. Both failed with
`Signed URL is missing for media asset …`. The storage objects exist and predate the failures. Core's
`player/jobs` route sets `url = null` when `createSignedUrl` fails, so this is a Core signing gap the
Player reported, not missing content. Retry has a real chance of working.

A failed target does not recover by itself. Core already has a way out:
`POST /media/publications/:id/retry` calls `media_publication_retry_targets`. On the newest Job it resets
every `failed` target, plus every `pending` target on a device with no heartbeat for 5 minutes, to
`pending`. It also bumps `retry_count`, which `media_job_poll` sends as `delivery_attempt`. The FE never
calls it. It sends nothing to the Players, so they learn on their next regular poll (55–65 s). It checks
only tenant ownership: a cancelled or ended Program can be retried.

The Programs list opens on every Program. On develop, 127 of 145 are Ended, and the KPI row shows Live,
Publishing, Scheduled and Draft but nothing that needs action.

## Decision

### 1. Sixth badge: Failed

| Badge | Rule |
|---|---|
| Failed | `active`, airing window `open`, the newest Job has at least one target, none is `playing`, and none is `pending`, `downloading` or `delivered` (every target `failed`) |

- **Precedence**: Draft → Ended → Publishing → **Failed** → Live → Scheduled. Publishing wins over Failed,
  so failed plus a target still waiting (on any device) reads Publishing. Failed plus one `playing` reads
  Live, and the Deployment column shows "n failed". A Job with no targets still reads Live, unchanged
  (none on prod). A `NULL` window counts as open, the same as for Publishing.
- **Only inside an open window**, like Publishing. Before the start or between airings, an all-failed
  Program reads Scheduled, and its failures show in the Deployment column. The badge describes what
  should be on screen now.
- **One delivery helper.** The current `boolean` input cannot tell all-failed from no targets. Add
  `media_core.publication_delivery_state(p_job_id uuid) RETURNS text`, which returns `'waiting'`,
  `'all_failed'` or `NULL`. It holds the `waiting` rule that today is copied into both RPCs (`get` uses
  `JOIN assets`, `list` uses `LEFT JOIN`). Change `publication_display_status` to take
  `p_delivery text` in place of `p_waiting_delivery boolean`. Because the signature changes, the
  migration runs `DROP FUNCTION media_core.publication_display_status(text, jsonb, boolean)` before
  `CREATE`. It then re-applies `REVOKE ALL … FROM PUBLIC`, because a new `CREATE` grants EXECUTE to
  PUBLIC again, and today only `postgres` holds it. Both RPCs call the helper.
- **Readers to change.** Core:
  - `media_publications_list`: the `p_display_status` check (`NOT IN (...)` and its message), and the
    hard-coded `counts_by_status` object gets `failed`.
  - `GET /media/publications` route: the `display_status` `z.enum` adds `failed` and `not_ended`.

  FE:
  - `DISPLAY_STATUSES`, `DISPLAY_STATUS_LABELS`, `BADGE_VARIANT` (`danger`, token `error`), `rowActionsFor`.
  - `PublicationEditPage` `isOnAir` includes `failed`. Without it, a Failed Program that has already
    started gets an editable start date, and `media_publication_update_published` has no server guard
    against that.

  Overview, my-work and playback-proof do not read `display_status`.

### 2. Programs list

- **KPI cards**: Total, Live, **Failed**, Scheduled, Draft. Failed replaces the Publishing card. Publishing
  stays a badge and a filter value. Total keeps summing every `counts_by_status` value, Ended included.
- **Default filter "All active"**: the list opens without Ended. `not_ended` is a filter value, not a
  badge. It means every badge except Ended, Draft included, and it is never returned as a
  `display_status`. It gets its own branch in the list (`display_status <> 'ended'`) next to
  `display_status = p_display_status`. In the FE it stays out of `DISPLAY_STATUSES`, which keys the
  Records above and the filter bar loop, and is added to the filter bar as its own option. "All" and
  "Ended" stay selectable. `counts_by_status` is computed before the badge filter, so the cards do not
  move with it. Under the default filter, the Total card (with Ended) is larger than the list's `total`.
- **Row actions for Failed**: **Retry** (primary, phase 2, see §3), Open, Duplicate, End program. Retry has no
  confirmation step. It only resets failed or stuck targets, and the next state is Publishing.

### 3. Retry

- **Program detail rail**: a Retry button when the badge is Publishing, Failed or Live and the newest
  Job has at least one `failed` target. A Live Program with 2 of 10 screens failed needs it too. It calls
  the existing route with no `device_ids`. Retrying single devices is out of scope.
- **Status guard in the RPC**: `media_publication_retry_targets` raises `Invalid input: only active
  publications can be retried` unless `status = 'active'` and the effective status is not `ended`.
  Today a cancelled Program's Job goes back to `in_progress`.
- **Poke**: after the reset, the RPC sends
  `realtime.send('{}'::jsonb, 'poll_now', 'player:' || device_id, false)` once per retried device. This is
  ADR 0018's payload-less contract: the Player polls and `media_job_poll` decides. `realtime.send`
  inserts into `realtime.messages`, broadcast from the WAL after COMMIT, so a rollback drops it, and its
  own failure is caught (`RAISE WARNING`) and cannot fail the retry. Broadcast has no queue, so offline
  devices miss it and pick up the reset on their next poll. Resetting a `pending` target on an offline
  device does not move the badge: it stays `pending`, and only `retry_count` (`delivery_attempt`)
  goes up.
- **Questions for the Player team**, sent with the handoff:
  1. Does the shipped build act on `poll_now`?
  2. When the same target comes back `pending` with a higher `delivery_attempt`, does the Player clear
     its local failure and download again?
- **The Retry buttons ship after the Player answers question 2** (owner, 2026-11-13). If the answer is
  no, a retried Program reads Publishing indefinitely, and the rail shows no Retry, because no target
  is `failed` any more. Phase 1 ships the badge, the KPI card, the filter, and the RPC guard and poke.
  Until phase 2, a Failed row offers Open, Duplicate and End program. Phase 2 adds the Retry row action
  (primary) and the rail button. A single owner-approved retry of the prod case through the existing
  route could answer question 2 sooner, with no FE work.

### 4. Rollout

The normal path: Core PR into `develop` (CI pushes the migration), FE PR into `dev`, both in the next
release, with Core first. Until the new FE ships, an FE build without this change shows a Failed
Program as:
- an empty badge pill (no label, no variant);
- View and Duplicate only, with no End program;
- an editable start date on the Edit page.

Total stays right. Old builds never send `not_ended`. Keep the gap between the Core and FE deploys short.

The poke cannot be checked on develop. `realtime.messages` there has no partition after
`messages_2026_10_30`, so `realtime.send` drops it silently. Check it on prod, or after the develop
partitions are fixed.

## Considered options

- **Count failed as waiting (Publishing).** Core-only, hotfix-sized. Rejected: Publishing means "on its
  way", and a failed target is not on its way until someone retries.
- **Keep Live, rely on the Deployment column.** No work. Rejected: the Live filter and count would keep
  including Programs on no screen.
- **"Not on air" as the label.** It overlaps Scheduled, which is also not on air.
- **Failed as soon as any target failed with none playing.** Rejected: it hides targets still waiting,
  which the hotfix just made count.
- **Retry without a poke.** Up to about a minute before a Player reacts, while the badge reads
  Publishing. Rejected, because the poke contract already exists.
- **Keep `publication_display_status(text, jsonb, boolean)` and compute all-failed in each RPC.** It
  avoids the DROP, but it adds a third copy of the delivery rule, which has already drifted.

## Consequences

- The badge now carries two delivery facts (Publishing, Failed). This widens the exception ADR 0080
  accepted for Publishing. Both are presentation only, and no guard reads them.
- An all-failed Program stays Failed until someone retries or ends it. If Retry fails again, it returns
  to Failed. The `createSignedUrl` gap behind the prod case is separate Core work.
- If the Player keeps its local failure, a retried Program reads Publishing indefinitely and shows no
  Retry. This is why the Retry buttons wait for the Player's answer (§3).
- Retry has no limit or cooldown. A Player that rate-limits pokes bounds repeated clicks.
- Filtering by Failed changes with the clock, like Live and Scheduled.
- Pre-existing, not changed here: the retry RPC recomputes the status of every Job of the Program, not
  only the newest. It is idempotent.
