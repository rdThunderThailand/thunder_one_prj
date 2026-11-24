# 0021 — Publication delivery progress: three stages derived from the existing job model

## Context

Ticket [86d3xxr09](https://app.clickup.com/t/86d3xxr09) (`10. Publication Delivery Progress`) and
its eight subtasks ask for a live view of what happens after `Publish Now`: a media-preparation
stage, a device-delivery stage, a playback-confirmation stage, an aggregate progress figure, a
per-device table, retry, and a final result status. None of it exists today —
`usePublishDraft.publishNow()` activates the publication and calls `cancelDraft()` immediately,
and the publication detail page shows a static table read once on mount.

The gap analysis before planning found that **the backend already carries most of the delivery
model**, which changes what this work is:

- `media_core.publish_job_targets` — `status` (`pending|downloading|playing|failed`),
  `attempt_count`, `error_message`, `acked_at`, `updated_at`, and `file_statuses` (per-asset
  diagnostic map, migration 084).
- `media_core.publish_jobs` — `status` (`pending|in_progress|completed|failed`), rolled up from its
  targets inside `media_job_ack`.
- `media_publication_get` already returns `targets[]` and `job_status`, and `fetchPublication()`
  already reads them.
- Devices poll every ~55–65 s (`next_poll_after_seconds`, migration 080) and acknowledge through
  `media_job_ack`.
- `public.assets.last_heartbeat_at` gives liveness on the same thresholds `media_screens_list`
  uses: over 5 minutes stale is `offline`, over 2 minutes is `warning`.

Production on 2026-08-18 held 70 jobs and 71 targets: 45 `pending`, 25 `playing`, 1 `downloading`,
and **zero `failed`** — with 21 of 506 assets online. The dominant real-world outcome is a device
that is simply not there, and the schema has no way to say so: an offline device's target sits in
`pending` forever, which also pins its parent job at `pending`/`in_progress` forever. Any design
that reads `job_status` as the answer inherits that hang.

Four questions had no obvious answer and were decided with the product owner before planning.

## Decision

**State 1 "Media Uploaded" is implemented as "Media Ready", not as an upload stage.** The ticket
describes the server preparing and uploading a publication package, with `Preparing`/`Uploading`
sub-states and a `Retry Upload` action. Thunder has no such step: media reaches Supabase Storage
during wizard step 2, and `media_publication_activate` only pins `playlist_items.file_version_no`
and inserts the job rows — work that completes inside the activation transaction. Stage 1
therefore reads `Completed` from the moment a job exists, showing file count and total size drawn
from the playlist's items, and its single failure mode is an activation that raised (in which case
no job, and no progress view, exists at all). There is no `Retry Upload` because there is nothing
to retry.

*Rejected: building a real packaging stage.* It would need a queue, a worker, and package
artifacts — infrastructure Thunder does not have — to model a step that currently takes
milliseconds and cannot partially fail. The sub-states would be decorative.

**`delivered` is added to the device ack protocol.** The ticket separates State 2 (files received)
from State 3 (playback confirmed), but a device can only ack `downloading`, `playing`, or `failed`,
so "downloaded but not yet playing" is unrepresentable. Migration 091 widens the
`publish_job_targets.status` CHECK and `media_job_ack`'s accepted values to include `delivered`,
and adds `delivered` to the "not yet finished" set in the job roll-up — a target that has the files
but is not playing is not a completed target. The change is backwards compatible: players that
never send it jump straight to `playing`, and the UI treats `playing` as implying delivered, so
stage 2 is correct for old and new players alike and simply gets more precise as players update.

*Rejected: collapsing to two stages.* Honest about today's data, but it discards an acceptance
criterion the player team can satisfy with a one-line change, and the distinction is the one that
tells an operator "the file is on the screen but it isn't showing" — the exact failure the ticket
exists to surface.

*Rejected: showing three stages where 2 and 3 always flip together.* It satisfies the mockup while
lying about what is known.

**The result status is derived client-side from targets, not read from `job_status`.** `publish_jobs`
has no vocabulary for `Completed with Warnings` and, as the production numbers show, never settles
while a targeted device stays offline. `summarizeDelivery()` computes the ticket's five results
from the targets themselves plus a ten-minute settle window measured from `activated_at`: while
targets are outstanding inside the window the result is `Publishing`; after it, outstanding
offline targets stop blocking and the publication settles to `Published Successfully`,
`Completed with Warnings`, or `Publish Failed`. This is what makes AC 10.5's "an offline device
must not hang the system forever" true.

**Progress is polled, not streamed.** `useDeliveryProgress` re-reads `fetchPublication(id)` every
10 seconds while the result is `Publishing`, pausing on `document.hidden` and stopping once
settled. No new endpoint is needed.

*Rejected: Supabase Realtime on `publish_job_targets`.* Thunder's tenant isolation lives in the
RPCs, not in RLS; exposing `media_core` to a browser subscription would require designing and
proving a full RLS policy set first. Devices ack at most once a minute, so a 10-second poll is
already an order of magnitude faster than the underlying data changes.

**One component, mounted in the place that already exists.** `DeliveryProgress` replaces the static
Delivery card on `/publications/[id]`, and `publishNow()` routes there on success. AC 10.1's
"close the page and come back to the same status" is then satisfied by the URL itself, with no new
route and no duplicated view.

*Rejected: a separate `/publications/[id]/progress` route,* which would give two pages showing the
same delivery data, and *a modal over the wizard,* which matches the mockup but cannot be returned
to once dismissed.

**A fourth stage-2 state, `expired`, was added during implementation — not anticipated at planning
time.** `media_job_poll` only ever hands a device a job while `now() < schedule.ends_at`; a target
still `pending`/`downloading` after that moment will never be picked up again, online device or
not. The first build read "pending + online" as `queued` unconditionally, which showed a
publication whose schedule window had already closed as perpetually "about to start" with no
explanation and a Retry button that could not possibly help — found live in testing against
publication `61aa87eb` (device heartbeat nine seconds old, `ends_at` a day in the past).
`deriveDeviceProgress` now checks `schedule.ends_at` before reading a non-terminal status, and
`canRetryTarget` excludes `expired` — resetting the target to `pending` again is exactly as futile
as leaving it, since the poll filter still rejects it. The fix widens `Stage2Status`'s and
`DeviceResult`'s existing case list; it does not touch the state model this ADR already decided.

## Consequences

`delivered` will report no real data until the player team ships an ack for it; until then stage 2
completes on `playing`. That dependency must be communicated, and any verification of `delivered`
before then is a hand-written row, not a device.

Three ticket requirements are amended rather than implemented, in the manner of ADR 0017:

1. **AC 10.2's `Preparing`/`Uploading` sub-states and `Retry Upload`** — not built, per the
   Media Ready decision above.
2. **AC 10.6's "open the device's detail"** — Thunder has no device detail page (`src/app` has no
   such route), so the row expands in place to show `file_statuses`, the error, last heartbeat and
   retry history. Building a device page is a larger piece of work than this ticket.
3. **AC 10.7's "open a ticket from an error"** — the acceptance criterion itself defers this to the
   future; it is out of scope here.

`retry_count`/`last_retried_at` are added alongside `attempt_count` rather than reusing it:
`attempt_count` counts device-reported failures, while AC 10.7 asks for the number and time of
*operator* retries. Merging them would make neither number answerable.

Migration 091's `media_publication_retry_targets` shipped with a bug caught in the same browser
pass: its `eligible` CTE selected an unqualified `id` after joining `candidates` (aliased `c`)
against `publish_job_targets` (aliased `pjt`), which Postgres rejected as ambiguous on every call
(`42702`). Migration 093 qualifies it as `c.id` and replaces the function in place (signature
unchanged, so no `DROP` was needed). Verified against the same publication that first surfaced it.

**AC 10.8's "show when the process finished" reads different sources depending on the result.**
There is no `completed_at` column — `publications.cancelled_at` (migration 067) covers the
Cancelled case, but nothing marks the moment a settled Published Successfully / Completed with
Warnings / Publish Failed run stopped moving. Migration 094 adds `cancelled_at` to
`media_publication_get`'s response (it existed on the table but was never returned); for every
other settled result, `completedAt` is the latest `updated_at`/`acked_at` across all targets — the
moment the last device to report in did so. `completedAt` is `null` while `Publishing`.

## Amendment — Publication Download Report (2026-08-21)

The player no longer produces `delivered` through the generic ACK route. After all distinct
Assets in a Publication snapshot are locally available, it sends the success-only
`POST /media/player/jobs/{publication_id}/publication` report. The backend atomically records the
file diagnostics and advances the matching `publish_job_target` to `delivered`. The sibling ACK
route remains responsible for `playing` and `failed`, so stage 2 and stage 3 keep separate evidence.

The report is bound to `retry_count` through `delivery_attempt`. A replay of an accepted attempt
is idempotent, a stale attempt is rejected, and a failed target must be retried before another
report can be accepted. Fresh downloads and cache reuse are both successful delivery outcomes.

The ten-minute settle window is now recurrence-aware. The backend returns `playback_window` with
`before|open|between|ended`; only an `open` window starts settlement, using that occurrence's
`opened_at`. Polling is 10 seconds during an open settlement, 60 seconds while waiting for a
schedule or a late target, pauses while the tab is hidden, and stops for cancelled/ended/all-terminal
runs.
