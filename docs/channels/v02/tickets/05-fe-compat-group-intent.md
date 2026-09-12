# 05: FE compat slice — Group intent round-trips through the existing Publication UI

**Repo:** thunder_one_prj
**Blocked by:** 02, 04a (deployed to develop)
**Status:** ready-for-agent — GitHub [#103](https://github.com/rdThunderThailand/thunder_one_prj/issues/103)
**Recommended model / effort:** **mid tier, medium effort** — Claude Sonnet · GPT-5 at `reasoning: medium` / GPT-4.1 · Gemini 2.5 Flash-thinking. Why: small, well-scoped frontend mapping change with an explicit check and browser script. Escalate to the frontier tier if a design fork appears (stop and ask, do not decide).

## What to build

Before any data is rewritten, the current Publication wizard/detail can open a Draft that carries `group` targets, show them as read-only removable chips, and Save without losing them; legacy n-device Channels still render. No Group picker, no Channel Groups screens.

## Closing conditions

- [ ] `PublicationTarget.target_type` gains `"group"` + `group_id`; detail mapping rehydrates `group_ids` with `channel_ids`; draft mapping writes both back; localStorage draft key version bumped
- [ ] `device` targets keep today's behaviour (not rehydrated; operator re-picks) — the existing comment stays true
- [ ] Target step shows Group chips "`<name>` · n channels" with remove; no picker
- [ ] Channel list/detail render `player === null` + `devices.length > 1` as today
- [ ] One `.check.mts`: channel+group in → identical out; device in → dropped
- [ ] Browser verification (ask the 3-option question first): **seed via Core v2** a Draft with ≥ 1 `group` and 1 `channel` target → open wizard → Save → reload → `GET /media/publications/:id` still has the `group` row. Channel-only Draft does not count
- [ ] tsc clean (after `rm -rf .next/dev/types` if routes changed); SESSIONLOG

## Artifacts

- `docs/adr/0074-channel-one-player-and-channel-group.md` §6, §7 (why this slice exists)
- `docs/channels/v02/plan-channel-v02.md` §2 Phase 2a
- Code: `src/features/media-workspace/publications/types/index.ts`, `detail-mapping.ts`, `draft-mapping.ts` (`channelIdsToTargets`), `channels-logic.ts`
- Memory: draft shape change → bump key; ESLint no sync setState in effects
