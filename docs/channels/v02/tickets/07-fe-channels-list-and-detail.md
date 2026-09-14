# 07: FE — All Channels list, Status = Player health, detail panel

**Repo:** thunder_one_prj
**Blocked by:** 02 (deployed to develop — the frontend talks to the deployed Core, not local code)
**Status:** ready-for-agent — GitHub [#105](https://github.com/rdThunderThailand/thunder_one_prj/issues/105)
**Recommended model / effort:** **mid tier, medium effort** — Claude Sonnet · GPT-5 at `reasoning: medium` / GPT-4.1 · Gemini 2.5 Flash-thinking. Why: UI work against a fixed mockup and a fixed API contract; volume, not depth. Escalate to the frontier tier if a design fork appears (stop and ask, do not decide).

## What to build

The Channels list matches D1/D2: stat tiles (Total / Online / Warning / Offline / Groups), columns Channel · Type · Status · Location · Groups · Now Playing · Actions, Status showing Player health with `No player` for Player-less Drafts, lifecycle as badge/filter, and a right-hand detail panel with Status, Now Playing ("via <group>"), Channel Structure tree, Groups chips, Channel Information. Types/api layer reshaped to the Core v2 contract.

## Closing conditions

- [ ] Types/api/hook mapping consume `player`, `output_kind`, `display_config`, `groups`, `health`; legacy `devices[]` still tolerated
- [ ] Every control and label on D1/D2 present with mockup wording; deviations only those listed in plan §0
- [ ] Status column = health incl. `No player`; `Degraded` nowhere in UI or types; lifecycle filter still works
- [ ] "Open Live View" on D1 is rendered disabled with a tooltip (Live View is ticket 14, parked) — not removed, so the layout matches the mockup
- [ ] Channel Structure tree renders Player → screens from `display_config` (single = one node)
- [ ] Browser verification (ask first) against develop Core v2: list, filter, open detail for a single and a legacy/multi Channel; screenshot per mockup
- [ ] tsc + lint clean; file ≤ 300 lines each; SESSIONLOG

## Artifacts

- `docs/adr/0074-channel-one-player-and-channel-group.md` §4; CONTEXT.md **Channel**, **Player**
- `docs/channels/v02/plan-channel-v02.md` §0 D1, D2; §1 thunder_one_prj keep/replace list; §2 Phase 3 items 1, 5
- Mockups: `00 - All Channels.png`, `00.1 - All Channels More Action.png`
- Code: `src/features/media-workspace/channels/**` (list/filter/api/detail), `src/lib/display-resolution.ts`
- Memory: hard-nav to nested route renders empty main — click sidebar when verifying
