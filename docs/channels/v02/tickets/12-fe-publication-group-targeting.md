# 12: FE — Publication targets Channel Groups; via-group and drift on detail

**Repo:** thunder_one_prj
**Blocked by:** 05, 10
**Status:** ready-for-agent — GitHub [#110](https://github.com/rdThunderThailand/thunder_one_prj/issues/110)
**Recommended model / effort:** **mid tier, medium effort** — Claude Sonnet · GPT-5 at `reasoning: medium` / GPT-4.1 · Gemini 2.5 Flash-thinking. Why: UI wiring of 04a/04b contracts; the tricky semantics are already server-side. Escalate to the frontier tier if a design fork appears (stop and ask, do not decide).

## What to build

In the Publication create flow the Target step gains the "Channel Groups" tab (D11 modal A); a Group pre-selected from the Group inspector arrives ticked; the detail page shows "via <group>" per target, the "Group changed: +CH / −CH" drift finding next to the existing ones, and the synchronized-Group refusal from activation as a readable message.

## Closing conditions

- [ ] Target step tabs Channels / Channel Groups / All Channels; disabled Groups absent from the picker; selection saved as `group_ids` intent (server expands)
- [ ] Detail: `via_groups` rendered; `drift_check.groups` → drift finding → existing Republish
- [ ] Activation refusal (incomplete synchronized Group) surfaced with Group name and missing members, no raw DB text
- [ ] `.check.mts` for drift finding mapping
- [ ] Browser verification (ask first) on develop: the ticket-04b scenario end to end (target `A` → error naming `S`; target `S` → activates; add member → drift → Republish clears)
- [ ] tsc + lint; SESSIONLOG

## Artifacts

- `docs/adr/0074-channel-one-player-and-channel-group.md` §5, §6; CONTEXT.md **Publication** (Program label note)
- `docs/channels/v02/plan-channel-v02.md` §0 D11 modal A, Program wording; §2 Phase 5
- Mockups: `01 - Channel Group - UI Flow & Actions.png` (A), `00 - All Channels.png` right panel
- Code: `src/features/media-workspace/publications/**` (`PublicationDetailPage.tsx`, `publication-drift.ts`, `channels-logic.ts`)
