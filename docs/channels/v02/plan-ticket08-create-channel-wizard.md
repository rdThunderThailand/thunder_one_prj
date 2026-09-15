# Plan: ticket 08 — Create Channel wizard (Core v2)

Executes `tickets/08-fe-create-channel-wizard.md` + plan §0 D0, D3–D6 deviations. Branch:
`feat/channel`. Risk: R1. Continues straight into 09–12 on the same branch per user instruction —
one combined PR for thunder_one_prj at the end, not per ticket.

## Facts confirmed against Thunder_Core source this session — do not re-derive

- **Bug fixed (not a fork):** `display_config.arrangement` is `{rows, cols}`, not a string
  (`media_core.channel_canvas`, `20260913230000_channel_v02_core_v2_channel_rpcs.sql`). Ticket 07's
  type/parser/fixtures were wrong (never exercised — no live Channel has `display_config` yet) and
  are fixed as part of this session, before writing the wizard.
- Canvas derivation is exact: `resolution = (cols*w)x(rows*h)`, `orientation = width>=height ?
  landscape : portrait`. The RPC refuses a supplied `expected_resolution` that disagrees — the
  wizard must compute and send the same value, never let the user type it for multi.
- `POST /media/channels` (`media_channel_create`) accepts (all confirmed from the function
  signature): `name`, `description`, `location_id`, `player_id`, `output_kind`
  (`screen`|`tv`|`kiosk`), `expected_resolution` (single only), `display_config` (multi only,
  `null` for single — sending both is a refusal), `confirm_mismatch`, `as_draft`. No
  `channel_type_id`/`category` needed — server defaults `category` to `dooh` silently when omitted.
  **Decision (low-stakes, not asked):** always send `confirm_mismatch: true` and `as_draft: false`
  — the wizard has no mismatch-confirmation UI or draft-save button (D3–D6 don't show one; D0's Key
  Points say "Create channel and return to All Channels").
- `GET /media/channels/player-candidates` (`media_channel_player_candidates`) is live and already
  returns exactly what D5 needs: `id, name, code, model, location, registry_status,
  never_connected, health, last_heartbeat_at, orientation, resolution, reserved_by_channel
  {id,name}`. **Available** = `!never_connected && reserved_by_channel === null` (frontend-computed
  — the RPC returns every candidate, ungrouped, per its own comment). No `outputs` field exists —
  confirmed live (`/api/proxy/media/channels/player-candidates` on local `:3001`, already Core v2 +
  M1b data).
- **Design fork resolved by the user:** D4/D5's "Map Displays to Outputs" dropdown has no backend
  data source (no reported outputs). Decision: auto-label each screen `Output 1`, `Output 2`, … by
  index (Auto Map), rendered as an editable text field per screen, never claiming "detected".
- **Verification constraint, flag before step 8's browser test:** every player-candidate on the
  current `:3001` seed is either `reserved_by_channel` (4, one per existing Channel) or
  `never_connected` (4 fake assets) — **zero currently Available**. A true end-to-end multi-Player
  creation cannot be verified without either freeing a Player (deactivating an existing seeded
  Channel — R0-ish, ask first) or seeding a new connected-and-unreserved asset. Note this in the
  SESSIONLOG rather than silently skipping or silently mutating seed data.

## Files

- **Fix (already done):** `types/index.ts` (`ChannelDisplayArrangement`), `services/channels-api.ts`
  (`parseChannelDisplayArrangement`), `channel-logic.check.mts`,
  `services/channels-api-contract.check.mts`, `display-structure.check.mts`.
- **New pure logic:** `display-config.ts` + `.check.mts` (arrangement options, `canvasResolution`,
  `autoMapScreens`) — the ticket's required check. `player-candidates.ts` + `.check.mts`
  (Available/Unavailable bucketing + reason text — has real branching, worth its own check).
  `create-wizard-state.ts` (draft type, defaults, per-step guards — trivial, no check).
- **New services:** `services/player-candidates-api.ts` (fetch+parse), `services/create-channel-api.ts`
  (`createChannelV2` — new body shape, does not touch the legacy `createChannel`/`ChannelDraftInput`
  used by Edit until ticket 09 replaces it).
- **New components** (`components/create-wizard/`): `CreateChannelModal.tsx` (orchestrator, uses
  `Modal` size `xl`), `Step1ChannelInfo.tsx`, `Step2Setup.tsx`, `PlayerPickerField.tsx` (D5),
  `OutputMappingTable.tsx`, `Step3Review.tsx`, `CreateChannelSuccessCard.tsx`.
- **Changed:** `ChannelsListPage.tsx`'s "Create Channel" button opens the modal instead of linking
  to `/channels/create`.
- **Removed:** `app/.../channels/create/` route + page. `rm -rf .next/dev/types` after (memory: stale
  route types hide tsc errors).

## Not in this ticket

Edit Channel page reshape (09, reuses these wizard sections). Channel Groups (10). Live View.
