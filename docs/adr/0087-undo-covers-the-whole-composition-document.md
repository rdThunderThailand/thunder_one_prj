# Undo covers the whole Composition document

**Status:** accepted · 2026-10-07
**Amends:** `0063-create-layout-flow-phase-1.md`, the undo/redo row of its reversal table (client-only undo/redo stands; its scope is set here)
**Source:** MW-003 BUG-01, issue #225; triage in `docs/media-workspace/bug-triage-mw-003.md`

## Context

Removing an item from a Zone's content list cannot be undone. Undo instead reverts an earlier geometry
edit. `useZoneHistory` (`compositions/hooks/useZoneHistory.ts`) stores only `LayoutZone[]`. Bindings
(`ZoneBindingDraft[]`: content plus per-Zone playback `playMode`, `repeat`, `startFrom`, `mediaFit`,
`muted`) and layout settings (aspect ratio, reference resolution, background) live in separate state in
`compositions/components/CompositionEditorPage.tsx` and never take a checkpoint. ADR 0063 adopted
client-only undo/redo but did not say "geometry only"; the scope came from the hook.

More defects sit in the same hook:

- The X/Y/W/H number inputs in `ZonePropertiesPanel` call `beginZoneEdit` on every keystroke, so typing
  `120` makes three undo steps. The image duration input in `ZoneContentList` is continuous too.
- The `past` and `future` stacks have no cap.
- `undo` and `redo` call `setFuture` and `onChange` inside the `setPast` updater, which React StrictMode
  runs twice in development.

The hook is fed computed values (`layout?.zones`), not the raw edit state. Today that is harmless,
because every checkpoint follows the shared-Template confirm.

#220 already resets history after save and fork, and keeps Cmd/Ctrl+Z out of text inputs.

## Decision

### 1. One snapshot of the raw draft state

A history entry is the editor's raw draft state:
`{ editedZones: LayoutZone[] | null, layoutSettings: LayoutSettingsDraft | null, bindings }`.
Undo and redo write these back as they were, so a Zone and its content never get out of step, and a
step that changed no geometry leaves `editedZones` and `layoutSettings` as they were (`null` when
untouched).

Restoring computed values instead would turn an undone content change into a geometry edit: the next
Save would then write a shared Template (`save-composition.ts:90`) without the shared-Template confirm.

**Ids a save has stored are never undone.** A save writes `idempotencyKey` and the inline `playlistId`
into the bindings (`onBindingsChanged`) and may fail after that. A restore keeps the `idempotencyKey`
and inline `playlistId` that the current binding for the same Zone already holds, only when both the
restored and the current binding have `source: 'assets'`. A `source: 'playlist'` binding is restored as
it was, since its `playlistId` names a saved Playlist the operator picked. Otherwise a retry
after Undo would create a second inline Playlist (ADR 0063 §2, 3b).

The Composition's name, tags and folder are not in the snapshot. They are text inputs with the
browser's own undo, which #220 left alone, and putting them in the history would give two undo stacks
for the same keystroke.

### 2. One checkpoint per operator action

A checkpoint is taken before the change, once per action:

- a discrete action: add, remove or reorder a content item, pick a playlist, change a playback setting,
  apply playback to all Zones, reset a binding, add, split, duplicate, align, rename or delete a Zone,
  pick a resolution preset, commit a reference-resolution number (on blur, as today);
- a drag or resize: once, on pointer down (as today);
- a continuous input (X, Y, W, H, image duration, the background color picker): on the first change after
  the input gains focus. Further changes in the same focus do not add steps.

### 3. The shared-Template confirm applies to what writes the `layouts` row

Geometry and layout setting changes write the `layouts` row, so they keep going through `beginZoneEdit`:
the shared-Template confirm, then the checkpoint. Layout setting changes, which today call
`confirmGeometryChange()` without a checkpoint, join that path.

A binding change takes a checkpoint without the confirm. It does not touch the Template.

### 4. History is capped at 100 steps

The oldest step is dropped past 100. Snapshots now carry bindings, so an unbounded stack grows with every
action in a long session.

## Considered and rejected

- **Content list only** (geometry plus add/remove of items). A change to fit or mute that Undo skips is
  the same bug reported again.
- **Include name, tags and folder.** Two undo mechanisms would fight over the same input.
- **Snapshot the computed zones and settings.** See §1: an undone content change would save a shared
  Template unasked.
- **A checkpoint per state change.** Typing and dragging would produce dozens of steps.
- **Checkpoint on blur.** Same result as checkpoint-on-first-change, but it has to hold the value from
  before the edit; the existing `checkpoint()`-before-mutation pattern already does that.

## Consequences

- `useZoneHistory` stores the snapshot instead of `LayoutZone[]`, and `onChange` restores all three
  pieces of state. Its name no longer fits; renaming it is left to the implementer.
- Undo and redo compute the entry outside the state updater, then set `past`, `future` and the three
  pieces of state once.
- Undoing back to the loaded state restores `editedZones === null` and `layoutSettings === null`, and the
  bindings compare equal through `draftSnapshot`, so the editor is clean again and leaving does not ask.
- Client-only. No migration, no API change.
