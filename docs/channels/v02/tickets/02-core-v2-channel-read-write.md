# 02: Core v2 — Channel read/write with Player, Output Kind, Display Configuration

**Repo:** Thunder_Core
**Blocked by:** 01
**Status:** ready-for-agent — GitHub [#99](https://github.com/rdThunderThailand/thunder_one_prj/issues/99)
**Recommended model / effort:** **frontier reasoning tier, high effort** — Claude Opus (thinking on) · GPT-5 / o-series at `reasoning: high` · Gemini 2.5 Pro with thinking. Why: several existing RPCs change signature at once (overload trap), transitional `player` and canonicalization rules must hold simultaneously, and a mistake breaks the deployed frontend

## What to build

`media_channels_list / _get / _create / _update / _activate` understand the one-Player model while still serving legacy n-device Channels: responses carry both old fields (`devices[]`, `sync_enabled`, `category`, `direct_target_conflicts`) and new (`player`, `output_kind`, `display_config`, `groups[]`, `health`); writes accept `p_player_id` and legacy `p_device_ids` (≤ 1). Canvas canonicalization and the single/multi orientation rule live here. New `media_channel_player_candidates` RPC + route feeds the picker with unavailable reasons.

## Closing conditions

- [ ] Transitional `player`: exactly one Device → `player`; any other count → `player = null` and `devices[]` as-is (never the first Device)
- [ ] `p_player_id` and `p_device_ids` both sent and disagreeing → `Invalid input: player_id and device_ids disagree`; `p_device_ids` length > 1 refused; old signatures `DROP FUNCTION IF EXISTS` first
- [ ] `multi`: `expected_resolution` derived from `display_config`, disagreeing input refused; `single`: `display_config` must be NULL; `expected_orientation` written derived, ignored as input; `channel_validate` refuses opposite orientation for single only
- [ ] `channel_assert_committable` requires ≥ 1 Device (until M1b)
- [ ] **Transitional sync read**: list/get `sync_enabled` = `c.sync_enabled OR EXISTS (synchronized group member)` — a legacy `sync_enabled=true` Channel still reads `true` before any Group exists (checked over HTTP)
- [ ] `media_channel_player_candidates` returns every credentialed asset with `registry_status`, `reserved_by_channel {id,name}`, health; REVOKE PUBLIC / GRANT service_role
- [ ] HTTP verification with curl against develop: legacy 2-device Channel lists (`player = null`) and activates; new single Channel create → `player` set; multi create with wrong `expected_resolution` → 400; both-params-disagree → 400
- [ ] tsc on changed files only; zod `resolutionSchema` → regex; SESSIONLOG

## Artifacts

- `docs/adr/0074-channel-one-player-and-channel-group.md` §1, §2, §3, §4
- `docs/channels/v02/plan-channel-v02.md` §2 Phase 2 items 1–4, 9–10; §1 facts (RPC inventory)
- Mockups: D4 `00.2.2 …Step - 2.png`, D5 `00.2.2.1 … select player.png` (what the candidates RPC must be able to render)
- Code: `Thunder_Core/supabase/migrations/101_channel_core_functions.sql` (`channel_validate`, `channel_set_devices`), `103_channel_derived_status.sql`, `src/app/api/core/v1/media/channels/**`, `channels/schema.ts`, `public.media_screens_list` (056)
- Memory: `CREATE OR REPLACE` with new params = overload trap; tsc never clean repo-wide
