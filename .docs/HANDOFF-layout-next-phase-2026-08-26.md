# Handoff — Layout: ปิดงานที่ค้าง แล้วต่อด้วย per-Zone content binding

**เขียน 2026-08-26** · repo: `thunder_one_prj` + `Thunder_Core` · branch ทั้งคู่: `feat/layout`

เซสชันก่อนหน้าแก้บั๊กสองตัวจนจบฝั่งโค้ด แต่ **ยังไม่ได้ verify ผ่าน browser และยังไม่ได้ commit**
เอกสารนี้คือ (1) checklist ปิดงานค้าง และ (2) แผนงาน Layout เฟสถัดไป

---

## อ่านตามลำดับนี้ก่อนลงมือ

| ไฟล์ | อ่านเพื่อ |
|---|---|
| `docs/adr/0044-multi-zone-layout.md` §5, §8, §9, §11 | สี่ก้อนที่ยังไม่ได้สร้าง — เป็นแกนของเฟสถัดไปทั้งหมด |
| `docs/adr/0045-publication-snapshot-materialization.md` | ตารางปลายทางที่ Layout จะเขียนลง (apply production แล้ว) |
| `docs/adr/0047-list-url-state-history-navigation.md` | ของใหม่เซสชันนี้ — supersede 0027 บางข้อ |
| `docs/layouts/plan-layout-execution.md` | Task 1–8 · เหลือค้างข้อเดียวคือ Task 8 Step 3 |
| `.docs/HANDOFF-layout-ui-2026-08-25.md` | handoff รอบก่อน (Tasks 1–5) |

---

## สถานะ repo — เช็คจริง 2026-08-26 08:50

| repo | branch | vs origin | working tree |
|---|---|---|---|
| `thunder_one_prj` | `feat/layout` | **ahead 5, behind 0** | **dirty — 7 ไฟล์** |
| `Thunder_Core` | `feat/layout` | sync แล้ว | สะอาด |

> ⚠️ **ข้อแรกขัดกับที่เข้าใจกันตอนต้นเซสชัน** — โจทย์ตั้งต้นบอกว่า "commit และ push แล้วทั้งสอง repo"
> แต่ `thunder_one_prj` ยัง ahead อยู่ 5 commits (`e660e7b`, `ae2457b`, `4ed80f3`, `8c975f0`, `17d5af9`)
> ยังไม่ได้ push · ส่วน `Thunder_Core` sync จริงตามที่เข้าใจ

ไฟล์ที่ยังไม่ commit ใน `thunder_one_prj`:

```
 M docs/adr/0027-playlist-list-url-state.md
 M src/features/media-workspace/channels/components/ChannelsListPage.tsx
 M src/features/media-workspace/layouts/components/LayoutsListPage.tsx
 M src/features/media-workspace/playlists/components/PlaylistsListPage.tsx
?? docs/adr/0047-list-url-state-history-navigation.md
?? src/hooks/use-list-url-state.check.mts
?? src/hooks/use-list-url-state.ts
```

---

## เสร็จแล้วในเซสชันนี้

### 1. Back/Forward ของ filter — แก้ครบสามหน้า (ยังไม่ commit)

บั๊ก: ทั้งสามหน้าเขียน URL ด้วย `replaceState` ตาม ADR 0027 → **ไม่มี history entry เลย** กด Back
หลุดออกจากหน้า และไม่มี `popstate` listener ต่อให้มี entry ก็ไม่คืน state

- `src/hooks/use-list-url-state.ts` (ใหม่) — สองส่วน:
  - `nextHistoryOp(current, qs, state)` → `{ op: "skip"|"push"|"replace", state }` · **pure, logic ทั้งหมดอยู่ตรงนี้
    รวม bookkeeping ของ mount และ search run** (เดิมแยกเป็น `historyModeFor` + ref ใน effect ซึ่งทำให้ check
    ไล่เป็นลำดับไม่ได้ และเป็นเหตุที่บั๊กหลุด browser verification รอบแรก)
    กติกา: `q` ต้องต่างจริง และคีย์อื่นนอกจาก `q`/`page` เท่าเดิม = search edit → ตัวแรกของ run push ตัวถัดไป replace ·
    อย่างอื่น push แล้วปิด run · **ไม่ใช้ timer** (run จบเมื่อผู้ใช้ทำอย่างอื่น ไม่ใช่เมื่อหยุดพิมพ์ครบ N ms)
  - `useListUrlState(qs, restore)` — hook wiring: กัน write ซ้ำเมื่อ `qs` ตรงกับ URL ปัจจุบัน, run แรก
    หลัง mount ใช้ `replaceState` เสมอ, ที่เหลือ push/replace ตาม `nextHistoryOp`, ฟัง `popstate` → `restore()`
- `src/hooks/use-list-url-state.check.mts` (ใหม่) — ไล่ `nextHistoryOp` เป็น **ลำดับการกดทั้งชุด**
  (mount → filter → พิมพ์ → sort → page) แล้ว assert ทั้ง ops และ history stack ที่ได้
- แก้สามหน้าให้ใช้ hook: `LayoutsListPage.tsx`, `PlaylistsListPage.tsx`, `ChannelsListPage.tsx`
  (Playlists ต้อง restore `tab` ด้วย · Channels มี `useState<ListState>` ก้อนเดียวอยู่แล้วเลยสั้นสุด)
- `docs/adr/0047-list-url-state-history-navigation.md` (ใหม่) + แก้ 0027 เป็น superseded เฉพาะข้อ `replaceState`

**จุดที่พลาดง่ายถ้าจะแก้ต่อ:** `restore()` ต้องอ่าน `window.location.search` **ห้ามใช้ `useSearchParams()`**
— `pushState` ตรงๆ ไม่ทำให้ Next อัปเดต `useSearchParams()`

### 2. duplicate-name migration — apply production แล้ว

- ไฟล์ในเครื่อง: `Thunder_Core/supabase/migrations/20260825104559_layout_upsert_duplicate_name.sql` (commit `42933af` แล้ว)
- apply ผ่าน Supabase MCP ลง project `sfiefevtxalqjizdkcsw` (ThunderCore) เรียบร้อย
- แก้เฉพาะ body ของ `public.media_layout_upsert` — ห่อทั้ง INSERT (create) และ UPDATE (edit) ด้วย
  `EXCEPTION WHEN unique_violation THEN RAISE EXCEPTION 'Already exists: a layout named "%" exists'`
  เพื่อให้ผ่าน `EXPECTED_ERROR` regex ใน `Thunder_Core/src/lib/core/media.ts:29`

> ⚠️ **version drift** — ชื่อไฟล์ในเครื่องคือ `20260825104559` แต่ production migration history บันทึกเป็น
> **`20260825152329`** เพราะ `apply_migration` ตั้ง timestamp เอง · เป็นรูปแบบเดิมที่เกิดกับ `20260825094420_layouts.sql`
> (production เก็บเป็น `20260825095404`) ด้วย — สอดคล้องกับ memory `thunder-core-migration-cli-drift`
> **อย่าพยายาม repair history ให้ตรง** ปล่อยไว้ตามเดิม แค่รู้ว่าเทียบชื่อไฟล์กับ history ตรงๆ ไม่ได้

---

## หลักฐาน verification — รันจริง 2026-08-26 ไม่ใช่ของจำ

### ผ่านแล้ว

| อะไร | ผล |
|---|---|
| check files 8 ตัว | **7 PASS / 1 FAIL** (ตัวที่ตกเป็นของเดิม ดูด้านล่าง) |
| `pnpm exec next typegen && pnpm exec tsc --noEmit` | exit **0** |
| `pnpm lint` | exit **0** |
| `git diff --check` | สะอาด |
| DB: overload ของ `media_layout_upsert` | **มีตัวเดียว** (oid 115535, 9 args) |
| DB: `pg_get_functiondef` เทียบไฟล์ | ตรงทุกบรรทัด |
| DB: grants | `service_role` + `postgres` เท่านั้น — **ไม่มี** `anon`/`authenticated`/`PUBLIC` |
| DB: advisors | security 22 ERROR / 102 WARN / 57 INFO = baseline เดิมเป๊ะ · perf 0 ERROR · **ไม่มีรายการใหม่บน layouts** |

### ❌ ยังไม่ได้ทดสอบ — ห้ามเขียนว่า verified

- **browser ทั้งหมด** — Back/Forward ทั้งสามหน้ายังไม่เคยกดจริงสักครั้ง
- **HTTP/UI ของ duplicate name** — ยืนยันแค่ระดับ DB ว่า function ใหม่อยู่จริง
  ยังไม่เคยยิงผ่าน route จริงให้เห็นข้อความ `ชื่อนี้ถูกใช้ไปแล้ว กรุณาตั้งชื่ออื่นแล้วลองใหม่`

### ⚠️ ของเดิมที่พังอยู่ก่อนแล้ว (ไม่ได้แก้ — นอก scope)

`src/features/media-workspace/playlists/list-url-state.check.mts` รันไม่ผ่าน:

```
ERR_UNSUPPORTED_DIR_IMPORT: Directory import '.../playlists/types'
```

**พิสูจน์แล้วว่าไม่ใช่ของใหม่** — stash แล้วรันที่ HEAD ก็ FAIL เหมือนกัน
สาเหตุ: `list-url-state.ts:7` import type จาก `./components/PlaylistsFilters.tsx` (ไฟล์ `"use client"`)
ซึ่ง import `../types` แบบ bare directory — Node ESM resolve ไม่ได้ ต้องเป็น `../types/index.ts`
แก้จริงน่าจะบรรทัดเดียว แต่**ยังไม่แก้ตาม §1 no scope creep** — รอสั่ง

---

## Checklist A — ปิดงานค้าง (ทำให้จบก่อนเริ่มของใหม่)

- [ ] **Browser verify — ถามผู้ใช้ก่อนทุกครั้งตาม §3** เสนอสามทาง: (1) ผมเดินเบราว์เซอร์เอง
      (2) ให้ checklist ไปกดเอง (3) ข้าม = นับ unverified
      ต่อหน้า `/media-workspace/{layouts,playlists,channels}`:
  - [ ] เปลี่ยน status filter → URL + rows เปลี่ยน → Back → URL, ค่าใน control **และ rows** กลับของเดิม → Forward → กลับไปที่กรอง
  - [ ] พิมพ์คำค้น 5 ตัวอักษรรวดเดียว → Back **ครั้งเดียว** กลับไปตอนช่องว่าง (ไม่ใช่ 5 ครั้ง)
  - [ ] เปลี่ยน sort แล้วเปลี่ยนหน้า → Back สองครั้งย้อนทีละขั้น
  - [ ] refresh ที่ URL ที่กรองไว้ → ได้ view เดิม
  - [ ] state default → URL สะอาด **ไม่มี `?` ห้อยท้าย** (เคสเดิมของ Channels ที่แก้ไปแล้ว)
- [ ] **duplicate name ผ่าน UI จริง** ที่ `/media-workspace/layouts` → สร้าง Layout ชื่อซ้ำ
      → ต้องเห็น `ชื่อนี้ถูกใช้ไปแล้ว กรุณาตั้งชื่ออื่นแล้วลองใหม่` (มาจาก `src/lib/api/api-error.ts:96-100`)
  - [ ] ยืนยันว่า **ไม่มี Layout เพิ่มในลิสต์** หลัง error (RPC เป็น transaction เดียว)
  - [ ] **ห้ามแตะ production Layout `413d7b1f-b1f5-4c97-b5b0-8616d537570b`**
  - [ ] multi-row sort: รับหลักฐานจาก `list-filtering.check.mts` — **ไม่สร้าง production record ตัวที่สอง**
- [ ] ติ๊ก `docs/layouts/plan-layout-execution.md` **Task 8 Step 3** พร้อมผลจริงรายข้อ (ข้อ 2 กับข้อ 10 คือสองข้อที่บั๊กนี้ค้างอยู่)
- [ ] เขียน `.docs/SESSIONLOG-<topic>-<date>.md` ไฟล์ใหม่ (ยังไม่ได้เขียน — จงใจรอผล browser
      เอกสารฉบับนี้ทำหน้าที่เก็บบันทึกไว้ชั่วคราว)
- [ ] **commit + push ทั้งสอง repo — เมื่อสั่งเท่านั้น** · ห้ามใส่ `Co-Authored-By: Claude` · verify ไม่ครบ → PR เปิดเป็น **Draft** · ถามก่อนว่า PR เอาไทยหรืออังกฤษ

---

## Checklist B — งาน Layout เฟสถัดไป

**เป้าหมาย: ทำให้ Layout ที่สร้างไว้เอาไปใช้กับ content จริงได้** ตอนนี้สร้าง/แก้/archive Layout ได้แล้ว
แต่ยังผูกเนื้อหาไม่ได้และยังส่งถึง player ไม่ได้

### สิ่งที่มีอยู่แล้ว (อย่าสร้างซ้ำ)

- `media_core.layouts` + `layout_zones` + RPC สี่ตัว — apply production แล้ว
- `media_core.publication_snapshots` + **`publication_snapshot_zones`** + `publication_snapshot_items` — apply แล้ว
  **ตาราง zone รองรับ Layout ไว้ตั้งแต่ต้น**: มี `source_layout_zone_id` (nullable), geometry bounds CHECK,
  playback shape CHECK · flat Publication ได้ implicit zone เดียว `x=0 y=0 w=100 h=100 role=main`
  → **ที่ขาดคือตัว writer และ reader ไม่ใช่ schema**
- templates 7 ตัวเป็น frontend constants (§7) · `LayoutWireframe` component

### ยังไม่มีเลย — เรียงตามลำดับที่แนะนำ

- [ ] **0. เคาะ design fork ก่อน: per-Zone content อยู่ที่ไหนตอนยังเป็น draft?**
      ADR 0044 §5 พูดถึงแค่ตอน publish (materialize ลง snapshot) แต่**ไม่ได้บอกว่าก่อน publish
      เก็บที่ไหน** — จะเป็นตารางใหม่ `publication_zones`, ต่อขยาย `publication_drafts`, หรือเก็บใน jsonb ของ draft
      → นี่คือ **design fork** (เลือกผิดแล้วรื้อยาก, กระทบ data model) ต้อง `grill-with-docs` → ผู้ใช้เคาะ → **ADR 0048**
      **ห้ามเดาเองแล้วลงมือ** และถ้าตอนนั้นเป็น Sonnet ให้หยุดเสนอสลับ Opus ก่อน (§2)
- [ ] **1. §11 capability gate** — ยังไม่มี `assets.player_capabilities jsonb` ในทุก migration
      ต้องมี: เพิ่มคอลัมน์ · `media_device_profile_set` รับ `capabilities` · publish ปฏิเสธเมื่อ device ไม่เคยรายงาน
      หรือ `max_video_zones` ต่ำกว่าที่ Layout ต้องการ (**unknown = fail**) · widen `media_heartbeat` ให้คืน
      `profile_required` เมื่อ `player_capabilities IS NULL`
- [ ] **2. §8 equal-priority block** — `media_schedule_conflicts` ต้องเพิ่มเคส **blocking** (ของเดิมเป็นแค่ warning)
      เมื่อ Publication ที่ priority เท่ากันซ้อนกันบน Media Device เดียวกัน และฝั่งใดฝั่งหนึ่งใช้ Layout
- [ ] **3. per-Zone content binding ใน Publication wizard** — UI ตาม mockup 3 (template picker → per-Zone content → settings)
      ขึ้นกับผลของข้อ 0
- [ ] **4. §9 `zones[]` payload ใน `media_job_poll`** — Publication ที่ไม่มี Layout คืน `slots[]` เหมือนเดิม
      **ห้ามแตะ flat contract** · ที่มี Layout คืน `zones[]` แต่ละอันมี geometry + `loop_duration_seconds` + `slots[]` ของตัวเอง
      `loop_anchor_at` เป็น **ค่าเดียว top-level ใช้ร่วมทุก Zone** ไม่ใช่ per-Zone (§10)

### Blocker ที่อยู่นอกสอง repo นี้

- **Player A1 (content component abstraction)** — audit บอกตรงๆ ว่า multi-zone rendering
  *"lands on top of A1, not beside it"* ตอนนี้ player ยังเป็น `if Image / else if Video` ใน `PlayerViewModel.ExecutePlay`
  **ไม่บล็อกข้อ 0–4** (ทำและ verify ฝั่ง server ได้ครบ) แต่บล็อกการเห็นผลจริงบนจอ
- **playback_logs สองบั๊กค้าง** (ADR 0044 ระบุไว้): `duration_played_seconds` ต่ำกว่าจริงคงที่ 1.2–1.8 วิ
  และราวครึ่งของ entry ที่ควรมาไม่มา · **Zone ยิ่งคูณทั้งสองบั๊กตามจำนวน Zone** ต้องปิดก่อนขึ้น §12

---

## กับดักที่เจอมาแล้ว (อ่านก่อนแตะของเดิม)

- **`apply_migration` ตั้ง timestamp เอง** → ชื่อไฟล์ในเครื่องไม่ตรงกับ production history เสมอ (ดูด้านบน)
- **`CREATE OR REPLACE FUNCTION` ไม่ replace ถ้าเพิ่ม parameter** — จะได้ overload ซ้อน call เดิม ambiguous
  รอบนี้ปลอดภัยเพราะ signature เดิมเป๊ะ · ถ้าจะเปลี่ยน arg ต้อง `DROP FUNCTION` นำหน้าเสมอ
- **`CREATE FUNCTION` แจก EXECUTE ให้ PUBLIC อัตโนมัติ** — ทุก migration ต้องมี `REVOKE ... FROM PUBLIC, anon, authenticated`
  แล้วค่อย GRANT ให้ `service_role` และ**ต้องเช็ค `has_function_privilege` จริงหลัง apply**
- **`pushState` ไม่อัปเดต `useSearchParams()`** — restore ต้องอ่าน `window.location.search`
- **frontend เรียก backend ที่ deploy อยู่** (`CORE_API_URL` → `thundercore.vercel.app`)
  แก้ route ฝั่ง Thunder_Core ในเครื่องแล้วเทสผ่าน UI จะไม่เห็นผลจนกว่าจะ deploy · เช็คด้วย `/api/proxy/__config`
  → **แต่ migration ที่ apply ผ่าน MCP มีผลทันที** ดังนั้น duplicate name เทสได้เลยไม่ต้อง deploy
- **Thunder_Core `tsc` ไม่เคยสะอาด** (~127 errors เดิม) — gate ที่ไฟล์ที่แก้ ไม่ใช่ยอดรวม
- **tenant isolation อยู่ใน RPC ไม่ใช่ RLS** — plpgsql function ใหม่ต้อง filter tenant เอง

---

## ของที่ยังไม่เคาะ

1. **per-Zone draft storage** (Checklist B ข้อ 0) — ต้องมี ADR ก่อนเขียนโค้ด
2. **playlists check ที่พังอยู่** — แก้ `../types` → `../types/index.ts` บรรทัดเดียว หรือปล่อยไว้? รอสั่ง
3. **ADR 0044 §12** อ้างถึงแต่ยังไม่ได้อ่านในเซสชันนี้ — ตรวจก่อนวางแผนข้อ 4
4. **PR ของงาน URL history** — ยังไม่เปิด · verify ไม่ครบ → ต้องเป็น Draft
