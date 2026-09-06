# 25 — Layout Properties panel absorbs creation, and the editor file splits

**Issue:** https://github.com/rdThunderThailand/thunder_one_prj/issues/55
**Repo:** `thunder_one_prj`
**Decided by:** `docs/adr/0063-create-layout-flow-phase-1.md` §1, §4
**Plan:** `docs/layouts/Phase1/plan-create-layout-flow.md` FE-2
**Design:** `docs/layouts/Phase1/Layout Editor.png`
**Blocked by:** 24 · 23 (for the Tags field)
**Blocks:** 26, 27, 28 — all three edit the same component, so this one splits it first
**Status:** not started

## What to build

Everything the Create modal used to ask for now lives in the editor's right-hand panel. And
`CompositionEditorPage.tsx` (734 lines against a 300-line ceiling) stops being one file.

## Context — ADR 0063 §1

> The Create modal does not collect resolution or background. Both stay where the geometry they
> describe is edited: the *Layout Properties* panel in the merged editor, where ADR 0052 §3's
> interruption already guards a shared Template.
>
> This is safe to defer because `LayoutCanvas` is percentage-based inside a CSS `aspect-ratio` box:
> changing resolution after Zones are drawn reshapes the box and leaves every Zone percentage
> untouched.
>
> Rejected: letting the modal set them and forking the geometry at creation. Every new Layout would
> then own private geometry, which is ADR 0052 §2's rejected copy model reintroduced through the front
> door.

## Context — ADR 0063 §2 (the badge)

> the editor's header badge reads `Unsaved` until the first save and `Last saved HH:MM` after it. The
> frames' `Saved just now` on a never-saved blank canvas is corrected, not implemented.

## Checklist

- [ ] Panel gains `Layout Name`, `Folder`, `Tags`, `Resolution`, `Background`
- [ ] Resolution and background changes still route through ADR 0052 §3's shared-Template
      interruption — *"This Template is used by N Layouts"* with **Change all** / **Make this Layout
      its own copy**
- [ ] Folder uses the existing `media_composition_move`; Tags use `setCompositionTags` from ticket 23
- [ ] Header badge: `Unsaved` before the first save, `Last saved HH:MM` after. **Never**
      `Saved just now` on a canvas that has never been written
- [ ] Background default is `#000000` — matching the schema default and `DEFAULT_BACKGROUND`. The
      frames show three different values across three screens; they are wrong
- [ ] Name is edited here **and** at the title; one state, two inputs, not two sources of truth
- [ ] **Split the component.** Panel, canvas and save path become their own files, each ≤ 300 lines.
      This is the ticket where that happens, not a later cleanup
- [ ] ESLint: no synchronous `setState` in a `useEffect` body, including through an async callee —
      use a promise chain and set state in `.then()`

## Verification

- [ ] Browser: change resolution on a Layout whose Template backs two others → the interruption
      appears; **Make this Layout its own copy** forks and leaves the siblings untouched
- [ ] Change it on a Layout with private geometry → no interruption
- [ ] Set a folder and two tags, reload, confirm both persisted
- [ ] Open a brand-new Layout from the picker: badge reads `Unsaved`, network tab shows no write
