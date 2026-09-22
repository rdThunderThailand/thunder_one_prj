# Plan — Template editor on the Lovable editor skeleton

**Goal:** `LayoutEditorPage` (Template editor, `/media-workspace/layouts/templates/*`) uses the same
single-screen skeleton as the Composition editor and Lovable `layout-editor.tsx`: header → toolbar →
3-column grid. The two-step wizard (Step 1 canvas / Step 2 settings) goes away.

**Reference:** Lovable project `e8b49026-…`, `src/components/layout-editor.tsx`; ADR 0076, 0077.
Decided 2026-09-22 ("ตามแนะนำทั้งหมด"): single screen · presets in the left column · settings in the
right inspector when no Zone is selected.

**Status:** in progress — 2026-09-22.

## Constraints

- Tokens only (ADR 0075); Lovable primitives from `src/components/ui/lovable/` (ADR 0076).
- Inputs `h-9 text-xs`, labels `text-xs` (round-3 convention, not Lovable's `text-[9px]`).
- Files ≤ 300 lines. No new dependencies. Save semantics, `saveDisabledReason`, the ratio-change
  confirm and the change-all warning are unchanged.

## Tasks

1. **`LayoutEditorChrome.tsx`** (new) — `LayoutEditorHeader` (back · breadcrumb `Templates › name` ·
   name + status badge · `res · N Zones · Unsaved changes|Saved` · Save), `LayoutEditorToolbar`
   (Add Zone = `duplicateZone` of the selected/last Zone · Split Zone · Even split ×2/3/4 · Delete
   Zone · Fit to Screen · "Selected: Zone A"), `LayoutZoneOverview` (A-badge · name · size, click
   selects).
2. **`LayoutSettingsStep.tsx` → `LayoutSettingsPanel.tsx`** — same fields and legacy-resolution
   logic, laid out vertically for a 270px inspector with the `Layout Properties / No zone selected`
   header.
3. **`ZoneProperties.tsx`** — inspector header `Zone Properties / Zone A (name)`, `h-9 text-xs`
   inputs, Remove stays.
4. **`TemplateRail.tsx`** — 2-column grid that fills the 230px left column, `Presets` header.
5. **`LayoutEditorPage.tsx`** — drop `step`; render Header → shell card (`h-[50rem] min-w-[1060px]`,
   same as the Composition editor) → Toolbar → grid `[230px_minmax(560px,1fr)_270px]`:
   `TemplateRail` | `LayoutCanvas fillAvailable` + `LayoutInformationCard` + `LayoutZoneOverview` |
   `ZoneProperties` or `LayoutSettingsPanel`.
6. Verify: `tsc --noEmit` on touched files + `eslint`; browser (ask first): create + edit template
   at 1320px — preset click, drag, split, even split, delete, settings edit, ratio-change confirm,
   save, unsaved-leave confirm.
