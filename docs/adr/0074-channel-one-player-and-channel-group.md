# 0074 — A Channel is one Player; Channel Group is the new grouping and synchronization boundary

Status: **accepted** (2026-09-12 by the owner, after five review rounds and a ticket scrutiny; rev 6). Tickets: thunder_one_prj #98–#111. Supersedes the "one or more equal members" model of ADR 0030 and the Channel-level
synchronization boundary of ADR 0042; removes Channel Health `Degraded` from ADR 0035; supersedes
ADR 0039's orientation check for multi-screen Channels only.

Two kinds of statement appear below and are labelled: **Design evidence** — a mockup in
`docs/channels/v02/design/` shows it, and the mockup wins on layout and wording; **Rationale** — a
data-model or rule decision the mockups do not show, and this ADR wins. Do not read a design label as
a rule, or a rule as something the design asked for.

## Context

ADR 0030 modelled a Channel as one-or-more equal Media Devices receiving the same content, with
synchronized playback (ADR 0042) as an opt-in policy on that Channel. The v02 design
(`00 - Create Channel MVP Flow.png`, `01 - Channel Group - UI Flow & Actions.png`) draws a
different shape: a Channel is one registered player driving one or more physical screens on one
machine, and the thing that groups many Channels for targeting and synchronization is a separate
**Channel Group**. The two shapes cannot coexist in one model.

Facts established before deciding:

- Queried 2026-09-12: **prod (`sfiefevtxalqjizdkcsw`) holds no Channels, no devices with
  credentials, no targets and no jobs** — every real player reports to the `develop` project
  (`ftfmokgphewzyxzwjitv`), which holds 4 Channels / 5 `channel_devices`: three single-device
  Channels (one of them `sync_enabled = true`, one a Draft test row) and one two-device Channel
  (`sync_enabled = true`). So develop *is* the live database for this work, and only **one**
  Channel actually needs splitting. Numbers in this ADR are illustrative; the migration reports
  its own counts at apply time. `channel_devices.device_id` is `REFERENCES public.assets(id) ON
  DELETE CASCADE` (`048_media_core_schema.sql`).
- A Media Device is a `public.assets` row with a `public.device_credentials` row. `registerAsset`
  creates both with `registry_status = 'pending'`; the player's first call to
  `/api/v0.1/player/retrieve` flips it to `active`. The "first heartbeat activates the device" step
  already exists.
- `media_screens_list` filters on credentials existing, not on `registry_status`, so never-connected
  devices are offered in the Channel picker today.
- The player reports one `screen_dimension` / `screen_ratio` and nothing about output count.
- `channels.expected_resolution` is constrained to four values (`100_channel_core_schema.sql`,
  `channels/schema.ts`), and `channel_validate` **refuses** a device whose reported orientation
  differs from `expected_orientation` (`101_channel_core_functions.sql`; ADR 0039). ADR 0055 made
  the Layout↔Device fit advisory but explicitly left this Channel↔Device rule alone.
- `publication_targets.target_type IN ('channel','device')` stores the operator's **intent**;
  `publication_snapshots` / `_zones` / `_items` store the frozen content; `publish_job_targets`
  store delivery. Republish (`20260827120000_republish_and_drift_read.sql`) re-runs activation on
  the same publication id — the activate route accepts only that id, nothing else.
- `media_publication_activate` today blocks a `device` target whose Channel has `sync_enabled`.
- `loop_anchor_at` derives from the Schedule of the first slot (ADR 0043), not from the Channel.

## Decision

### 1. A Channel has exactly one Player; Draft may have none

**Design evidence:** `00.2.2 - Channel Setup Wizard Modal Step - 2.png` — one "Select Player"
control per Channel. `00.2.2.1 … select player.png` — an "Unavailable Players" group with reasons.

**Rationale:** the Player is stored in `channel_devices` with a new `UNIQUE (channel_id)`; every
existing RPC and the reservation table already join through that table, so this is one index
rather than a new column. `channel_devices.device_id` changes to `ON DELETE RESTRICT` — with the
cascade, deleting an asset would silently leave an Inactive or Draft Channel Player-less. A Draft
may be Player-less so an operator can prepare a Channel before the hardware arrives; activation
requires one (`channel_assert_committable`). `channel_device_reservations` is kept unchanged —
`media_device_id UNIQUE` is still exactly "one Device is the Player of at most one Active Channel".
Changing or removing the Player is blocked while an Active or Scheduled Publication targets the
Channel (ADR 0038's guard, unchanged).

The Player picker offers every Media Device of the tenant and marks two kinds unavailable rather
than hiding them: `registry_status <> 'active'` ("never connected") and reserved by another Active
Channel ("in use by CH-xxxx"). The mockup's "3 outputs available" reason is **not** implemented — the
player does not report outputs.

### 2. Output Kind replaces Channel Category; Channel Type leaves the wizard

**Design evidence:** `00.2.1 - Create Channel Wizard Modal Step - 1.png` — icon buttons Screen /
TV / PA-Audio / Kiosk; no Channel Type field; Location marked required.

**Rationale:** `output_kind IN ('screen','tv','kiosk','audio')`; the UI offers the first three.
`audio` is reserved until the player has an audio-only mode — offering a PA channel that plays
video playlists would mislead. `tv` and `kiosk` behave identically to `screen`. Channel Category
never drove behaviour beyond a list filter and is dropped from the UI and from new writes (the
column stays until a cleanup migration). Channel Type (`LED Display`, `Menu Board`) stays as a
nullable column and list filter; the wizard no longer asks for it. **Location stays optional**
against the mockup: both production Channels have none and small tenants have no Locations.

### 3. Display Configuration: free canvas resolution, orientation derived, advisory for multi

**Design evidence:** `00.2.2 … Step - 2.png` (Display Mode, Arrangement, per-screen resolution,
computed "Total Resolution 5760 × 1080"), `00.3 - Edit Channel Page (multi screen).png`,
`00.2.3 - Review … Step - 3.png`.

**Rationale:**

- `expected_resolution` loses its four-value CHECK and its zod enum; it accepts any
  `^[1-9]\d{2,4}x[1-9]\d{2,4}$` (same bounds as Authoring Reference Resolution). It keeps its
  meaning as the **canvas total**. `expected_orientation` becomes derived (`width > height`) and is
  no longer an input; the column is kept and written by the RPC for existing readers
  (Target Geometry Profile, ADR 0055 fit rule) until a cleanup drops it.
- New nullable `display_config jsonb` holds `{ mode: 'single'|'multi', arrangement, screens:
  [{ index, resolution, output }] }`; single-screen Channels store `NULL`. **The RPC is the only
  writer of the canvas for `multi`**: it derives `expected_resolution` (and orientation) from
  `display_config` — arrangement × per-screen resolution — and refuses a request whose
  `expected_resolution` disagrees with that derivation, so the two columns cannot drift apart. For
  `single`, `expected_resolution` is the input and `display_config` must be `NULL`.
- **Single-screen Channels keep ADR 0039's rule**: `channel_validate` still refuses a Player whose
  reported orientation contradicts the (now derived) canvas orientation.
- **Multi-screen Channels supersede ADR 0039 here**: the Player's single reported
  `screen_dimension` describes one monitor, not the canvas, so `channel_validate` makes no
  comparison and no refusal is possible until the player protocol reports output topology.
- **Two different geometry questions, two different sources.** Channel↔Player validation (above)
  reads what the Player reports. Publication-side Layout fit (ADR 0055) and the pre-publish
  preview's Target Geometry Profile (ADR 0051) today read the *Device's reported* `WxH`
  (`publications/channels-logic.ts`, `summarizeGeometryFit`). **This ADR changes that source**: for
  a Channel target they read the Channel's declared canvas — `expected_resolution` and its derived
  orientation — and fall back to the Player's reported geometry only when the canvas is unset. A
  multi-screen Channel therefore contributes `5760x1080` to preview and fit as advisory declared
  geometry, not "unknown"; unknown remains the label for a Channel with no canvas and a Player that
  reports nothing.
- Multi-screen is one machine driving several monitors (ADR 0050); several machines showing one
  image in step is a synchronized Channel Group, never a Display Configuration.

### 4. Channel status is the Player's health; `Degraded` is gone

**Design evidence:** `00 - All Channels.png` — Status column Online / Warning / Offline.

**Rationale:** lifecycle `Draft / Active / Inactive` (ADR 0037) remains as a badge and filter; a
Player-less Draft reads "No player". With one Device per Channel there is nothing to aggregate, so
Channel Health `Degraded` (ADR 0035) leaves the model and the glossary.

### 5. Channel Group: many-to-many, at most one synchronized Group per Channel

**Design evidence:** `01 - Channel Group - UI Flow & Actions.png` (Playback Mode Synchronized /
Independent, Disable Group, Delete Group with "has active programs, cancel or reassign before
deleting"), `00 - All Channels.png` (a Channel shown in two Groups), `00.4 - Mange Group Channel
Modal.png` (checklist of Groups from one Channel).

**Rationale — schema, fixed, not left to the implementer:**

```
media_core.channel_groups
  id uuid PK, tenant_id uuid NOT NULL, name text NOT NULL, description text,
  playback_mode text NOT NULL CHECK (playback_mode IN ('synchronized','independent')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','disabled')),
  created_at, updated_at,
  UNIQUE (tenant_id, name), UNIQUE (id, playback_mode)        -- target for the composite FK

media_core.channel_group_members
  group_id uuid NOT NULL, channel_id uuid NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL,
  playback_mode text NOT NULL,                                -- copy, kept in step by the FK below
  PRIMARY KEY (group_id, channel_id),
  FOREIGN KEY (group_id, playback_mode) REFERENCES channel_groups(id, playback_mode)
      ON UPDATE CASCADE ON DELETE CASCADE

CREATE UNIQUE INDEX channel_group_members_one_sync
  ON media_core.channel_group_members (channel_id) WHERE playback_mode = 'synchronized';
```

The copied column plus `ON UPDATE CASCADE` means flipping a Group `independent → synchronized`
cascades into every member row and is **rejected atomically by the partial unique index** if any
member already sits in another synchronized Group — no trigger, no check-then-insert.

The synchronization boundary moves from Channel to Group. `channels.sync_enabled` is migrated into
`playback_mode` and dropped in the cleanup migration. ADR 0042's phase arithmetic and ADR 0043's
Schedule-derived `loop_anchor_at` are **unchanged** — a Group only decides which Channels must
carry the same payload; it does not become an anchor scope.

The activation guard runs **after** every intent row — `channel`, `device` and `group` alike —
has been resolved into one set of target Channels, so it does not branch per target type and a
Channel reached through an *independent* Group cannot slip past it: for every synchronized Group
that has at least one member in the resolved set, **all** of its members must be in the set, or
activation is refused naming the Group and the missing members. The direct-`device` restriction
stays as a separate, simpler rule: a `device` target whose Channel is in any synchronized Group is
refused (today's rule, one level up).

**Grandfathering has one verifiable definition:** both refusals apply only to a Publication's
**first** activation — one that has no `publication_snapshots` row yet. A Publication that has
already aired (has a snapshot) republishes with the same targets and receives a **warning** on
the Group instead of a refusal. "Has aired" is the evidence that the conflict predates the Group
being synchronized; no `synchronized_at` timestamp is added, because the snapshot already answers
the question. Until M2 the Channel-level `direct_target_conflicts` field is still returned,
populated from these Group warnings, so the deployed frontend keeps its warning.

`status = 'disabled'` hides the Group from the Publication target picker and does nothing else:
members keep playing and keep synchronizing. Stopping synchronization is an explicit change of
Playback Mode.

**Deleting a Group follows the mockup: blocked** while any Publication row still references it
(`publication_targets.target_type = 'group'`, rule 6) — otherwise the intent to republish would be
destroyed. The confirmation lists the referencing Publications; the operator must **remove or replace the
Group in every one of them** first — cancelling a Publication does not help, because cancel only
changes its status and leaves `publication_targets` rows in place. A Group with no references is deleted after confirmation and its members become
ungrouped.

### 6. A Group is stored intent, expanded into a frozen snapshot at activation

**Design evidence:** `01 - Channel Group - UI Flow & Actions.png` modal A ("Target: Channels /
Channel Groups / All Channels"); `00 - All Channels.png` right panel ("via All Restaurant Screens").

**Rationale — three layers, each with its own table, following the existing snapshot model
(ADR 0045):**

1. **Intent** — `publication_targets` gains `target_type = 'group'` and `group_id uuid REFERENCES
   channel_groups(id) ON DELETE RESTRICT`; the one-ref CHECK is extended. A Publication saves the
   Groups and Channels the operator picked, exactly as typed, at **save/upsert time** — the activate
   route keeps accepting only the publication id. The same Channel may legitimately appear both
   directly and through one or more Groups — those are different intents and are all kept. An
   exact duplicate (`(publication_id, target_type, channel_id|device_id|group_id)`) is rejected by a
   unique index, because it carries no extra intent and would collide in the frozen expansion.
2. **Frozen expansion** — new `media_core.publication_snapshot_group_members (snapshot_id →
   publication_snapshots ON DELETE CASCADE, group_id, group_name text, playback_mode text,
   channel_id, channel_name text, device_id uuid, PRIMARY KEY (snapshot_id, group_id, channel_id))`.
   **Only `snapshot_id` is a foreign key.** `group_id`, `channel_id` and `device_id` are frozen
   identifiers with no FK — a `CASCADE` would erase history when a Group or Channel is deleted, a
   `RESTRICT` would pin a Group forever after its last intent row is gone; `group_name` and
   `channel_name` are frozen for display for the same reason. Activation writes one row per (Group,
   member) it expanded, **freezing the member's Player as `device_id` at that moment** — `publish_job_targets` has only `device_id`, and a Channel's Player
   can change later, so joining back through `channel_devices` would attribute a delivery row to
   the wrong Group. `via_groups` on a job target is `SELECT group_name … WHERE snapshot_id = job.snapshot_id
   AND device_id = jt.device_id`. The same Channel reached through two Groups has two rows; this is
   the provenance behind "via <Group>" and behind drift — many-to-many, so it cannot live as one
   nullable column on a target row.
3. **Delivery** — `publish_job_targets` unchanged: one row per resolved Channel/Device, whatever
   intent produced it.

Drift: `media_publication_get` compares, per intent Group, the current `channel_group_members`
set with the snapshot's `publication_snapshot_group_members` set and reports "+CH-x / −CH-y"
alongside the Composition/Layout/Playlist findings; the existing Republish action re-expands from
intent. A Channel added to a Group receives nothing until someone republishes.

### 7. Migration of existing data

**Rationale:** the data rewrite is **not** in the same step as the schema. Today's
`media_publication_activate` expands only `channel` and `device` intents; a `group` row present
before Core v2 is deployed would pass the "at least one target" check, expand to nothing, and mint
an Active Publication with a snapshot and no `publish_job_targets`. DB migrations and Vercel deploys
are not atomic with each other, so the order is fixed: **M1a** additive schema only (no data
rewrite, no `UNIQUE (channel_id)`) → deploy **Core v2**, which understands `group` intent *and*
still reads legacy multi-device Channels (a Channel with exactly one Device exposes it as `player`;
any other count exposes `player = null` and the honest `devices[]` — never the first Device by
default) → deploy a **frontend compatibility slice** that can read, rehydrate and write back
`group` intent, because the current publications UI keeps only `channel` targets and would erase a
Group on the next Save → **M1b** data rewrite → deploy the full frontend → **M2** cleanup. M1b is **query-driven**: the pre-apply report (`SELECT` at that moment, never a number from a
document) lists what will change, and the migration acts per Channel by its device count:

- **exactly one device** → the row is kept as-is; only `output_kind = 'screen'` is set. No Group is
  created, no intent is rewritten, no name changes. A `sync_enabled = true` flag on such a Channel
  has no cross-Device effect, but `media_job_poll` still sends `sync_enabled: true` +
  `loop_anchor_at` to that one player; whether a lone player behaves differently with the flag is a
  player-side question that M2 must answer before dropping the column (ticket 13).
- **two or more devices** → for each `channel_devices` row create a Channel named `<channel name> –
  <device name>` with that device as Player, `output_kind = 'screen'`, the old Channel's
  `expected_*`, lifecycle and location; turn the old Channel into a Channel Group of the same name
  with `playback_mode` from `sync_enabled`; rewrite that Channel's `publication_targets` rows into
  `target_type = 'group'` rows (intent preserved); **backfill**
`publication_snapshot_group_members` for every existing snapshot of those Publications directly
from the old-device → new-Channel mapping — **never by re-running `media_publication_activate`**,
which would create a new snapshot, a new Job generation and a new `activated_at` for content that
is already airing; leave existing `publish_jobs` / `publish_job_targets` untouched (they reference
devices, which do not change); move reservations to the new Channels; finally create `UNIQUE (channel_id)` on `channel_devices`.
`channels_tenant_id_name_key` makes a name collision fail loudly
rather than merge. The fixture airing on Screen 01/03 until 2026-10-08 must still air afterwards.
`sync_enabled`, `channel_category` writes and the old `expected_resolution` CHECK are removed only
in a later cleanup migration, after the frontend has switched (see plan §2 cutover).

## Considered options

- **Keep Channel = n Devices; treat the design's "Channel" as a Device page.** Rejected: the design
  puts Display Configuration, lifecycle and targeting on the one-player entity.
- **Both shapes at once.** Rejected: permanent branching in every RPC for a handful of rows.
- **`channels.player_id` column instead of `channel_devices + UNIQUE(channel_id)`.** Rejected:
  every RPC and the reservation table already join `channel_devices`; one index is the smaller
  change.
- **Group as a live target (members follow automatically).** Rejected: contradicts ADR 0045 and
  would require re-materializing job targets on membership change.
- **One `source_group_id` column on the expanded target row** (rev 1 of this ADR). Rejected in
  review: a Channel reached via two Groups, or both directly and via a Group, loses provenance;
  and `ON DELETE SET NULL` on it would destroy the intent Republish needs.
- **Group delete allowed while referenced** (rev 1). Rejected for the same reason; the mockup blocks.
- **`channel_groups.synchronized_at` to define grandfathering.** Rejected: a column added to
  answer a question the snapshot already answers (has this Publication aired?).
- **Split every legacy Channel, single-device ones included.** Rejected in scrutiny: produces
  one-member Groups and renames Channels with no benefit; only n ≥ 2 Channels need it.
- **Trigger-enforced "one synchronized Group per Channel".** Rejected: the copied-column + partial
  unique index is a DB guarantee with atomic rejection on mode change.
- **Make the Channel↔Player orientation check advisory for single-screen too.** Rejected: ADR 0039
  chose to refuse, ADR 0055 deliberately left it, and nothing in the design asks otherwise.
- **Wait for the player to report outputs before multi-screen.** Rejected: ADR 0050 already commits
  to one machine driving several monitors from configuration.
- **Enable all four Output Kinds now.** Rejected for `audio`: no audio-only player path exists.

## Consequences

- ADR 0030: reservation table and the Category/Type section's *Type* axis survive; the
  one-or-more-members model and Category as an input are superseded.
- ADR 0042: `sync_enabled` on the Channel, `direct_target_conflicts`, and the Channel-level guard
  are superseded by rule 5; the phase arithmetic is not. M2 landed on 2026-09-15, so the
  transitional `sync_enabled` compatibility read has been removed; synchronized Group membership
  is now the sole synchronization boundary.
- ADR 0039: superseded for multi-screen Channels only (rule 3); single-screen refusal stands.
- ADR 0051 / ADR 0055: geometry source for Channel targets changes from Device-reported to
  Channel-declared canvas with Device fallback (rule 3); the advisory nature is unchanged.
- ADR 0035 loses `Degraded`.
- Live View (`00.5.1 …`, `02 Live view - Architecture & Development Roadmap.png`) is a separate
  sub-project that consumes this model and is not decided here.
- Player-reported outputs wait for a player protocol change outside both repos.
