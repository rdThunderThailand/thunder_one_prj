# 26 — Canvas tools: undo/redo, align, duplicate Zone

**Issue:** https://github.com/rdThunderThailand/thunder_one_prj/issues/56
**Repo:** `thunder_one_prj`
**Decided by:** `docs/adr/0063-create-layout-flow-phase-1.md` §5
**Plan:** `docs/layouts/Phase1/plan-create-layout-flow.md` FE-3
**Design:** `docs/layouts/Phase1/Layout Editor.png` (toolbar)
**Blocked by:** 25 (the file split)
**Runs in parallel with:** 27
**Status:** not started

## What to build

Three tools. Client-side only — no contract, no backend.

## Context — ADR 0063 §5

> Taken now:
>
> - **Undo / redo** — client-only, and the merged canvas is where an operator drags geometry with
>   content already bound to it. §7 sent this to ticket 11; ticket 11 has not shipped and the cost of
>   the feature is a state stack, not a contract.
> - **Align / distribute** (the five-button group) — arithmetic on Zone percentages, no contract.
> - **Duplicate Zone** — same.
>
> Still refused, with §7's reasons unchanged:
>
> - **Ruler, zoom, Fit to Screen** — the canvas is percentage-based inside an `aspect-ratio` box and is
>   therefore fitted at all times. The frames' `80%` scales CSS and means nothing about the Layout.
> - **Lock / hide** — no column to persist them and no meaning across a session.
> - **Safe Margin** — a pixel value on a percentage model, resolved against `reference_resolution`,
>   which is nullable for Layouts predating ADR 0050. It would read `N/A` for exactly the older Layouts
>   most likely to want it.

**Do not add a ruler, a zoom control or a Fit to Screen button to this toolbar.** If a future reader
thinks the canvas needs them, the answer is above.

## Checklist

- [ ] Undo/redo over Zone geometry and Zone naming, keyboard shortcuts included
- [ ] The five align/distribute actions, operating on Zone percentages
- [ ] An aligned or distributed result still satisfies `validateZones` — no overlap, nothing past 100
- [ ] Duplicate Zone: offset the copy so it does not land exactly on its source and does not overlap
- [ ] Three decimal places preserved throughout (`docs/layouts/Phase0/contract-v2-zones.md`)
- [ ] One `*.check.mts` for the align/distribute arithmetic — plain `node:assert`, run with
      `node <file>.check.mts`. **No test runner**; this repo has none by design
- [ ] Nothing from the refused list above

## Verification

- [ ] The check file passes
- [ ] Browser: drag three Zones, align-left, undo twice, redo once — geometry matches at every step
- [ ] Duplicate a Zone, save, reload — the copy persisted with its own `layout_zones.id`
