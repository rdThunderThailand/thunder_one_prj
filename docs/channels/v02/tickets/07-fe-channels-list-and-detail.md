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

## Deviations and data sources decided 2026-09-14 (grilling session, owner confirmed)

Facts checked first: `/media/now-next` (ADR 0065) already carries per-Channel `current` occurrence
with publication names, `thumbnail_url` and `remaining_seconds` but **no** `via_groups`;
`display_config` shape is fixed by ADR 0074 §3; the Channel contract has no `code`, `tags`,
cover image, `created_by` / `updated_by`; Thunder_Core has no duplicate route; develop holds no
`display_config.mode = 'multi'` Channel after M1b.

| Mockup element | Decision |
| --- | --- |
| Now Playing (column + panel) | Join `/media/now-next?horizon_minutes=60&include_idle=true` by `channel.id`. `merged_loop` → first name + "+N more" in the table, all names in the panel. Empty → "–" / "Nothing scheduled now". |
| "via <group>" | Panel only: on open, `GET /media/publications/{id}` of the current publication; read `targets[].via_groups` for this Channel's Player. No backend change. |
| Row thumbnail / panel cover | Current program's `thumbnail_url`; fallback = Output Kind icon. |
| `CH-0008`, Tags, "by <actor>" | Omitted — no field in the contract. Created / Last Updated show timestamps only. |
| Filter bar | Category tabs/select and category grouping removed (ADR §2). Type = `output_kind` + "Multi-screen" (`display_config.mode = 'multi'`); Status = health (Online / Warning / Offline / No player); Lifecycle kept as a third select (ADR §4). |
| Row checkbox, grid/list toggle | Omitted — no bulk action and no card mockup exist. |
| Sort by dropdown | Present (Name A–Z, Name Z–A, Location, Status), bound to the same state as the header sort. |
| "…" menu (D2) | Disable Channel = existing deactivate + confirm. Duplicate Channel rendered disabled with tooltip ("not available yet"). |
| Groups "Manage →" / "Add to Group" | Rendered disabled with tooltip until ticket 11 (D9). |
| "Open Live View" | Rendered disabled with tooltip (ticket 14). |
| Channel Groups tile | `GET /media/channel-groups` count (correct for empty Groups; same source as ticket 10). |
| "View Programs →" | Links to Now & Next with `?q=<channel name>`; `NowNextPage` initialises its search from the URL (small cross-feature edit). |
| Multi-screen tree verification | Single-node verified in browser; multi covered by a `.check.mts` on the tree mapping only, browser-verified when ticket 08 can create one. |
