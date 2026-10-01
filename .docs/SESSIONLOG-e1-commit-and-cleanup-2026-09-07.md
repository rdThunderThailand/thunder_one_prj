# Session — E1 commit + develop test-row cleanup

**Date:** 2026-09-07 · **branch:** `feat/layoutV2` · model: Sonnet
**Predecessor:** `HANDOFF-e1-save-as-template-2026-09-07.md` (scratchpad) — items 1 and 2 taken, item 3 left.

## What was done

### 1. Committed the E1 `Save as Template` work — `c0e7773`

```
fix(compositions): name the row when saving a Layout as a Template (#58)
```

5 files, +131 −5: `promoteLayoutToTemplate` in `layouts-api.ts`, new
`SaveAsTemplateDialog.tsx`, wiring in `CompositionEditorPage.tsx`, and the
`a layout named …` → Template-collision branch in `status-display.ts` + `.check.mts`.

- Re-ran `status-display.check.mts` before commit → all assertions pass.
- `tsc` / `eslint` not re-run — predecessor verified them clean and the tree was
  unchanged since. Browser verification was done in full by the user across two
  checklists in the predecessor session.
- **Not pushed, no PR** — standing instruction: wait until the whole `feat/layoutV2`
  phase-1 set is done.

### 2. Deleted the develop test rows (R0, approved)

develop branch project `ftfmokgphewzyxzwjitv`. One transaction, prefixes
`zz-t28%` / `zz-e1%` plus the one flip-in-place orphan `comp:9af4e90a…`:

| table | deleted |
|---|---|
| composition_zones | 8 |
| compositions | 8 |
| layout_zones | 17 |
| layouts | 8 |
| playlist_items | 7 |
| playlists | 7 |
| **total** | **55** |

Pre-check confirmed no `publications` / external FK referenced any of it. Post-check:
0 rows remain for all three prefixes.

Compositions removed: `zz-t28-b`, `zz-t28-czz-t28-c-tab1`, `zz-t28-crec`,
`zz-t28-crec2`, `zz-t28-d`, `zz-e1-a`, `zz-e1-e`, `zz-e1-b`.
Named test templates removed: `zz-e1-tpl-3col`, `zz-e1-tpl-bound`.

### 3. Ticket 28 doc + editor file split — `0163ef5`, `813ee64`

- `0163ef5` docs: ticket 28 status `pending → verified (localhost → develop DB)`, Verification
  boxes ticked with evidence + dates, board README row + footnote ³, plan/README line-count note.
- `813ee64` refactor (R1): `c0e7773` had pushed `CompositionEditorPage.tsx` to 318 lines.
  New `CompositionEditorOverlays.tsx` (69 lines) holds the leave confirm, Save-as-Template
  dialog, save-error banner and shared-Template fork card. `upsertBinding` moved into
  `zone-bindings.ts` beside `applyPlaybackToAll`. Editor back to exactly 300.
  `tsc -p` exit 0 project-wide · `eslint` clean (1 pre-existing `<img>` warning elsewhere) ·
  `status-display.check.mts` passes.

**Browser-verified** 2026-09-07 (localhost:3000 → local Core :3001 → develop), editor
`ZZTEST-T15-browser-layout`:

- Save-as-Template dialog opens from the overlays component, field prefilled, typing a taken
  template name (`T25 Layout`) shows the red hint and disables the button, `ยกเลิก` closes clean
- Cancel with an unsaved name change raises `UnsavedLeaveConfirm`; `อยู่ต่อ` closes it and keeps
  the edit
- No console errors; the state-only rename never persisted (list still shows the original name,
  no stray template row)
- Not exercised: the save-error banner and the shared-Template fork card — both are verbatim
  JSX moves (`{saveError && …}`, `{sharedTemplateUsage > 1 && …}`) with no prop/logic change.

## Still open
- The rest of the `feat/layoutV2` phase-1 tickets (unchanged from predecessor).
- Pushed 2026-09-07. Two Draft PRs opened (Thai bodies):
  - FE `thunder_one_prj#60` `feat/layoutV2 → dev` (94 files, +4379 −737)
  - BE `Thunder_Core#50` `feat/layoutV2 → develop` (7 files: 4 migrations + 3 routes)
  - Cross-linked. Merge BE first.
- **Issues #51–#59 auto-close on merge.** An earlier note here said otherwise — that was wrong:
  local `origin/HEAD` pointed at `main`, but GitHub's default branch is `dev` for
  `thunder_one_prj` and `develop` for `Thunder_Core`. FE PR #60 therefore targets the default
  branch, so `Closes` keywords work. All nine are attached to #60 (`closingIssuesReferences`
  confirms 9), including the Core-side tickets #51–#53 — closing keywords do not cross repos,
  and `Thunder_Core#50` merges first anyway. A comment on #50 records this.
- Claude did not mark either PR ready (CLAUDE.md §4).
