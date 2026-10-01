# Checklist — #41 FE-6 playlist tags, browser layer

Date: 2026-09-03 · Issue: #41 (FE-6) · ADR: 0060 §8 / §8a
Backend: `.docs/CHECKLIST-playlist-be5-tags-2026-09-03.md` (24/24 PASS, both DBs)
Frontend: `.docs/SESSIONLOG-playlist-fe6-tags-2026-09-03.md`

## What is already verified — do not re-test

The RPC and route layer are done, on **both** develop and prod: `media_playlist_set_tags`
normalises names (trim, drop blanks, case-insensitive dedupe, reuse existing spelling),
refuses a trashed playlist / another tenant / a >64-char tag / >50 tags, and
`media_playlists_list` returns each row's `tags`. `tsc`, `eslint` and all 15
`playlists/*.check.mts` pass. Nothing in this checklist should be re-deriving those —
it's asking whether the UI wires them up correctly.

## Setup

1. Thunder_Core running locally on `:3001` from branch `fix/playlist`
   (`cd Thunder_Core && npm run dev -- -p 3001`).
2. thunder_one_prj on `:3000` with `CORE_API_URL=http://localhost:3001` — confirm via
   `http://localhost:3000/api/proxy/__config` (must show `coreApiUrl":"http://localhost:3001"`).
   If not, set the env var and **restart the dev server**.
3. Log in, open `http://localhost:3000/media-workspace/playlists`.
4. You'll need at least 3 playlists to work with; the ones already on develop are fine.
   Note down the names of two you're willing to tag — call them **PL1** and **PL2** below.

## A. Tags tab — basics

| # | Step | Expected |
|---|---|---|
| A1 | Look at the rail on the left | Two tab buttons above the folder list: **Folders** and **Tags**. Folders is active by default. |
| A2 | Click **Tags** | The folder tree is replaced by a flat list: **All** at the top, then any tags already in use, each with a count in small grey text to the right of its name. |
| A3 | If the tag list is empty | It shows a quiet "No tags yet" line rather than looking broken or blank. |
| A4 | Click **Folders** again | You're back to the folder tree, unaffected — nothing about switching tabs lost your folder selection or scrolled you anywhere odd. |

## B. Tagging a playlist (chip editor)

| # | Step | Expected |
|---|---|---|
| B1 | Find **PL1** in the table, open its row menu (⋯), click **Edit tags…** | A dialog titled "Edit tags" opens. If PL1 already has tags, they show as removable pill chips. |
| B2 | Click **+ Add tag**, type a brand-new name like `QA Smoke`, press Enter | A new pill `QA Smoke` appears in the chip row; the input clears and collapses back to the "+ Add tag" button. |
| B3 | Click **+ Add tag** again, start typing a tag name that already exists elsewhere in your tenant (any tag you saw in step A2, or type a couple of letters) | A native browser autocomplete dropdown offers the existing name(s) — this is the shared-vocabulary datalist. |
| B4 | Pick the suggested existing name and press Enter (or click away to blur) | It's added as a pill using its **existing** spelling/casing, not whatever partial text you'd typed. |
| B5 | Try adding the exact same tag name again (case-different, e.g. `qa smoke` if you already added `QA Smoke`) | Nothing duplicates — no second `qa smoke` pill appears. |
| B6 | Click the **×** on one of the pills | That pill disappears immediately (client-side; not yet saved). |
| B7 | Click **Save** | Dialog closes, the row list refreshes. PL1's row now shows the tag chips you ended up with in B2–B6. |
| B8 | Reopen **Edit tags…** on PL1 | The chips shown match exactly what you saved in B7 — the round trip through the backend didn't drop or duplicate anything. |
| B9 | Remove every chip (click × on all) and **Save** | PL1's row shows no tag chips at all afterward. |
| B10 | Re-tag PL1 with `QA Smoke` again (for section D below) and Save | One chip, `QA Smoke`. |

## C. Filtering by tag

| # | Step | Expected |
|---|---|---|
| C1 | Click **Tags** tab, then click `QA Smoke` in the list | The table narrows to only playlists tagged `QA Smoke` — PL1 should be the only (or one of the) rows shown. |
| C2 | Look at the browser's address bar | The URL now has `?tag=<some-id>` (or similar) in the query string — not `folder=`. |
| C3 | Reload the page (F5) | You land back on the same filtered view — still showing only `QA Smoke`-tagged playlists, and the Tags tab is the one shown as active in the rail (not Folders). |
| C4 | Copy the URL, open it in a new tab (still logged in) | Same filtered view opens directly — the tag selection is fully reconstructed from the URL alone. |
| C5 | Click **All** at the top of the Tags list | Filter clears, full list returns, `?tag=` disappears from the URL. |

## D. Folder / Tag mutual exclusivity

| # | Step | Expected |
|---|---|---|
| D1 | Click **Folders** tab, select any real folder (not "All") | List narrows to that folder; URL shows `?folder=...`. |
| D2 | Click **Tags** tab, select `QA Smoke` | List now shows the tag filter instead. Click back to **Folders** tab — the folder that was highlighted before is now back to **All**, not still selected. |
| D3 | With a tag selected, click **Trash** at the bottom of the Folders tab | You enter Trash mode (as before #41). Check the address bar and the Tags tab — the tag selection is gone; Trash and a tag selection cannot both be active. |
| D4 | Leave Trash (click **All** in Folders), reselect `QA Smoke` in Tags, then pick a different folder in the Folders tab | Same mutual-clear behavior as D2, just the other direction. |

## E. Chips on the list + regressions

| # | Step | Expected |
|---|---|---|
| E1 | With no tag/folder filter active, scan the table | Any playlist carrying tags shows small grey pill chips under its name, beneath the "By <creator>" line if present. Untagged playlists show nothing extra there — no empty pill, no layout shift. |
| E2 | Open a Playlist in the editor (pencil icon), change nothing tag-related, click **Save Draft** | Saves normally — editing tags from the list never touched the editor's revision-locked save path. |
| E3 | Move a playlist between folders (row menu → Move to folder…) | Still works exactly as before; unaffected by the tags work. |
| E4 | Sort the table by any column, then filter by status/type (existing filters) while a tag is selected | Sorting and the existing filters keep working together with the tag filter — e.g. sort by Name while `QA Smoke` is selected still only shows tagged rows, sorted. |
| E5 | Open DevTools Console throughout A–E | No uncaught errors, no React warnings. |
| E6 | Open a Playlist's **Details** side panel (the one with Playlist Type / Campaign / etc.) | There is **no Tags row** in this panel anymore — tags are edited from the list only now (X-1: `metadata.info.tags` removed). If you see a stray "Tags" row here or the panel throws, that's a bug. |

## Cleanup

From PL1's row menu → Edit tags…, remove any test tags you added (`QA Smoke`, etc.) and
Save, so the tenant's tag vocabulary doesn't accumulate test data. Tell me which tag names
you created during this run — same as the BE-5 checklist, I don't delete `media_core.tags`
rows without your approval.

## Report back

For each row: PASS / FAIL. For a FAIL, say what you saw instead and, if it's a console
error, paste it.

Two things that specifically gate what happens next:

- **Any row in section D** (mutual exclusivity) that fails — that's the core #41 AC and the
  part most likely to have an edge case I didn't think of.
- **E6** — if the Details panel still shows a Tags row or errors, `metadata.info.tags`
  removal (X-1) is incomplete somewhere I didn't find.

All PASS → #41 (BE-5 + FE-6) is done. Next is X-2 (browser-verify the whole epic against
the v1 plan) and then the single epic PR covering #38 + #40 + #41, which I'll ask you about
separately (Thai or English body, and it opens as Draft only if something here comes back
unverified).
