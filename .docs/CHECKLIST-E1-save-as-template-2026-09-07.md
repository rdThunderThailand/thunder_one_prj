# CHECKLIST — E1 `Save as Template` naming (2026-09-07)

Closes the E1 ⚠️ from `.docs/CHECKLIST-28-save-activate-2026-09-06.md`.
**Nothing here is browser-verified yet** — this is the list to run.

## What changed, so you know what you are looking at

- `Save as Template` now opens a **naming dialog** instead of promoting silently.
- The promotion is `fetchLayout` → `upsertLayout` (rename, Zone ids round-tripped) →
  `setLayoutKind('template')`. **Rename happens before the flip**, so a mid-way failure leaves
  the row private and invisible rather than dropping a `comp:<uuid>` row in the Templates list.
- The **in-place flip was not changed** — ADR 0052 §4 says `inline → template` "only ever widens
  who may point at the row", so the Composition keeping its `layout_id` is correct, not a bug.

## Setup

```bash
CORE_API_URL=http://localhost:3001 npm run dev
```

Thunder_Core must be running on `:3001` (→ **develop** DB `ftfmokgphewzyxzwjitv`).
Restart the dev server after changing `CORE_API_URL` or the proxy keeps hitting deployed develop
— confirm with `/api/proxy/__config`.

`/media-workspace/layouts` = Compositions list · `/media-workspace/layouts/templates` = Templates list.

---

## A. The dialog appears and is prefilled

| # | Step | Expected |
|---|---|---|
| A1 | Open a **saved** Composition with private geometry (create one named `zz-e1-a`, save it once) | `Save as Template` button is visible |
| A2 | On a **never-saved** new Composition | `Save as Template` is **not** visible (needs `layoutId` + `kind === "inline"`) |
| A3 | Click `Save as Template` | Modal opens, title `Save as Template`, name field prefilled **`zz-e1-a`**, focused |
| A4 | Rename the Composition in the header to `zz-e1-a2`, close the dialog, reopen it | Prefill now reads **`zz-e1-a2`** (it remounts, so it re-reads) |
| A5 | Click `ยกเลิก` | Modal closes, **nothing was written** — confirm with SQL §F: no new template row |

## B. Duplicate name is caught before the write

| # | Step | Expected |
|---|---|---|
| B1 | Note an existing Template's name from `/media-workspace/layouts/templates` | — |
| B2 | Open the dialog, type that exact name | `Save as Template` button goes **disabled**, red line `ชื่อนี้ถูกใช้ไปแล้ว กรุณาตั้งชื่ออื่น` |
| B3 | Clear the field | Button disabled (empty name) |
| B4 | Type a fresh name | Button enabled, no red line |

## C. Happy path

| # | Step | Expected |
|---|---|---|
| C1 | On `zz-e1-a2`, open the dialog and enter **`zz-e1-tpl-3col`** | — |
| C2 | Click `Save as Template` | Modal closes, header shows `กำลังบันทึก...` briefly, then redirects to `/media-workspace/layouts/templates` |
| C3 | Look at the Templates list | A row named **`zz-e1-tpl-3col`** — **not** `comp:<uuid>` ← this is the whole fix |
| C4 | Its wireframe / zone count | Matches `zz-e1-a2`'s geometry |
| C5 | Reopen `zz-e1-a2` from `/media-workspace/layouts` | Loads normally, Zones intact, bindings intact |
| C6 | On that reopened editor | `Save as Template` is now **gone** (the row is `kind='template'`, not `inline`) |

## D. The promotion did not break the Composition's bindings

Only meaningful if `zz-e1-a2` had at least one Zone bound to content. If you skipped binding,
say so rather than ticking this.

| # | Step | Expected |
|---|---|---|
| D1 | Reopen `zz-e1-a2`, check Zone Overview | Bound Zones still read *Bound*, same content as before |
| D2 | Open the preview | Plays the same content per Zone |

Why this can break: the rename resends the geometry through `media_layout_upsert`. Zone ids are
round-tripped, so the RPC **updates** the Zones rather than deleting and re-inserting them — if
they had been re-inserted, `composition_zones.layout_zone_id` would point at rows that no longer
exist. D1/D2 is the check that the round-trip actually held.

## E. Error path (optional, needs DevTools)

| # | Step | Expected |
|---|---|---|
| E1 | Have a colleague's Template name that is **not** in your loaded list (or insert one via SQL after the page loaded), then use it | Save fails with **`ชื่อนี้ถูกใช้ไปแล้ว กรุณาตั้งชื่ออื่นแล้วลองใหม่`** (from `isDuplicateName`), banner visible **not** hidden behind a modal |
| E2 | Block `PATCH /media/layouts/*` in DevTools, then Save as Template | Thai error shows; SQL §F confirms **no** new `kind='template'` row appeared (rename-before-flip means a failed rename leaves nothing visible) |

---

## F. SQL to confirm (develop, `ftfmokgphewzyxzwjitv`)

```sql
select l.id, l.name, l.kind, l.updated_at,
       (select count(*) from media_core.compositions c where c.layout_id = l.id) as used_by
from media_core.layouts l
where l.name like 'zz-e1-%' or l.name like 'comp:%'
order by l.updated_at desc
limit 20;
```

**Pass looks like:** one row `zz-e1-tpl-3col`, `kind = 'template'`, `used_by = 1`.
**Fail looks like:** a row still named `comp:<uuid>` with `kind = 'template'`.

## G. Cleanup

Test rows created here are `zz-e1-*`. Add them to the pending section-F cleanup list — do not
delete anything without listing it first (R0).
