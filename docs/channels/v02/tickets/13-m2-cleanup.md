# 13: M2 — cleanup migration and contract contraction

**Repo:** Thunder_Core + thunder_one_prj
**Blocked by:** 06, 09, 11, 12 (all deployed)
**Status:** ready-for-agent — GitHub [#111](https://github.com/rdThunderThailand/thunder_one_prj/issues/111)
**Recommended model / effort:** **frontier reasoning tier, high effort** — Claude Opus (thinking on) · GPT-5 / o-series at `reasoning: high` · Gemini 2.5 Pro with thinking. Why: irreversible drops on the live database; the consumer sweep and the lone-player sync question need judgment

## What to build

Remove the compatibility layer once nothing reads it: drop `channels.sync_enabled`, stop writing `channel_category`, drop `expected_orientation` as an input path, remove legacy `devices[]` / `p_device_ids` / `direct_target_conflicts` from RPCs and routes, and delete the matching frontend fallbacks.

## Closing conditions

- [ ] Before dropping `sync_enabled`: list single-device Channels with the flag `true` (on develop today: `Channel for Screen 1`); confirm from the player code that a lone player ignores `sync_enabled`/`loop_anchor_at`, or move each such Channel into a one-member synchronized Group first so poll output does not flip `true → false` silently
- [ ] Consumer sweep documented: grep across both repos shows no reader of each removed field before the drop
- [ ] Migration file; **apply is R0** develop then prod; schema dump diff
- [ ] RPC signatures changed with `DROP FUNCTION IF EXISTS`; routes/zod updated; frontend types drop legacy fields; tsc on changed files
- [ ] HTTP + browser smoke (ask first): list, create, activate, publish to a Group still work
- [ ] ADR 0074 Consequences updated to say M2 landed; SESSIONLOG

## Artifacts

- `docs/adr/0074-channel-one-player-and-channel-group.md` §2, §3, §5, §7 (what is deferred to cleanup)
- `docs/channels/v02/plan-channel-v02.md` §2 M2
- Memory: `CREATE FUNCTION` grants PUBLIC → re-REVOKE after every recreate
