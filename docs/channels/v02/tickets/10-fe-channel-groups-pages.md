# 10: FE — Channel Groups pages (list, inspector, create/edit, manage channels, delete)

**Repo:** thunder_one_prj
**Blocked by:** 03, 07
**Status:** ready-for-agent — GitHub [#108](https://github.com/rdThunderThailand/thunder_one_prj/issues/108)
**Recommended model / effort:** **mid tier, medium effort** — Claude Sonnet · GPT-5 at `reasoning: medium` / GPT-4.1 · Gemini 2.5 Flash-thinking. Why: UI against fixed mockups and ticket 03's contract. Escalate to the frontier tier if a design fork appears (stop and ask, do not decide).

## What to build

A new "Channel Groups" nav item under CHANNELS opens `/media-workspace/channel-groups` with Groups and Ungrouped Channels tabs, tiles, the Group inspector with Create Program / Edit Group / Manage Channels / More, and the D14–D16 modals; Delete confirms with the referencing Publications and is blocked while any exist.

## Closing conditions

- [ ] Nav row + route; tabs, tiles and table columns per D12/D13; inspector per D11 §2 with actions A–D wired (Create Program → Publication create flow with the Group pre-selected — the flow itself is ticket 12)
- [ ] Create/Edit modal with Playback Mode radio; second-synchronized-Group and mode-flip refusals surfaced as readable errors
- [ ] Manage Channels modal (D16) with search + checklist
- [ ] Delete: lists referencing Publications and what members air; blocked while referenced; unreferenced deletes and members appear under Ungrouped
- [ ] Wording carried verbatim from mockups (plan §0)
- [ ] Browser verification (ask first) on develop: create sync Group, try to add a Channel already in another sync Group → error; disable → Group hidden from picker (verify in ticket 12 or via API)
- [ ] tsc + lint; files ≤ 300 lines; SESSIONLOG

## Artifacts

- `docs/adr/0074-channel-one-player-and-channel-group.md` §5; CONTEXT.md **Channel Group**, **Synchronized Playback**
- `docs/channels/v02/plan-channel-v02.md` §0 D11–D16; §2 Phase 4 items 1–2
- Mockups: `01 - Channel Group - UI Flow & Actions.png`, `01.1`, `01.2`, `01.2.1`, `01.3`, `01.4`
- Code: `src/config/nav/media-workspace.tsx`, new `src/features/media-workspace/channel-groups/`
