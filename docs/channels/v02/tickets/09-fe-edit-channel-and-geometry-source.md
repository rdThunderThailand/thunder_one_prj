# 09: FE — Edit Channel page (single/multi) and canvas-first geometry for preview/fit

**Repo:** thunder_one_prj
**Blocked by:** 08
**Status:** ready-for-agent — GitHub [#107](https://github.com/rdThunderThailand/thunder_one_prj/issues/107)
**Recommended model / effort:** **mid tier, medium effort** — Claude Sonnet · GPT-5 at `reasoning: medium` / GPT-4.1 · Gemini 2.5 Flash-thinking. Why: reuses ticket 08 sections; the geometry-source switch is a small, specified change. Escalate to the frontier tier if a design fork appears (stop and ask, do not decide).

## What to build

Editing a Channel reuses the wizard sections on the D7/D8 pages, and the Publication wizard's geometry fit (step 3/5) and Target Geometry Profile read the Channel's declared canvas first, falling back to the Player's reported size only when the canvas is unset — so a `5760x1080` multi-screen Channel previews as that canvas, not as unknown.

## Closing conditions

- [ ] D7 and D8 pages render from the same sections as the wizard; Player change blocked message when Active/Scheduled Publication targets the Channel (server error surfaced cleanly)
- [ ] `summarizeGeometryFit` and the step-5 profile grouping use Channel canvas → Player report → unknown, in that order; existing `.check.mts` for fit extended with a canvas-set and canvas-unset case
- [ ] Browser verification (ask first): edit a multi Channel, change arrangement, save; open Publication wizard step 5 with that Channel selected → profile shows `5760x1080`
- [ ] tsc + lint clean; SESSIONLOG

## Artifacts

- `docs/adr/0074-channel-one-player-and-channel-group.md` §3 (two geometry questions) and Consequences on ADR 0051/0055
- `docs/channels/v02/plan-channel-v02.md` §0 D7, D8; §2 Phase 2 item 8b, Phase 3 items 3–4
- Mockups: `00.3 - Edit Channel Page (single screen).png`, `(multi screen).png`
- ADR 0051, ADR 0055; code `src/features/media-workspace/publications/channels-logic.ts`, `src/features/media-workspace/channels/hooks/**`
