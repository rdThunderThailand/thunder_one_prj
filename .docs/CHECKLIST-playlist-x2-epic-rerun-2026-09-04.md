# Checklist — X-2 RERUN: Playlist v1 epic, end-to-end browser verification

Date: 2026-09-04 · Supersedes the 2026-09-03 X-2 run (4 PASS / 3 FAIL / 4 BLOCKED)
Covers: #33, #35, #36, #37 (editor) · #38, #40 (folders/trash) · #41 (tags)

## Why a rerun

The first run found **one real product bug** plus several test-script problems:

| First run | Cause | Status now |
|---|---|---|
| Step 5 FAIL (`fit`/`bg`/`notes` not persisted) | `Thunder_Core` `PUT /media/playlists/[id]/items` Zod schema stripped the 4 #37 override fields before they reached `media_playlist_set_items` | **FIXED** — schema now accepts `transition_duration_seconds`, `fit`, `background_color`, `notes`. Proc + DB columns already supported them (committed `89dc582`, prod-applied). |
| Step 6/8 FAIL | Playwright selector grabbed the Tag chip in `td:nth-child(1)` instead of the Status badge in `td:nth-child(4)` | Selector fixed in `scratch/test_x2_epic.mjs` (per Gemini report) — **re-verify the selector reads `td:nth-child(4)`** |
| Step 10 FAIL → 11–14 BLOCKED | Script clicked the inner `<div>` of the Publication-wizard asset card, not the `<button>`, so `setPlaylistId` never fired; "ยังไม่ได้เลือกสื่อ" modal then blocked Next | Selector fixed to target `<button>` in `AssetCard.tsx` — **re-verify** |

Nothing else from the first run needs re-checking in isolation — this is still the one
continuous compose-flow, now run all the way to step 14.

## Setup — do this first, in order

1. **Restart Thunder_Core dev server** so the Zod fix loads:
   ```bash
   cd /Users/arty/Desktop/Thunder/project/Thunder_Core && npm run dev -- -p 3001
   ```
2. Frontend on `:3000` with `CORE_API_URL=http://localhost:3001` set **and its dev server
   restarted** — confirm at `http://localhost:3000/api/proxy/__config` (must show the
   localhost core URL, not `thundercore.vercel.app`).
3. Logged in at `:3000/media-workspace/playlists`.
4. DB: develop branch `ftfmokgphewzyxzwjitv`.

## One continuous flow — same playlist, in order, no starting over

| # | Step | Expected | First-run result |
|---|---|---|---|
| 1 | **+ Create Playlist**, name `X2 Rerun <timestamp>`, pick a folder | Lands in the single-page editor at `/media-workspace/playlists/<id>` | PASS |
| 2 | **+ Add Item**, add 2–3 media items from the drawer | Items appear in the left pane / timeline | PASS |
| 3 | Select item 1, set **transition = fade**, **transition duration = 2s**, **fit = fill**, **background color = `#112233`**, **notes = `X2 note intent text`** | All 5 fields accept the values; filmstrip reflects the transition | PASS |
| 4 | **Save Draft** | HTTP 200, no revision-conflict card | PASS |
| 5 | **Go back to the list, reopen this playlist in the editor** | **All of `transition=fade`, `transition_duration=2`, `fit=fill`, `background_color=#112233`, `notes=X2 note intent text` are still there.** This is the step the backend fix targets — watch the `PUT .../items` request payload AND the reopened editor fields. | **FAIL → must PASS now** |
| 6 | On the list, this playlist's row → **Edit tags…** → add tag `x2-rerun` | Saves; tag chip shows on the row (`td:nth-child(1)`) | FAIL (selector) |
| 7 | Row menu → move to a **different folder** | Row shows under that folder in Folders tab; still under `x2-rerun` in Tags tab (check both filters actually list it) | FAIL (cascade from 6) |
| 8 | Row menu → **Mark as ready** *(Critical Gate)* | **Status badge = `Inactive`, NOT `Active`** (ADR 0028 — nothing has published it). Read the badge from `td:nth-child(4)`, not the tag chip. | FAIL (selector) |
| 9 | Publications → create a new Publication → pick this playlist as content | Playlist is visible and selectable in the content picker (visible *because* it's `Inactive`, not `draft`). Click the `<button>` of the asset card, not the inner div. | PASS |
| 10 | **Activate** that Publication | Publication → `active`; back on the Playlists list, this playlist's badge (`td:nth-child(4)`) now reads **`Active`** (derived from `publication_count`, ADR 0028). No "ยังไม่ได้เลือกสื่อ" modal — if it appears, the card selection in step 9 didn't register. | **FAIL → must PASS now** |
| 11 | Try to move this playlist to **Trash** (row menu) *(Critical Gate)* | **Refused**, message names the Publication from step 9 (ADR 0060 §7). Not a 500, not a silent no-op. | BLOCKED → must run |
| 12 | Cancel / end that Publication so nothing `draft`/`active` points at the playlist, then Trash it | Succeeds — moves to Trash | BLOCKED → must run |
| 13 | In Trash, **Restore** it | Comes back; folder (step 7) and tag `x2-rerun` (step 6) intact | BLOCKED → must run |
| 14 | **Permanently delete** it (row menu, Trash view) *(Critical Gate)* | **Refused** with an explanation that it was published at some point (ADR 0060 §7 — "a playlist that has ever been published can never be permanently deleted"). Not offered as a silent no-op or a 500. Leave it in Trash. | BLOCKED → must run |

## Report back

PASS/FAIL per numbered step. For any FAIL: which step, what you saw, and the relevant
request/response payload if it's an API-layer failure.

The three to look at hardest:
- **Step 5** — the backend fix. If `fit`/`background_color`/`notes` are still null after
  reopen, capture the `PUT /media/playlists/<id>/items` request body *and* response, and
  confirm the Thunder_Core dev server was actually restarted after the schema edit.
- **Step 8** — badge must be `Inactive` not `Active` (silent-regression risk).
- **Step 11** — Trash refusal must name the publication (silent-regression risk).

## Cleanup

Tell me the playlist name and tag name (`x2-rerun`) you created — I'll remove them the same
way as the earlier rounds. I don't delete tag/playlist rows without your say-so.

## After all 14 PASS

The v1 epic (#38 + #40 + #41, plus already-shipped #33/#35/#36/#37) is verified
end-to-end across both repos. Next is the epic PR — including committing this Zod fix and
the other uncommitted `Thunder_Core` routes/migrations. I'll ask separately about Thai vs
English PR body.
