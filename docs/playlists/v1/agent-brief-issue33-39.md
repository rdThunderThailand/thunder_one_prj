# Agent brief — implement #33 + #39 (Playlist editor + preview)

Branch: `fix/playlist` (already checked out, ADR 0061 committed at 74a97e6).
Reply in Thai; code/identifiers/commits/ADRs in English. Files ≤300 lines, no `any`, no dead code,
Server Components by default, mutations via Server Actions, no new dependencies without asking.

## Read first (in order)

1. `docs/playlists/v1/handoff-issue33-39.md` — why the two issues ship together, files to delete, paths
2. `docs/adr/0061-playlist-preview-is-the-one-zone-case.md` — **the authoritative contract for #39**, 8 sections
3. `docs/adr/0060-playlist-editor-single-page.md` §1–§3 — editor shape, saving, no publish authority
4. GitHub #33 and #39 for the acceptance-criteria checklists (authoritative)

## Model

#33 is execute-to-spec — Sonnet. #39's contract is already decided in ADR 0061; execute it, do not
redesign. If a design question appears that ADR 0060 / 0061 / 0051 does not answer, **stop and flag
it** rather than deciding it.

## Sequence

**Phase A — #39 preview plumbing (do first, it is the smaller contract and #33 depends on nothing here)**

1. Rename `CompositionPreview` → `StagePreview` in `preview/composition-preview.ts`; update the two
   existing preview routes and `FullPreviewPage.tsx`. **Regression risk lives here** — run the app
   and confirm Composition + Publication preview still work before moving on.
2. Widen `FullPreviewPage`: `source` union gains `"playlist"`; handoff identity becomes
   `{ source, id }`; `isHandoff(value, source, id)`.
3. `preview-clock.ts`: add `defaultTransition?: string | null` and
   `transitionDurationSeconds?: number | null` to `PlaybackPreviewSettings` (types only —
   `previewFrameAt()` unchanged).
4. `PreviewStage.tsx`: add `allowActualSize?: boolean` (default `true`, hides the Actual-size control)
   and `onFrameChange?: (frame: ZonePreviewFrame | null) => void` — fires on `frame.itemIndex` /
   `frame.item` change (not `offsetSeconds`), `null` unless exactly one Zone. Wire it in an effect,
   not during render (repo ESLint rule).
5. New `preview/playlist-preview.ts`: pure `playlistPreviewStage({ name, items, playback })` →
   `StagePreview` with one Zone `x0 y0 w100 h100`. Lift the mapping from `ReviewStep.tsx:54`.
   Maps `defaultTransition: playback.defaultTransition`,
   `transitionDurationSeconds: playback.transitionDuration`.
6. `preview/playlist-preview.check.mts` — `node:assert`, run with `node <file>`. Cover: one
   full-frame Zone, item mapping, nullable duration passthrough.
7. New route `app/(preview)/media-workspace/preview/playlist/[playlistId]/page.tsx` mirroring the
   composition route. Unsaved Playlist uses literal segment `new`.
8. New `PlaylistPreviewPanel.tsx` (Now Playing + Playlist Information) fed by `onFrameChange`.
   Must label the un-simulated values: `Shuffle (not simulated)`, `Once (preview loops)`,
   `Resume (not simulated)`, `Transition (not simulated)` — or one notice covering all four.
   3 synthetic `geometryOptions` (`1920x1080`, `1080x1920`, `1440x1080`), 16:9 first;
   pass `referenceResolution={null}` and `allowActualSize={false}`.
9. Editor: Preview action opens the tab via BroadcastChannel handoff, disabled at 0 items.
   Capture the id when opening; keep sending that value for the channel lifetime (save mid-preview
   must not restart the clock). Handoff carries only referenced assets, no preview URLs.

**Phase B — #33 editor page**

Copy `layouts/components/LayoutEditorPage.tsx` (301 lines) as the pattern. Delete `PlaylistStepper`,
`BasicInfoStep`, `ContentStep`, `SettingsStep`, `ReviewStep`, `step-validation.ts` (+ `.check.mts`),
`store/usePlaylistDraftStore.ts`, `hooks/usePlaylistDraftSave.ts`, and any component only the stepper
used (check the list in the handoff doc before deleting each). Reuse `RevisionConflictCard.tsx` and
`UnsavedLeaveConfirm.tsx` verbatim. No status control, no Publish button. Row created on first save,
not on page entry — abandoning a new Playlist leaves nothing in DB or Trash. Services
`playlists-api.ts` `upsertPlaylist` + `setPlaylistItems` are likely sufficient — no new endpoints.
Grep for zero remaining references to every deleted symbol.

## Out of scope

Composition-as-Playlist-item, folder rail / trash / tags on the editor (#38/#40/#41), grid/compact
views, and **#42** (making play mode / repeat / transitions actually play). Do not pull forward.

## Verify (ask the user before each browser run — offer: agent drives / checklist / skip)

- `npx tsc` on changed files only (repo tsc is never globally clean — gate on your files)
- `node` each `.check.mts` you touched or added
- Browser: create Playlist → editor, no DB row until Save; first save updates URL without full nav;
  reopen restores name + items + order; unsaved-leave confirm; stale-revision conflict;
  undo/redo; Preview opens full-screen, plays in order with real durations, reframes 16:9/9:16/4:3;
  Now Playing + Playlist Information reflect the Playlist; Composition + Publication preview
  unregressed.

## Finish

PR opens **Draft** if any verify point is unverified — do not mark ready. Ask Thai-or-English for the
PR body. No `Co-Authored-By` / AI mentions in commits. `.docs/SESSIONLOG-playlist-editor-preview-<date>.md`
at the end.
