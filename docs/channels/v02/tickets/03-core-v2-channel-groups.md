# 03: Core v2 — Channel Group RPCs and routes

**Repo:** Thunder_Core
**Blocked by:** 01
**Status:** ready-for-agent — GitHub [#100](https://github.com/rdThunderThailand/thunder_one_prj/issues/100)
**Recommended model / effort:** **mid tier, medium effort** — Claude Sonnet · GPT-5 at `reasoning: medium` / GPT-4.1 · Gemini 2.5 Flash-thinking. Why: greenfield RPCs with a fixed schema; the only subtle part (partial unique index behaviour) is already decided. Escalate to the frontier tier if a design fork appears (stop and ask, do not decide).

## What to build

Operators can create, edit, disable, delete Groups and set membership from either side (Group → Channels, Channel → Groups) through Core, with the one-synchronized-Group rule and the delete guard enforced server-side.

## Closing conditions

- [ ] RPCs `media_channel_groups_list / _get / _create / _update / _delete / _set_members`, `media_channel_set_groups(p_channel_id, p_group_ids)`; tenant filter in every function; REVOKE PUBLIC / GRANT service_role after each CREATE
- [ ] Adding a Channel to a second synchronized Group → refused by the partial unique index (error surfaced as `Invalid input`, names both Groups)
- [ ] Flipping a Group `independent → synchronized` while a member is synchronized elsewhere → refused atomically
- [ ] `_delete` refuses while any `publication_targets.group_id` references the Group, listing the Publications; unreferenced Group deletes and members become ungrouped
- [ ] Routes `channel-groups/`, `channel-groups/[id]/`, `channel-groups/[id]/members`, `channels/[id]/groups`; zod schemas
- [ ] HTTP verification with curl on develop covering each bullet above; tsc on changed files; SESSIONLOG

## Artifacts

- `docs/adr/0074-channel-one-player-and-channel-group.md` §5
- `docs/channels/v02/plan-channel-v02.md` §2 Phase 2 items 5, 9
- Mockups (contract they must serve): D11 `01 - Channel Group - UI Flow & Actions.png`, D14, D15, D16, D9 `00.4`
- CONTEXT.md: **Channel Group**, **Synchronized Playback**
