# Plan — one editor lifecycle module for the three editors (#459)

Issue: https://github.com/rdThunderThailand/thunder_one_prj/issues/459 (tracking #464).
Decision: [ADR 0127](../adr/0127-one-editor-lifecycle-module-for-the-three-editors.md). Read it first; this
plan does not repeat its reasons.
Base: `dev` @ 7ea41ca8. Branch: `refactor/459-editor-lifecycle`. One PR, one commit per step 1–4.
Risk: R1 (cross-file, reversible, frontend only, no Core change).

Names: code names below. **Composition** = "Layout" in the UI, **Layout** = "Template" in the UI.

**Status.** Ready to run. Nothing done yet.

## Ground rules for the executor

- **Behaviour does not change** except where ADR 0127 says so: sidebar/breadcrumb links now ask before
  leaving a dirty editor (all three); the Composition shows `RevisionConflictCard` + Reload on a 409
  conflict, and its Reload drops this tab's geometry edits; the Composition name commits on blur; double
  Save writes once; `UnsavedLeaveConfirm` has new text (ADR 0127 §7); an untouched new Composition
  (blank `/media-workspace/layouts/create`, no seed) no longer asks before the tab closes (ADR 0127 §3).
  Any other visible change is a bug in this work.
- **Do not touch `compositions/save-composition.ts`.** The multi-write sequence and its recovery callbacks
  stay exactly as they are; the Composition adapter calls `persistComposition` the way
  `useCompositionSave.save` does today.
- **No new dependency, no test runner.** Checks run with `node <file>.check.mts`.
- **Do not commit, push, or open a PR** unless the session that started you says so. Never apply anything
  to a database (there is no backend change here).
- **Stop and report** (do not decide) when: the Composition reads dirty right after a successful save in
  any of the four cases of step 3c; a file would need an interface change outside the "Files touched"
  list; or any step needs a design decision this plan does not make.
- Repo rules: `AGENTS.md` (JSX one element per line in files that already do so; design-system tokens
  only), `~/.claude/CLAUDE.md` §8 (no `any`, no dead code, ESLint forbids a synchronous `setState` in a
  `useEffect` body). Files over 300 lines (`CompositionEditorPage.tsx` is 405) must not grow.
- `editor-lifecycle.ts` must be runnable by `node` directly: **no runtime imports** (type-only imports are
  fine), no `@/` alias, no React. Copy how `playlists/playlist-editor-state.ts` and its check import.

## Steps

### 1. The module (commit: `refactor(media-workspace): add the editor lifecycle module`)

Create `src/features/media-workspace/editor-lifecycle/`:

**1a. `editor-lifecycle.ts`** — pure.

```ts
export type LifecycleStatus = "new" | "dirty" | "saved";
export type LifecycleState = {
  baseline: string;            // JSON of the last saved / loaded snapshot
  isSaving: boolean;
  saveError: string | null;
  conflict: string | null;
  lastSavedAt: Date | null;
};
export type LifecycleEvent =
  | { type: "reset"; baseline: string }                        // load, hydrate, reload: also clears error + conflict
  | { type: "save-start" }                                     // clears error + conflict
  | { type: "save-success"; baseline: string; at: Date }       // baseline = snapshot captured at save start
  | { type: "save-failure"; kind: "conflict" | "error"; message: string };
export function initialLifecycle(baseline: string): LifecycleState;
export function reduceLifecycle(state: LifecycleState, event: LifecycleEvent): LifecycleState;
export function lifecycleStatus(state: LifecycleState, current: string, hasRow: boolean): LifecycleStatus;
  // current !== baseline → "dirty"; else hasRow || lastSavedAt → "saved"; else "new"
export function createSaveSlot<A extends unknown[], R>(run: (...args: A) => Promise<R>): (...args: A) => Promise<R>;
  // while a run is in flight, every call returns that same promise (its arguments are dropped);
  // the slot frees in finally
export function failureKind(kind: string, hasReload: boolean): "conflict" | "error";
  // kind === "conflict" && hasReload → "conflict"; anything else → "error" (ADR 0127 §5)
export function savedBaseline<S, R>(start: S, result: R, savedSnapshot?: (start: S, result: R) => S): string;
  // JSON.stringify(savedSnapshot ? savedSnapshot(start, result) : start) (ADR 0127 §3)
```

`save-failure` never moves the baseline. `save-success` clears `isSaving`, sets `lastSavedAt`.

**1b. `editor-lifecycle.check.mts`** — node:assert, the twelve cases of ADR 0127 §12:

1. `initialLifecycle(x)` with current `x`, `hasRow` true → `saved`.
2. current `y` → `dirty`; current back to `x` → `saved`.
3. `save-start` then `save-success{baseline: y}` with current `y` → `saved`, `lastSavedAt` set.
4. Save started at `y`, current moved to `z` during the save, `save-success{baseline: y}` → `dirty`.
5. `save-failure{kind:"error"}` → baseline unchanged, `saveError` set, `conflict` null, `isSaving` false.
6. `save-failure{kind:"conflict"}` → `conflict` set, `saveError` null.
7. After 6, `reset{baseline: w}` → `conflict` null, baseline `w`.
8. `ensureSaved` logic: model it as the hook does (not dirty → `true` without calling the run; failed run
   → `false`). If this needs the hook, export a small pure `ensureSavedWith(isDirty, save)` helper and
   test that instead.
9. `hasRow` false, never saved, current = baseline → `new`.
10. `createSaveSlot`: call twice before the first resolves → `run` called once, both get the same value;
    a third call after it settles runs again; a rejected run frees the slot.
11. `failureKind("conflict", false)` → `"error"`; `failureKind("conflict", true)` → `"conflict"`;
    `failureKind("rejected", true)` → `"error"`.
12. `savedBaseline(start, result)` = `JSON.stringify(start)`; with `savedSnapshot` it is the JSON of
    `savedSnapshot(start, result)`.

Run: `node src/features/media-workspace/editor-lifecycle/editor-lifecycle.check.mts`.

**1c. Move the shared pieces** with `git mv` (keep history), then fix every importer:

| From | To | Importers to update |
|---|---|---|
| `publications/hooks/useLeaveGuard.ts` | `editor-lifecycle/useLeaveGuard.ts` | `publications/components/PublicationEditPage.tsx:24` (path only) |
| `playlists/components/UnsavedLeaveConfirm.tsx` | `editor-lifecycle/components/UnsavedLeaveConfirm.tsx` | `PlaylistEditorPage.tsx:29`, `LayoutEditorPage.tsx:9`, `CompositionEditorOverlays.tsx:9` (these go away in steps 2–4; in step 1 just repoint them) |
| `playlists/components/RevisionConflictCard.tsx` | `editor-lifecycle/components/RevisionConflictCard.tsx` | `PlaylistEditorPage.tsx:28` |

Change `UnsavedLeaveConfirm`'s text only: title `ออกโดยไม่บันทึก?`, description
`การแก้ไขที่ยังไม่บันทึกจะหายไป`. Buttons and styling unchanged.

**1d. `useEditorLifecycle.tsx`** — the hook, interface exactly as ADR 0127 §2. Implementation notes:

- `useReducer(reduceLifecycle, snapshot, (s) => initialLifecycle(JSON.stringify(s)))`.
- `current = JSON.stringify(snapshot)` each render; `isDirty = current !== state.baseline`;
  `status = lifecycleStatus(state, current, hasRow)`.
- `save(intent?, snapshotOverride?)`: the slot (from `createSaveSlot`, kept in a `useRef` so it survives
  renders) wraps: `const s = snapshotOverride ?? snapshot` (the render's closure — no ref needed),
  dispatch `save-start`, `await write(s, intent)`, dispatch
  `save-success{baseline: savedBaseline(s, result, savedSnapshot)}`, call `onSaved?.(result, intent)`,
  return the result. On throw: `classifyApiError(err, fallbackError)` (`@/lib/api/api-error` — fine in
  the hook, not in the pure file), dispatch `save-failure{kind: failureKind(classified.kind, !!reload)}`;
  return `null`. Because the slot lives in a ref while `write` comes
  from the render, have the slot call a ref that is updated to the latest `run` each render
  (in an effect, not during render).
- `ensureSaved = async () => !isDirty || (await save()) !== null`.
- `resetBaseline(s)` dispatches `reset{baseline: JSON.stringify(s)}`.
- `reloadFromServer = async () => { await reload?.() }` — the editor's `reload` calls `resetBaseline`,
  which clears the conflict.
- Leave guard: `const [pendingHref, setPendingHref] = useState<string | null>(null)`;
  `useLeaveGuard(isDirty, onLeave)` with a `useCallback`-stable `onLeave = setPendingHref`;
  `requestLeave(href)` → `isDirty ? setPendingHref(href) : router.push(href)`;
  `leaveDialog = pendingHref ? <UnsavedLeaveConfirm onStay={() => setPendingHref(null)} onLeave={() => { setPendingHref(null); router.push(pendingHref); }} /> : null`.
  `useLeaveGuard` already owns `beforeunload` — so each editor's inline `beforeunload` effect is deleted.

Checks: the 1b check; `npx tsc --noEmit`; `npx eslint src/features/media-workspace/editor-lifecycle
src/features/media-workspace/publications/components/PublicationEditPage.tsx`.

### 2. Playlist (commit: `refactor(media-workspace): run the Playlist editor on the lifecycle module`)

**`playlists/components/usePlaylistEditorRow.ts`**

- Keeps: load / `hydrate`, `serverId`, `revision`, `status`, `inUseCount`, the idempotency key ref,
  `loading`, `loadError`.
- Removes: `savedSnapshot`, `lastSavedAt`, `saving`, `saveError`, `conflict` state, and the try/catch
  classification. These come from `useEditorLifecycle` called inside this hook.
- Snapshot: `{ state: history.present, info }` (replaces the `baseline()` string helper).
  `hasRow: !!serverId`. `fallbackError: "บันทึก Playlist ไม่สำเร็จ"`. `reload`: today's
  `reloadFromServer` body (`hydrate(await fetchPlaylist(id))`).
- `hydrate` calls `lifecycle.resetBaseline({ state, info: loadedInfo })` where it set `savedSnapshot`.
- `write(snapshot, intent: { activate: boolean })`: the body of today's `save` from `upsertPlaylist`
  to `setRevision`, writing `snapshot.state` / `snapshot.info` (not `history.present`). An empty name
  throws `new UserFacingError("กรุณากรอกชื่อ Playlist ก่อนบันทึก")` (find `UserFacingError` in
  `src/lib/api/api-error.ts`). Returns the playlist id. No `savedSnapshot` (default rule).
- `onSaved(id, intent)`: `replaceState` for a new row, `setServerId`, the activate → `active` status
  update, the toast — all as today.
- Public `save(activate = false, nameOverride?)` keeps its signature for the page and header. Keep
  today's order: build `present` with the override; if `present.name.trim()` is empty, do **not**
  `history.commit` (an empty name must not become an undo step) and let `write` throw the
  `UserFacingError`; otherwise, when the name differs, `history.commit` it as today. Then
  `lifecycle.save({ activate }, { state: present, info })`.
- Return shape: replace `isDirty, lastSavedAt, saving, saveError, conflict, reloadFromServer` with the
  lifecycle's values under the same names, plus `status` (lifecycle) as `saveStatus`, `requestLeave`,
  `leaveDialog`. Keep the existing `status` (Playlist display status) name as it is.

**`playlists/playlist-editor-state.ts`** — `savedStateLabel(status: LifecycleStatus, lastSavedAt)`:
`dirty` → `"unsaved changes"`; `new` → `"not saved yet"`; `saved` → `saved <time>` or `"saved"`. Same
strings as today. `editorSnapshot` stays if anything else uses it; otherwise delete it.

**`playlists/components/PlaylistEditorPage.tsx`**

- Delete the inline `beforeunload` effect (:78-83), `confirmLeave` state, the `UnsavedLeaveConfirm`
  block (:218-220). `goBack` → `row.requestLeave(LIST_PATH)`. Render `{row.leaveDialog}`.
- `publishPlaylistChanges`: `if (!(await row.ensureSaved())) throw new Error("save failed")`.
- `publishPrep` / `publishDisabledReason`: unchanged apart from reading `row.isDirty`.
- `RevisionConflictCard` from the new path. `savedLabel = savedStateLabel(row.saveStatus, row.lastSavedAt)`.

**`playlists/components/PlaylistEditorHeader.tsx`** — add prop `isUnsaved: boolean` (page passes
`row.saveStatus !== "saved"`); delete the `savedLabel.includes(...)` line (:79).

Checks: `node src/features/media-workspace/playlists/playlist-editor-state.check.mts`, every other
`*.check.mts` in `playlists/`, `npx tsc --noEmit`, `npx eslint` on the changed files.

### 3. Composition (commit: `refactor(media-workspace): run the Composition editor on the lifecycle module`)

**3a. `compositions/hooks/useCompositionSave.ts`** — becomes the adapter plus the non-lifecycle writes:

- `write = async () => { const result = await persistComposition(buildInput()); applyResult(result);
  if (result.warnings.length > 0) toast.warning(...); return result; }` — `applyResult` minus its
  `setInitialSnapshot` line (the module now moves the baseline).
- `run` stays for fork-layout and Save as Template, with its own `busy` flag and `runError` slot
  (rename from `saving` / `saveError` so nothing confuses them with the lifecycle's).

**3b. `CompositionEditorPage.tsx`**

- `useEditorLifecycle({ snapshot, hasRow: id != null, write, reload, savedSnapshot, fallbackError: "บันทึก Layout ไม่สำเร็จ" })`
  — `snapshot` and `savedSnapshot` per 3c.
- Extract the body of the load effect (:114-139) into `loadDraft()` used by both the effect and
  `reload`; it calls `lifecycle.resetBaseline(...)` where it called `setInitialSnapshot(draft.snapshot)`,
  with a snapshot built from the loaded `draft` (not from render state, which is still the old one).
- `reload = async () => { setEditedZones(null); setLayoutSettings(null); setBlankZones(null); resetHistory(); await loadDraft(); }`
  — Reload must drop this tab's geometry edits and undo history (ADR 0127 §5).
- The Create-seed effect (:73-110) never calls `resetBaseline`: a new Composition's baseline is its first
  render, so a seeded one reads dirty and a blank `/create` reads clean (ADR 0127 §3, intended).
- Delete: `isDirty` (:141), the `beforeunload` effect (:143-148), `confirmLeave` state,
  `initialSnapshot` state. Use `lifecycle.isDirty` everywhere `isDirty` was read
  (`hasUnsavedChanges`, the publish flows).
- `onBack` → `lifecycle.requestLeave(LIST_PATH)`; render `{lifecycle.leaveDialog}`; render
  `{lifecycle.conflict && <RevisionConflictCard message={lifecycle.conflict} onReload={lifecycle.reloadFromServer} />}`
  where `saveError` is shown today.
- `onSaveDraft` → `if (await lifecycle.save()) router.push(LIST_PATH)`.
- `onActivate` and `saveForPublish(activate)`: `const result = await lifecycle.save(); if (!result) return null;`
  then, when activating, do `setCompositionStatus(result.compositionId, "active")` + `setStatus("active")`
  inside `run(…, "เปิดใช้งาน Layout ไม่สำเร็จ")` (ADR 0127 §11: a failed activation shows in the
  `run` error slot and never un-saves the draft). `run` swallows the error and returns `void`, so track
  success with a flag set as the last line inside the operation (the pattern
  `publishCompositionChanges` uses today). A failed activation: `saveForPublish` returns `null` (the
  publish prep must not go on with an inactive Composition) and `onActivate` does not navigate — both as
  today. A plain save (`activate` false) returns `result.compositionId`.
- `publishCompositionChanges`: `if (!(await lifecycle.ensureSaved())) throw new Error("save failed")`.
- Buttons that were disabled on `saving` → `lifecycle.isSaving || busy`.

**3c. Snapshot and saved baseline** (ADR 0127 §3 — keep today's dirty definition, move it into the
module):

- `snapshot = { draft: { name, layoutId, bindings, folderId, tags }, pendingGeometry: editedZones !== null || layoutSettings !== null || (blankZones !== null && !layoutId) }`.
  `draft` is today's `draftSnapshot` input. In `load-composition-draft.ts`, change `draftSnapshot` to
  return that object (type it, e.g. `CompositionDraftFields`) instead of a JSON string, and the
  `CompositionDraft.snapshot` field to that type; the module does the stringify.
- `savedSnapshot = (start, result) => ({ draft: { ...start.draft, layoutId: result.layoutId, bindings: result.bindings }, pendingGeometry: false })`
  — the same values #454's `setInitialSnapshot(...)` uses today (`CompositionEditorPage.tsx:194`).
- After `resetBaseline` from a load: `pendingGeometry: false`.

The four save cases that must read saved right after a successful save: (1) a new blank or preset
Composition, first save; (2) an asset-bound Zone whose inline Playlist is created by this save; (3) a
new Zone added to an existing Composition; (4) an existing Composition on an unedited Template, name
change only. Trace each through `persistComposition` and `savedSnapshot` and say in your report why it
reads saved; stop and report if one does not. The main session checks them in the browser (step 9 below).

**3d. `CompositionEditorOverlays.tsx`** — drop `confirmLeave` / `onStay` / `onLeave` and the
`UnsavedLeaveConfirm` import; `saveError` shows `lifecycle.saveError ?? runError`; `saving` prop →
`lifecycle.isSaving || busy`.

**3e. `CompositionEditorHeader.tsx`** — name input commits on blur like the Playlist header
(`PlaylistEditorHeader.tsx:80-92,117-134`): an `isClosingName` ref, `onBlur` → commit unless closing,
Enter / ✓ commit, Escape cancels. Nothing else in the header changes; it keeps showing its own `savedAt`
(`Updated HH:MM` from the server's `updated_at`), not the module's `lastSavedAt` (ADR 0127 §9).

Checks: every `*.check.mts` in `compositions/` (`node <file>`), `npx tsc --noEmit`, `npx eslint` on the
changed files. `CompositionEditorPage.tsx` must end ≤ 405 lines.

### 4. Layout (commit: `refactor(media-workspace): run the Layout editor on the lifecycle module`)

**`layouts/components/LayoutEditorPage.tsx`**

- `useEditorLifecycle({ snapshot: draft, hasRow: !!draft.id, write, fallbackError: "บันทึก Layout ไม่สำเร็จ", onSaved: () => router.push("/media-workspace/layouts/templates") })`
  — **no `reload`** (ADR 0127 §8).
- `write(d)` = today's `upsertLayout({...})` call with `d`'s fields.
- Load: `lifecycle.resetBaseline(loaded)` where it called `setInitial(loaded)`; delete `initial` state if
  nothing else reads it.
- Delete: `isDirty` (:79), the `beforeunload` effect (:81-86), `confirmLeave` state, the
  `UnsavedLeaveConfirm` block (:207-212), `saving` / `saveError` state.
- `goBack` → `lifecycle.requestLeave("/media-workspace/layouts/templates")`; render `{lifecycle.leaveDialog}`.
- `handleSave`: keep the shared-Layout confirm first (`usageCount > 1`), then `await lifecycle.save()`.
- The error banner reads `lifecycle.saveError`; the header gets `isDirty={lifecycle.isDirty}` and
  `saving={lifecycle.isSaving}` (`LayoutEditorChrome.tsx` unchanged unless a prop name forces it).

Checks: every `*.check.mts` in `layouts/`, `npx tsc --noEmit`, `npx eslint` on the changed files.

### 5. Final checks (no commit)

- `node` every `*.check.mts` under `src/features/media-workspace/editor-lifecycle/`, `playlists/`,
  `compositions/`, `layouts/`, `publications/`.
- `node src/design-system/design-system.check.mts`.
- `npx tsc --noEmit` (if it is suspiciously clean, `rm -rf .next/dev/types` first), `npm run lint`.
- `rg -n "beforeunload" src/features/media-workspace` → only `editor-lifecycle/useLeaveGuard.ts` and the
  five unrelated users, which stay untouched: the three preview-session handoffs
  (`use-playlist-preview-handoff.ts`, `useCompositionPreview.ts`, `usePublicationPreviewHandoff.ts`),
  `player-releases/new-release-dialog.tsx` and `assets/upload/useUploadQueue.ts`.
- `rg -n "UnsavedLeaveConfirm|RevisionConflictCard|useLeaveGuard" src` → imports only from
  `editor-lifecycle/`.

## Browser verification (the main session asks the owner first — CLAUDE.md §3)

Against the local dev server on the develop backend, in each editor (Playlist, Composition, Layout):

1. Open an existing row → header reads saved; edit → unsaved; undo the edit back → saved (Playlist,
   Composition).
2. Dirty, click a sidebar link → `ออกโดยไม่บันทึก?` dialog; อยู่ต่อ keeps the edit; ออกโดยไม่บันทึก leaves.
3. Dirty, the editor's back button → same dialog. Clean → leaves with no dialog.
4. Dirty, reload the tab → the browser's own leave prompt.
5. Save → saved; reload the page → no prompt. Double-click Save → one write in the Network tab.
6. Playlist and Composition: open the same row in two tabs, save in tab A, then edit and save in tab B
   → `RevisionConflictCard`; Reload → tab B shows tab A's version, header saved. For the Composition,
   edit only the name and bindings: geometry is written before the 409 and is a known limit (ADR 0127 §5).
7. Composition: edit the name, click elsewhere → the name sticks; Escape cancels.
8. Composition: Publish Changes with unsaved edits saves first; Save & Activate from the publish prep
   dialog saves and activates.
9. Composition: a new Layout from the Create wizard (seeded) opens dirty — closing the tab asks; a
   blank `/media-workspace/layouts/create` with no seed opens clean and closing asks nothing (intended
   change, ADR 0127 §3). The four save cases of step 3c all read saved right after saving.
10. Layout: Save returns to the list; a shared Layout still asks "used by N" first.
11. Program edit page (`PublicationEditPage`): dirty + sidebar link still opens its own Discard dialog.

Test rows: name them `zz-459-*` on develop; deleting them later is R0.

## Files touched

New (`src/features/media-workspace/editor-lifecycle/`):
`editor-lifecycle.ts`, `editor-lifecycle.check.mts`, `useEditorLifecycle.tsx`, `useLeaveGuard.ts` (moved),
`components/UnsavedLeaveConfirm.tsx` (moved), `components/RevisionConflictCard.tsx` (moved).

Changed (`src/features/media-workspace/`):

- `publications/components/PublicationEditPage.tsx` (import path only)
- `playlists/components/usePlaylistEditorRow.ts`
- `playlists/components/PlaylistEditorPage.tsx`
- `playlists/components/PlaylistEditorHeader.tsx`
- `playlists/playlist-editor-state.ts`
- `compositions/components/CompositionEditorPage.tsx`
- `compositions/components/CompositionEditorHeader.tsx`
- `compositions/components/CompositionEditorOverlays.tsx`
- `compositions/hooks/useCompositionSave.ts`
- `compositions/load-composition-draft.ts` (only `draftSnapshot`'s return type and the `snapshot` field, step 3c)
- `layouts/components/LayoutEditorPage.tsx`
- `layouts/components/LayoutEditorChrome.tsx` (only if a prop name forces it)

Removed (moved away): `publications/hooks/useLeaveGuard.ts`,
`playlists/components/UnsavedLeaveConfirm.tsx`, `playlists/components/RevisionConflictCard.tsx`.

Must not change: `compositions/save-composition.ts`, anything under `src/lib/api/`.

Overlap with #479: `CompositionEditorPage.tsx` and `usePlaylistEditorRow.ts`. #479 starts after this PR
merges.

## Follow-ups (not in this PR)

- **Core issue to file (draft; not filed — owner files it or asks for it):**
  > **Layout save has no optimistic lock.** `media_core.layouts` has no `revision`, and
  > `media_layout_upsert` deletes and reinserts Zones with no concurrency check, so two people editing
  > the same Template overwrite each other silently; a shared Template changes every Composition that
  > uses it. Add `revision integer NOT NULL DEFAULT 1`, an optional `expected_revision` on
  > `PATCH layouts/[id]` raising `Already modified: layout was changed elsewhere` (409, ADR 0003 style),
  > and return the new revision. Frontend side is one adapter change (ThunderOne ADR 0127 §8).
- The Playlist's `PUT …/items` has no revision check (pre-existing; ADR 0003 accepts a first-write check).
- Browser back button (`popstate`) is not guarded in any editor (ADR 0127 §6).
