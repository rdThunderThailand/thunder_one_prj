# 0127 — One editor lifecycle module for the Playlist, Composition and Layout editors

Status: accepted (2026-11-25, owner decisions in the #459 design grill: two rounds, then a third
after an outside review of this ADR found the Composition baseline problem in §3).
**Workspace:** media
**Extends:** ADR 0060 §2 (leaving with unsaved edits is confirmed — now in every editor) · ADR 0003
(revision conflict on the first write) · ADR 0078 §6 and ADR 0116 §6 (save before publish) · ADR 0126
(`kind: "conflict"` from the refusal table).
**Relates to:** GitHub #459 (this decision), #464 (architecture review round 2), #454 / #455 (the fixes
that showed the drift), #479 (refusal links, lands after this on the same files); ADR 0063 §2 and
ADR 0088 §4 (Composition multi-write save); ADR 0087 (Composition undo); ADR 0123 (success is a toast).

Names: code names are used below. **Composition** is "Layout" in the UI; **Layout** is "Template" in the
UI (`src/config/nav/media-workspace.tsx`).

## Context

Three editors each wrote their own mechanics around saving. Every fix landed in one and the other two
drifted. State on `dev` at `7ea41ca8` (after #454 and #455):

| | Playlist | Composition | Layout |
|---|---|---|---|
| Dirty check | `JSON.stringify` vs a baseline reset on save (`usePlaylistEditorRow.ts:15,70,114`) | edit flags `editedZones`/`layoutSettings` + `draftSnapshot` vs `initialSnapshot` (`CompositionEditorPage.tsx:141`), reset on save since #454 | `JSON.stringify(draft) !== JSON.stringify(initial)` (`LayoutEditorPage.tsx:79`), set on load only — a save navigates away |
| Close tab | inline `beforeunload` (:78-83) | inline copy (:143-148) | inline copy (:81-86) |
| Sidebar / breadcrumb links | not guarded | not guarded | not guarded |
| Editor back button | `UnsavedLeaveConfirm` | same (via `CompositionEditorOverlays`) | same |
| Double save | disabled button only | disabled button only | disabled button only |
| Revision conflict | `RevisionConflictCard` + reload | generic error text, no reload | no revision in Core |
| Name commit on blur | yes | no (Enter / ✓ only) | in the settings panel |
| Header state | `savedLabel.includes("unsaved")` (`PlaylistEditorHeader.tsx:79`) | `Updated HH:MM` / `Not saved` | `isDirty ? "Unsaved changes" : "Saved"` |

`useLeaveGuard` (`publications/hooks/useLeaveGuard.ts`) already guards in-app anchors in the capture
phase and the tab close, but only `PublicationEditPage` uses it. `UnsavedLeaveConfirm` lives in
`playlists/components/` and is imported sideways by the other two editors; its text still speaks of a
draft "left in this browser and overwritten by another playlist", which has not been true since ADR 0060
removed the browser draft.

Core (`Thunder_Core` `origin/develop`, baseline migration `20261026235959`):

- Playlists: `PATCH playlists/[id]` takes `expected_revision` and raises `Already modified: draft was
  changed elsewhere` (409). The second write, `PUT playlists/[id]/items`, has no revision check and bumps
  `revision`.
- Compositions: `PUT compositions/[id]` and `PUT compositions/[id]/zones` both check `expected_revision`
  (`Already modified: composition was changed elsewhere`, 409) and both return the new revision.
- Layouts: `media_core.layouts` has **no** `revision` column; `media_layout_upsert` deletes and reinserts
  Zones with no concurrency check. `updated_at` is set on every update but never compared. Last write wins.

## Decision

**1. One deep module, `useEditorLifecycle`, owns the save lifecycle of all three editors.** Each editor
hands it an adapter — its current `snapshot` and a `write` — and gets back everything around the write.
The behaviour lives in a pure reducer (`editor-lifecycle.ts`, no React) that the check exercises; the hook
is a thin React adapter over it. The Composition multi-write sequence (`save-composition.ts`, its
recovery callbacks and idempotency keys) stays inside the Composition's `write` adapter; the module does
not know it exists.

**2. Interface.**

```ts
useEditorLifecycle<S, I, R>({
  snapshot: S,                                    // current draft content; compared via JSON.stringify
  hasRow: boolean,                                // false = a new editor that was never saved
  write: (snapshot: S, intent?: I) => Promise<R>, // the editor's adapter; throws on failure
  reload?: () => Promise<void>,                   // omitted = the editor has no revision (Layout)
  fallbackError: string,
  onSaved?: (result: R, intent?: I) => void,      // toast, navigate, replaceState stay with the editor
  savedSnapshot?: (start: S, result: R) => S,     // baseline after a save; omitted = `start` (§3)
}) → {
  status: "new" | "dirty" | "saved",  isSaving: boolean,  lastSavedAt: Date | null,
  isDirty: boolean,
  save(intent?: I, snapshot?: S): Promise<R | null>, // null = failed; saveError or conflict is set
  ensureSaved(): Promise<boolean>,                // save before publish; not dirty → true, no write
  saveError: string | null,  conflict: string | null,  reloadFromServer(): Promise<void>,
  resetBaseline(snapshot: S): void,               // after load / hydrate
  requestLeave(href: string): void,               // editor back button
  leaveDialog: ReactNode,                         // UnsavedLeaveConfirm when a leave is pending
}
```

- `intent` carries Save & Activate to an adapter that needs it (Playlist's `save(true)`).
- `save`'s optional `snapshot` is the value to write when the caller holds a fresher one than the last
  render: the Playlist's Save click while the name field is still open, where the typed name has not
  reached state yet (`nameOverride`; UAT A8 found a Save that dropped the typed name). It defaults to
  the latest rendered `snapshot`, and the module hands `write` the snapshot being saved. An adapter whose
  `write` rebuilds its input from live editor state (the Composition's, through `buildInput`) ignores that
  argument, so its `save` must not be given an override.
- Loading stays with each editor: the ADR 0086 seed and `load-composition-draft.ts` differ too much to
  share. The editor calls `resetBaseline` with the value it loaded.
- Revision tokens stay in the adapter (`expected_revision` in, new revision out).
- `isSaving` is separate from `status`: a Save & Activate on an unchanged draft is saving while `saved`,
  and every header today keeps its saved/unsaved text during a save.
- Validation before the write (an empty Playlist name) is the adapter throwing `UserFacingError`;
  `classifyApiError` shows its message as-is.

**3. Baseline rule.** After a successful save the baseline is the snapshot captured **when the save
started**, unless the adapter passes `savedSnapshot`. Edits made while the save is in flight therefore
keep the editor dirty. A failed save does not move the baseline. The initial baseline is the first
rendered `snapshot`; an editor calls `resetBaseline` only after loading a stored row.

- **Playlist and Layout** use the default: their `write` does not change the draft.
- **Composition** passes `savedSnapshot`, because `persistComposition` changes the draft while it saves:
  it adds idempotency keys and inline Playlist ids to bindings, sets `layoutId` when it creates a Layout,
  and remaps Zone ids to the ones the server minted (`save-composition.ts:85,131,142,181`). The start
  snapshot can never equal the state after the save. The Composition keeps today's snapshot —
  `draftSnapshot`'s fields plus whether `editedZones` / `layoutSettings` / an unsaved `blankZones` are
  pending — and computes the saved baseline from `result`, as the #454 fix does today
  (`CompositionEditorPage.tsx:194`): saved `layoutId` and `bindings`, nothing pending.
- **A new Composition opened with no Create-wizard seed starts clean** (`new`). Today its baseline starts
  as `""`, so an untouched new Composition asked before the tab closed. This is an intended change: it
  now behaves like a new Playlist. A seeded one stays dirty, since the seed is applied after the first
  render and never calls `resetBaseline`.

**4. One save slot.** A `save()` while one is in flight returns the in-flight promise; it never writes
twice. The second call's `intent` is dropped: a Save & Activate pressed during a plain save gets the
plain save's result. Buttons stay disabled while saving as today, so this needs no handling.

**5. Conflict → reload.** A failure classified `kind: "conflict"` (ADR 0126) sets `conflict`, not
`saveError`, and the editor renders `RevisionConflictCard`; *Reload* calls the adapter's `reload` and then
clears the conflict. This now applies to the Composition, which showed plain text. An editor without
`reload` gets any conflict as `saveError` (a pure helper, so the check covers it).

The Composition's reload also drops its local geometry edits and undo history (`editedZones`,
`layoutSettings`, `blankZones`, the zone history), so Reload really shows the other tab's version.
Known limit: the Composition's 409 comes from `upsertComposition`, which runs *after* `upsertLayout` has
already written edited geometry with no lock (§8). A conflicting save therefore still overwrites the
Zone geometry before the conflict appears; Reload recovers names and bindings, not geometry. This is the
Layout lock gap, not a new one, and closes when Core adds a Layout `revision`.

**6. Every editor confirms leaving with unsaved edits** (extends ADR 0060 §2 from the Playlist to all
three). While dirty the module guards: tab close and reload (`beforeunload`), every same-origin anchor
(sidebar, breadcrumb — `useLeaveGuard`'s capture-phase click), and the editor's own back button
(`requestLeave`). Not guarded: the browser's back button (`popstate`) and programmatic `router.push`.
Next 16.2 has no navigation-blocking API (`node_modules/next/dist/docs`: only per-Link `onNavigate`), and
a fake history entry is fragile. This is a known limit, not an oversight. Another unguarded programmatic
navigation: Global Search (Cmd+K, `GlobalSearch.tsx`, `router.push`) opens a hit without asking.

**7. The shared pieces move into the module.** `useLeaveGuard`, `UnsavedLeaveConfirm` and
`RevisionConflictCard` move to `src/features/media-workspace/editor-lifecycle/`. `PublicationEditPage`
changes only its import path and keeps its own Discard dialog. `UnsavedLeaveConfirm`'s text becomes
neutral and true for every editor: title **ออกโดยไม่บันทึก?**, description **การแก้ไขที่ยังไม่บันทึกจะหายไป**,
buttons unchanged (อยู่ต่อ / ออกโดยไม่บันทึก).

**8. Layout has no optimistic lock, and that is accepted for now.** Saving a Layout stays last-write-wins.
The module supports an adapter without `reload`, so when Core adds a `revision` the Layout adapter starts
sending it and passes `reload` — no module change. A Core follow-up issue is drafted in the plan, not
filed. Layout edits are rare and a shared Layout already asks before saving ("used by N Compositions").

**9. Behaviour each editor keeps.** The Layout editor still returns to its list after a save (`onSaved`
navigates, after the module has reset the baseline). Header copy stays per editor; headers read `status`
and `isSaving` instead of parsing a label. The Playlist header reads the module's `lastSavedAt`; the
Composition header keeps its own `savedAt`, which comes from the server's `updated_at` on load
(`Updated HH:MM`), since the module's `lastSavedAt` is null until the first save in the tab. The success toast (ADR 0123) stays where it is
today: in the Playlist's `onSaved`.

**10. The Composition name commits on blur**, as the Playlist's does: blur, Enter and ✓ commit, Escape
cancels, a ref stops a double commit. This is header input handling, not lifecycle, but ships with it.

**11. Outside the module.** Undo/redo and their shortcuts (`useUndoableState`, `useZoneHistory`, ADR
0087) keep their own history shapes; no Cmd+S is added. The Composition's other writes — fork-layout and
Save as Template (`useCompositionSave.run`) — keep their own in-flight flag and error slot; their buttons
are disabled while `isSaving || busy`. Activation after a Composition save is one of those writes (plan
step 3), so a failed activation never un-saves a saved draft.

**12. Check.** `editor-lifecycle.check.mts` (node:assert, no runner) drives the reducer and the save slot
through: load = saved; edit = dirty and an edit back = clean; success moves the baseline to the start
snapshot; an edit during a save stays dirty; failure keeps the baseline and sets the error; conflict sets
`conflict` not `saveError`; reload clears the conflict and resets the baseline; `ensureSaved` with no
edits writes nothing and returns true, and returns false on a failed save; no row = `new`; two saves in
flight write once; a conflict with no `reload` lands in `saveError`; `savedSnapshot` sets the baseline
when given. `useLeaveGuard` needs a DOM and is verified in the browser.

## Not chosen

- **A kit of small hooks** (`useUnsavedGuard`, `useSaveSlot`, `useConflict`) composed per editor. Shallow:
  the ordering — when the baseline moves, whether a conflict replaces the error — would stay spread over
  three editors, which is the drift this fixes. Delete such a kit and almost nothing is lost: each editor
  still carries the ordering, so the kit does not earn its interface.
- **Extracting only the guard** (`beforeunload` + nav + dialog). Smallest diff, but the #454 class
  (baseline) and the missing Composition reload stay hidden in each editor.
- **A Layout `revision` column now** (ADR 0003 style), or **`updated_at` as the token**. Both are Core
  changes with a prod migration; tying them to a frontend refactor would block it. `updated_at` is also a
  weaker token than an integer. Left as the follow-up in §8.
- **`write` always returns the new baseline.** Every editor would decide what "saved" means, which is
  the mistake #454 was. The optional `savedSnapshot` keeps the Playlist and Layout on the default rule and
  limits that decision to the one editor whose save changes its own draft.
- **A content-only Composition snapshot** (a pure `compositionSnapshot()` that drops idempotency keys,
  inline Playlist ids and server Zone ids, and keys bindings by Zone position). It would keep one baseline
  rule for all three editors. Rejected because it is new logic that must know everything
  `save-composition.ts` changes: a later change to the save that forgets it brings #454 back. Also, list
  rows overwrite the loaded Layout (`useCompositionEditorData.ts:88`), so list/detail differences would
  read as edits. `savedSnapshot` reuses the computation the #454 fix already proved.
- **`runExclusive(op)` on the module** for the Composition's other writes. One caller; a seam with one
  adapter is hypothetical.
- **Guarding the browser back button** with a sentinel history entry, or `Link onNavigate` on every link.
  Fragile, or needs every link to opt in.
- **Undo inside the module.** Forces the Playlist and Composition histories into one shape.
- **`src/lib/`** for the module. It carries Media Workspace text and ADR 0060 rules.
- **One PR per editor.** #479 waits on the same files; one PR means one rebase for it.

## Consequences

- Fixing a lifecycle bug once fixes it in all three editors; the check covers the ordering that drifted.
- Sidebar links are now guarded in all three editors (they were not); the browser back button still is not.
- Layout saves remain last-write-wins until Core adds a revision, and so does a Composition's edited
  geometry, even when the Composition save then conflicts (§5).
- An untouched new Composition no longer asks before the tab closes (§3).
- Pre-existing and unchanged: the Playlist's second write (`PUT …/items`) has no revision check. ADR 0003
  accepts a check on the first write only.
- #479 rebases onto this change in `CompositionEditorPage.tsx` and `usePlaylistEditorRow.ts`.
- Plan: `docs/media-workspace/plan-editor-lifecycle-459.md`.
