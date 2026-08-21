# 0036 — The Channel UI splits on read vs write, not on backed vs unbacked

Part of the Channel set: 0030 (membership and exclusivity), 0033 (lifecycle and concurrency),
0034 (display expectation and target snapshot), 0035 (monitoring, alerts, notifications), this ADR.

## Context

A Figma mock covering three surfaces — Channels list, Create Channel, Edit Channel — proposes far
more than the backend can serve. The channel API surface, verified against
`src/features/channels/services/channels-api.ts`, is five channel routes plus `reference-data` plus
`/media/screens`. There is no monitoring, telemetry, history, screenshot, command or link-count
endpoint.

Of roughly thirty-five fields the mock draws, these are real: `description`, `expected_orientation`,
`expected_resolution`, `default_playlist`, `lifecycle`, per-device `health` / `last_heartbeat_at` /
`orientation` / `resolution`, and the channel `health` derived client-side by `deriveChannelHealth`.
Everything else — Tags, Timezone, the whole Schedule & Default Behavior section, the whole Monitoring
section, Fallback Content, Audio, Playback Mode, Sync Mode, Auto Resume, Preview, Capture Now, Test
Output, View History, Linked Items counts, per-device IP Address and Output/Screen, and the summary's
Current Content / Next Content / Uptime / Player Version / Storage Used — has no column, no endpoint,
or both.

`docs/channels/plan-channels-monitoring.md` §11 already states the rule: *"A control ships only when
its end-to-end contract works. No button appears before the thing behind it responds."* §12 lists
what blocks each: milestone 14.2 policy storage is specified but not migrated, 14.3 remote operations
are gated on unverified Player command polling, and the telemetry slice (uptime, player version,
storage) is gated on the Player emitting anything beyond a heartbeat.

The previous round applied that rule as a flat cut — anything unbacked was dropped — which left the
page shaped nothing like the mock and gave no home for the values when they eventually arrive.

## Decision

### The line is read versus write, not backed versus unbacked

A **read-only row** with no data renders `—`. An empty value is a truthful statement about the world:
this channel has no data for this yet.

An **input control** with no write path is cut entirely. A disabled field is a lie of a different
kind — it invites the user to fill it in, and if it ever became enabled by accident the value would
be discarded on save. There is no honest rendering of a form field that cannot be saved.

This keeps the mock's silhouette (two columns, numbered sections, a summary rail) without carrying
several hundred lines of dead form.

### Unbacked read-only values live in a labelled group, not scattered among real ones

The summary rail shows six real rows — Category, Type, Location, Resolution, Status, Last Seen —
then a divider, then Current Content, Next Content, Uptime, Player Version and Storage Used as `—`
under a heading naming what they wait for.

A `—` sitting beside populated rows reads as *broken*. The same `—` under a heading that says the
Player has not reported yet reads as *not yet due*. When milestone 14.2/14.3 lands, the values drop
into rows that already exist.

### A block with nothing real in it is cut, not stubbed

Three parts of the mock contain no backed value at all and are removed rather than emptied: the
Linked Items counts (Publications / Playlists / Campaigns), the Preview Channel and View History
buttons, and the device table's IP Address, Output/Screen and Test Output columns. A column of `—`
down its whole length is noise, and a button that cannot respond is the exact thing §11 forbids.

### Status is a read-only pill, never the mock's toggle

The mock draws a two-state switch. ADR 0033 makes `Draft → Active` one-way, and both real
transitions carry preconditions a switch cannot express: activation requires at least one assigned
device, and deactivation is refused while an Active or Scheduled Publication targets the channel.

A switch promises an immediate, reversible flip. A button that can be pressed and then refused with
a reason is the honest control, and `ChannelLifecycleActions` already implements it.

### The Publications tab and the summary thumbnail are deferred, not approximated

`GET /media/publications` filters on `status` only, and `PublicationListItem` carries no target ids —
`publication_targets` exists on the detail payload alone. Answering "which publications does this
channel have?" therefore means fetching every publication and then fetching each one's detail to read
its device ids: an N+1 fan-out, on a list the mock itself shows as 156 rows. The summary thumbnail
sits one hop further out still, since a publication has no image of its own and must be resolved
through `playlist_id → cover_asset_id → POST /media/videos/preview-urls`.

Both ship as the mock's own "No preview available yet" placeholder, and the backend is asked for one
of: a `channel_id=` query parameter on `GET /media/publications`, or `target_device_ids[]` on
`PublicationListItem`. Either unblocks both with no UI rework.

## Alternatives rejected

**Draw the full mock with unbacked controls disabled and badged "coming soon."** It matches the mock
exactly and unlocking later is a one-line change per field. Rejected because it inverts the §11 rule
this project already committed to, and because "coming soon" on roughly twenty controls across two
sections is not a UI, it is an apology. The cost is also real: several hundred lines of form wiring
that no test exercises and no save path touches, decaying until the milestone lands.

**Do the N+1 fan-out for the Publications tab, lazily on tab open.** Rejected on latency — a hundred
or more requests against production to populate one tab — and because the snapshot caveat in ADR 0034
means the answer would be wrong anyway: activated publications freeze their device ids, so matching
them against a channel's *current* membership disagrees with what was actually published.

**Cap the fan-out at the first twenty active publications and label the result partial.** Rejected as
the worst of the three. "Which content is this channel showing" is precisely the question where a
partial answer is indistinguishable from a wrong one.

## Consequences

- The three pages will not match the mock. The gaps are the ones listed above, each traceable to a
  missing column or endpoint rather than to a design preference.
- When 14.2 and 14.3 land, the summary rail's telemetry group takes values without restructuring, and
  the cut sections come back as new sections — they are not waiting half-built in the tree.
- One backend ask is outstanding and blocks two mock features: a channel filter on the publications
  list endpoint.

## Execution notes

These follow from the decision above and are recorded only so the reasoning is not re-derived:

- Refactor scope is `ChannelEditorPage.tsx` alone, down to the 300-line convention. It was already
  over before this work.
- The list page gains six stat cards, sorting, pagination, URL state and category grouping, reusing
  the modules `src/features/playlists/` already proved. Channel Groups, Import Channels, the
  grid/list toggle and row checkboxes are cut — the first has no table behind it, the rest have no
  endpoint.
- The detail rail stays a single view. Its Schedule and History tabs have the same telemetry gate as
  the summary group, and Publications is deferred above.
- No breadcrumbs. Neither playlists nor publications has them; one page growing its own would be the
  start of two conventions.
