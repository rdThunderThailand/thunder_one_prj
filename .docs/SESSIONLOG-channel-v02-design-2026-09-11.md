# SESSIONLOG — Channel v02 design (grill-with-docs) — 2026-09-11

Branch: `feat/channel` (thunder_one_prj). Docs only — no code, no migration, nothing applied.

## What was decided

Grilling over `docs/channels/v02/design/*.png` in 3 rounds (Q1–Q21). Outcome recorded in
`docs/adr/0074-channel-one-player-and-channel-group.md`; execution order in
`docs/channels/v02/plan-channel-v02.md` §2; mockup → implementation binding in plan §0.

Headline: Channel = exactly one Player (0..1 while Draft) · Output Kind (screen/tv/kiosk) replaces
Category · Display Configuration = advisory jsonb on top of `expected_*` · Channel Group is the new
sync boundary, n:m with ≤1 synchronized group per channel · Group is stored intent, expanded at activation into a frozen
`publication_snapshot_group_members` (with `device_id`) for "via <group>" + drift → existing Republish · prod 2→6
channels + 2 groups by migration.

## Facts found (not decisions)

- Device "activation" already exists: `registerAsset` → `registry_status='pending'`;
  `/api/v0.1/player/retrieve` → `'active'` on first contact. Only gap: `media_screens_list` ignores
  it, so never-connected devices are offered in the picker today.
- Player reports one `screen_dimension`; no outputs count → "3 outputs available" is not buildable.
- Republish + drift detection already exist on `PublicationDetailPage`.

## Files touched

- `CONTEXT.md` — Synchronized Playback, Channel, **Player**, **Output Kind**, **Display
  Configuration**, **Channel Group** (new), Channel Type rewritten; Channel Category and Channel
  Health removed; Publication gains group-expansion sentence.
- `docs/adr/0074-channel-one-player-and-channel-group.md` — new.
- `docs/adr/0030`, `0042`, `0035`, `0039` — supersession/amendment note under the title.
- `docs/channels/v02/plan-channel-v02.md` — new.

## Review round (same day) — fix-then-ship, applied

Reviewer findings accepted and folded into ADR rev 2 + plan:

- Group intent: `publication_targets.target_type='group'` + `group_id` saved at upsert; frozen
  expansion in new `publication_snapshot_group_members`; `source_group_id` column dropped from the
  design. Delete Group → **blocked** while referenced (reverses grilling Q12, follows mockup D).
- Display Configuration: `expected_resolution` becomes free `WxH`, orientation derived;
  single-screen keeps ADR 0039 refusal, multi-screen skips the comparison (ADR 0039 partially
  superseded, note added).
- Sync constraint fixed as copied `playback_mode` + composite FK `ON UPDATE CASCADE` + partial
  unique index; guard covers device targets too; `loop_anchor_at` scope claim removed.
- `channel_devices.device_id` FK → `ON DELETE RESTRICT`; Player stored via `UNIQUE (channel_id)`.
- Cutover sequence M1 → Core v2 (compatible) → FE → M2 cleanup; every apply is R0.
- ADR status → proposed; ADR 0030 note corrected; CONTEXT.md Group `_Avoid_` wording fixed;
  "Program" label rule extended to D1/D11 pages; design-evidence vs rationale labelled per rule.

## Review round 2 — applied (2026-09-12)

- `publication_snapshot_group_members` freezes `device_id` (+ `channel_name`) so `via_groups`
  resolves by `(snapshot_id, device_id)`, never via `channel_devices`.
- M1 backfills provenance directly; never calls `media_publication_activate`; existing jobs untouched.
- Geometry split: Channel↔Player validation reads Player report; preview/fit read the Channel
  canvas with Player fallback (source change vs ADR 0051/0055 recorded).
- Delete Group: "remove/replace the Group in every referencing Publication" (cancel doesn't help).
- New tables: RLS on, REVOKE, tenant validation in RPCs, FK indexes listed.
- Exact-duplicate intent rows rejected by unique index; direct-vs-group and group-vs-group kept.
- ADR stays `proposed` independent of migration approval; plan/CONTEXT/SESSIONLOG wording aligned;
  `channel_category` column name corrected; `p_player_id` vs `p_device_ids` conflict rule defined.

## Review round 3 — applied (2026-09-12)

- Cutover split: M1a schema-only → Core v2 (reads legacy multi-device Channels + group intent) →
  M1b data rewrite (+ `UNIQUE(channel_id)` last) → FE → M2. Reason: today's activate expands only
  channel/device intents, so a `group` row before Core v2 would mint an Active Publication with no
  job targets.
- Guard: resolve all intents to a Channel set, then require every touched synchronized Group to be
  fully present; direct-device rule kept separately.
- `publication_snapshot_group_members`: FK on `snapshot_id` only; other ids/names frozen, no FK.
- Multi canvas: RPC derives `expected_resolution` from `display_config`, refuses mismatch; single
  requires `display_config` NULL.
- Nit: `channel_device_health` removed from the readers list (it takes only a heartbeat).

## Review round 4 — applied (2026-09-12)

- M1a cleared for writing. New **Phase 2a FE compat slice** before M1b: publications UI reads,
  rehydrates and writes back `group` intent (types, detail-mapping, draft-mapping + draft key bump),
  legacy n-device Channels still render. Reason: today's UI keeps only `channel` targets; a Draft
  rewritten to `group` would reopen empty and the next Save would erase it.
- Transitional `player`: exactly one Device → `player`; otherwise `player = null` + `devices[]`;
  legacy Channels keep activating until M1b.
- M1a wording: "no table, column or row removed or rewritten" (two constraints are replaced).

## Review round 5 — applied (2026-09-12)

- Phase 2a scope fixed: round-trip `channel + group` only; `device` targets keep today's
  drop-and-repick behaviour; the check asserts both; browser verify must seed a Draft with a real
  `group` target via Core v2 first.
- M1a cleared to write. Plan is now execution-only once the owner marks ADR 0074 accepted.

## Handoff docs + tickets (2026-09-12)

- `docs/channels/v02/README.md` — overview with the four omissions the user's summary missed
  (grandfathered sync warnings on the Group, transitional `expected_orientation` / nullable
  `channel_type_id`, FE geometry-source switch in Phase 3, transitional aggregate health).
- `docs/channels/v02/tickets/` — 13 ticket files + board, each with closing conditions and
  artifacts. Status `proposed`; not published to GitHub (R0, waiting for go).

## Ticket scrutiny — applied (2026-09-12)

Facts re-queried (read-only) on both projects:

- prod `sfiefevtxalqjizdkcsw`: channels 0, channel_devices 0, publication_targets 0, publish_jobs 0,
  assets with credentials 0.
- develop `ftfmokgphewzyxzwjitv`: `Channel for Screen 1` (active, sync, 1 dev, 20 ch-targets /
  32 dev-targets), `Channel for Screen 2` (active, 1 dev, 5 / 13), `Channel for Screen 3-4`
  (active, sync, **2 dev**, 9 / 33), `zz-uitest-sync-on` (draft, 1 dev, 0 / 32).
- My "2 channels / 6 devices" came from the v01 plan's 2026-08-19 snapshot without re-querying —
  NO MAGIC violation, corrected everywhere.

Decisions (F1/F2 accepted as recommended) and fixes:

- F1: single-device Channels are kept as-is (`output_kind` only); only n ≥ 2 are split into a
  Group. M1b is query-driven; documents carry no hardcoded counts.
- F2: grandfathering = refusals apply to first activation only (no snapshot); aired Publications
  republish with a Group warning. No `synchronized_at` column.
- Transitional sync read `c.sync_enabled OR EXISTS(group)` in poll + list until M2 (closes the
  phase-lock gap between Core v2 deploy and M1b).
- `direct_target_conflicts` populated from Group warnings until M2 (02/04 consistent).
- Ticket 04 split into 04a (intent/expansion/provenance/via_groups/transitional read) and 04b
  (guard/grandfather/drift); 07 blocked by "02 deployed"; frontier diagram replaced by prose.
- Publishing target: all issues in `thunder_one_prj`, Core tickets labelled `repo:core`.
- develop is the live DB → its M1b apply is the real R0; prod is empty today.

## Model guidance + Live View parking (2026-09-12)

- Every ticket carries a model-agnostic **Recommended model / effort** line (frontier/high vs
  mid/medium vs mid/low, with Claude / OpenAI / Google equivalents and the reason); board gains a
  tier column and legend. Frontier tier: 02, 04a, 04b, 06, 13.
- Live View was in no ticket → added `14-live-view-parked.md` (parked, needs its own
  grill-with-docs; not part of the publish); ticket 07 renders D1's "Open Live View" disabled.
- Residual from the verification pass fixed: lone-player `sync_enabled` is not a pure no-op
  (poll still sends it) → ADR §7 wording + precondition in ticket 13.

## Live View issue published (2026-09-12)

- thunder_one_prj#97 created on request: parked Live View with phase-by-phase approach guidance,
  facts, closing conditions for the design session. Labels `documentation`, `enhancement`
  (deliberately **not** `ready-for-agent`). Tickets 01–13 still unpublished.

## Published (2026-09-12)

- ADR 0074 marked **accepted** by the owner ("publish เลย").
- GitHub issues #98–#111 = tickets 01–13, created blockers-first so "Blocked by" carries real
  issue numbers; labels `ready-for-agent`, `channel-v02`, `repo:core` (Core work). Board and every
  ticket file link their issue. #97 = Live View (parked).

## Not done / next

- Next: fresh session (clear context) on Thunder_Core, branch `feat/channel-v02` from `develop`, work #98 (M1a). Mid tier model is enough; apply is R0.
- The design docs on `feat/channel` are still uncommitted — commit when told.
- M1a apply on develop is R0; M1b apply on develop is the real R0 (develop is the live DB) — approval with the query-driven report.
- Pre-existing uncommitted changes in the tree (`AGENTS.md`, `docs/channels/v01/` move) are not
  part of this session; do not stage them with the design docs.
