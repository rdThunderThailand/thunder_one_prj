# Playlist Editor UX/UI Browser Checklist

Date: 2026-09-03  
Scope: playlist editor 3-pane UX/UI and playlist full-preview page  
Target repo: `thunder_one_prj`

## Preconditions

- Dev server is running at `http://localhost:3000`.
- Browser is signed in with an account that can open Media Workspace.
- Use a desktop viewport around `2008x1325`, or at least `1440px` wide.
- Start from this editor route, or an equivalent playlist with 3+ items:
  `http://localhost:3000/media-workspace/playlists/8064d28c-26cd-4d4a-84c4-13d0a39d6358`
- Do not click `Publish`. Do not run the write checks unless the owner explicitly approves saving the draft.

## Report Format

For each item, report `PASS`, `FAIL`, or `SKIPPED`, with:

- URL tested
- viewport size
- screenshot path or attached screenshot
- console errors, if any
- exact visible mismatch for every failure

## A. Editor Shell And Header

- [ ] Page loads without a React error overlay or blocking console error.
- [ ] The editor content fits inside the main workspace area without page-level overflow or clipped panels.
- [ ] Left playlist pane, center timeline pane, and right properties pane all stretch to the available height.
- [ ] Playlist title is fully visible in read mode.
- [ ] Pencil icon appears beside the title.
- [ ] Clicking the pencil changes title into edit mode.
- [ ] Confirm/check action accepts the edited title and returns to read mode.
- [ ] Header shows a capsule status badge, for example `saved` or `unsaved changes`.
- [ ] Header shows latest updated time text.
- [ ] Header does not show separate `items` count or total duration pills.
- [ ] Small `Undo` and `Redo` icon buttons appear left of `Cancel`.
- [ ] `Undo`/`Redo` are disabled when there is no history in that direction.
- [ ] After an edit (reorder / rename / add item), clicking `Undo` restores the prior state; `Redo` re-applies it.
- [ ] `Cmd+Z` undoes and `Shift+Cmd+Z` redoes when focus is not in a text field.
- [ ] `Cmd+Z` inside the title input edits the input text, not the playlist history.

## B. Playlist Items Pane

- [ ] `Playlist Items` panel fills its column height.
- [ ] `Add Item` is pinned in the panel footer, not above the item list.
- [ ] Footer hint `Drag items to reorder` is visible under `Add Item`.
- [ ] Item rows have hover feedback.
- [ ] Selected item row is visibly highlighted.
- [ ] Now-playing/current item indicator is visible on the active row.
- [ ] Rows can be reordered with native drag and drop.
- [ ] After drag and drop, row order changes in the list.
- [ ] After drag and drop, the thumbnail strip order in the center pane matches the list order.
- [ ] Each row has a `more actions` button instead of an `x` remove button.
- [ ] Opening `more actions` shows `Preview`, `Replace`, `Duplicate`, `Move Up`, `Move Down`, and `Remove from Playlist`.
- [ ] `Move to...` is not shown.
- [ ] `Replace` and `Duplicate` are visibly disabled if their flow is not implemented yet.
- [ ] `Remove from Playlist` is red.
- [ ] Boundary movement is correct: first item cannot move up, last item cannot move down.

## C. Preview Action And Selection Sync

- [ ] Clicking a row selects that playlist item.
- [ ] Clicking row `more actions` > `Preview` selects that item.
- [ ] `Preview` jumps the center preview playback to that item's start time.
- [ ] Clicking a thumbnail card below the preview also selects that item.
- [ ] Thumbnail click and row `Preview` produce the same selected item and playback position.

## D. Center Preview And YouTube-Style Controls

- [ ] Center preview media is visible and not blank.
- [ ] Preview frame is taller than the earlier compact version; at the reference viewport it is about `582px` tall.
- [ ] Playback controls are overlaid as a fixed footer inside the preview frame.
- [ ] Controls stay visible and do not collapse when the mouse moves away.
- [ ] Progress bar is usable and seeking updates the visible time.
- [ ] `Play` toggles playback state.
- [ ] `Mute` / `Unmute` toggles audio state.
- [ ] `Unmute` button text is white on the overlay.
- [ ] `Full screen` button text is white on the overlay.
- [ ] Speed choices are not separate `1x`, `2x`, `3x` buttons.
- [ ] More actions menu opens speed choices.
- [ ] Choosing a speed updates the playback speed label/state.

## E. Thumbnail Timeline Strip

- [ ] Thumbnail cards are around `150px` wide and `150px` tall.
- [ ] All thumbnail cards use the same dimensions.
- [ ] Thumbnail label text is about `16px` and bold.
- [ ] Cards do not overflow into `Playback Settings`.
- [ ] Cards do not leave excessive empty horizontal space when there are only a few items.
- [ ] Clicking card 1 seeks to `0s`.
- [ ] Clicking card 2 seeks to the start of item 2.
- [ ] Clicking card 3 seeks to the start of item 3.

## F. Right Properties Pane

- [ ] Selecting an item shows the `Item` tab.
- [ ] Item tab shows thumbnail, file name, media type, duration, transition, display options, notes, and red remove button.
- [ ] `Display Options` section is visible.
- [ ] Fit option is present, with playlist default available.
- [ ] Background color field is visible.
- [ ] Notes field is visible.
- [ ] Video duration is not accidentally edited if the item derives duration from media metadata.
- [ ] `Playlist` tab remains available for playlist-level fields.

## G. Add Item Drawer

- [ ] Footer `Add Item` opens the add-item drawer.
- [ ] Drawer lists selectable assets.
- [ ] Search input filters visible assets.
- [ ] Type, folder, or tag filters work if data exists.
- [ ] Selecting assets enables `Add selected` / `Add N items`.
- [ ] Already-added assets are skipped or disabled.
- [ ] Upload action opens the asset upload route in a new tab/window.
- [ ] Closing the drawer returns to the editor without layout shift.

## H. Full Playlist Preview Page

Open by clicking `Preview` from the editor.

- [ ] Full preview opens a playlist preview route like `/media-workspace/preview/playlist/<playlistId>?previewSession=...`.
- [ ] Page uses light theme.
- [ ] Outer framed/card container is removed; content expands to fill the page width.
- [ ] Preview frame does not have a leftover dark wrapper/border around it.
- [ ] Right-side information panel uses light cards.
- [ ] `Now Playing` card shows current item thumbnail, name, type, duration, and position.
- [ ] `Playlist Information` card shows playlist name, item count, total duration, play mode, repeat, start from, transition, fit, and background color where available.
- [ ] `Preview Mode` choices are visible.
- [ ] `16:9` mode is enabled by default.
- [ ] `9:16` and `4:3` are disabled or clearly unavailable if not implemented.
- [ ] Full preview has the same persistent YouTube-style footer controls inside the preview frame.
- [ ] `Unmute` and `Full screen` button text is white on the overlay.
- [ ] Timeline strip is visible under the preview and clicking an item seeks to that item.
- [ ] `Publish` is disabled or cannot perform a real publish from this preview page.
- [ ] `Edit Playlist` returns to the editor route.

## I. Regression Smoke

- [ ] Existing non-playlist preview pages still render without crashing, if an available fixture exists.
- [ ] Existing playlist editor data still loads after a browser refresh.
- [ ] No layout overlap at `1440px` desktop width.
- [ ] No layout overlap at a narrower desktop width around `1280px`.

## J. Optional Write Check

Run this section only after explicit owner approval. `Save Draft` writes playlist draft state to the backend.

- [ ] Edit the playlist title and confirm it.
- [ ] Add one item from the drawer.
- [ ] Reorder at least two items.
- [ ] Change one playback setting.
- [ ] Click `Save Draft`.
- [ ] Verify the page stays on `/media-workspace/playlists/<playlistId>`.
- [ ] Refresh the page.
- [ ] Verify title, item order, added item, and playback setting persisted.
- [ ] If a conflict or save error appears, capture the exact message and do not retry blindly.

## Completion Criteria

- Mark the checklist complete only when sections A-I pass.
- Section J is optional and must be reported separately as `not run`, `passed`, or `failed`.
- Any browser console error, blank preview frame, clipped panel, or real publish capability from preview page is a blocker.
