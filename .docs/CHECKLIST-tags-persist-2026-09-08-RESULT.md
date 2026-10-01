# RESULT — CHECKLIST-tags-persist-2026-09-08.md

Run 2026-09-08, via Browser tool (Claude driving directly, per user instruction). Session lost
login mid-run before D3; user re-signed in and D3 was completed in a second pass.

## A. Tags persist

| # | Result |
|---|---|
| A1 | PASS — editor loads, TAGS section empty (fresh row) |
| A2 | PASS — added `zz-tag-a`, Save Layout redirected, no warning toast |
| A3 | PASS — `PUT …/compositions/<id>/tags` → 200 |
| A4 | PASS — re-open shows chip `zz-tag-a` |
| A5 | PASS — removed, added `zz-tag-b` + `ZZ-TAG-B` → exactly one chip, canonical `zz-tag-b` |
| A6 | PASS — TAGS rail shows `zz-tag-b` (1), click filters list to `zz-ux-blank` |

## B. BUG-1 fix — warning path silent on happy path

| # | Result |
|---|---|
| B1 | PASS — timestamp updates on save, no orange warning toast |
| B2 | PASS — Cancel with no changes leaves immediately, no "leave without saving?" prompt |
| B3 | PASS — New Layout `zz-ux-b3` + tag `zz-tag-c3`, Save Layout lands on real id, appears in list |

## C. BUG-2 fix — duplicate Template names

| # | Result |
|---|---|
| C1 | PASS — Save as Template `zz-ux-tpl-4` succeeds |
| C2 | PASS — same name again → confirm button `disabled`, red "ชื่อนี้ถูกใช้ไปแล้ว" |
| C3 | PASS — `zz-ux-tpl-1` (pre-existing) → same disabled + red |
| C4 | PASS — Template Picker → My Templates lists `zz-ux-tpl-4` without a reload |

## D. Regression sweep

| # | Result |
|---|---|
| D1 | PASS — no console errors across the whole run |
| D2 | PASS — zero 404s across 406 captured requests (all 200/201/304) |
| D3 | PASS — moved `zz-ux-blank` into Test Folder 25 via real UI select + Save Layout, re-opened, folder stuck; list showed "In folder" |

**16/16 PASS.**

## Process note (not an app defect)

Mid-D3 I hit a false negative from my own automation: a `<select>` from an earlier-opened
"New Layout" modal stayed in the DOM (hidden, `offsetParent === null`) after the modal closed.
`document.querySelector` picked that stale node instead of the live Properties-panel select, so a
JS-simulated change event landed on the wrong element and looked like the move silently no-opped.
Confirmed via direct `fetch()` to the composition endpoint and via `form_input` on the correct
`ref` (filtered to `offsetParent !== null`) that the real save flow works end to end.

## After this — still outstanding (unchanged from the checklist)

1. Commit + push the 3 frontend files to PR thunder_one_prj#60 (awaiting the word).
2. Update `docs/layouts/Phase1/tickets/README.md` + PR #60's Verification section.
3. **R0** — delete the `zz-ux-*` test rows on develop (this run added more: `zz-ux-b3`,
   `zz-tag-c3`, `zz-ux-tpl-4`). Combined SELECT to be shown for approval first.
4. Merge `Thunder_Core#50` before #60, then apply this phase's migrations to **prod**.
