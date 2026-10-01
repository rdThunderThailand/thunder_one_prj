# Checklist — X-2: Playlist v1 epic, end-to-end browser verification

Date: 2026-09-03 · Covers: #33, #35, #36, #37 (editor) · #38, #40 (folders/trash) · #41 (tags)
Plan: `docs/playlists/v1/plan-playlist-v1.md` — "เงื่อนไขว่า เสร็จ" (5 conditions)

## What is already verified — do not re-test in isolation

Every piece here has its own PASS checklist already on record. X-2 is not re-running
those — it's confirming they **compose** into one continuous flow, since nothing so far
has tested them back-to-back on the same playlist.

- Per-item fields (duration/transition/fit/background/notes) round-trip through Save
  Draft — `SESSIONLOG-issue37-per-item-intent-phase5-6-2026-09-03.md`, prod-applied.
- Folders + Trash — `CHECKLIST-playlist-fe5-folders-trash-2026-09-03.md`, 57/57 PASS.
- Tags — `CHECKLIST-playlist-be5-tags-2026-09-03.md` (24/24) +
  `CHECKLIST-playlist-fe6-tags-2026-09-03.md` (29/29).
- **Poll payload mechanism** (condition 3 below) — confirmed by reading `media_job_poll`'s
  definition directly: every slot carries `transition_duration_seconds`, `fit`,
  `background_color`. `notes` is deliberately **not** in the payload — ADR 0060 §5a: no
  player acts on an authoring annotation. The plan's "ครบทั้ง 4 ตัว" wording predates that
  decision; 3 of the 4 reaching poll is correct, not a gap. This was also verified live at
  the HTTP layer in the #37 session (develop, since cleaned up). No active publication on
  develop currently has a schedule window open, so this session did not re-poll live data —
  if you want a live re-check, say so and I'll set up a schedule window for it (that would
  touch data, so I'd ask first).

## Setup

Same as the BE-5/FE-6 checklists: Thunder_Core on `:3001`, `CORE_API_URL` pointed there,
logged in at `:3000/media-workspace/playlists`.

## One continuous flow

Do these in order, on the **same playlist**, without starting over — the point is that each
step's state survives into the next.

| # | Step | Expected |
|---|---|---|
| 1 | Click **+ Create Playlist**, name it something you'll recognize (e.g. `X2 Epic Test`), pick a folder | Lands in the single-page editor. |
| 2 | Click **+ Add Item**, add 2–3 media items from the drawer | Items appear in the left pane / timeline. |
| 3 | Select the first item, in its properties pane set **transition = fade**, **transition duration = 2s**, **fit = fill**, **background color** to something, **notes** to some text | Fields accept the values; the item row/filmstrip reflects the transition. |
| 4 | Click **Save Draft** | Saves without error; no revision-conflict card. |
| 5 | Navigate away (back to the list) and reopen this playlist in the editor | All four per-item values from step 3 are still there — not just duration/transition, the fit/background/notes too. |
| 6 | Back on the list, find this playlist's row, open **Edit tags…**, add a tag (e.g. `x2-test`) | Saves; chip shows on the row. |
| 7 | Move this playlist to a **different folder** via the row menu | Row's folder membership updates; it now shows under that folder in the Folders tab, and still shows under `x2-test` in the Tags tab. |
| 8 | Row menu → **Mark as ready** (only present because the playlist is `draft`) | Status badge changes to **Inactive** — not Active. This is correct per ADR 0028: nothing has published it yet. |
| 9 | Go to Publications, create a new Publication, and pick this playlist as its content | The playlist is selectable — being `Inactive` (not `draft`) is what makes it appear in the content picker. |
| 10 | Activate that Publication | Publication goes `active`; the playlist's own badge should now read **Active** (derived from `publication_count`, ADR 0028). |
| 11 | Back on the Playlists list, try to move this playlist to **Trash** (row menu) | **Refused**, with a message naming the Publication you just created — it's referenced by an `active` publication (ADR 0060 §7). |
| 12 | Cancel or end that Publication so nothing `draft`/`active` points at the playlist anymore, then Trash it | This time it succeeds — moves to Trash. |
| 13 | In Trash, restore it | Comes back, folder and tags from steps 6–7 are intact. |
| 14 | Permanently delete it (row menu, Trash view) | Since it was published at some point, deletion is **refused** with an explanation, not offered as a silent no-op or a 500 — matches "a playlist that has ever been published can never be permanently deleted" (ADR §7). Leave it in Trash — don't force this. |

## Report back

PASS/FAIL per numbered step. For a FAIL, note which step and what you saw. Step 8 (badge
must read Inactive, not Active) and step 11 (Trash refusal naming the publication) are the
two most likely to regress silently, so look closely at those.

Cleanup: whatever test tag/playlist you created in this flow — tell me the names and I'll
remove them the same way as the earlier rounds (I don't delete `media_core.tags` rows or
playlists without your say-so).

All PASS → the whole v1 epic (#38 + #40 + #41, plus the already-shipped #33/#35/#36/#37) is
verified end-to-end. Next is the epic PR — I'll ask separately about Thai vs English body.
