# 0037 — Channel status is derived from Publications; commitment replaces activation

Part of the Channel set: 0030 (membership and exclusivity), 0033 (lifecycle and concurrency, which
this ADR partly **supersedes**), 0034 (configuration boundary and target snapshot), 0035
(monitoring), 0036 (UI scope, whose *Status is a read-only pill* section this ADR **amends**).

## Context

ADR 0033 gave a Channel a stored lifecycle changed by an explicit **Activate** button, and rejected
deriving it. That rejection rested on one claim: *"there is no underlying fact to derive from."*

That claim is no longer true, and was already less true than it read. Verified against ThunderCore
(`sfiefevtxalqjizdkcsw`) on 2026-08-21:

- `media_core.publication_targets` carries `target_type` and `channel_id`.
- `media_publication_upsert` accepts `target_type:'channel'` and validates the channel per tenant.
- `media_publication_activate` already expands a channel target into its devices through
  `channel_devices` when it writes `publish_job_targets`.
- `media_core.channel_blocking_publications` already asks "which live Publications target this
  Channel", and `media_publication_get` already returns channel targets with a resolved name.

The fact exists and is one join away. What did not exist was a *producer* of it: the Publication
wizard's step 3 read `/media/screens` and emitted `target_type:'device'`, so every one of the 86
`publication_targets` rows in production was a device target and no Channel had ever been referenced.

Meanwhile the list page carried two status-shaped columns — `lifecycle` (Draft/Active/Inactive) and
`health` (Online/Warning/Degraded/Offline/unassigned) — and the operator reads them as one question.
`degraded` and `warning` were never distinguishable in practice: `channel_rows` emitted `degraded`
for "some devices offline" and `warning` for every other mixed state, a distinction no one acts on
differently.

## Decision

### One status, three values, derived

`media_core.channels.status` keeps its check constraint and its three values, but only two of them
are ever written by a caller:

- **`draft`** — staged. Not validated, holds no device reservations, may share devices freely.
- **`active`** — committed. Validated, holds an exclusive reservation on each of its devices.
- **`inactive`** — released by the operator; reservations dropped.

What the UI shows is computed in `channel_rows`, the same shape ADR 0028 uses for Playlists:

```
status = 'draft'                                  -> Draft
status = 'active' AND publication_count > 0       -> Active
otherwise                                         -> Inactive
```

"Active" answers *is this Channel carrying content right now*, and only a Publication can make that
true. A committed Channel nothing publishes to is Inactive — including the one production row that
reads `active` today, which correctly becomes Inactive once this lands.

`publication_count` is returned alongside so the derivation is auditable in a single query. The
frontend does not read it: unlike Playlists, where ADR 0028 had to derive client-side because the
backend could not, the derivation here is entirely server-side and the client just reads `lifecycle`.

### Create and Save as Draft are separate buttons; Activate is gone

The editor's single Create button always produced a Draft, because `channels.status` defaults to
`'draft'` — the "Draft button" and the "Create button" were the same button. They split:

- **Save as Draft** — `as_draft: true`. Stages the Channel with no validation beyond name and type,
  reserves nothing. Shown on the create page and on any Channel still in Draft.
- **Create Channel** — `as_draft: false`. Requires a Channel Type and at least one Media Device,
  then commits: `status = 'active'`, `activated_at` stamped, devices reserved.
- **Save changes** — `as_draft` omitted. An ordinary edit of an already-created Channel; leaves the
  stage alone. Nothing returns a Channel to Draft, and the RPC refuses an attempt.

`media_channel_activate` stays deployed and is simply no longer called. Dropping a live RPC is its
own change with its own blast radius.

### Reservations move from activation to commitment

This is the load-bearing consequence and the reason the fork needed a decision rather than a patch.
Reservations are what stop two Channels driving one screen (ADR 0030), and they were written inside
`media_channel_activate`. With no Activate, they had to move somewhere.

They move to **commitment**, and the mechanism is ordering, not new code: `channel_set_devices`
already reserves for a Channel whose `status` is `active`, so `media_channel_create` and
`media_channel_update` write the status *before* calling it. A committed Channel owns its screens
from the moment it exists; a Draft owns nothing. No background job, no new table, no second rule.

### `health` leaves the Channel row

`channel_rows` stops returning a channel-level `health`, and the `ChannelHealth` type, the health
filter, the health column and the four health stat tiles are removed. Liveness is rolled up from
`devices[].health` at the point of display: the Devices cell reads `2/3 online`, the detail rail and
the editor summary read the same.

This answers "fold `degraded` into `warning`" by removing the axis the two values lived on. A
Channel that is Active with two of three screens dark now shows both facts — `Active` and
`2/3 online` — where the old two-column layout could only show one of them per column.

The wire key stays `lifecycle` even though the UI column is headed **Status**. Renaming it would
touch the RPC, the parser and every Channel component for a label change; `lifecycle` still
describes draft/active/inactive accurately.

### Publications target Channels, not screens

Wizard step 3 was already titled "Select Channels" and already rendered channel-shaped cards — it
was fed `Screen[]`. It now reads `fetchChannels()` and emits `target_type:'channel'`. Draft Channels
are filtered out of the picker: a Draft holds no reservations, so publishing to one would drive
screens nothing has claimed.

Two consequences that are not obvious:

- `media_schedule_conflicts` still takes `p_device_ids uuid[]`. The wizard flattens the selected
  Channels' devices before asking. Pushing the expansion into the RPC would be a second place that
  knows how a Channel resolves to screens.
- The persisted draft key goes `v6 -> v7`. `channelIds` held device ids; rehydrating one into a
  channel-typed target would fail with "channel not found". A resumed pre-v7 draft comes back with
  an empty Channel selection rather than a silently wrong one.

## Alternatives rejected

**Keep Activate and derive nothing (ADR 0033 as written).** Rejected by the operator: activation is
a step that records no decision an operator actually makes. Whether a Channel is live is a fact
about Publications, not a button press, and two sources of truth for it drift.

**Reserve devices when a Publication targets the Channel, release when the last one ends.** The
tightest possible coupling between "Active" and "holds screens". Rejected for the same reason ADR
0033 rejected deferred release: it needs a worker to notice the last Publication ending, so
exclusivity would depend on a job running rather than on a transaction. Committing at Create keeps
it inside one `BEGIN`.

**Drop reservations entirely** — nothing else needs them once status is derived. Rejected outright:
that is the double-playback state the table exists to prevent, and it would silently un-decide
ADR 0030.

**Merge health into status as five values** (Draft / Inactive / Online / Warning / Offline).
One column, one filter, no second axis. Rejected: an Active Channel with dark screens can only
report one of those two facts, and the one it would report is the less actionable.

**Derive now and let every Channel read Inactive until the wizard round ships.** Rejected as an
ordering choice: the wizard change is small and frontend-only, so shipping the derivation first
would have meant a list that reads Inactive for everything with no way to make it read anything
else.

**Rename the payload key `lifecycle` to `status`.** Matches the UI label. Rejected as churn: the RPC,
the parser and roughly fifteen components for a word that is already accurate.

## Consequences

- The single production Channel that stores `active` will read **Inactive** until a Publication
  targets it. That is the intended meaning, not a regression.
- The list's lifecycle counts are no longer counts of a stored column (reversing ADR 0033's
  consequence note) — a tenant with no channel-targeted Publications reads zero Active, legitimately.
- `?health=` on a bookmarked list URL is ignored; `sort=health` falls back to the default sort.
- Deactivate is now the only lifecycle button, and its "these publications still target this
  channel" guard is reachable for the first time, because Publications can finally target a Channel.
- A Channel committed at create time carries `activated_at`, so ADR 0033's hard-delete carve-out
  (`activated_at IS NULL`) now covers exactly the Drafts and nothing else.
- `media_channel_create` and `media_channel_update` change signature. Both old signatures are
  dropped before the new ones are created, and their grants re-issued — `CREATE OR REPLACE` with an
  added parameter would have produced an ambiguous overload.
