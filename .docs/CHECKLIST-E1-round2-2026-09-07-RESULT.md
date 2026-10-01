# RESULT — E1 round 2 (browser-verified 2026-09-07)

develop (`ftfmokgphewzyxzwjitv`) via `CORE_API_URL=http://localhost:3001`. Login `piyapat@thunder.co.th`.

## Verdict: both gaps closed. D and E all PASS.

`status-display.check.mts` → `all assertions passed`.

## D — Zone bindings survive the promotion ✅

Built `zz-e1-b` (composition `66910918-dd56-4732-bafd-a76137202dee`), 2 Zones both bound:
Main → Playlist `Boss test`, Main 2 → Playlist `test2`.

| # | Result | Evidence |
|---|---|---|
| D1 | ✅ PASS | Zone Overview 2/2 `Bound`, no unbound badge |
| D2 | ✅ PASS | `Save as Template` → `zz-e1-tpl-bound` → redirect to Templates list, row `zz-e1-tpl-bound` (16:9, 2 zones) — not `comp:<uuid>` |
| D3 | ✅ **PASS (the real risk)** | `composition_zones` SQL identical before/after — see below |
| D4 | ✅ PASS | Reopened `zz-e1-b` → Main `Bound · Boss test`, Main 2 `Bound · test2` |
| D5 | ✅ PASS | Preview played: Main = Subway/food video (77s), Main 2 = wildlife video (27s) — both zones live |

**D3 SQL — `layout_zone_id` round-tripped, no delete/reinsert:**

| zone | layout_zone_id (before = after) | playlist_id (before = after) |
|---|---|---|
| Main   | `08082118-2279-4cd5-a291-f73455e9beb6` | `2ff237ff-115b-4fab-8577-91c558bc2e57` |
| Main 2 | `84d424b5-6803-49a1-88a4-ae29aab0e03d` | `faac9b57-8281-4f7f-8a54-f7718300cc67` |

2 rows, same uuids, same playlists. `media_layout_upsert` took the UPDATE path — no
`zone is used by composition(s)` error, no silently-unbound Zones. `promoteLayoutToTemplate`
sending every Zone with its `id` is what holds this.

## E — corrected error copy ✅

Used inactive Template `I1 Test Layout` (client can't see it — `fetchLayouts()` omits inactive).
Composition: `zz-e1-e` (`b8f72785-…`, backing layout still `kind='inline'`).

| # | Result | Evidence |
|---|---|---|
| E2 | ✅ PASS | Button stays **enabled**, no client red line — inactive Template invisible to the client check |
| E3 | ✅ **PASS** | Fail message = `บันทึกไม่ได้ — มี Template ชื่อนี้อยู่แล้ว กรุณาตั้งชื่ออื่น` — says **Template**, not *Composition* |
| E4 | ✅ PASS | Banner in header error slot, below the buttons, no modal over it; modal closed |
| E5 | ✅ PASS | No new `kind='template'` row — `dcc5c958` (backs `zz-e1-e`) still `inline`; rename-before-flip held |

## §F final state (develop)

```
zz-e1-tpl-3col    kind=template  used_by=1
zz-e1-tpl-bound   kind=template  used_by=1
```

Only `comp:<uuid>` template row present is `9af4e90a…` — pre-existing from ticket 28, **not**
from either run. Both failed E attempts left their backing layouts `kind='inline'` (invisible in
Templates).

## §G Cleanup — pending list on develop (`ftfmokgphewzyxzwjitv`), NOTHING DELETED

Round 1 + round 2 combined:

| table | id | name |
|---|---|---|
| media_core.compositions | `13fbc93d-cecc-43ed-9371-4bd14d8aa16c` | zz-e1-a |
| media_core.compositions | `b8f72785-8249-4817-8a94-24f7da3adb00` | zz-e1-e |
| media_core.compositions | `66910918-dd56-4732-bafd-a76137202dee` | zz-e1-b |
| media_core.layouts | `8848e2fc-ac71-4ee6-8e60-75a34b0f22d0` | zz-e1-tpl-3col (template) |
| media_core.layouts | `2eae27f9-4d0d-4a12-8de3-04e81a66f266` | zz-e1-tpl-bound (template) |
| media_core.layouts | `dcc5c958-d9e5-43b8-93b7-a077d1ea90d0` | comp:dcc5c958… (inline, backs zz-e1-e) |

Plus the inline Playlist bindings on `zz-e1-b`. One combined list up for approval before any DELETE (R0).
