# Session Log — Layout: filter Back/Forward + duplicate-name migration — 2026-08-26

## Scope

สองบั๊กที่ค้างจาก Task 8 Step 3 ของ Layout UI (`docs/layouts/plan-layout-execution.md`):

1. Back/Forward ไม่คืน state ของ filter/sort/page บนหน้า Layouts, Playlists, Channels
2. duplicate-name แสดง `Media operation failed` แทนข้อความไทย

## Part 1 — Back/Forward

- เพิ่ม `src/hooks/use-list-url-state.ts` (shared hook) + `use-list-url-state.check.mts`
- แก้สามหน้าให้ใช้ hook นี้แทนการเรียก `window.history.replaceState` ตรงๆ:
  `LayoutsListPage.tsx`, `PlaylistsListPage.tsx`, `ChannelsListPage.tsx`
- เขียน `docs/adr/0047-list-url-state-history-navigation.md` และแก้ `docs/adr/0027` ให้ระบุว่าถูก
  supersede เฉพาะข้อ `replaceState`

### Root cause ของบั๊กแรก (พบระหว่างแก้ ไม่ใช่ตอนวางแผน)

การ implement รอบแรก (ก่อน browser verify) มีบั๊ก: `isFirstRun` flag ถูกเคลียร์เฉพาะตอนที่ effect
ตอน mount **เขียน URL จริง** — ถ้าเข้าหน้าด้วย URL สะอาดอยู่แล้ว (เคสปกติที่สุด) mount effect จะ
`return` ก่อนถึงจุดเคลียร์ flag → flag ค้างเป็น `true` → การกดครั้งแรกของผู้ใช้ถูกมองว่าเป็น mount
แล้วใช้ `replaceState` กินประวัติที่ควรมีไว้ให้ Back กลับไป

**พิสูจน์ด้วยการ simulate effect body ก่อนแก้จริง** (ไม่เดา) — ผลตรงกับอาการที่ browser test
ครั้งแรกรายงานมาทุกข้อ (A2/A5/A8, B2/B5/B11, C2/C5/C8)

แก้โดยยุบ logic ทั้งหมด (รวม mount bookkeeping) เข้า pure function เดียว `nextHistoryOp()`
เพื่อให้เขียน check ไล่เป็น**ลำดับการกดทั้งชุด**ได้ ไม่ใช่ทดสอบทีละ transition แบบเดิม
(`historyModeFor()`) ซึ่งเป็นช่องโหว่ที่ทำให้บั๊กหลุด check เขียวไปได้ตั้งแต่แรก

ระหว่างเขียน check แบบ red-first เจอบั๊กที่สอง: การเปลี่ยนหน้า (page 2→3) ล้วนๆ ถูกนับเป็น
"search edit" แล้วยุบรวมกับ run การพิมพ์ก่อนหน้า — แก้ `isSearchEdit` ให้เรียกร้องว่า `q` ต้องต่างจริง

### ของที่เพิ่มเพิ่มเติมนอกแผนเดิม — ปุ่ม Clear all

ตรวจสอบเช็คลิสต์ browser verify v1 พบว่าข้อ "เคลียร์ filter กลับ default" ไม่มีปุ่มให้กดเลย
สามหน้านี้มี `onClearFilters` ต่อเข้ากับ empty-state component เท่านั้น (โผล่เฉพาะตอน rows ว่าง)
และ handler เดิม reset แค่ `filters` ไม่แตะ `sort`/`page`

หลังถามผู้ใช้ ตัดสินใจ: **เพิ่มปุ่ม `Clear all`** ในแถบ filter ทั้งสามหน้า โผล่เฉพาะตอน query
string ไม่ว่าง กดแล้ว reset ครบ filters/sort/page/perPage (และ tab สำหรับ Playlists)

## Part 2 — duplicate-name migration

- Apply `Thunder_Core/supabase/migrations/20260825104559_layout_upsert_duplicate_name.sql`
  ผ่าน Supabase MCP `apply_migration` ลง project ThunderCore (`sfiefevtxalqjizdkcsw`)
- production migration history บันทึกเป็น version `20260825152329` (ไม่ตรงกับชื่อไฟล์ในเครื่อง —
  `apply_migration` ตั้ง timestamp เอง เป็นรูปแบบเดิมที่เคยเจอมาก่อน)
- ตรวจหลัง apply: overload เดียว (9 args), `pg_get_functiondef` ตรงกับไฟล์ทุกบรรทัด, grants
  ถูกต้อง (มีแค่ `service_role`/`postgres`), security advisors ตรง baseline เดิมเป๊ะ (22 ERROR /
  102 WARN / 57 INFO), ไม่มีรายการใหม่บน `layouts`

## Verification

### Static — รันจริงวันนี้

- 7/7 check files (`.check.mts`) PASS — รวม `use-list-url-state.check.mts` ที่เขียนใหม่
- `pnpm exec next typegen && pnpm exec tsc --noEmit` — exit 0
- `pnpm lint` — exit 0
- `git diff --check` — สะอาด
- **ของเดิมที่พังอยู่ก่อนแล้ว ไม่ใช่ของใหม่**: `playlists/list-url-state.check.mts` FAIL ด้วย
  `ERR_UNSUPPORTED_DIR_IMPORT` — พิสูจน์แล้วโดย stash แล้วรันที่ HEAD ก็ FAIL เหมือนกัน (bare
  directory import `../types` ใน `PlaylistsFilters.tsx`) ไม่ได้แก้ตาม §1 no scope creep

### Browser — verify ผ่านผู้ใช้ (ตามเช็คลิสต์ v2)

ผลที่ผู้ใช้รายงานกลับ:

- **Layouts A1–A11**: ผ่านหมด
- **Playlists B1–B13**: ผ่านหมด (รวม tab back/forward และ Type/Campaign filter)
- **Channels C1–C11**: ผ่านหมด (รวมกรณี default sort ต่างจากสองหน้าอื่น)
- **Duplicate name D1–D4**: ผ่านตั้งแต่รอบก่อนหน้า ไม่ได้ทำซ้ำ (ไม่มีอะไรแตะโค้ดส่วนนั้นในรอบนี้)
- ยืนยันจากผู้ใช้: ไม่มีการเขียนข้อมูล production ระหว่างทดสอบ

**Multi-row sort ordering**: รับหลักฐานจาก `list-filtering.check.mts` เท่านั้น ตามที่ตกลงไว้ —
ไม่ได้สร้าง Layout ตัวที่สองใน production เพื่อพิสูจน์

ทุก verify point ในเซสชันนี้ถามผู้ใช้ก่อนทุกครั้งตาม `CLAUDE.md` §3

## เอกสารที่อัปเดต

- `docs/layouts/plan-layout-execution.md` — Task 8 Step 3 ติ๊กครบ พร้อมอ้างอิงว่าข้อไหนมาจาก
  session 2026-08-25 (editor/archive/restore) และข้อไหนมาจากวันนี้ (back/forward, duplicate name)
- `docs/adr/0047-list-url-state-history-navigation.md` — แก้ให้ตรงกับชื่อฟังก์ชันจริงหลัง refactor
  (`nextHistoryOp` แทน `historyModeFor`) และบันทึก root cause ที่เจอไว้ในตัว ADR

## หมายเหตุ — งานคู่ขนานที่พบระหว่างเซสชัน (ไม่ใช่ของเซสชันนี้)

ระหว่างทำงาน พบว่ามีอีก session ทำงานคู่ขนานอยู่บนของ Checklist B ข้อ 0 ของ handoff
(`.docs/HANDOFF-layout-next-phase-2026-08-26.md`) ไปแล้ว — สร้าง `docs/adr/0048-per-zone-content-binding.md`,
`docs/layouts/spec-per-zone-content.md`, `docs/layouts/tickets/*` (7 ไฟล์) ใน `thunder_one_prj`
และใน `Thunder_Core`: migration ใหม่สองไฟล์ (`20260826090000_publication_zone_bindings.sql`,
`20260826093000_media_device_capabilities.sql`), route ใหม่ (`publications/[id]/zones`), และแก้ไฟล์
เดิมสองไฟล์ (`device-profile/route.ts`, `014_restore_auth_fkey.sql` — ไฟล์หลังเดิมเป็นไฟล์เปล่า
ไม่ใช่การแก้ migration ที่มีเนื้อหาอยู่แล้ว)

**ไม่ได้แตะไฟล์กลุ่มนี้เลยในเซสชันนี้** ทั้งไม่ stage ไม่ commit ไม่ apply migration ใดๆ ที่เกี่ยวข้อง
ปล่อยให้เป็นความรับผิดชอบของ session ที่ทำอยู่ ผู้ใช้ควรทราบว่ามีสองงานเดินคู่กันอยู่ตอนนี้

## Git state ก่อนปิดเซสชัน

- `thunder_one_prj` (`feat/layout`): ก่อน commit นี้ ahead origin 5 commits (ของรอบก่อนหน้า
  ยังไม่ push) + งานเซสชันนี้ยังไม่ commit
- `Thunder_Core` (`feat/layout`): sync กับ origin — migration ของ Part 2 commit ไปแล้วตั้งแต่ก่อน
  เซสชันนี้ (`42933af`) ไม่มีอะไรของเซสชันนี้ต้อง commit เพิ่มใน repo นี้
