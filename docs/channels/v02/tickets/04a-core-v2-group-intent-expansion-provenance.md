# 04a: Core v2 — Group intent, expansion, provenance, `via_groups`, transitional sync read

**Repo:** Thunder_Core
**Blocked by:** 01, 03
**Status:** ready-for-agent — GitHub [#101](https://github.com/rdThunderThailand/thunder_one_prj/issues/101)
**Recommended model / effort:** **frontier reasoning tier, high effort** — Claude Opus (thinking on) · GPT-5 / o-series at `reasoning: high` · Gemini 2.5 Pro with thinking. Why: touches `media_publication_activate` and `media_job_poll`, the two functions that decide what real players play; provenance shape must match ADR §6 exactly

## What to build

One vertical slice: a Publication saved with `group_ids` stores `group` intent, activates by resolving every intent to a Channel set, expands Groups, freezes provenance in `publication_snapshot_group_members` (with `device_id`), writes `publish_job_targets` as today, and reads back `via_groups` per job target. `media_job_poll` and list/get read sync as `c.sync_enabled OR EXISTS (synchronized group member)` so no legacy Channel loses phase-lock before M1b. **No new refusals in this ticket** — the guard is 04b.

## Closing conditions

- [ ] Publication upsert accepts `group_ids[]` → `target_type='group'` rows; exact duplicate rejected by the M1a unique index; direct + via-Group both kept
- [ ] `media_publication_activate`: resolve all intents → Channel set → devices; one provenance row per (Group, member) with frozen `device_id`, `group_name`, `channel_name`, `playback_mode`; `publish_job_targets` written as today
- [ ] `media_publication_get`: each job target carries `via_groups[]` resolved by `(snapshot_id, device_id)` — verified by changing a member Channel's Player after activation and confirming `via_groups` does not move
- [ ] `media_job_poll` and `media_channels_list`: `sync_enabled` = `c.sync_enabled OR EXISTS (synchronized member)`; a legacy `sync_enabled=true` Channel with no Group still polls `sync_enabled=true`; `loop_anchor_at` derivation untouched (diff shows no change to ADR 0043 logic)
- [ ] HTTP verification on develop: seed Group `S` (C1+C2); Publication targeting `S` → 200 with two provenance rows; `GET` shows `via_groups=["S"]` on both job targets; poll for the legacy synchronized Channel still returns `sync_enabled=true`
- [ ] tsc on changed files; `DROP FUNCTION IF EXISTS` for changed signatures; REVOKE/GRANT after each CREATE; SESSIONLOG

## Artifacts

- `docs/adr/0074-channel-one-player-and-channel-group.md` §6 (three layers), §5 transitional read rule (Consequences), Context facts on activation/republish
- `docs/channels/v02/plan-channel-v02.md` §2 Phase 2 items 6, 7 (expansion part), 8 (`via_groups`), 9
- ADR 0045 (snapshot), ADR 0042/0043 (sync, anchor)
- Code: `Thunder_Core/supabase/migrations/20260909120000_equal_priority_publishes_with_a_warning.sql` (current activate body), `20260827120000_republish_and_drift_read.sql`, `20260824140000_loop_anchor_at.sql` (line reading `c.sync_enabled`), `src/app/api/core/v1/media/publications/**`
- Mockup: D1 right panel "via All Restaurant Screens"
