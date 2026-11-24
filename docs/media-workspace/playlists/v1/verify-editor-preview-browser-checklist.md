# Browser verification checklist — Playlist editor (#33) + preview (#39)

Branch `fix/playlist`. Run `pnpm dev` (or the repo's dev script) and open the Media Workspace.
`CORE_API_URL` must be set + dev server restarted, or the proxy hits deployed `develop`
(see `docs/...` dev-env note). Every step lists the action and the expected result — mark
PASS/FAIL and paste anything that doesn't match.

## A. Regression — existing preview must still work (do first)

| # | Action | Expected |
|---|--------|----------|
| A1 | Open a **Composition** editor with bound content → **Open full preview** | New tab plays the Composition's zones in order, timeline scrubs, geometry selector present, "Actual size" button present |
| A2 | Open **Publication** wizard to the preview step for a composition-type publication → **Preview playback** | Modal preview renders zones, no console errors |
| A3 | Publication wizard preview for a **playlist-type** publication | Full-frame single zone plays, no errors |
| A4 | Browser console during A1–A3 | No new errors/warnings referencing `StagePreview`, `isHandoff`, `source`, `PlaylistPreviewPanel` |

## B. Playlist editor — create flow (#33)

| # | Action | Expected |
|---|--------|----------|
| B1 | Playlists list → **Create Playlist** | Lands on `/media-workspace/playlists/create`, three-pane editor, header "New Playlist", **no** Publish button, **no** status control |
| B2 | In another tab, open the Playlists list and note the count / newest row | — |
| B3 | Add 2–3 assets from Content Library, set a name, reorder with the ↑/↓ buttons, edit an image item's duration and a transition | List updates live; order changes stick |
| B4 | **Before saving**, refresh the Playlists list tab from B2 | **No new Playlist row** exists (row is created only on save — ADR 0060 §1) |
| B5 | Click **Save Draft** | Toast "บันทึกแล้ว"; the URL becomes `/media-workspace/playlists/<uuid>` **without a full page reload** (no white flash, editor stays mounted, scroll position kept); header now reads "Edit Playlist" |
| B6 | Refresh the Playlists list tab | New Playlist appears with status **Draft** |
| B7 | Hard-reload the editor URL | Name, items and order come back **exactly** as saved |
| B8 | Start a second **Create Playlist**, add a name, then navigate away (Cancel) | Confirmation dialog appears ("ยังไม่ได้บันทึก…"); choosing "ออกโดยไม่บันทึก" returns to the list with **no** row created; the Trash has nothing new |

## C. Editor — undo/redo, conflict, dirty guard

| # | Action | Expected |
|---|--------|----------|
| C1 | In a saved playlist, make 3 edits (add item, reorder, rename) → click **Undo** 3× | Each click reverts one step in reverse order; **Redo** re-applies them |
| C2 | After undo/redo lands on a changed state, **Undo** is disabled at the oldest state, **Redo** disabled at the newest | Buttons disable correctly |
| C3 | Open the same playlist in two editor tabs. In tab 1: edit + Save Draft. In tab 2: edit + Save Draft | Tab 2 shows the **revision conflict** card (amber), does **not** overwrite; "โหลดใหม่" reloads tab 2 to the server state and clears the card |
| C4 | Edit a saved playlist, then click **Cancel** | Unsaved-leave confirmation shows; "อยู่ต่อ" keeps you in the editor |
| C5 | Save with an empty name | Inline error "กรุณากรอกชื่อ Playlist ก่อนบันทึก"; Save button also disabled while name is blank |

## D. Playlist preview (#39)

| # | Action | Expected |
|---|--------|----------|
| D1 | In an editor with **0 items**, look at the **Preview** button | Disabled, tooltip "เพิ่ม media ก่อนดู preview" |
| D2 | Add ≥1 item, click **Preview** | New full-screen tab opens at `/media-workspace/preview/playlist/<id or `new`>?previewSession=…` |
| D3 | Watch the preview | Items play **in order** with their real durations; timeline at the bottom scrubs; single full-frame stage (one zone, no zone borders splitting it) |
| D4 | Preview "Preview shape" selector | Three options; **16:9 first / default**; switching to 9:16 and 4:3 **reframes** the stage; there is **no "Actual size" button** |
| D5 | Right panel — **Now Playing** | Shows the current item's title, "Position N of M", its duration and its transition; updates when the stage advances to the next item (not on every timeline tick) |
| D6 | Right panel — **Playlist Information** | Name, item count, total duration, Play mode, Repeat, Start from, Transition. Values the preview can't honour are labelled: `Shuffle (not simulated)` / `Once (preview loops)` / `Resume (not simulated)` / `… (not simulated)` for transition. Footer note says play mode/repeat/start-from/transitions are "stated, not played" |
| D7 | With the preview tab open, go back to the editor, **rename** the playlist and **Save Draft** | The preview keeps playing — the clock does **not** restart, the handoff stays valid (name in the panel may or may not refresh, but playback position is preserved) |
| D8 | Reorder items in the editor while preview is open | Preview reflects the new order on its next channel heartbeat without a clock reset |
| D9 | Open a playlist-preview URL directly (paste `/media-workspace/preview/playlist/<id>` with **no** `previewSession`) | Shows the "Preview session expired — reopen from editor" state, not a crash |
| D10 | Console in the preview tab | No errors; no ~60fps re-render storm (React DevTools Profiler: the page around the stage should not re-render every frame) |

## E. Cleanup / no dead references

| # | Action | Expected |
|---|--------|----------|
| E1 | `rg -n "usePlaylistDraftStore\|PlaylistStepper\|ReviewStep\|CreatePlaylistPage\|step-validation" src/features/media-workspace/playlists` | No matches (publications' own `step-validation` is a different feature and is fine) |
| E2 | Visit `/media-workspace/playlists/create?id=<uuid>` (the old edit URL) | The `?id=` is ignored; it's just the create page. The list "Edit" action now routes to `/media-workspace/playlists/<uuid>` directly — confirm from the list |

## Known pre-existing issue (not caused by this change)

`node src/features/media-workspace/playlists/metadata.check.mts` fails a round-trip
assertion: `decodeMetadata` returns derived `width`/`height` that the test's expected
literal omits. This check could not run at all before (a `./types` directory-import error
that this branch fixes in `metadata.ts`), so the failure was latent. Flagged for a
separate fix — do not block on it.
