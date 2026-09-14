# 08: FE — Create Channel wizard (3 steps) with Display Configuration and Player picker

**Repo:** thunder_one_prj
**Blocked by:** 07
**Status:** ready-for-agent — GitHub [#106](https://github.com/rdThunderThailand/thunder_one_prj/issues/106)
**Recommended model / effort:** **mid tier, medium effort** — Claude Sonnet · GPT-5 at `reasoning: medium` / GPT-4.1 · Gemini 2.5 Flash-thinking. Why: the only logic is `display-config.ts` (arrangement × resolution, Auto Map) with its own check; the rest is mockup transcription. Escalate to the frontier tier if a design fork appears (stop and ask, do not decide).

## What to build

"Create Channel" on the list opens the D3–D6 modal: step 1 Output Kind icon buttons (Screen / TV / Kiosk), Name, optional Location, Description; step 2 Display Mode single/multi, Arrangement, per-screen resolution with computed canvas total and preview strip, Player select with Available/Unavailable groups and reasons, output mapping with Auto Map; step 3 review → Create → success card. The `/channels/create` route goes away.

## Closing conditions

- [ ] `display-config.ts` pure module (canvas total from arrangement × per-screen; Auto Map) with one `.check.mts`
- [ ] Player picker uses `player-candidates`; unavailable reasons "never connected" / "in use by CH-x"; no "outputs available"
- [ ] PA/Audio not offered; no Channel Type dropdown; Location optional; all other D3–D6 controls and wording present
- [ ] Multi: client sends `display_config` + computed `expected_resolution`; server agreement confirmed (a deliberately wrong value → visible error, not raw DB text)
- [ ] Route `channels/create` removed; `rm -rf .next/dev/types` then tsc clean
- [ ] Browser verification (ask first): create one single and one 1×3 multi Channel end-to-end against develop; success card → View Channel lands on detail; screenshots per step
- [ ] SESSIONLOG

## Artifacts

- `docs/adr/0074-channel-one-player-and-channel-group.md` §1, §2, §3
- `docs/channels/v02/plan-channel-v02.md` §0 D0, D3–D6 + deviations list; §2 Phase 3 items 2–3
- Mockups: `00 - Create Channel MVP Flow.png`, `00.2.1`, `00.2.2`, `00.2.2.1`, `00.2.3`
- CONTEXT.md **Output Kind**, **Display Configuration**, **Player**
- Memory: stale `.next` route types hide tsc errors
