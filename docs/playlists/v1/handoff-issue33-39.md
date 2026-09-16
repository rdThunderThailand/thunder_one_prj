# Handoff — Playlist v1, issues #33 + #39

For the agent picking up [#33](https://github.com/rdThunderThailand/thunder_one_prj/issues/33)
(Playlist editor: one page replaces the create wizard) and
[#39](https://github.com/rdThunderThailand/thunder_one_prj/issues/39) (Preview a Playlist).
Written 2026-09-02, after #34 merged (list stat tiles, Type column, Mark as ready — closed).

## Model check first

Before writing code: #33 is mostly execute-to-spec (ADR 0060 §1–§3 already decided the shape,
`LayoutEditorPage.tsx` is a pattern to copy) — Sonnet is enough for that half. #39 is not: it
requires widening `FullPreviewPage`'s `source` union and payload contract and designing the
adapter that turns a Playlist into a synthetic full-frame Zone — that is contract design, not
spec-following. Do the #39 contract shape on Opus; #33's editor plumbing can run on Sonnet. If
you're on Sonnet and a design question comes up mid-#39 that ADR 0060/0051 doesn't already
answer, stop and flag it rather than deciding it as Sonnet.

## Why these two ship together

`ReviewStep.tsx`, which #33 deletes, is where Playlist preview lives today (via
`PlaybackPreviewModal`). If #33 merges without #39, Playlist preview disappears from the product
entirely with no replacement. Land them in the same branch/PR.

## Intent

Replace the four-step Playlist creation wizard with one editor page —
`/media-workspace/playlists/[id]` and `/media-workspace/playlists/create` — matching the
list+editor shape `/media-workspace/layouts` and `/media-workspace/compositions` already use, and
give that editor a working Preview that plays the Playlist full-screen.

## Context and paths

- **Pattern to copy**: `src/features/media-workspace/layouts/components/LayoutEditorPage.tsx`
  (301 lines) — same page shape this issue wants: item list + canvas/preview + properties pane,
  no wizard.
- **Files #33 deletes**: `PlaylistStepper.tsx`, `BasicInfoStep.tsx`, `ContentStep.tsx`,
  `SettingsStep.tsx`, `ReviewStep.tsx`, `step-validation.ts` (+ its `.check.mts`),
  `store/usePlaylistDraftStore.ts` (178 lines — the browser-local draft store), and any component
  that only the stepper used (check `CreatePlaylistActions.tsx`, `CreatePlaylistPage.tsx`,
  `PlaylistPanelTabs.tsx`, `PlaylistProperties.tsx`, `PlaylistSidePanel.tsx`,
  `PlaylistItemsTable.tsx`, `AssetPicker.tsx`, `SelectedItems.tsx`, `form.tsx` before deleting —
  some may still earn their keep in the new editor, most won't).
- **Reuse, don't rewrite**: `RevisionConflictCard.tsx` (21 lines) and `UnsavedLeaveConfirm.tsx`
  (29 lines) already exist and already do what the acceptance criteria ask for.
  `usePlaylistDraftSave.ts` (85 lines) is today's only place that writes `status` — it goes away
  with the wizard, and nothing in the new editor should replace that responsibility (§3: no
  status control in the editor, "Mark as ready" on the list page already owns leaving `draft`,
  landed in #34).
- **Preview feature** (`src/features/media-workspace/preview/`): `FullPreviewPage.tsx`,
  `PreviewStage.tsx`, `composition-preview.ts` (today's `source: "composition" | "publication"`
  union and `CompositionPreview` payload — this is what #39 widens), `preview-clock.ts` /
  `preview-geometry.ts` (reuse verbatim, do not reimplement timing).
- **Services**: `src/features/media-workspace/playlists/services/playlists-api.ts` —
  `upsertPlaylist` already supports `expected_revision` and PATCH-vs-POST; `setPlaylistItems`
  already replaces items wholesale. Probably enough for the editor's save without new endpoints.
- **Design guideline**: `docs/playlists/v1/design-guideline-playlist-editor.md` — editor section
  and Preview section. **ADR**: `docs/adr/0060-playlist-editor-single-page.md` §1–§3 (editor
  shape, saving, no-Publish-authority) and `docs/adr/0051-pre-publish-preview.md` (preview
  pattern #39 extends).

## Constraints

- Reply in Thai; code/identifiers/commits/ADRs/specs stay English.
- Commit/push only when asked; no `Co-Authored-By`/AI mentions in commits; PR opens Draft when
  verification is incomplete, never marked ready by the agent; ask Thai-or-English for the PR body.
- Files ≤300 lines, no `any`, no dead code, Server Components by default, mutations through
  Server Actions, no new dependencies without asking.
- **Ask before any browser verification run** — offer (1) agent drives browser, (2) checklist for
  the human, (3) skip; (2)/(3) count as unverified.
- The row was created on first save, not on entering the page (ADR 0060 §1) — abandoning a new
  Playlist must leave nothing in the database or the Trash.
- No Publish button anywhere on the editor or preview — that's a Publication's job (ADR 0060 §3).
- `playlistDisplayStatus()`, `ContentFolderRail`, `preview-clock`, `preview-geometry` — do not
  touch beyond what these two issues explicitly require.
- Preview needs a third route + widened `source` union + an adapter synthesizing one full-frame
  Zone from the Playlist at the operator-chosen aspect ratio (16:9/9:16/4:3) — not a new timing
  engine.

## Acceptance criteria

See the issues for the authoritative checklists. Headline items:

- [ ] Create Playlist → editor with no server row until first Save Draft; abandoning leaves
      nothing behind
- [ ] First save creates the Playlist and updates the URL without a full navigation
- [ ] Reopening restores name, items and order exactly
- [ ] Unsaved-leave confirmation; stale-revision save surfaces a conflict, never overwrites
- [ ] Undo/redo on in-page state
- [ ] No status control, no Publish button, anywhere on editor or preview
- [ ] Stepper/step components/step validation/draft store deleted with zero remaining references
- [ ] Preview opens from the editor, plays items in order with real durations, reframes on
      16:9/9:16/4:3, Now Playing + Playlist Information reflect the Playlist
- [ ] Preview depends on no wizard component

## Out of scope

Composition-as-Playlist-item, folder rail/trash/tags on the editor (later issues #38/#40/#41),
`derived_usage`, players acting on the new per-item fields, grid/compact views — all deferred per
ADR 0060. Don't pull them forward. No change to Publication, Composition or Channel behaviour.
