# 0099 — Programs reach only active Channels

Status: accepted (2026-10-21, owner decision "C.1" after a Playback Proof investigation; scrutiny
round 1 applied). Amends 0037 (target pickers), 0089 §4 (why a Channel can be null). Migration:
Thunder_Core `supabase/migrations/20261021120000_publish_active_channels_only.sql`.

## Context

Playback Proof showed 1,331 prod entries for device *test android 1* with no Channel. Traced on prod:

- Channel *testandroid 1* was deactivated 2026-10-19. `media_channel_deactivate` sets
  `status = 'inactive'` and deletes the Channel's `channel_device_reservations`.
- Programs created 2026-10-20/21 still targeted it. `media_publication_activate` — the only function
  that inserts `publish_job_targets`; republish and Publish Changes call it — resolves Channel and
  Group targets through `channel_devices` and never reads Channel status. The device got Jobs and
  played.
- Everything that names "the Channel driving this device" reads reservations instead: Playback Proof
  ingest (0089 §4), `media_job_poll`, Channel lifecycle. So the device played while every screen said
  it had no Channel.
- 0037 already says a Draft holds no reservation and must not be targeted, but only the FE pickers
  enforce it (`lifecycle !== "draft"`); the backend accepts any Channel of the tenant. `lifecycle`
  `inactive` also covers an active Channel that has no Program yet, so the pickers cannot filter on it.
- Deactivate refuses only while a Program targets the Channel *directly*; a Channel reached through a
  Group could be deactivated and keep playing the Group's Job. Nothing stops a non-active Channel from
  joining a Group.

## Decision

1. **Only an active Channel can receive content.** `media_publication_activate` refuses when any
   Channel target, or any member of a Group target, has stored `status <> 'active'`, naming those
   Channels. The check runs on every activation, not only the first, so republish and Publish Changes
   are covered. Draft Channels are covered too.
2. **Groups hold only active Channels.** `media_channel_groups_set_members` and
   `media_channel_set_groups` refuse to *add* a non-active Channel. Existing members are not checked,
   so a Group that predates this rule (one exists on develop) can still be edited and shrunk; its
   Programs are refused by §1 until the member is activated or removed.
3. **A Channel in a Group cannot be deactivated.** `media_channel_deactivate` refuses and names the
   Groups. With §2 this means no Program reaches an inactive Channel through a Group, so
   `channel_blocking_publications` keeps its direct-target-only check.
4. **Pickers read the stored status.** `channel_rows` gains an additive `status` key; the publish
   pickers offer only Channels with `status = 'active'` (replacing `lifecycle !== "draft"`). The FE maps
   each new refusal to Thai copy that names the Channels or Groups.
5. **Playback Proof says why.** A null Channel shows as "No active Channel", with a tooltip. History is
   not backfilled (0089 §4 stands).

## Considered options

- **Activation reactivates the Channel and reserves its devices.** Rejected: silently undoes someone's
  deactivate and can collide with another Channel's reservation.
- **Resolve targets through reservations instead of `channel_devices`.** Rejected: an inactive Channel
  silently contributes zero screens; alone it hits the #134 "no screens" error with no reason, mixed
  with other targets it simply drops out.
- **Skip non-active Group members instead of refusing.** Rejected: content would silently not reach a
  Channel the user picked.
- **Deactivate removes the Channel from its Groups.** Rejected: an unannounced Group edit, and it can
  leave a synchronized Group incomplete while its Program is live.
- **Guard at Program save (upsert) or in job poll.** Rejected: save would block preparing a Draft
  ahead of time; poll would take screens dark silently.
- **Backfill Playback Proof from `channel_devices`.** Rejected (0089 §4): a guess, and a device can sit
  in several Draft Channels.

## Consequences

- A Program whose target Channel is later deactivated keeps its existing Job until it ends; deactivate
  is still refused while it is live or scheduled (direct) or while the Channel is in a Group (§3).
- Direct *device* targets bypass Channels entirely and are not covered (0 rows on prod 2026-10-21);
  retire them or extend this rule if they come back.
- Prod 2026-10-21: no Group has a non-active member; one ended Program (MEDIA-HOW-013) targets the
  inactive Channel boe_55 and is unaffected. *testandroid 1* was reactivated by the owner the same day.
