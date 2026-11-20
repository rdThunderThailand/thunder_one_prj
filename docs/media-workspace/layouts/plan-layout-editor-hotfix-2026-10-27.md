# Plan: Layout editor hotfix (2026-10-27)

Agreed in a grilling session; no ADR (geometry storage unchanged, everything else reversible).

## Facts this plan rests on

- Zone geometry is stored in percent, thousandths precision (`layouts/geometry.ts` `roundPercent`).
  px is a display/input unit only; no data-model or API change.
- `LayoutCanvas` is shared by the Composition editor (`/layouts/[id]`) and the Template editor
  (`/layouts/templates`, `LayoutEditorPage`). "Snap to grid" today rounds to whole percent.
- Preset resolution changes already reach the canvas live; Custom commits on blur.
- `PreviewStage` already has a fit/actual (`fitToWindow`) mode; zones render with a border and a
  name/time label (`PreviewZones.tsx`).
- `main` and `dev` are identical under `compositions/`, `layouts/`, `preview/`.

## PR 1 — branch from `main`

1. **Move Layout Properties under the canvas.** In `CompositionEditorPage`, replace the read-only
   `LayoutInformationCard` with the full `LayoutPropertiesPanel` (name, folder, tags, resolution,
   background, shared-Template warning), non-compact grid. Keep zone count / status / aspect ratio
   as a summary line. Right sidebar with no zone selected shows "Select a Zone to edit its
   properties." Delete `LayoutInformationCard` if unused.
2. **Live Custom resolution.** `CustomResolution` commits on every valid change (100–99999), not
   on blur. The shared-Template guard (`beginZoneEdit`, ADR 0052 §3) asks once per edit session,
   via a continuous key, not per keystroke. Zones keep percent → they scale with the frame.

## PR 2 — branch from `main`

3. **% / px unit toggle.** One `% | px` toggle for X/Y/W/H in both `ZonePropertiesPanel` and
   `layouts/components/ZoneProperties`. Default px, remembered per browser (localStorage, try/catch).
   No reference resolution → % only, toggle disabled. px input converts with `roundPercent`.
4. **Snap to zone edges.** In `LayoutCanvas`, always on: while moving or resizing, an edge within
   ~8 screen px of another zone's edge or a canvas edge snaps to it and shows a guide line. Alt held
   bypasses. Zone-edge snap wins over grid snap. Applies to both editors.
5. **Aurora-style preview.** In `PreviewStage` (every surface that uses it): opens at Fit, with a
   Scale slider 0.1–1.0 (1.0 = real pixels), scrollable when larger than the window. Zones render
   without border or overlay labels; play/time controls stay outside the frame.

## Scrutinize amendments (2026-10-27)

- Branch from `origin/main` after `git fetch`; local `main` is stale (d7068ca).
- Step 2: `CustomResolution` keeps the locked ratio in its own state (set on lock/mount) instead of
  reading the live `settings.aspectRatio`, or live commits drift it (1234x694 → 617:347). Seed its
  width/height from the current resolution. Pass continuous key `"resolution"` to `beginZoneEdit`
  so typing makes one undo step. The shared-Template approval already asks once per session;
  the first keystroke on a shared Template opens the modal and is dropped — accepted.
- Steps 2–3: `ZonePropertiesPanel`, the preview dialog and the canvas ruler (hardcoded 0…1920)
  read the draft `settings.referenceResolution` / `aspectRatio`, not the saved `layout.*`.
- Step 1 (decided): render `LayoutPropertiesPanel` `compact` in the left half under the canvas. If
  it does not fit, it takes the whole row and `ZoneOverview` is dropped — never moved below.
- Step 4: snap adjusts the moving edge's delta before clamp/round (w/n handles move x and width
  together); threshold `8 / containerWidth * 100`; targets exclude hidden zones, include locked;
  read everything from `drag.current`, not the closure.
- Step 5: extend `fitToWindow` to `scale: number | "fit"` under the existing
  `allowActualSize && framePixels` gate; no new mode. Scope (decided): borderless, label-free
  zones on every `PreviewStage` surface; controls keep each caller's `controlsPlacement`.
  "Needs duration" / "Ended" labels go away (accepted). A muted zone keeps a small mute icon
  (ADR 0064 §7 still holds); no other zone chrome.

## Verification

- One `*.check.mts` for the snap function (pure: rect + neighbours + threshold → snapped rect) and
  px↔% round-trip.
- Browser check per PR at the user layer (ask before each verify point, CLAUDE.md §3).
