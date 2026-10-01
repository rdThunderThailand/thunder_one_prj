# FE-C — Change Playlist / Layout on the Program Edit page (2026-09-30)

Branch `feat/program-edit-page`, uncommitted.

## Done
- `ContentSourceCard` opens `PlaylistPickerModal` / `CompositionPickerModal`; a pick fetches the Playlist / Layout and calls `edit.patch({ content })`.
- `ProgramContent.name` added (card shows the new name before saving); `playlistContent` / `compositionContent` in `program-edit.ts`.
- Category (Folders, subtree-inclusive counts, Uncategorized) in both pickers: `picker-folder.ts`, `PickerFolderSection.tsx`. Also shows in the create wizard, which uses the same pickers.
- `ProgramPreviewButton` keyed by content id so a change never shows the old preview.

## Not done (decided)
- Type switching (playlist ↔ layout ↔ video ↔ image): mockups 05/06 have no entry point; video/image Programs keep the button disabled. Needs a design decision.
- "Custom Layout — Create from blank" stays out (plan: disabled).

## Verified
- tsc + eslint clean; `program-edit.check.mts`, `picker-folder.check.mts` pass.
- Browser (localhost:3000 → Core :3001 develop), Draft `zz-monthly-ui-19`: picker opens with current Playlist selected; Category shows All (7) / Uncategorized (7); picking `test setting` updates the card to "test setting · 3 items" and enables Save; switching back to `Boss test` returns Save to disabled. Nothing was saved.

- Folders (develop test data, approved): Playlist `test` moved into folder `zz-fe-c-folder`, Layout `Test Layout 1` likewise. Category shows `All (7) / zz-fe-c-folder (1) / Uncategorized (6)` (Playlists) and `All (1) / zz-fe-c-folder (1) / Uncategorized (0)` (Layouts); selecting a row filters the list (Uncategorized → 0 layouts, folder → 1).
- Change Layout on Draft `zz-fe-c-layout-draft` (id 4152229e-7dc6-4ab6-bdc0-078fab7392b2): picker opens with the bound Layout selected; re-selecting it leaves Save disabled.

## Test data left on develop (delete = R0, list before deleting)
- Playlist folder `zz-fe-c-folder` (109c9b2f-cc48-42f4-b6ba-17f6c530ca2e) — holds Playlist `test` (ba3b8962-213e-4706-bb41-44336a5836ac); move it back to Uncategorized first.
- Layout folder `zz-fe-c-folder` (13a26935-a386-4cd1-ae5d-9d57d9b3aaf6) — holds Layout `Test Layout 1` (8a51df15-09e8-4608-926f-59f4ab85c205); move it back first.
- Draft `zz-fe-c-layout-draft` (4152229e-7dc6-4ab6-bdc0-078fab7392b2).

## Not verified
- Switching to a *different* Layout (develop has only one Layout) and Publish changes on a Live Program with a changed Playlist.
- Screenshot comparison against mockups 05/06.
