# Channel-first Now & Next read model

**Status:** accepted (2026-08-30)
**Related:** ADR-0004, ADR-0043, ADR-0045, ADR-0049

Now & Next is an operational view of resolved playout, not another Publication-management list.
The existing `/media-workspace/publications` page becomes Now & Next; its Draft/Active/Inactive
management surface moves intact to `/media-workspace/publications/manage`.

## Decision

- The primary row is a Channel, because a Channel is the operator-facing publishing destination.
  A row expands to its Media Devices. A Publication that targets a Media Device directly is shown as
  its own device row after the Channel rows; direct targets are never hidden or assigned to a
  synthetic Channel.
- `Scheduled Now` and `Playback Confirmed` are separate facts. Scheduled means the resolved
  Schedule occurrence is open. Confirmed means at least one effective Publish Job Target reports
  `playing` and that Media Device's heartbeat is fresh. A playing acknowledgement with a stale
  heartbeat is `Playback stale`, not confirmed.
- The page presents effective output after applying Publication Priority
  (`urgent > high > normal > low`). Suppressed Publications remain inspectable through an
  indicator. Equal-priority flat Publications that the player merges are one
  `Merged loop (N Publications)` group with expandable members; they are not overlapping timeline
  blocks. Existing Composition overlap blockers remain unchanged.
- `Time remaining` initially means the current Schedule occurrence's remaining time. Current
  Asset/Playlist position and item time remaining require new player telemetry and are out of this
  slice.
- The timeline switches between the next 60 minutes and next 3 hours. Summary counts are distinct
  Channels with effective current or upcoming content, not Publication or occurrence counts.
- The default list hides idle Channels and offers `Show idle channels`. Search covers Channel,
  Media Device and Publication names. Channel filtering, horizon selection and 60-second refresh
  ship first. Advanced filters and Live View remain visibly disabled until their own contracts and
  routes exist.
- This page has read-only navigation to Channel and Publication detail. Cancel, re-publish and other
  lifecycle mutations stay on management/detail surfaces.
- There is no date picker in this slice. Selecting a future date is Schedule Preview/Calendar, where
  `Live`, `Now` and playback confirmation have different meanings.
- Backend time is authoritative. Schedule occurrences are evaluated using each Schedule's stored
  timezone and returned as normalized timestamps. The response includes `as_of`; the UI initially
  displays `Asia/Bangkok` and labels freshness explicitly.
- Core exposes one tenant-scoped read model through `media_now_next_get(...)` and
  `GET /media/now-next`. It resolves recurrence, priority, Channel/direct-device grouping and
  current/upcoming occurrences server-side. The frontend must not reconstruct playout from raw
  Publications/Jobs, make N+1 Publication-detail requests, or invent mock fallback data.

## Considered options

- Keeping Now & Next beside the existing management list was rejected because the sidebar already
  names this route Now & Next and monitoring and lifecycle management have different tasks.
- A Media-Device-first table was rejected because operators publish to Channels; device divergence
  belongs in an expanded operational detail.
- Treating an open Schedule as `Live` was rejected because Schedule is intent, while `playing` plus
  fresh heartbeat is playback evidence.
- Resolving recurrence and priority in the browser was rejected because it duplicates player rules,
  creates clock drift and requires N+1 detail requests.
- A future-date picker was deferred because it silently turns the surface into Calendar/Schedule
  Preview and invalidates live-status semantics.

## Consequences

- Core needs a new read-only RPC and HTTP route before the full UI can use real data.
- The current Publication management component can be reused at its new route; no management
  capability is removed.
- Player telemetry is not expanded in this phase. The page cannot claim the current item or exact
  item time remaining.
- The mockup terms `Screen`, `Program`, `Medium Priority` and an unconditional `Live` badge do not
  enter the contract. Use Channel, Media Device, Publication, `normal`, and evidence-qualified
  status labels instead.
