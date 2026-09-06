# 24 — Template Picker: one modal, two sources

**Issue:** https://github.com/rdThunderThailand/thunder_one_prj/issues/54
**Repo:** `thunder_one_prj` · branch off `dev`
**Decided by:** `docs/adr/0063-create-layout-flow-phase-1.md` §2, §3
**Plan:** `docs/layouts/Phase1/plan-create-layout-flow.md` FE-1
**Design:** `docs/layouts/Phase1/Create Modal.png`, `Template Picker.png`
**Blocked by:** 21 (for the *Recently Used* group only — the rest can be built against today's list)
**Runs in parallel with:** 29
**Status:** verified — browser-checked on localhost 2026-09-06 (see Verification). Files:
`layouts/templates.ts` (14 presets, `description`/`use_cases`/`orientation`/`aspectRatio`),
`layouts/template-picker.ts` (+`.check.mts`, pure merge/filter/group),
`layouts/create-seed.ts` (sessionStorage one-shot handoff),
`layouts/components/LayoutTemplatePicker.tsx` (the modal, 263 lines),
`CompositionsListPage.tsx` (`+ New Layout` opens the modal),
`CompositionEditorPage.tsx` (reads the seed on mount).
`TemplateRail.tsx` kept — still the starting-geometry rail for the *Templates* editor
(`LayoutEditorPage`), which is out of this ticket's scope; it now lists 14 tiles.

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

Browser, localhost dev servers (One :3000 → Core :3001 → `develop` DB), 2026-09-06 — all passed:

- [x] `+ New Layout` opens **one** modal titled *Choose a starting point*, with all four group tabs.
      No navigation to `/create`, no second modal
- [x] Recommended shows **14** preset cards, every one badged `Copied`
- [x] Filters over the merged list: Portrait → 7 · `4+ zones` → 2 (4 Grid L+P) · use case
      `Menu board` → 2 (3 Column, 3 Row)
- [x] Free-text `quadrant` matches 4 Grid — i.e. search reaches `description`, not just `name`
- [x] My Templates lists the tenant's Templates, every one badged `Shared`
- [x] Details panel: wireframe, name, aspect ratio, orientation, zone count, `On use`
      (*Copied to this Layout* / *Shared reference*), chips, description
- [x] Pick a preset → editor opens with those Zones drawn, **network tab shows no POST/PUT/PATCH**.
      The modal writes nothing (ADR 0063 §2)
- [x] `Create from Scratch` → editor opens on a single full-screen `Main` Zone, still no write
- [x] Pick an operator Template → editor opens pointing at that `layout_id`, not a copy

*Recently Used* ordering exercised in the browser 2026-09-06: using a Template puts it at the top
of the group on the next open, matching `template-picker.check.mts`'s `last_used_at` assertion.
