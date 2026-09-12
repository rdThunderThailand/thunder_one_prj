# Channel v02 — handoff overview

Read this first, then the ADR for rules and the plan for order. Status as of 2026-09-12: design and
plan complete after five review rounds; **nothing implemented, no migration written or applied, no
deploy**; ADR 0074 **accepted** 2026-09-12; tickets published as GitHub #98–#111 (Live View parked as #97).

| Document | Role |
| --- | --- |
| `docs/adr/0074-channel-one-player-and-channel-group.md` | rules: data model, sync, targeting, cutover; wins on model |
| `plan-channel-v02.md` | order of work, mockup binding D0–D17, current-state facts, out of scope |
| `tickets/README.md` | board; one file per ticket with closing conditions and artifacts |
| `CONTEXT.md` (repo root) | glossary: Channel, Player, Output Kind, Display Configuration, Channel Group, Publication |
| `design/*.png` | layout and wording source of truth (19 mockups) |
| `.docs/SESSIONLOG-channel-v02-design-2026-09-11.md` | review history rounds 1–5 |
| ADR 0030 / 0035 / 0039 / 0042 | carry a note under the title saying what 0074 supersedes |
| `../v01/*` | historical; membership sections superseded, alerting sections still valid |

## The shape

```
Channel Group (playback_mode: synchronized | independent; status: active | disabled)
├─ Channel A ── Player A ── single / multi-screen canvas
├─ Channel B ── Player B ── …
└─ Channel C ── Player C ── …

Publication
  → intent: channel | device | group rows in publication_targets (saved at upsert)
  → Core expands group → member Channels → Players at Activate
  → freezes provenance in publication_snapshot_group_members (FK on snapshot_id only)
  → publish_job_targets per Player (device_id), unchanged
```

Two core changes: **one Channel has one Player**; **Channel Group is the grouping and
synchronization boundary**.

## Channel

Business destination for Publications. `Draft → Active ↔ Inactive`. Draft may have no Player;
Active has exactly one. Stored in `channel_devices` (FK to assets becomes `ON DELETE RESTRICT`),
`UNIQUE (channel_id)` added at the end of M1b — not a new `player_id` column, because every RPC and
the reservation table already join `channel_devices`, so one index is the smaller change. A Device
may be the Player of many Drafts but is reserved by one Active Channel. Changing/removing the Player
is blocked while an Active/Scheduled Publication targets the Channel.

## Player

The Media Device of a Channel. Pickable when `registry_status = active` (set by the player's first
`/player/retrieve`) and not reserved by another Active Channel; never-connected and reserved
Devices are shown as unavailable with the reason, not hidden. The player reports one screen
dimension and no output count, so the UI never claims "outputs available".

## Output Kind, Channel Type, Location

Output Kind (`screen | tv | kiosk`; `audio` reserved, not offered) replaces Channel Category in the
wizard and new writes; the `channel_category` column stays until M2. Channel Type (LED / Menu
Board) leaves the wizard, `channel_type_id` becomes nullable in M1a, stays as a list filter.
Location stays optional — the mockup marks it required; this is a recorded deliberate deviation.

## Display Configuration

- **Single**: `display_config` is NULL; operator enters `expected_resolution` (any `WxH`);
  orientation derived. ADR 0039's refusal of a Player reporting the opposite orientation stands.
- **Multi**: `display_config` holds arrangement, screens, output mapping; the RPC derives
  `expected_resolution` and refuses a disagreeing value. No comparison with the Player's single
  monitor report.
- `expected_orientation` column is kept during transition and written by the RPC (derived), dropped
  in M2.
- Preview and Layout fit read the Channel canvas first, Player report as fallback — this is a
  **source change** vs ADR 0051/0055 and lands in the frontend in Phase 3 (`summarizeGeometryFit`,
  Target Geometry Profile). `5760x1080` is advisory declared geometry, not unknown.

## Status and health

Status column = Player health (Online / Warning / Offline / No player); lifecycle is a badge and
filter. Aggregate Channel Health and `Degraded` leave the model. **During transition** Core v2
still returns the ADR 0035 aggregate for a legacy n-device Channel until M1b splits it.

## Channel Group

Named n:m set of Channels with Playback Mode and stored status. A Channel is in at most one
synchronized Group — enforced by a copied `playback_mode` on the membership row, a composite FK
`ON UPDATE CASCADE`, and a partial unique index; flipping a Group to synchronized is rejected
atomically if a member is already synchronized elsewhere. Disable = hidden from the target picker
only. Delete = blocked while any `publication_targets` row references the Group (cancel does not
remove targets); remove/replace the Group in every Publication first. Mockup `00.4` = "from a
Channel, pick its Groups".

## Live data (queried 2026-09-12 — re-query before M1b)

**Prod holds nothing** (0 Channels, 0 devices with credentials, 0 targets, 0 jobs). **Develop is
the database real players report to**: 4 Channels / 5 devices — three single-device Channels (one
with `sync_enabled=true`, one Draft test row) and one two-device synchronized Channel with dozens
of legacy `device`-type targets. So M1b on develop is the real R0, and only one Channel is split.

## Synchronized Playback

Boundary moves to the Group. ADR 0042 phase arithmetic and ADR 0043 Schedule-derived
`loop_anchor_at` unchanged. Activate: resolve **all** intents (channel/device/group) to a Channel
set, then every synchronized Group touched must be fully present — an independent Group or a
direct target cannot bypass it; a direct `device` target inside a synchronized Group is refused by
a separate rule. **Grandfathering** has one verifiable definition: both refusals apply only to a
Publication's **first** activation (no snapshot yet); a Publication that has aired republishes with
a warning on the Group instead. `direct_target_conflicts` on the Channel is populated from those
warnings until M2. **Transitional read** until M2: `sync_enabled` = `channels.sync_enabled OR EXISTS
(synchronized Group member)`, so no legacy synchronized Channel loses phase-lock between the Core v2
deploy and M1b.

## Targeting: intent → frozen expansion → delivery

- Intent: `publication_targets` gains `group` + `group_id ON DELETE RESTRICT`. Exact duplicates
  rejected by a unique index; direct-and-via-Group and via-two-Groups are kept.
- Frozen: `publication_snapshot_group_members (snapshot_id FK, group_id, group_name,
  playback_mode, channel_id, channel_name, device_id)` — only `snapshot_id` is a FK.
- Delivery: `publish_job_targets.device_id` unchanged. `via_groups` resolves by
  `(snapshot_id, device_id)`, never through current `channel_devices`.
- Membership change after publish → nothing on air changes; drift `+CH / −CH`; Republish re-expands.

## Security

New tables follow `harden_media_core_rls`: RLS on, no client policies, `REVOKE` from PUBLIC / anon /
authenticated, access via SECURITY DEFINER RPCs that validate tenant on every row; FK indexes.

## Execution order

```
M1a schema-only → Core v2 (compatible) → FE compat slice → M1b data rewrite
→ Channels UI → Channel Groups UI → Publication Group targeting → M2 cleanup
```

DB migrations and Vercel deploys are never atomic with each other. Every apply is R0. Transitional
`player`: exactly one Device → `player`; otherwise `player = null` + honest `devices[]`; legacy
Channels keep activating until M1b. M1b is query-driven: a Channel that already has one Device is
kept as-is (only `output_kind` set); only n ≥ 2 Channels are split into a Group. FE compat slice round-trips `channel + group` intent only;
`device` targets keep today's drop-and-repick behaviour; browser verification must seed a Draft with
a real `group` target through Core v2.

## Out of scope

Live View (D10, D17), `audio`, player-reported outputs, Channel Type UI, ADR 0042 arithmetic,
unifying `public.assets` with `public.devices`.
