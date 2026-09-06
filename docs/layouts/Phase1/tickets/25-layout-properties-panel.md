# 25 — Layout Properties panel absorbs creation, and the editor file splits

**Issue:** https://github.com/rdThunderThailand/thunder_one_prj/issues/55
**Repo:** `thunder_one_prj`
**Decided by:** `docs/adr/0063-create-layout-flow-phase-1.md` §1, §4
**Plan:** `docs/layouts/Phase1/plan-create-layout-flow.md` FE-2
**Design:** `docs/layouts/Phase1/Layout Editor.png`
**Blocked by:** 24 · 23 (for the Tags field)
**Blocks:** 26, 27, 28 — all three edit the same component, so this one splits it first
**Status:** verified (localhost → `develop` DB, 2026-09-06) — all five items plus the
regression sweep passed in the browser.

Acquired one unplanned Core migration: `20260906133000_composition_get_folder_and_tags.sql`.
`media_composition_get` returned neither `folder_id` nor `tags`, so the panel had nothing to open
on. Body-only `CREATE OR REPLACE` — signature untouched, no overload, grants survived (verified:
one row in `pg_proc`, ACL `postgres=X/postgres | service_role=X/postgres`).

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

- [x] Panel gains `Layout Name`, `Folder`, `Tags`, `Resolution`, `Background` —
      `LayoutPropertiesPanel.tsx`, presentational
- [x] Resolution and background route through ADR 0052 §3's interruption: the page's
      `confirmGeometryChange` guards `onSettingsChange`, and the **Make this Layout its own copy**
      banner is unchanged
- [x] Folder uses `media_composition_move`; Tags use `setCompositionTags` from ticket 23. Both are
      applied *after* `set_zones` (see `save-composition.ts`) because both need the Composition to
      exist — and both replace wholesale, so a retry adds no recovery hole
- [x] Header badge: `Unsaved` / `Last saved HH:MM`, in `CompositionEditorHeader.tsx`
- [x] Background default `#000000` via `DEFAULT_BACKGROUND`
- [x] Name is one state behind two inputs — the panel field and an inline rename in the heading.
      `PageHeader.title` widened from `string` to `ReactNode` to allow it
- [x] **Split the component.** 734 → 300 lines, along the lines of who edits next:
      `save-composition.ts` + `hooks/useCompositionSave.ts` + `CompositionEditorHeader.tsx`
      (ticket 28) · `CompositionCanvasPane.tsx` (ticket 26) · `ZoneContentPicker.tsx` already
      separate (ticket 27) · plus `LayoutPropertiesPanel.tsx`, `load-composition-draft.ts`,
      `hooks/useCompositionEditorData.ts`, `hooks/useCompositionPreview.ts`,
      `hooks/useEditorLayout.ts`. No file in either feature exceeds 300 lines
- [x] ESLint clean, including `react-hooks/set-state-in-effect`

## Guarded on the way through

`folder_id` / `tags` are held as `string | null | undefined` and `string[] | undefined`, where
`undefined` means *this Core did not tell us*. Without that, opening an existing Composition against
a Core that predates the migration would initialise tags to `[]` and **the next Save would wipe
them**. `PersistInput` already treats `undefined` as "leave alone", so the two line up.

## Verification

SQL layer, `develop` 2026-09-06 (read-only):

- [x] `media_composition_get`: exactly one row in `pg_proc` (no overload), ACL
      `postgres=X/postgres | service_role=X/postgres` — no PUBLIC / anon / authenticated
- [x] Returns `folder_id` (null = Uncategorized) and `tags` (`[]`), alongside the existing fields

Browser, localhost against the `develop` DB with `Thunder_Core` on `feat/layoutV2` at
`localhost:3001` (ticket 23's `/tags` route is not on `develop` yet), 2026-09-06:

- [x] Change resolution on a Layout whose Template backs two others → the interruption
      appears; **Make this Layout its own copy** forks and leaves the siblings untouched
- [x] Change it on a Layout with private geometry → no interruption
- [x] Set a folder and two tags, reload, confirm both persisted
- [x] Open a brand-new Layout from the picker: badge reads `Unsaved`, network tab shows no write
- [x] Rename at the title and in the panel — both move together
- [x] **Regression sweep after the split:** load an existing Composition, bind a Zone, Split Zone,
      Preview, Open full preview, Save draft, Activate, Save as Template

Write order observed in the Network tab: `set_zones` → `PATCH /media/compositions/:id` (folder)
→ `PUT /media/compositions/:id/tags`, which is the order `save-composition.ts` documents.
