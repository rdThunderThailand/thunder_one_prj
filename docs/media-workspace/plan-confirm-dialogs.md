# Plan: replace `window.confirm` with a modal confirm dialog (Media Workspace)

Status: implemented on `refactor/confirm-dialogs`, Draft PR → `dev`. Tag: R1 (cross-file refactor, reversible, no new dependency).

## Why
`window.confirm` is swallowed by the in-app browser pane (the button silently does nothing), blocks the main thread, and is
unstyled. Media Workspace already has a modal pattern (`useSharedWriteConfirm`, `AlertDialog` in `components/ui/lovable/`).

## Decision
One hook, `content-library/useConfirmDialog.tsx`: `confirm({ title, description, confirmLabel?, isDestructive? }) → Promise<boolean>`
plus a `dialog` node rendered once next to the caller. Esc / backdrop = Cancel. A second `confirm()` while one is open resolves the first as `false`.
`useSharedWriteConfirm` keeps its own copy (different wording and call shape); not merged here.

## Sites migrated (7 `window.confirm` → 0 in `src/features/media-workspace/`)
| Site | File | Kind |
|---|---|---|
| Layouts bulk Trash / Restore / Delete | `compositions/components/CompositionsListPage.tsx` | `await` |
| Playlists bulk Trash / Restore / Delete | `playlists/use-trash-batch.ts` (hook returns `confirmDialog`) | `await` |
| Template editor: change aspect ratio | `layouts/components/LayoutEditorPage.tsx` | `.then` (inside sync setter) |
| Template editor: save a shared Template | `layouts/components/LayoutEditorPage.tsx` `handleSave` | `await` |
| Composition editor: "Make own copy" | `compositions/components/CompositionEditorPage.tsx` `handleForkLayout` | `await` |
| Layout picker: "Leave and create a Template?" | `layouts/components/LayoutTemplatePicker.tsx` | `.then` |
| Shared-Template geometry guard | `compositions/hooks/useZoneEditGuard.ts` | behaviour change (below) |

## Behaviour change to know about
`useZoneEditGuard` was a synchronous gate (`confirm` → true/false). A modal is async, so the **first** edit on a shared Template is
refused while the modal opens; after "Continue editing" the operator repeats the edit. Asked once per session, as before.
Alternative (not taken): make the gate async and replay the edit — larger change across every zone-edit handler.

## Verification status
- `tsc --noEmit`, eslint on changed files: pass.
- Browser (localhost → Core :3001 → develop): Layouts bulk Trash (Esc = cancel, confirm moves 4), permanent-delete modal,
  Playlists bulk Trash (Cancel), Template editor aspect-ratio modal (Cancel keeps; Change applies to the draft only).
- **Not verified** (develop has no Template-based Compositions): save to shared Template, "Make own copy",
  shared-Template geometry guard, picker "Leave and create a Template?". PR stays Draft until these are exercised.

## Remaining / out of scope
- Merge `useSharedWriteConfirm` into `useConfirmDialog` — only if the wording stays the only difference.
- Outside Media Workspace: check `git grep window.confirm src` before claiming the app is `confirm`-free.
