# 01: M1a — additive schema only

**Repo:** Thunder_Core
**Blocked by:** None (can start once ADR 0074 is marked accepted)
**Status:** ready-for-agent — GitHub [#98](https://github.com/rdThunderThailand/thunder_one_prj/issues/98)
**Recommended model / effort:** **mid tier, medium effort** — Claude Sonnet · GPT-5 at `reasoning: medium` / GPT-4.1 · Gemini 2.5 Flash-thinking. Why: the DDL is fully specified in ADR §5–§6 and plan Phase 1; the work is transcription + one R0 apply. Careful reading matters more than reasoning. Escalate to the frontier tier if a design fork appears (stop and ask, do not decide).

## What to build

One migration file that adds every new table, column, constraint and index Channel v02 needs while leaving every existing RPC, row and the deployed frontend behaving exactly as before. No table, column or row is removed or rewritten; two constraints are replaced (`channel_devices.device_id` FK action → RESTRICT, `expected_resolution` CHECK → free `WxH`). **No `UNIQUE (channel_id)`** — any legacy multi-device Channel would violate it.

## Closing conditions

- [ ] Migration file on `feat/channel-v02` contains: `channel_groups`, `channel_group_members` (copied `playback_mode`, composite FK `ON UPDATE CASCADE ON DELETE CASCADE`, partial unique `channel_group_members_one_sync`), `channels.output_kind` + `display_config`, `channel_type_id` nullable, `publication_targets` `group` type + `group_id ON DELETE RESTRICT` + one-ref CHECK + exact-duplicate unique index, `publication_snapshot_group_members` (FK on `snapshot_id` only), RLS enabled + REVOKE on all three new tables, FK indexes listed in plan Phase 1 §4b
- [ ] `expected_resolution` CHECK replaced by `^[1-9]\d{2,4}x[1-9]\d{2,4}$`; `channel_devices_device_id_fkey` recreated with `ON DELETE RESTRICT`
- [ ] **Apply is R0** — approval requested with the DDL summary; applied to develop via MCP; schema dumped back and diffed against the file (no drift)
- [ ] Every existing Channel/Publication RPC returns 200 with unchanged payload on develop (spot-check `media_channels_list`, `media_publication_get`, `media_job_poll` for the fixture devices)
- [ ] Deployed frontend (develop) opens Channels list and a Publication detail unchanged
- [ ] SESSIONLOG written; prod apply is a **separate** R0 approval

## Artifacts

- `docs/adr/0074-channel-one-player-and-channel-group.md` §1 (Player storage, FK), §2 (`output_kind`), §3 (`display_config`, CHECK), §5 (group schema, verbatim), §6 (intent + frozen tables, FK policy)
- `docs/channels/v02/plan-channel-v02.md` §1 current-state facts (re-verify first), §2 Phase 1 items 1–5, §2 cutover sequence
- Convention: `Thunder_Core/supabase/migrations/20260902150000_harden_media_core_rls.sql`; trap: `CREATE FUNCTION` grants PUBLIC (memory), overload trap not relevant here (no functions)
- Prior schema: `048_media_core_schema.sql`, `100_channel_core_schema.sql`, `20260825080838_publication_snapshot_materialization.sql`
