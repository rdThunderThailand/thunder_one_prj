# 11: FE — Manage Groups from a Channel (D9) and Groups chips in detail

**Repo:** thunder_one_prj
**Blocked by:** 10
**Status:** ready-for-agent — GitHub [#109](https://github.com/rdThunderThailand/thunder_one_prj/issues/109)
**Recommended model / effort:** **mid tier, low–medium effort** — Claude Sonnet · GPT-4.1 / GPT-5 `reasoning: low` · Gemini 2.5 Flash. Why: one modal and a chips refresh; smallest ticket in the set. Escalate if a design fork appears.

## What to build

From a Channel's detail panel the operator opens the D9 checklist "Select the channel groups for this channel", ticks/unticks Groups, saves via `channels/[id]/groups`, and the Groups chips and list column update.

## Closing conditions

- [ ] D9 modal with search, checklist, save; error when picking a second synchronized Group
- [ ] Groups chips in detail panel + Groups column reflect the change without reload
- [ ] Browser verification (ask first); SESSIONLOG

## Artifacts

- `docs/adr/0074-channel-one-player-and-channel-group.md` §5
- `docs/channels/v02/plan-channel-v02.md` §0 D9; §2 Phase 4 item 3
- Mockup: `00.4 - Mange Group Channel Modal.png`
- Route from ticket 03: `channels/[id]/groups`
