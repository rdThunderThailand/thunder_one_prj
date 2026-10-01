# RESULT — E1 `Save as Template` naming (browser-verified 2026-09-07)

Ran against **develop** (`ftfmokgphewzyxzwjitv`) via `CORE_API_URL=http://localhost:3001`
(`/api/proxy/__config` → `{"coreApiUrl":"http://localhost:3001","hasKey":true}`).
Login: `piyapat@thunder.co.th`.

## Verdict: fix works. 1 minor wording finding on the optional error path (E1).

| # | Result | Notes |
|---|---|---|
| A1 | ✅ PASS | Created `zz-e1-a` (2 zones, 1920×1080), saved, reopened → `Save as Template` visible |
| A2 | ✅ PASS | Never-saved new Composition → no `Save as Template` button (only the Save split-button, both options disabled "กรุณากรอกชื่อ Layout") |
| A3 | ✅ PASS | Modal opens, title `Save as Template`, field prefilled `zz-e1-a`, autofocused |
| A4 | ✅ PASS | Renamed header to `zz-e1-a2` (unsaved), reopened dialog → prefill re-read as `zz-e1-a2` |
| A5 | ✅ PASS | `ยกเลิก` closes modal; §F SQL shows no stray row written |
| B1 | ✅ | Picked active Template `T25 Layout` |
| B2 | ✅ PASS | Typing `T25 Layout` → button disabled + red `ชื่อนี้ถูกใช้ไปแล้ว กรุณาตั้งชื่ออื่น` |
| B3 | ✅ PASS | Cleared field → button disabled, no red line |
| B4 | ✅ PASS | Fresh name `zz-e1-tpl-3col` → button enabled, no red line |
| C1 | ✅ | Entered `zz-e1-tpl-3col` |
| C2 | ✅ PASS | Modal closes, header `กำลังบันทึก…`, redirect to `/media-workspace/layouts/templates` |
| C3 | ✅ **PASS (the fix)** | Templates list row named **`zz-e1-tpl-3col`** — not `comp:<uuid>` |
| C4 | ✅ PASS | Template `8848e2fc` zones = `Main`(0,0,50,100) + `Main 2`(50,0,50,100), 16:9 — matches `zz-e1-a` |
| C5 | ✅ PASS | Reopened `zz-e1-a` from Compositions list → loads, both Zones intact |
| C6 | ✅ PASS | On that editor `Save as Template` is gone (backing row is now `kind='template'`) |
| D1–D2 | ⏭️ SKIPPED | `zz-e1-a` had no Zone bound to content (0/2), so the round-trip binding check is not meaningful — not exercised |
| E1 | ⚠️ PARTIAL | Fails safely, Thai message, banner in header error slot (not behind modal), **no orphan row** — but wording is `บันทึกไม่ได้ — มี Composition ชื่อนี้อยู่แล้ว`, not the checklist's `ชื่อนี้ถูกใช้ไปแล้ว กรุณาตั้งชื่ออื่นแล้วลองใหม่`, and it says "Composition" when the collision is with a Template (`I1 Test Layout`, inactive) |
| E2 | ⏭️ SKIPPED | Optional; E1 already demonstrates rename-before-flip safety |

## §F SQL (develop) — PASS

```
zz-e1-tpl-3col   kind=template   used_by=1
```

Only `comp:<uuid>` template row present is `9af4e90a…` (2026-09-06 14:06, pre-existing from
ticket 28's E1 ⚠️) — **not** produced by this run. The failed E1 attempt left `zz-e1-e`'s
backing layout `dcc5c958…` as `kind='inline'` (invisible in Templates) — rename-before-flip held.

## E1 finding detail

Flow on collision: `save()` persists the Composition, then `promoteLayoutToTemplate` →
`upsertLayout` PATCH with the taken name → 409 → `classifyApiError`. The surfaced string is the
generic Composition-name-conflict message, so it (a) doesn't match the E1 spec wording and
(b) mislabels a Template-name collision as a Composition one. Behaviour is safe; only the copy
is misleading. Low priority (needs an inactive/foreign template name to hit — client catch
covers every active one).

## §G Cleanup — test rows on develop (`ftfmokgphewzyxzwjitv`), NOT yet deleted

| table | id | name |
|---|---|---|
| media_core.compositions | `13fbc93d-cecc-43ed-9371-4bd14d8aa16c` | zz-e1-a |
| media_core.compositions | `b8f72785-8249-4817-8a94-24f7da3adb00` | zz-e1-e |
| media_core.layouts | `8848e2fc-ac71-4ee6-8e60-75a34b0f22d0` | zz-e1-tpl-3col (template, used_by=1) |
| media_core.layouts | `dcc5c958-d9e5-43b8-93b7-a077d1ea90d0` | comp:dcc5c958… (inline, backs zz-e1-e) |

Add to the pending section-F cleanup list from `.docs/CHECKLIST-28-*` — do not delete without listing (R0).
