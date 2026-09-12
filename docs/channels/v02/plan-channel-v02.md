# Plan: Channel v02 — one Player per Channel, Channel Groups

Execution detail for `docs/adr/0074-channel-one-player-and-channel-group.md`. The ADR holds the
decisions and the rejected alternatives; this file holds the order of work, the mockup each piece
must match, and the facts that would rot inside the ADR.

Nothing here has been implemented as of 2026-09-11. No migration has been applied.

Repos: frontend `thunder_one_prj` (branch `feat/channel`, base `dev`), backend `Thunder_Core`
(base `develop`; migrations applied via Supabase MCP to the develop branch project first, then
prod — see memory: the migration CLI is broken).

---

## 0. Design binding — read this before touching any file

Every screen below is the source of truth for **layout, wording and which controls exist**. The ADR
is the source of truth for **data model and rules**. Do not invent a control that is on neither.
Do not drop a control that is on a mockup without noting it in the ticket. When implementing a
component, open the PNG.

| # | Mockup (`docs/channels/v02/design/`) | Implements | Phase |
| --- | --- | --- | --- |
| D0 | `00 - Create Channel MVP Flow.png` | overview of the 3-step wizard + result panel | 3 |
| D1 | `00 - All Channels.png` | list page: stat tiles (Total / Online / Warning / Offline / Groups), table columns Channel · Type · Status · Location · Groups · Now Playing · Actions, right-hand detail panel with Status, Now Playing ("via <group>"), Channel Structure tree, Groups chips, Channel Information | 3 |
| D2 | `00.1 - All Channels More Action.png` | row `…` menu | 3 |
| D3 | `00.2.1 - Create Channel Wizard Modal Step - 1 .png` | step 1: Output Kind icon buttons, Name*, Location (optional — ADR §2 overrides the mockup's asterisk), Description 0/300 | 3 |
| D4 | `00.2.2 - Channel Setup Wizard Modal Step - 2 .png` | step 2: Display Mode single/multi, Arrangement, per-screen resolution, computed canvas total, preview strip; Player select + output mapping table, Auto Map | 3 |
| D5 | `00.2.2.1 - Channel Setup  select player(device) Wizard Modal Step - 2 .png` | Player dropdown: search, Available / Unavailable groups, reasons ("never connected", "in use by CH-x"; **not** "outputs available" — player does not report outputs), "Can't find your player?" hint | 3 |
| D6 | `00.2.3 - Review Create Channel Wizard Modal Step - 3 .png` | step 3 review + Create; success card with View Channel / Create Another | 3 |
| D7 | `00.3 - Edit Channel Page (single screen).png` | edit page, single | 3 |
| D8 | `00.3 - Edit Channel Page (multi screen).png` | edit page, multi | 3 |
| D9 | `00.4 - Mange Group Channel Modal.png` | from a Channel: pick which Groups it belongs to | 4 |
| D10 | `00.5.1 Live view Modal (single screen).png` / `(multi screen).png` | **out of scope** — parked as ticket 14; ticket 07 renders the D1 button disabled | 14 |
| D11 | `01 - Channel Group - UI Flow & Actions.png` | groups overview: list, inspector, actions A–D | 4 |
| D12 | `01.1 - Channel Group tab.png` | Groups tab: tiles, table Group Name · Mode · Channels · Status · Description · Last Updated | 4 |
| D13 | `01.2 - Channel ungroup tab.png` | Ungrouped Channels tab | 4 |
| D14 | `01.2.1 -  Channel ungroup tab create group modal.png` | Create Group modal (name, description, Playback Mode, pre-selected channels) | 4 |
| D15 | `01.3 Edit Channel Group modal.png` | Edit Group: name, description, Playback Mode radio | 4 |
| D16 | `01.4 Manage Channels Modal.png` | Manage Channels in a Group: search, checklist | 4 |
| D17 | `02 Live view - Architecture & Development Roadmap.png` | **out of scope** — evidence for ticket 14's design session | 14 |

Wording carried from the mockups verbatim: "Create Channel", "Display Mode", "Single-screen /
Multi-screen", "Arrangement", "Canvas Resolution", "Player & Output Mapping", "Auto Map",
"Channel Groups", "Ungrouped Channels", "Playback Mode — Synchronized / Independent",
"Manage Channels", "Program" (UI label for Publication in the Publication create flow; the Channel/Group pages in D1 and D11 also say "Current Program / View Programs / Create Program" — use those labels there; code, API and glossary stay `Publication`).

Deliberate deviations from the mockups (all decided in the grilling session, recorded in the ADR):

- Location is optional (mockup: required).
- No Channel Type dropdown (LED Display / Menu Board) anywhere in the wizard.
- PA / Audio is **not** offered as an Output Kind; Screen / TV / Kiosk only.
- "3 outputs available / not enough outputs" is not shown; player does not report outputs.
- Group **Disable** hides from the target picker only. Delete Group follows the mockup: blocked
  while a Publication references the Group (ADR 0074 §5).
- Orientation is derived from the canvas resolution, not a separate input.
- Status column = Player health, with lifecycle as a badge/filter, not a second column.

---

## 1. Current-state facts (verified 2026-09-11, re-verify before writing migrations)

### Thunder_Core

| object | state |
| --- | --- |
| `media_core.channels` | `id, tenant_id, name, description, status, metadata jsonb, channel_category, channel_type_id, location_id, expected_orientation, expected_resolution, default_playlist_id, sync_enabled, revision, …` (ADR 0030/0037/0039/0042) |
| `media_core.channel_devices` | `(channel_id, device_id → public.assets ON DELETE CASCADE, role)` — becomes the single-Player link via `UNIQUE (channel_id)`; FK changes to `ON DELETE RESTRICT` |
| `media_core.channel_device_reservations` | `media_device_id UNIQUE` — **kept as-is** |
| `media_core.publication_targets` | `target_type IN ('channel','device')`, `channel_id`, `device_id` — gains `'group'` + `group_id` (intent); frozen expansion goes to new `publication_snapshot_group_members` |
| Channel RPCs | `media_channels_list / _get / _reference_data / _create / _update / _delete / _activate / _deactivate`; internals `channel_rows, channel_assert_committable, channel_device_health, channel_blocking_publications, channel_audit, channel_validate, channel_set_devices, channel_lock` |
| Sync consumers | `media_job_poll` reads `c.sync_enabled` (`20260824140000_loop_anchor_at.sql`), `media_publication_activate` direct-target guard (latest body in `20260909120000_equal_priority_publishes_with_a_warning.sql`) |
| Display expectation | `expected_resolution` CHECK = 4 values (`100_channel_core_schema.sql`) + zod enum (`channels/schema.ts`); `channel_validate` refuses orientation mismatch (`101_channel_core_functions.sql`) |
| Snapshot tables | `publication_snapshots`, `_zones`, `_items` (`20260825080838_…`); republish = re-activate same id (`20260827120000_republish_and_drift_read.sql`); activate route takes only the publication id |
| Routes | `src/app/api/core/v1/media/channels/{route.ts,[id]/route.ts,[id]/activate,[id]/deactivate,reference-data}`, zod in `channels/schema.ts` |
| Device picker source | `public.media_screens_list(p_tenant_id)` — filters on `device_credentials` existence, ignores `assets.registry_status` |
| Device activation | `/api/v0.1/player/retrieve` sets `registry_status = 'active'` on first player contact |
| Live rows | **prod is empty** (0 channels / devices / targets / jobs — queried 2026-09-12); **develop is the live DB** the real players hit: 4 channels / 5 channel_devices, one Channel with 2 devices. Fixture airing on Screen 01/03 until 2026-10-08. Re-query before M1b; never trust these numbers |

### thunder_one_prj

`src/features/media-workspace/channels/` (~3.8k lines incl. hooks). Keep: `list-url-state.ts`,
`list-filtering.ts`, `channel-logic.ts`, `services/channels-api.ts` (reshape bodies), `components/
ChannelTable.tsx`, `ChannelFiltersBar.tsx`, `ChannelSummaryTiles.tsx`, `ChannelsListStates.tsx`,
`ChannelDetailPanel.tsx`, `ChannelLifecycleActions.tsx`, `hooks/useChannelEditor*.ts`,
`hooks/editor-mapping.ts`. Replace: `ChannelDeviceAssignmentSection.tsx` +
`ChannelDevicePickerModal.tsx` → Player picker; `ChannelDisplayExpectationSection.tsx` → Display
Configuration; `ChannelBasicInfoSection.tsx` → Output Kind buttons; route `channels/create/page.tsx`
→ wizard modal opened from the list. New: `src/features/media-workspace/channel-groups/`.

Publications: `PublicationDetailPage.tsx` already has `republishPublication` + `publication-drift.ts`;
the group-membership drift finding is added there. The wizard's target step
(`publications/channels-logic.ts`) gains the Groups tab (D11 modal A).

---

## 2. Phases

Each phase ends with its own verification at the layer the operator uses (HTTP for backend, browser
for frontend) and a SESSIONLOG. Backend phases go on a `feat/channel-v02` branch in Thunder_Core.
**Every migration apply is R0**: applied to develop, then prod, only after explicit approval with the
statement of what will change shown first — never "as soon as written".

### Cutover sequence (the deployed frontend must keep working at every step)

```
M1a additive schema        → new tables/columns/indexes, nothing removed, NO data rewrite,
                             NO UNIQUE(channel_id) yet; old RPC contracts still valid
Core v2 (compatible)       → understands target_type='group' + display_config + groups;
                             still reads legacy multi-device Channels (devices[] length n);
                             returns BOTH old fields (devices[], sync_enabled, category) and new
                             (player, groups, output_kind, display_config); create/update accept
                             both device_ids[] (≤ 1) and player_id
FE compat slice            → publications wizard/detail read, rehydrate and write back
                             target_type='group' (group_ids) and render legacy n-device Channels;
                             no Channel Groups screens yet
M1b data rewrite           → split channels, groups, intent rewrite, provenance backfill,
                             reservations, then UNIQUE(channel_id)
Frontend Phase 3–5         → switches to the new fields; deployed
M2 cleanup migration       → drop sync_enabled, channel_category writes, legacy fields
```

DB migrations and Vercel deploys are never atomic with each other — never schedule M1b "together
with" a deploy. Phase 1 = M1a; Phase 2 = Core v2; **Phase 2a = FE compat slice**; **Phase 2b =
M1b** (develop **is** the live DB — its apply is the real R0, prod is currently empty); M2 is its own ticket after Phase 5 ships.

The FE compat slice exists because today's frontend cannot hold a Group intent: `PublicationTarget`
is `"channel" | "device"` (`publications/types/index.ts`), draft rehydration keeps only
`target_type === "channel"` (`detail-mapping.ts`), and `channelIdsToTargets()` writes back Channels
only (`draft-mapping.ts`). A Draft rewritten to `group` by M1b would reopen with an empty selection
and the next Save would erase the intent.
ADR 0074 accepted 2026-09-12 (independently of any migration approval).

### Phase 1 — M1a additive schema (R0 on apply)

Schema exactly as ADR 0074 §5–§6; **no table, column or row is removed or rewritten** in this phase (two constraints are replaced: the `channel_devices.device_id` FK action and the `expected_resolution` CHECK).

1. `channel_devices`: `ALTER … DROP CONSTRAINT channel_devices_device_id_fkey; ADD … REFERENCES
   public.assets(id) ON DELETE RESTRICT`. **No `UNIQUE (channel_id)` here** — any legacy multi-device
   Channel would violate it; it is created at the end of M1b.
2. `channels`: `output_kind` (CHECK 4 values, default `screen`), `display_config jsonb NULL`,
   `channel_type_id` → nullable; **drop the 4-value `expected_resolution` CHECK and add the
   `^[1-9]\d{2,4}x[1-9]\d{2,4}$` CHECK** (ADR §3).
3. `channel_groups` + `channel_group_members` with the copied `playback_mode`, composite FK
   `ON UPDATE CASCADE`, partial unique `channel_group_members_one_sync` (ADR §5, verbatim).
4. `publication_targets`: `target_type` CHECK gains `'group'`, `group_id uuid NULL REFERENCES
   channel_groups(id) ON DELETE RESTRICT`, one-ref CHECK extended; unique index on
   `(publication_id, target_type, COALESCE(channel_id, device_id, group_id))` rejects exact
   duplicates (ADR §6). `publication_snapshot_group_members` created with `device_id` frozen
   (ADR §6).
   `publication_snapshot_group_members`: FK on `snapshot_id` only; `group_id / channel_id /
   device_id / *_name` are frozen values with no FK (ADR §6).
4b. Security/index contract for the three new tables, same as `20260902150000_harden_media_core_rls.sql`:
   `ENABLE ROW LEVEL SECURITY` with no policies, table-level `REVOKE ALL FROM PUBLIC, anon,
   authenticated`, access only through SECURITY DEFINER RPCs that validate `tenant_id` on every
   row they touch (group ↔ channel ↔ publication must agree). Indexes:
   `channel_group_members(channel_id)`, `publication_targets(group_id)`,
   `publication_snapshot_group_members(snapshot_id, device_id)`.
5. Verify: schema dump diffed against the migration file; every existing RPC still returns 200
   unchanged (no data moved, so nothing can differ); deployed frontend unaffected.

### Phase 2 — Core v2 (backward compatible RPCs + routes)

1. `media_channels_list / _get`: add `player`, `output_kind`, `display_config`, `groups[{id, name,
   playback_mode}]`, `health`; **keep** `devices[]` (length n until M1b, ≤ 1 after), `sync_enabled` (= member of a
   synchronized group), `category`, `direct_target_conflicts` (from the group) until M2.
   **Transitional `player` semantics** (until M1b): `devices.length === 1` → `player = devices[0]`;
   any other length → `player = null` and `devices[]` carries the truth — never pick the first
   Device silently. `health` for a multi-device legacy Channel = the ADR 0035 aggregate as today.
2. `media_channel_create / _update`: accept `p_player_id` **and** legacy `p_device_ids` (≤ 1) —
   if both are sent and disagree, raise `Invalid input: player_id and device_ids disagree`; if only
   one is sent it wins; `p_device_ids` with more than one element is refused;
   `p_output_kind`, `p_display_config`; **`sync_enabled` in list/get = `c.sync_enabled OR EXISTS
   (synchronized group member)` until M2**; orientation derived from the canvas, `p_expected_orientation`
   ignored if sent. Canvas canonicalization (ADR §3): `multi` → server derives `expected_resolution`
   from `display_config` and refuses a disagreeing value; `single` → `display_config` must be NULL. `channel_validate`: single → keep orientation refusal; multi → skip
   (ADR §3). **`DROP FUNCTION IF EXISTS` every old signature first** (overload trap).
3. `media_channel_activate`: `channel_assert_committable` requires **at least one** Device until
   M1b (legacy n-device Channels keep activating with today's semantics); after M1b the
   `UNIQUE (channel_id)` index makes that exactly one. New create/update never accept more than one.
4. `media_channel_player_candidates(p_tenant_id)`: every asset with credentials +
   `registry_status`, `reserved_by_channel {id, name}`, health.
5. Groups: `media_channel_groups_list / _get / _create / _update / _delete / _set_members`,
   `media_channel_set_groups(p_channel_id, p_group_ids)` (D9). `_delete` refuses while any
   `publication_targets.group_id` references it, listing the publications. Tenant filter inside
   every function; REVOKE PUBLIC / GRANT service_role after each CREATE.
6. `media_job_poll`: `sync_enabled` → `c.sync_enabled OR EXISTS (member of synchronized group)`
   (transitional until M2 — a legacy synchronized Channel must not lose phase-lock between this
   deploy and M1b); `loop_anchor_at` untouched (ADR 0043).
7. Publication save/upsert: accepts `group_ids[]` and writes `target_type='group'` intent rows.
   `media_publication_activate`: expands group intent into `publish_job_targets` and writes
   `publication_snapshot_group_members`; guard per ADR §5 — resolve **all** intents to a Channel set
   first, then for every synchronized Group touched require all members present; separate rule
   refuses `device` targets in a synchronized Group. **Both refusals apply only to a first
   activation (no snapshot yet); a Publication with a snapshot republishes with a Group warning.**
   Error text names the group and the missing members. `direct_target_conflicts` on the Channel is
   populated from the Group warnings until M2.
8. `media_publication_get`: `drift_check` gains `groups: [{group_id, name, added[], removed[]}]`
   and each job target carries `via_groups: [name]`, resolved by `(snapshot_id, device_id)` from
   `publication_snapshot_group_members` — never by joining `channel_devices` at read time.
8b. Geometry source change (ADR §3): `media_channels_list` exposes the canvas; the frontend's
   `summarizeGeometryFit` and the step-5 Target Geometry Profile read the Channel canvas first and
   the Player's reported `WxH` only as fallback.
9. Routes: `channels/*` bodies (zod: resolution regex, `player_id`, `output_kind`,
   `display_config`); new `channel-groups/`, `channel-groups/[id]/`, `channel-groups/[id]/members`,
   `channels/[id]/groups`, `channels/player-candidates`; publications upsert accepts `group_ids`.
10. Verify over HTTP against develop with curl (old frontend still on the old fields must keep
    working; a legacy 3-device Channel still lists and activates); tsc gate on changed files only.

### Phase 2a — FE compat slice (deployed before M1b)

Smallest change that keeps Group intent round-tripping through the existing publications UI:

1. `PublicationTarget.target_type` gains `"group"` + `group_id`; `detail-mapping.ts` rehydrates
   `group_ids` alongside `channel_ids`; `draft-mapping.ts` writes both back (`channelIdsToTargets`
   → `targetsFromSelection`). **`device` targets keep today's behaviour**: not rehydrated, the
   operator re-picks (the comment in `detail-mapping.ts` stays true) — no `deviceIds` state, no
   Device chips. Bump the localStorage draft key version (memory: shape change).
2. Target step shows selected Groups as read-only chips with a count ("All Restaurant Screens ·
   3 channels") — no Groups tab/picker yet (that is Phase 5); the operator can remove a chip.
3. Channel list/detail render a legacy Channel with `player === null` and `devices.length > 1`
   exactly as today (`devices[]` still present).
4. One `.check.mts` asserting both halves: `channel + group` targets in → identical out, and a
   `device` target in → dropped from the selection (unchanged behaviour, now stated).
5. Verify in browser against Core v2 on develop. **Seed first** through Core v2: a Draft whose
   targets include at least one `group` row (and one `channel`). Then open it in the wizard → Save
   → reload → `GET /media/publications/:id` still shows the `group` row. A Channel-only Draft does
   not prove this seam and does not count.

### Phase 2b — M1b data rewrite (R0 on apply; only after Core v2 **and** the FE compat slice are deployed)

1. Data migration (ADR §7) — **pure data backfill, no RPC calls, query-driven**. Before apply: run
   the report query and show it for R0 approval — per Channel: name, status, `sync_enabled`, device
   count, channel-target rows, device-target rows; then the derived actions (kept as-is / split into
   N + Group). Inside one transaction, per Channel:
   - **1 device** → `UPDATE … SET output_kind = 'screen'`; nothing else.
   - **≥ 2 devices** → insert N Channels (`<channel> – <device>`) → move `channel_devices` → move
     reservations → create the Group + members (`playback_mode` from `sync_enabled`) → rewrite that
     Channel's `publication_targets` (channel → `group` intent) → for every existing
     `publication_snapshots` row of those publications, insert `publication_snapshot_group_members`
     from the old-device → new-Channel mapping → delete the old Channel row.
   - Finally `CREATE UNIQUE INDEX channel_devices_one_player ON media_core.channel_devices (channel_id)`.
   **Do not call `media_publication_activate`**: it would mint a new snapshot, a new job generation
   and a new `activated_at` for content already airing. `publish_jobs` / `publish_job_targets` are
   left untouched — they reference devices, which do not change.
2. Verify: schema dump diffed against the migration file; `media_job_poll` for the fixture devices
   returns the fixture with the **same** `snapshot_id` / job id as before the migration;
   `media_channels_list` (Core v2, already deployed) returns every Channel with `player` set and
   the Groups the report predicted; `media_publication_get` for the fixture Publication shows `via_groups`.

### Phase 3 — Frontend: Channels (D0–D8)

1. Types/api reshape (`types/index.ts`, `services/channels-api.ts`, `hooks/editor-mapping.ts`).
2. Create wizard modal, 3 steps, opened from list "Create Channel" (D3–D6); `/channels/create`
   route removed (memory: `rm -rf .next/dev/types` after deleting a route).
3. Step 2 Display Configuration + Player picker (D4, D5); publications `channels-logic.ts` geometry
   source switch (Phase 2 item 8b) — `display-config.ts` pure module with one
   `.check.mts` (canvas total from arrangement × per-screen resolution; Auto Map).
4. Edit page (D7, D8) reusing the wizard sections.
5. List page (D1, D2): tiles, columns, Status = health, detail panel with Channel Structure tree and
   Groups chips → D9 modal.
6. Verify in browser (ask which of the three verify options per CLAUDE.md §3 first).

### Phase 4 — Frontend: Channel Groups (D9, D11–D16)

1. Nav item "Channel Groups" under CHANNELS in `src/config/nav/media-workspace.tsx`; route
   `/media-workspace/channel-groups`, tabs Groups / Ungrouped.
2. Feature folder `channel-groups/`: list + inspector (D11/D12), create/edit modals (D14/D15),
   Manage Channels (D16), Ungrouped tab (D13), delete confirm listing what members air (D11 modal D).
3. D9 from the Channel detail panel.

### Phase 5 — Publications × Groups

1. Target step: "Channel Groups" tab (D11 modal A) — selection saves `group_ids` as intent on
   upsert; the server expands at activation.
2. Detail: "via <group>" per target from `via_groups`; drift finding "Group changed: +CH-x / −CH-y"
   from `drift_check.groups` → existing Republish.
3. Activation refusal message for the synchronized-group guard surfaced without leaking raw DB text.

### M2 — cleanup migration (own ticket, after Phase 5 is deployed)

Drop `channels.sync_enabled`, `channels.expected_orientation` input path, `channel_category`
writes, legacy `devices[]` / `p_device_ids`; RPCs drop the compatibility fields.

### Out of scope (do not start without a new decision)

Live View (D10, D17); `audio` Output Kind; player-reported outputs; Channel Type UI; any change to
ADR 0042 phase arithmetic; unifying `public.assets` with `public.devices` (ADR 0024).

---

## 3. Documents this plan touches

- `CONTEXT.md` — updated 2026-09-11 (Channel, Player, Output Kind, Display Configuration, Channel
  Group, Channel Type, Synchronized Playback, Publication).
- `docs/adr/0074-channel-one-player-and-channel-group.md` — accepted 2026-09-12 (rev 6).
- `docs/channels/v01/*` — historical; the monitoring plan's alerting sections remain valid, its
  Channel-membership sections are superseded by this file.
