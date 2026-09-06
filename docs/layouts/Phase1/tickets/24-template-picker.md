# 24 — Template Picker: one modal, two sources

**Issue:** https://github.com/rdThunderThailand/thunder_one_prj/issues/54
**Repo:** `thunder_one_prj` · branch off `dev`
**Decided by:** `docs/adr/0063-create-layout-flow-phase-1.md` §2, §3
**Plan:** `docs/layouts/Phase1/plan-create-layout-flow.md` FE-1
**Design:** `docs/layouts/Phase1/Create Modal.png`, `Template Picker.png`
**Blocked by:** 21 (for the *Recently Used* group only — the rest can be built against today's list)
**Runs in parallel with:** 29
**Status:** not started

## What to build

`New Layout` opens **one** modal that both offers the system presets and lists the tenant's own
Templates, and hands the choice to the editor as client state.

## Context — ADR 0063 §2

> `New Layout` opens a single modal: the Template Picker, with *Create from Scratch* inside it as the
> blank path. There is no modal on top of a modal and no separate "choose how to start" step.
>
> The Phase 1 frames show two stacked modals whose second one contains a `Create from Scratch` button
> that returns to the first one's other option. That loop is the design defect.
>
> **The modal collects no name.** It picks a starting point and opens the editor on it.
>
> **The modal writes nothing.** It seeds client draft state.

## Context — ADR 0063 §3

> | Group | Source | What choosing it does |
> |---|---|---|
> | Recommended | frontend constants, `layouts/templates.ts` | **copies** the geometry into a new private `inline` row |
> | My Templates | `layouts WHERE kind = 'template'` | **points at** the shared row (ADR 0052 §2) |
> | All Templates | both, in that order | per source |
> | Recently Used | `layouts WHERE kind = 'template'`, by `last_used_at` | points at the shared row |
>
> A system preset is a **starting point**; an operator Template is a **shared reference**. Nobody wants
> a fix to the *3 Zones – Header + 2 Bottom* preset to propagate into every Layout ever started from
> it. So copy-on-use for presets is the correct semantics, not a compromise.
>
> **This is also what the code already does.** The seven constants reach the editor through
> `blankZones`, which mints private `inline` geometry on save.
>
> **Filtering is client-side.** No stored preview images — the picker draws each entry from its Zone
> percentages with `LayoutWireframe`.

## Checklist

- [ ] New component under `layouts/components/`. `TemplateRail.tsx` (49 lines) stays only if the
      editor still needs an in-place switcher; otherwise it goes
- [ ] Two sources merged into one list: presets from `layouts/templates.ts`, operator Templates from
      one `fetchLayouts("template")`
- [ ] Four groups — Recommended (presets) · My Templates (fetched) · All (both) · Recently Used
      (fetched, ordered by `last_used_at` from ticket 21)
- [ ] **A card states which behaviour it has** — copied, or shared — so an operator knows before
      choosing whether a later geometry edit travels to other Layouts
- [ ] Filters run client-side over the merged list: orientation from `aspect_ratio`, zone count from
      `zones.length`, use case from `use_cases`, free-text search over name and description.
      **No new query parameters**
- [ ] `Create from Scratch` lives **inside this modal**. No modal on a modal, no
      `Don't show this again`
- [ ] Details panel: name, resolution, orientation, Zone arrangement, use-case chips, description,
      and a `LayoutWireframe`. **No photographic preview.** Only presets carry a description and chips
- [ ] **No name field and no write.** The CTA navigates to the editor carrying the choice in client
      state
- [ ] `LayoutTemplate` in `layouts/templates.ts` gains `description` and `use_cases`
- [ ] Each preset gains a **portrait variant**, or the orientation filter has one value
- [ ] **Delete the opening comment in `layouts/templates.ts`** — it says `Save as Template` is out of
      release one and proposes `is_template`; both are superseded by `layouts.kind` (ADR 0052 §4) and
      ticket 28
- [ ] Files stay ≤ 300 lines; no `any`

## Verification

- [ ] Browser: open the picker, filter by portrait, by 3 zones, and by a use case; search by
      description; confirm the counts match what is on screen
- [ ] Pick a preset → the editor opens with those Zones drawn and nothing written to the API
      (check the network tab)
- [ ] Pick an operator Template → the editor opens pointing at it
- [ ] *Recently Used* reflects a Composition created moments earlier
