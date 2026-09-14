# 06: M1b — split legacy Channels, create Groups, rewrite intent, backfill provenance

**Repo:** Thunder_Core
**Blocked by:** 02, 03, 04a, 04b, 05 (all deployed and verified)
**Status:** ready-for-agent — GitHub [#104](https://github.com/rdThunderThailand/thunder_one_prj/issues/104)
**Recommended model / effort:** **frontier reasoning tier, high effort** — Claude Opus (thinking on) · GPT-5 / o-series at `reasoning: high` · Gemini 2.5 Pro with thinking. Why: one-shot data rewrite on the live database with no rollback; the pre-apply report and the per-Channel branching must be reasoned about, not pattern-matched

## What to build

Every legacy Channel ends up one-Player: a Channel that already has exactly one Device is kept as-is (only `output_kind` set); a Channel with two or more Devices is split into one Channel per Device inside a new Group carrying its `sync_enabled` as Playback Mode, its Publication intents rewritten to `group`, and its existing snapshots given provenance rows. The fixture on Screen 01/03 keeps airing with the same snapshot and job ids. Pure data backfill — no RPC calls, **query-driven** — ending with `UNIQUE (channel_id)`. As of 2026-09-12 that means one split (the 2-device Channel on develop); the report at apply time is the truth.

## Closing conditions

- [ ] Pre-apply report (a `SELECT` run at that moment) shown for R0 approval: per Channel name / status / sync / device count / channel-target rows / device-target rows, and the derived action (keep vs split into N + Group), generated names, count of intents to rewrite, count of provenance rows to insert
- [ ] One transaction, per Channel: 1 device → `output_kind='screen'` only; ≥2 devices → insert Channels → move `channel_devices` → move reservations → Group + members → rewrite intents → backfill `publication_snapshot_group_members` from old-device → new-Channel mapping → delete old Channel row; finally `CREATE UNIQUE INDEX channel_devices_one_player`
- [ ] **Never calls `media_publication_activate`**; `publish_jobs` / `publish_job_targets` untouched — verified by comparing ids before/after
- [ ] `media_job_poll` for fixture devices returns the same `snapshot_id` / job id as before; `media_channels_list` shows every Channel with `player` set and the Groups the report predicted; `media_publication_get` for the fixture shows `via_groups`
- [ ] Real player on Screen 01/03 still plays the fixture (user confirms)
- [ ] **develop is the live DB** (real players report there; prod holds no Channels or devices as of 2026-09-12) — its apply is the real R0. Prod apply is a separate R0 only if prod has rows by then (re-query); schema dump diff; SESSIONLOG

## Artifacts

- `docs/adr/0074-channel-one-player-and-channel-group.md` §7
- `docs/channels/v02/plan-channel-v02.md` §2 Phase 2b; §1 live rows fact
- Report query (adapt): the per-Channel query in SESSIONLOG 2026-09-12 (name, status, sync_enabled, device count, channel/device target counts)
- Memory: fixture airs until 2026-10-08, don't clean up; migration CLI broken → MCP apply; check objects not migration names on prod
- Constraint to respect: `channels_tenant_id_name_key`
