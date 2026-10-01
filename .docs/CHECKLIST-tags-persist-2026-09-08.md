# CHECKLIST — Composition tags persist for real (2026-09-08)

Ran after the root-cause correction: the backend was never missing. `Thunder_Core` was checked out on
`hotfix/poll-payload-ms`, so the local `:3001` server had no `tags/` route. It is now on
`feat/layoutV2` and restarted.

**Scope:** prove tags actually save, and that the two 2026-09-07 fixes still behave. Nothing else from
`CHECKLIST-layout-uiux-2026-09-07.md` needs re-running.

## Environment — already set up for you, verify only if something looks wrong

| | |
|---|---|
| Frontend | `http://localhost:3000` — running |
| Core | `http://localhost:3001` — restarted 2026-09-08 on `Thunder_Core` `feat/layoutV2` |
| Proxy config | `/api/proxy/__config` → `{"coreApiUrl":"http://localhost:3001","hasKey":true}` ✅ |
| DB | develop `ftfmokgphewzyxzwjitv` |
| Layout list | `/media-workspace/layouts` |
| Template list | `/media-workspace/layouts/templates` |

Already confirmed without the browser: `PUT /api/core/v1/media/compositions/<uuid>/tags` answers
**401** (auth), not 404 — the route resolves. A bogus sibling path still answers 404, so that 401 is
the route and not a catch-all.

Keep the browser **Console + Network** panels open for the whole run (§F).

---

## A. Tags persist — the thing that was broken

| # | Step | Expected |
|---|---|---|
| A1 | Open `/media-workspace/layouts`, open **`zz-ux-blank`** in the editor | editor loads, existing tag chips (if any) show in the Properties panel |
| A2 | Add tag `zz-tag-a`, then **Save Layout** | saves, redirects to the list. **NO** orange toast "บันทึก tags ไม่สำเร็จ…" |
| A3 | Network panel: find `PUT …/compositions/<id>/tags` | **200**, not 404 |
| A4 | Re-open `zz-ux-blank` | chip `zz-tag-a` is still there — this is the actual proof |
| A5 | Remove `zz-tag-a`, add `zz-tag-b` **and** `ZZ-TAG-B` (same word, different case), Save, re-open | exactly **one** chip, and it is the canonical stored name (RPC dedupes case-insensitively) |
| A6 | Back on the list — does a Tags rail / filter show `zz-tag-b` with a count? | rail lists it; clicking it filters the list to this Layout. *(If the rail is not on this page yet, mark N/A — server-side facet is `p_tag_id`, ticket 29)* |

## B. BUG-1 fix still does its job (warning path, not the error path)

The `try/catch` stays — prod has not had this phase's migrations, so an older backend must not cost
an operator their edit. Only check that the happy path is now silent:

| # | Step | Expected |
|---|---|---|
| B1 | During A2, watch the header/status area | badge moves to "saved just now" with a fresh timestamp |
| B2 | Open a Layout, change **nothing**, hit Cancel | leaves immediately — **no** "leave without saving?" prompt (the stuck-`isDirty` symptom) |
| B3 | Create a new Layout via **New Layout**, give it a name + one tag, Save | lands on the real id (not stuck on "Not saved"), appears in the list |

## C. BUG-2 fix unchanged — duplicate Template names

| # | Step | Expected |
|---|---|---|
| C1 | In the editor, **Save as Template** with a fresh name `zz-ux-tpl-4` | confirm enabled, saves |
| C2 | **Save as Template** again, same name `zz-ux-tpl-4` | confirm **disabled** + red "ชื่อนี้ถูกใช้ไปแล้ว" |
| C3 | **Save as Template** with `zz-ux-tpl-1` (exists from an earlier session) | confirm **disabled** + red |
| C4 | Open the **Template Picker** | `zz-ux-tpl-4` is listed without a page reload |

## D. Regression sweep

| # | Step | Expected |
|---|---|---|
| D1 | Console panel, whole run | no uncaught errors |
| D2 | Network panel, whole run | **no 404s at all** — the `…/tags` 404 from 2026-09-07 must be gone |
| D3 | Move a Layout into a folder, Save, re-open | folder sticks, no warning toast |

---

## How to report back

One line per row: `A1 PASS` / `A3 FAIL — got 500, body: …`. For any FAIL, paste the Network response
body and the Console line if there is one.

## After this passes — still outstanding (do not do now)

1. Commit + push the 3 frontend files to PR thunder_one_prj#60 (awaiting your word).
2. Update `docs/layouts/Phase1/tickets/README.md` + PR #60's Verification section.
3. **R0** — delete the `zz-ux-*` test rows on develop. Combined SELECT gets shown for approval first.
4. Merge `Thunder_Core#50` **before** #60, then apply this phase's migrations to **prod**
   (prod still lacks `media_composition_set_tags`; `media_compositions_library_list` is at 14 args).
