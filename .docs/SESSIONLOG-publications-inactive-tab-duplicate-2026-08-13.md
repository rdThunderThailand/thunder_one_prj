# SESSIONLOG — Publications Inactive tab + Duplicate (2026-08-13)

## โจทย์ตั้งต้น

หน้า `/publications` แท็บ Active มีรายการสถานะ `ended` ปนอยู่ อยากให้ (1) แยกไปอีกแท็บ (2) ติ๊กเลือกหลายอันแล้วลบได้ (3) กด duplicate แล้วเข้าไปแก้จอ/วันเวลาใหม่ได้

## ผลลัพธ์: ทำ 2 จาก 3 — bulk-delete ถูกตัดออกโดยเจตนา

ระหว่าง grilling พบว่า schema ทั้งระบบไม่มี soft-delete เลย (`deleted_at`/`is_deleted` ไม่มีในตารางไหน) และ delete path เดียวที่มี (`media_publication_delete`) hard-delete และอนุญาตเฉพาะ `status='draft'` เท่านั้น เมื่อผู้ใช้ยืนยันว่า Thunder ต้องอ้างอิงประวัติการออกอากาศย้อนหลังได้ (proof-of-play) การ hard-delete publication ที่เคย active จึงทำลายหลักฐานถาวร — ตัด bulk-delete ออกจาก scope ทั้งหมด ไม่ทำ archive column ทดแทนด้วย (ยังไม่มีใครขอ)

## เอกสารที่เขียน

- `docs/adr/0015-publications-inactive-tab-and-duplicate.md` — บันทึกทั้งสามเรื่อง รวมการ reverse ADR 0004 (ที่เคยตัดสินใจ "ไม่ทำ Ended tab" เพราะกลัวรายการหาย — ในที่นี้ไม่หาย แค่ย้ายแท็บ เจตนาเดิมยังอยู่) และเหตุผลที่ตัด bulk-delete
- `docs/publications/plan-inactive-tab-and-duplicate.md` — แผน 4 task พร้อม migration SQL และ diff

## ข้อเท็จจริงที่ยืนยันแล้ว (อย่า re-derive)

- **Inactive tab ไม่ต้องแตะ backend เลย** — `media_publications_list` allow-list `'cancelled'` มาตั้งแต่ migration 061 (`079_publications_list_created_by.sql:32-34`) และ route zod schema ก็รับอยู่แล้ว (`publications/route.ts:32-34`) สิ่งเดียวที่บล็อกคือ TypeScript union ของ `fetchPublications` ฝั่ง frontend
- `media_core.publications.name` เป็น `varchar(200)` — Postgres **error** ไม่ truncate ให้ ชื่อยาว 194+ ตัวอักษรจะทำให้ duplicate พังถ้าไม่มี guard
- `gen_random_uuid()` มีอยู่ **สองที่**บน prod (`pg_catalog` และ `extensions`) — ภายใต้ `SET search_path = ''` ต้อง qualify ให้ชัด
- pub:-owned playlist ถูกสร้างด้วย `status='active'` เสมอ ไม่ว่า publication จะเป็น draft หรือไม่ (`071_publication_draft_revision.sql:267-269`) — สำเนาเดินตาม convention เดิม ไม่ประดิษฐ์สถานะใหม่
- publication เก็บ tag ผ่านตารางแยก `media_core.publication_tags(publication_id, tag_id)` (`060:24-30`) ไม่ใช่คอลัมน์บน `publications` — เกือบลืม copy ตารางนี้ เจอตอนอ่าน `media_publication_upsert` ก่อน apply
- orphan `pub:` playlist บน prod มี 1 แถวจาก 11 ส.ค. — **ของเดิม ไม่ใช่เศษจากเซสชันนี้** (เช็คแล้ว)

## สิ่งที่ทำจริง

**Thunder_Core** (branch `fix/application` — ⚠️ ไม่ใช่ `feat/thunderOne` ที่ PR #29 ใช้อยู่):
- สร้าง `supabase/migrations/088_publication_duplicate.sql` — RPC `media_publication_duplicate(p_tenant_id, p_source_publication_id, p_created_by)` copy playlist+items, targets, tags, และ schedule shape เป็น transaction เดียว, เคลียร์ `ends_at` เป็น NULL / `starts_at` เป็น `now()` (คอลัมน์ NOT NULL เคลียร์เป็น null ไม่ได้), ต่อท้ายชื่อ `' (Copy)'` แบบ truncate ที่ 200
- สร้าง `src/app/api/core/v1/media/publications/[id]/duplicate/route.ts`

**thunder_one_prj** (branch `feat/playlist`):
- `services/publications-api.ts` — ขยาย union เป็น `"draft" | "active" | "cancelled"`, เพิ่ม `duplicatePublication`
- `components/PublicationsListPage.tsx` — แท็บที่สาม "Inactive" (ended จาก active-fetch + cancelled จาก fetch ใหม่), Active กรอง ended ออก, ปุ่ม Duplicate บนแถว active/inactive

**นอกเหนือจากแผน:** ย้ายปุ่ม Cancel ให้โชว์เฉพาะแท็บ `active` (เดิม logic เป็น `tab === "draft" ? ... : ...` ซึ่งจะทำให้ inactive ได้ปุ่ม Cancel ติดมาด้วย) — เป็นผลบังคับจากการแยกแท็บ ไม่ใช่ scope creep

## ที่ verify แล้ว / ยังไม่ได้ verify

**ยืนยันแล้ว (SQL layer):** apply migration 088 ลง prod แล้ว, `pg_get_functiondef` ตรงกับไฟล์, รัน RPC จริงกับ publication ที่ cancelled ใน transaction แล้ว ROLLBACK — ผลถูกทุกช่อง (name `(Copy)`, status draft, items 2=2, targets 1=1, playlist ใหม่ชื่อ `pub:<new_id>` status active, `ends_at` NULL, timezone copy มา, revision 1, campaign copy มา), guard ปฏิเสธ draft ผ่าน (มี draft จริงให้เทส 1 แถว ไม่ได้ skip), guard tenant isolation ผ่าน, ไม่มีเศษตกค้างใน prod

**ยืนยันแล้ว (build layer):** `tsc --noEmit` frontend ผ่าน 0 error, `eslint src/features/publications` ผ่าน 0 error, Thunder_Core `tsc` ไม่มี error ในไฟล์ใหม่ (repo มี pre-existing error 127 ตัวที่ไม่เกี่ยว)

**ยังไม่ได้ verify:**
- **HTTP layer** — route `/duplicate` ยังไม่ deploy `CORE_API_URL` ชี้ `thundercore.vercel.app` เพราะฉะนั้นกด Duplicate จากเครื่องตอนนี้จะได้ 404
- **Browser** — ยังไม่ได้เปิดดูจริงสักหน้า ทั้งแท็บ Inactive และปุ่ม Duplicate (ยังไม่ได้ขออนุญาตผู้ใช้ตามกฎ §3)

## ค้างอยู่

1. ยังไม่ commit อะไรเลยทั้งสอง repo
2. Thunder_Core อยู่ branch `fix/application` — ต้องเคาะว่าจะ commit ตรงนี้หรือย้ายไป `feat/thunderOne`
3. deploy Thunder_Core → แล้วค่อย verify ผ่าน browser (migration apply ไปแล้ว ปลอดภัยเพราะเป็นฟังก์ชันใหม่ ไม่มีใครเรียก)
