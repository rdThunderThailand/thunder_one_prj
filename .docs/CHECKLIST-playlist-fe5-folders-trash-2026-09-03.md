# Browser verification checklist — FE-5 (playlist folder rail + Trash) — v2

For a browser agent (gemini). Report every step as **PASS / FAIL / BLOCKED** with what
you actually saw (screenshot or text). Do **not** edit code — only observe and report.

> v2 note: the playlists list page was redesigned since v1. Gone: ownership tabs
> (All/My), the Campaign column + filter, click-row-to-open side panel. New: inline
> **Preview** + **Edit** icon buttons per row, a `⋯` menu, "Create Playlist" is now a
> modal, an **Empty Trash** bulk button, a stand-alone playlist Preview route.

---

## 0. Prerequisites — do first, report if not met

The Thunder_Core routes this feature calls are **not on `develop` yet**:
`PATCH /media/playlists/[id]/move`, `POST …/restore`, `DELETE …/permanent`, and the
`?trash=true` branch of `GET /media/playlists`. Before testing:

1. In `Thunder_Core/` (branch `fix/playlist`) start the backend on port 3001:
   `npm run dev -- -p 3001`
2. In `thunder_one_prj/` set `CORE_API_URL=http://localhost:3001` in `.env.local`, then
   (re)start the dev server.
3. Open `/api/proxy/__config` — confirm the core URL is `localhost:3001`. If it still
   shows `thundercore*.vercel.app`, stop and report (env didn't take).

If the backend can't be started: do the **frontend-only** steps (marked ⚙️ FE-only) and
mark the rest **BLOCKED**.

**Test page:** `/media-workspace/playlists` — use a tenant with ≥ 5 playlists.

---

## A. Rail + layout

1. ⚙️ Left column shows a **Folders** heading and a rail: **All**, **Uncategorized**, a
   folder tree area, and **Trash** pinned at the bottom (trash icon). A **+ New Folder**
   button sits under Trash.
2. ⚙️ **All** is selected on first load; the table shows every non-trashed playlist.
3. ⚙️ Each rail entry shows a small grey count on the right: **All** = total non-trashed
   playlists; **Uncategorized** = playlists with no folder; each folder = its own count.
4. ⚙️ Top of page still shows the 4 stat cards (Total / Draft / Active / Inactive).
5. ⚙️ Table columns are exactly: Playlist Name, Type, Duration, Status, Last Updated,
   Actions. **No Campaign column. No All/My tabs.**
6. ⚙️ Pagination bar sits at the bottom of the card; page size selector works.

## B. Virtual collections (⚙️ FE-only)

7. Click **Uncategorized** → table shows only playlists with no folder; URL gains
   `folder=uncategorized`; row total matches the rail count for Uncategorized.
8. Click **All** → `folder=` disappears from the URL; full list returns.

## C. Folder CRUD — #38 AC "Create, rename and move a folder all work"

9. **+ New Folder** → modal → `QA Parent` → Create. Rail shows `QA Parent` (count 0).
10. Select `QA Parent`, **+ New Folder** again → `QA Child` → Create. `QA Child` appears
    **indented under** `QA Parent`.
11. `⋯` on `QA Child` (in the rail) → **Rename** → `QA Child 2` → Save. Name updates.
12. `⋯` on `QA Child 2` → **Move** → the parent `<select>` does **not** list `QA Child 2`
    itself or its descendants. Pick **Root** → Save → it becomes top-level.
13. ⚙️ Reload the page → the folder tree is unchanged.

## D. Move a playlist between folders — #38 AC

14. On a playlist row in **All**, open the `⋯` menu → **Move to folder…** → dialog with a
    folder `<select>` (nested folders shown as `Parent / Child` paths), preselected to the
    row's current folder (Uncategorized if none).
15. Choose `QA Parent` → Save. Dialog closes, list refreshes.
16. Rail: `QA Parent` count +1, **Uncategorized** count −1.
17. Click `QA Parent` in the rail → the moved playlist is listed; URL has `folder=<uuid>`.
18. `⋯` → **Move to folder…** → **Uncategorized** → Save → row leaves the folder view,
    Uncategorized count goes back up.

## E. Subtree-inclusive counts — #38 AC "counts that include each folder's whole subtree"

19. Nest `QA Child 2` back under `QA Parent` (rail `⋯` → Move → `QA Parent`).
20. Put 1 playlist directly in `QA Parent` and 1 playlist in `QA Child 2`.
21. Rail: `QA Parent` count = **2** (its own + child's); `QA Child 2` count = **1**.
22. Select `QA Parent` → the list shows **both** playlists (parent's + child's).

## F. Folder selection round-trips — #38 AC "restored from the URL on reload and on Back"

23. Select `QA Parent` (URL `folder=<uuid>`). Reload → still `QA Parent`, same list.
24. Click **All**, then browser **Back** → returns to `QA Parent` + its list. **Forward**
    → back to All.

## G. Delete folder — #38 AC "deleting a non-empty folder is refused with a clear reason"

25. With ≥ 1 playlist (or a child folder) still inside `QA Parent`: rail `⋯` → **Delete**
    → confirm. Operation **refused**; a readable message shows near the top of the list.
    **No raw SQL / RPC text.**
26. Empty `QA Parent` (move playlists out, delete/move `QA Child 2`), Delete again →
    succeeds, folder disappears from the rail.

## H. Nesting limit — #38 AC "Nesting deeper than five levels is refused"

27. Create folders nested 5 deep, then try to create a 6th inside the deepest (or Move a
    folder so it would land at depth 6). **Refused** with a readable message; no crash,
    no raw error text.

## I. Move to Trash — #40 ACs

28. Pick a playlist **not** referenced by any active/draft publication. Row `⋯` → **Move
    to Trash** → a confirm dialog appears. Confirm → row disappears from the list, list
    refreshes, **All** count drops by 1.
29. **Refused for active publication:** find/create a playlist referenced by an **active**
    publication → `⋯` → Move to Trash → confirm → **refused**, message **names the
    publication(s)** (e.g. "…publication ที่ active หรือ draft: <ชื่อ>…"). No raw error.
30. **Refused for draft publication:** same with a playlist referenced only by a **draft**
    publication → also refused, names it.
31. **Allowed for cancelled/ended:** a playlist whose only referencing publication is
    **cancelled or ended** → Move to Trash **succeeds**.

## J. Trash view — #40 ACs

32. Click **Trash** in the rail → URL `folder=trash` → the trashed playlists are listed.
33. Trashed rows: **no** inline Preview/Edit icons; the `⋯` menu shows **Restore** and
    either **Delete permanently** or the greyed note "Can't delete permanently — this
    playlist has been published." — and **not** Duplicate / Move / Move to Trash /
    Mark as ready.
34. An **Empty Trash** button appears in the filter row (right side).
35. Go to **Publications → create** and open the playlist picker → a trashed playlist is
    **not** selectable.
36. ⚙️ Stat cards at the top do **not** change when Trash is selected (they summarise the
    active library only).

## K. Restore — #40 AC "returns it to its former folder, or Uncategorized when that folder is gone"

37. Move a playlist into `QA Parent`, Move it to Trash, then in Trash `⋯` → **Restore** →
    it leaves Trash and reappears under `QA Parent`.
38. Move a playlist into a folder, Trash it, **delete that folder** while it's trashed,
    then **Restore** → it comes back under **Uncategorized**, no crash.

## L. Permanent delete — #40 AC "offered only where it can succeed; else the UI explains why"

39. In Trash, a **never-published** playlist → `⋯` → **Delete permanently** → confirm
    dialog → confirm → row gone; reload Trash to confirm it's really gone.
40. In Trash, a **has-been-published** playlist (publication any status incl.
    cancelled/ended) → shows the greyed note, **no clickable action that errors**.
41. #40 AC "No raw database error text reaches the operator" — through steps 25–40, every
    refusal/error message is human-readable Thai/English, never raw SQL/PLpgSQL/RPC text.

## M. Empty Trash (bulk)

42. In Trash with a mix of never-published and published trashed playlists → **Empty
    Trash** → modal states how many will be deleted and how many will be **skipped**
    (published). Confirm → never-published ones are permanently deleted; published ones
    remain; a summary message reports "ลบถาวรแล้ว N; ข้าม M …".
43. **Empty Trash** button is **disabled** when there are no eligible (never-published)
    trashed playlists.

## N. Empty states

44. ⚙️ Empty Trash completely → Trash view shows **"ถังขยะว่าง"**.
45. ⚙️ Select a folder with no playlists (no filters active) → **"โฟลเดอร์นี้ยังไม่มี
    playlist"**.
46. ⚙️ In **All**, set the search box to gibberish → **"ไม่พบ playlist ที่ตรงกับตัวกรอง
    ที่เลือก"** with a **ล้างตัวกรอง** button that clears it.

## O. Create Playlist (modal)

47. ⚙️ Header **+ Create Playlist** opens a **modal** (not a page) with a name field and a
    **Folder** `<select>` (nested paths, default Uncategorized).
48. ⚙️ If a real folder is selected in the rail when you open it, the modal's Folder
    defaults to that folder.
49. Type a name, pick `QA Parent`, click **Next** → you land on the playlist editor
    (`/media-workspace/playlists/<id>`) for a new **draft**; going back to the list, the
    new playlist is under `QA Parent`.

## P. Row actions still work (regression)

50. ⚙️ **Preview** icon on a row → opens `/media-workspace/preview/playlist/<id>` and the
    playlist preview renders **stand-alone** (no "expired" screen — this route now has a
    by-id loader).
51. ⚙️ **Edit** icon → opens the playlist editor for that playlist.
52. `⋯` → **Duplicate** → a copy appears in the list ("… (Copy)"). If content couldn't be
    copied you get the amber "…เปิดฉบับร่างเพื่อเพิ่มสื่อเอง" note, not a hard error.
53. `⋯` → **Mark as ready** (draft rows only) → the row's status badge changes (to
    Inactive until a publication references it).
54. ⚙️ Search, Status filter, Type filter, all 5 sortable column headers, page size, and
    **Clear filters** all still work. **Clear filters** also resets the folder selection
    back to **All**.

## Q. Cross-feature regression (shared rail)

55. ⚙️ Open **`/media-workspace/layouts`** — its folder rail still renders and its
    create / rename / move / delete folder modals still work (this feature refactored the
    shared `FeatureFolderRail` that Layouts now uses).
56. ⚙️ Open **Media Library** — its folder rail still renders and filters assets by folder
    as before (it uses the shared `ContentFolderRail`, which gained an optional `counts`
    prop this change).

## R. Console

57. ⚙️ Through everything above, the browser console shows **no uncaught errors** and no
    React warnings originating from the playlists list page or the shared rail.
