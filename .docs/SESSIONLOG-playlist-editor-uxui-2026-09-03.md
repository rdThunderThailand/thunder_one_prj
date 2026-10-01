# Session Log — Playlist editor UX/UI annotations

Date: 2026-09-03
Branch: `fix/playlist`

## Scope

- Applied browser annotation fixes on the Playlist editor draft UI.
- Kept scope frontend-only; no backend/API contract changes.

## Changes

- Constrained the editor workspace to a fixed viewport-height container with internal scrolling.
- Changed the header title from always-editable input to display mode with edit and confirm actions.
- Split header metadata into item count, duration, status badge, and last-updated display.
- Moved Add Item to the Playlist Items footer.
- Added native drag-and-drop ordering to Playlist Items.
- Made timeline thumbnails jump the embedded preview clock to the selected item start time.
- Added mute/unmute control to shared `PreviewStage`.
- Extracted preview controls and media surface rendering so touched files stay under the 300-line cap.
- Moved embedded playlist preview controls into an overlay inside the preview frame.
- Removed item count and total duration from the editor header status row.
- Added a footer hint for drag-to-reorder in the Playlist Items pane.
- Added disabled per-item Display Options placement for #37-only fields without adding an unsupported save path.
- Replaced the left-list remove `x` with a per-item More actions menu; Move to is intentionally omitted.
- Wired the left-list More actions Preview item to jump the embedded preview to the same item start time as the filmstrip.
- Added hover treatment to item rows/actions and kept Remove from Playlist as the red destructive action.
- Changed embedded preview controls into a persistent YouTube-style footer overlay and moved playback speed choices into the More menu.
- Reshaped the full Playlist preview page into a light shell with header, preview stage, right information panel, timeline strip, and dark-theme class support.
- Removed the full Playlist preview outer card/frame and the dark wrapper around the preview stage; forced overlay secondary controls to white text.
- Expanded the editor filmstrip tiles to fill available timeline width while retaining horizontal overflow for larger playlists.
- Adjusted editor filmstrip tiles to fixed 150px cards with larger bold labels and increased only the embedded editor preview height budget.
- Added a browser QA checklist for Gemini/manual verification at `docs/playlists/v1/verify-playlist-editor-uxui-browser-checklist.md`.
- Changed the unsaved-leave warning from an in-flow card to the shared modal so it no longer pushes the editor grid down.
- Let the Timeline card size to its preview and fixed-height filmstrip content inside the scroll column to prevent the 150px thumbnail strip from overlapping Playback Settings.
- Tightened the editor Timeline filmstrip to a 157px strip with 11px top spacing so the fixed 150px cards stay clear of Playback Settings.

## Verification

- `npx tsc --noEmit` — passed after both UX/UI patch rounds.
- `npx eslint src/features/media-workspace/playlists/components/PlaylistEditorPage.tsx src/features/media-workspace/playlists/components/PlaylistEditorHeader.tsx src/features/media-workspace/playlists/components/PlaylistItemsPane.tsx src/features/media-workspace/playlists/components/PlaylistTimelinePane.tsx src/features/media-workspace/playlists/components/PlaylistPropertiesPane.tsx src/features/media-workspace/preview/PreviewStage.tsx src/features/media-workspace/preview/PreviewControls.tsx src/features/media-workspace/preview/PreviewSurface.tsx` — passed after both UX/UI patch rounds.
- `node src/features/media-workspace/playlists/playlist-editor-state.check.mts` — passed; Node emitted the existing package-type warning.
- `npx tsc --noEmit` — passed after the More actions menu patch.
- `npx eslint src/features/media-workspace/playlists/components/PlaylistItemsPane.tsx` — passed after the More actions menu patch.
- `npx tsc --noEmit` — passed after wiring More actions Preview seek.
- `npx eslint src/features/media-workspace/playlists/components/PlaylistItemsPane.tsx src/features/media-workspace/playlists/components/PlaylistEditorPage.tsx src/features/media-workspace/playlists/components/PlaylistTimelinePane.tsx src/features/media-workspace/playlists/playlist-editor-state.ts` — passed after wiring More actions Preview seek.
- `node src/features/media-workspace/playlists/playlist-editor-state.check.mts` — passed after adding the item-start assertion; Node emitted the existing package-type warning.
- `npx tsc --noEmit` — passed after the preview footer overlay patch.
- `npx eslint src/features/media-workspace/preview/PreviewControls.tsx src/features/media-workspace/preview/PreviewStage.tsx` — passed after the preview footer overlay patch.
- `npx tsc --noEmit` — passed after the full Playlist preview page reshape.
- `npx eslint src/features/media-workspace/preview/FullPreviewPage.tsx src/features/media-workspace/preview/PlaylistPreviewPanel.tsx src/features/media-workspace/preview/PreviewStage.tsx` — passed after the full Playlist preview page reshape.
- `npx tsc --noEmit` — passed after removing the full preview outer frame.
- `npx eslint src/features/media-workspace/preview/FullPreviewPage.tsx src/features/media-workspace/preview/PreviewControls.tsx` — passed after removing the full preview outer frame.
- `npx tsc --noEmit` — passed after expanding editor filmstrip tiles.
- `npx eslint src/features/media-workspace/playlists/components/PlaylistTimelinePane.tsx` — passed after expanding editor filmstrip tiles.
- `npx tsc --noEmit` — passed after sizing filmstrip tiles to 150px.
- `npx eslint src/features/media-workspace/playlists/components/PlaylistTimelinePane.tsx src/features/media-workspace/preview/PreviewStage.tsx` — passed after sizing filmstrip tiles to 150px.
- `npx tsc --noEmit` — passed after moving unsaved-leave warning to a modal and fixing the filmstrip overflow.
- `npx eslint src/features/media-workspace/playlists/components/UnsavedLeaveConfirm.tsx src/features/media-workspace/playlists/components/PlaylistTimelinePane.tsx` — passed after moving unsaved-leave warning to a modal and fixing the filmstrip overflow.
- `npx tsc --noEmit` — passed after tightening the Timeline filmstrip spacing.
- `npx eslint src/features/media-workspace/playlists/components/PlaylistTimelinePane.tsx` — passed after tightening the Timeline filmstrip spacing.

## Browser Verification (checklist QA, delegated to Gemini)

- Sections A–I: all PASS. 3-pane layout no overflow at 1440px and 1280px, no console errors.
  Header edit/confirm, status badge, no Undo/Redo. Add Item footer + drag reorder + full More
  actions menu. Selection sync across items pane / center preview / thumbnail strip. YouTube-style
  overlay footer (~582px preview). 150x150 thumbnail cards seek to item start. Right pane Item +
  Playlist tabs. Add Item drawer search/filter/upload. Full preview page light theme with Now
  Playing + Playlist Information cards, persistent footer, Edit Playlist round-trip.
- Section J (write check): all PASS. Title edit, add item, reorder (Move Down), playback setting
  change, Save Draft -> backend PATCH/PUT ok, URL unchanged, persisted correctly after refresh,
  no revision conflict.

## Undo/redo wired back (post-QA, #33 AC)

- `use-undoable-state` history was tracked but never invoked from the editor. Added:
  - `UndoIcon` / `RedoIcon` in `src/components/ui/icons.tsx`.
  - Undo/Redo icon buttons in `PlaylistEditorHeader`, left of Cancel, disabled per `canUndo`/`canRedo`.
  - `Cmd/Ctrl+Z` / `Shift+Cmd/Ctrl+Z` keydown handler in `PlaylistEditorPage`, ignored while
    focus is in input/textarea/select/contenteditable so the title field keeps native undo.
- Verified: tsc + eslint clean on changed files; `use-undoable-state.check.mts` passes.
- Browser check for the buttons + shortcuts added to the checklist (section A).

## Full checklist QA — second pass (delegated to Gemini)

- All 101 checks across sections A–J: PASS / 0 fail / 0 skip.
- Includes the new undo/redo buttons + Cmd+Z / Shift+Cmd+Z shortcuts (section A) and the
  full Save Draft write check (section J).
- Reports: `playlist_editor_verification_report.md`, `walkthrough.md` (Gemini artifacts).

## Stale-revision conflict — verified (checklist section K, Gemini)

- Two-tab repro: Tab A idle, Tab B renames + Save Draft, Tab A renames + Save Draft.
- Tab A shows the revision-conflict card ("ข้อมูลถูกแก้ไขจากที่อื่น... กรุณาโหลดหน้านี้ใหม่")
  with a reload action, stays on the same URL, does not overwrite the server.
- Reload re-hydrates to Tab B's state, card clears, a fresh edit then saves with no conflict.
- Section K: 9/9 PASS. Full checklist A–K: 110/110 PASS.

## #33 acceptance criteria — all met

- One-page editor, no server row until first Save Draft, URL becomes the saved id in place.
- Reopen restores name/items/order. Unsaved-leave confirm. Stale-revision conflict surfaces.
- Undo/redo (buttons + Cmd+Z). No Publish control anywhere. Wizard/stepper/local draft removed.

## Preview aspect-ratio modes wired (#39 AC "switching between 16:9, 9:16 and 4:3 reframes the stage")

- `PlaylistPreviewPanel`'s three mode buttons were inert (`disabled={mode !== "16:9"}`, no handler).
- `PlaylistFullPreview` now holds `previewMode` state (default `16:9`), passes it as `PreviewStage`
  `aspectRatio` in place of the handoff's stored ratio (ADR 0061 §2 — a Playlist has no geometry
  of its own), and hands `previewMode` / `onPreviewMode` to the panel.
- Panel buttons: `aria-pressed`, click calls `onPreviewMode`, selected style follows `previewMode`.
- `PreviewStage` already parses the ratio string and sets `style.aspectRatio`, so no stage change.
- Verified: tsc + eslint clean; section H reframe check (Gemini) 6/6 PASS — 16:9 default,
  9:16 and 4:3 reframe the stage with the active button tracking, back to 16:9 restores the
  wide frame, playback position is not reset and the media does not blank.

## #39 acceptance criteria — all met

- Preview opens from the editor and plays items in order with their durations.
- Now Playing + Playlist Information reflect the previewed Playlist.
- 16:9 / 9:16 / 4:3 all reframe the stage.
- Timing from the existing preview-clock / preview-geometry helpers, no second implementation.
- No dependency on any wizard component. No Publish control in preview.

## #35 acceptance criteria — all met (AddItemDrawer, no code change needed)

- Drawer opens from the editor footer; AssetPicker lists media with search + type + folder
  filters (tag filter present as a bonus).
- Multi-select, one "Add N Items" action naming the count, disabled at zero.
- `commit()` passes staged ids in selection order -> `appendItems` appends to the end ->
  `history.commit` re-renders the item list immediately (write check J2).
- Clear resets the staged selection; Cancel / backdrop close without adding.
- Upload is a `<Link target="_blank">` to the existing upload route — no navigation, editor state intact.
- Picker is only ever fed `fetchMediaAssets()` (`/media/videos`), so Compositions and Layouts
  are structurally unselectable.
- Verified via checklist section G (8/8) and write check J2, both PASS across two Gemini passes.

## Not Verified

- Shared non-playlist (Composition/Publication) preview regression not explicitly covered beyond
  Section I smoke.
