# Plan — P0.3: draft revision, 409 conflict, publish idempotency

**สถานะ:** ยังไม่เริ่มลงมือ — รอเคาะ design fork (ดู §4)
**ขอบเขต:** ข้ามสอง repo (`thunder_one_prj` frontend + `Thunder_Core` backend/DB)
**วันที่สำรวจ:** 2026-08-04

---

## 1. ข้อเท็จจริงที่ยืนยันแล้ว — อย่า re-derive

ทุกข้อด้านล่างเช็คจากโค้ดจริงและ **query prod โดยตรง** (`sfiefevtxalqjizdkcsw` = ThunderCore)
ไม่ได้อ่านจากไฟล์ migration อย่างเดียว

### 1.1 Schema บน prod — `media_core.publications`

คอลัมน์ที่มีจริง: `id`, `tenant_id`, `playlist_id`, `status`, `published_by`, `created_at`,
`name`, `description`, `campaign_id`, `publication_type`, `priority`, `language`,
`metadata`, `activated_at`, `updated_at`, `cancelled_at`

- **ไม่มี `revision` / `version` / `idempotency_key`** — ยืนยันจาก `information_schema.columns`
- **มี `updated_at timestamptz NOT NULL DEFAULT now()`** อยู่แล้ว

### 1.2 RPC บน prod (ดึงจาก `pg_proc.prosrc` ไม่ใช่ไฟล์ migration)

| RPC | row lock (`FOR UPDATE`) | status guard | idempotency | bump `updated_at` |
|---|---|---|---|---|
| `media_publication_upsert` | ❌ | ❌ | ❌ | ✅ |
| `media_publication_set_content` | ❌ | ❌ | ❌ | ✅ |
| `media_publication_set_schedule` | ❌ | ❌ | ❌ | **❌** |
| `media_publication_activate` | ❌ | ✅ | ❌ | ✅ |

**`set_schedule` ไม่ bump `updated_at`** ← ข้อนี้เป็นตัวตัดสินทางเลือกใน §4.1

### 1.3 `media_publication_activate` มี guard อยู่แล้วแต่มี race

```sql
SELECT playlist_id, status INTO v_playlist_id, v_status
FROM media_core.publications
WHERE id = p_publication_id AND tenant_id = p_tenant_id;   -- ไม่มี FOR UPDATE

IF v_status <> 'draft' THEN
    RAISE EXCEPTION 'Already active: publication is not a draft';
END IF;
```

- กด Publish ซ้ำ **แบบเรียงกัน** → ครั้งที่ 2 ได้ `Already active` ไม่สร้าง publish job ซ้ำ
- กด Publish ซ้ำ **พร้อมกัน / retry หลัง timeout** → TOCTOU: ทั้งสอง transaction อ่าน
  `status='draft'` ได้ก่อนที่ฝ่ายใดจะ UPDATE → **สร้าง `publish_jobs` ซ้ำได้จริง**
- ไฟล์ migration (`056_media_redesign_functions.sql:206`) ตรงกับ prosrc บน prod

**แต่ race นี้ยังไม่เคยเกิดจริงบน prod** (นับเมื่อ 2026-08-04):

```sql
select count(*), count(distinct publication_id) from media_core.publish_jobs;
-- 24 rows, 24 distinct publications → duplicate = 0
```

และ `media_job_poll` (RPC ที่ device ใช้ดึงงาน) อ่าน `publish_jobs` + `publications`
โดยมี `DISTINCT` อยู่ในตัว — **ยังไม่ได้อ่าน logic เต็มว่า dedupe ครอบคลุมแค่ไหน**

### 1.4 มี precedent ของ idempotency ใน repo เดียวกันแล้ว

`Thunder_Core` ทำ pattern นี้ไว้ที่ booking domain — ถ้าจะทำ ให้ลอกของเดิม อย่าคิดใหม่:

- `supabase/migrations/044_booking_core_schema.sql:182` — `idempotency_key varchar(128) NOT NULL`
- บรรทัด 192 — `UNIQUE (tenant_id, source_application_id, idempotency_key)` ← ตัวบังคับจริงคือ unique index
- `045_booking_core_functions.sql:251-267` — RPC validate key แล้ว fast-path lookup: ถ้าเจอ row เดิมคืนอันเดิมแทนสร้างใหม่
- `src/app/api/core/v1/bookings/route.ts:38-41` — route **บังคับ** header `Idempotency-Key` ไม่มีคือ error

### 1.5 Frontend มองไม่เห็น status code เลย

[`publications-api.ts:35-47`](../../src/features/publications/services/publications-api.ts) —
`requestApi` ยุบทุกอย่างเป็น `new Error(string)`:

```ts
if (resData && typeof resData === "object" && "error" in resData) {
  throw new Error(resData.error || "API request failed");   // status หายตรงนี้
}
if (res.status < 200 || res.status >= 300) {
  throw new Error(`HTTP Error ${res.status}`);              // เหลือแค่ string
}
```

**ต่อให้ backend ส่ง 409 กลับมาวันนี้ frontend ก็แยกไม่ออกจาก error อื่น**
นี่คืองานฝั่ง frontend ล้วน ทำได้เลยโดยไม่ต้องรอ backend

### 1.6 Partial save เกิดจาก 3 call เรียงกัน

[`usePublishDraft.ts:173-209`](../../src/features/publications/hooks/usePublishDraft.ts) —
`persistDraft` ยิง `saveBasicInfo` → `savePublicationContent` → `savePublicationSchedule`
ต่อกัน ไม่มี transaction ครอบ ล้มกลางทางแล้วเหลือข้อมูลบางส่วนใน backend

**บรรเทาอยู่แล้วบางส่วน:** ทั้งหมดนี้เกิดกับ row ที่ `status='draft'` ซึ่งยังไม่ออกอากาศ
และ draft ยัง resume ได้จาก localStorage + `?id=` ผู้ใช้กด Next ใหม่แล้ว save ซ้ำได้

### 1.7 ข้อจำกัดการ deploy

`CORE_API_URL` ของ frontend ชี้ `thundercore.vercel.app` — **แก้โค้ด backend ในเครื่องแล้ว
ทดสอบผ่าน UI จะไม่เห็นผลจนกว่าจะ deploy** เช็คได้ที่ `/api/proxy/__config`
Migration ต้องยิงผ่าน Supabase MCP `apply_migration` เท่านั้น (CLI พังจาก history drift)

---

## 2. ปัญหาแยกเป็น 4 อัน ไม่ใช่อันเดียว

| # | ปัญหา | เกิดจริงเมื่อ | เกิดจริงบน prod แล้วหรือยัง | ต้องแตะ backend? |
|---|---|---|---|---|
| A | Lost update — เปิด 2 แท็บ save ทับกันเงียบๆ | แก้ draft เดียวกันสองที่พร้อมกัน | ไม่มีข้อมูล (ตรวจไม่ได้ย้อนหลัง) | ✅ |
| B | Duplicate activate — publish job ซ้ำ | retry หลัง timeout / กดรัว | **ยังไม่เคย** — 24 job / 24 pub | ✅ |
| C | error ทุกชนิดถูกยุบเป็น string เดียว | **ทุกครั้งที่ API พัง** | **เกิดอยู่ทุกวัน** | ❌ frontend ล้วน |
| D | Partial save | save ล้มกลางทาง | ไม่มีข้อมูล (draft resume ได้) | ✅ |

---

## 3. ลำดับที่แนะนำ + ความจำเป็นจริง

**ข้อสรุปหลัก:** ชื่อ "P0.3 revision/idempotency" ทำให้งานนี้ดูเป็นก้อนใหญ่ที่ต้องรื้อ contract
สองฝั่ง เลยถูก defer มาหลายรอบ พอแยกออกเป็น 4 ปัญหาแล้ว **ประโยชน์เกือบทั้งหมดอยู่ที่ C
ซึ่งเป็น frontend ล้วน** ส่วนที่แพงจริง (A) ยังไม่มีหลักฐานว่าเจ็บ

1. **C — จำเป็น ทำก่อน** ไม่ใช่เพราะเป็น prerequisite ของ A/B แต่เพราะตัวมันเองแก้ปัญหาที่
   ผู้ใช้เจอทุกวัน: error ทุกชนิดหน้าตาเหมือนกันหมด (`HTTP Error 500`) ผู้ใช้แยกไม่ออกว่า
   ควร retry หรือควรแก้ฟอร์ม frontend ล้วน ไม่ต้อง deploy backend
2. **B1 — ทำก็ได้** race มีจริงแต่ยังไม่เคยยิง (§1.3) ทำเพราะราคา 1 บรรทัด ไม่ใช่เพราะเร่งด่วน
3. **A — YAGNI** ต้อง migration + แก้ RPC 3 ตัว + contract สองฝั่ง + UX merge เพื่อกันเคสที่
   ต้องมีคน 2 คนแก้ draft เดียวกันพร้อมกัน บนเครื่องมือ internal ที่คนสร้าง publication
   มักทำคนเดียวจบในรอบเดียว — **รอจนมีคนรายงานว่าข้อมูลหายจริงก่อน**
4. **D — ยอมรับ** draft resume ได้อยู่แล้ว กด Next ใหม่ก็ save ทับ

---

## 4. Design fork ที่ต้องเคาะก่อนลงมือ

### 4.1 A — จะใช้อะไรเป็น concurrency token

| ทางเลือก | ต้อง migration | ความเสี่ยง |
|---|---|---|
| **A1** เพิ่ม `revision integer NOT NULL DEFAULT 1`, RPC ทุกตัว `WHERE revision = p_expected_revision` แล้ว `+1` | ✅ 1 migration | ชัดเจน ตรงไปตรงมา ไม่มี edge case |
| **A2** ใช้ `updated_at` ที่มีอยู่แล้วเป็น token (สไตล์ If-Unmodified-Since) | ❌ | **`set_schedule` ไม่ bump `updated_at` (§1.2)** → ต้องแก้ RPC นั้นอยู่ดี และเหลือ edge case เรื่อง `now()` เท่ากันใน transaction ที่ชนกันพอดี |

**แนะนำ A1** — A2 ดูเหมือนประหยัดกว่าเพราะไม่ต้อง migration แต่พอ `set_schedule` ไม่ bump
`updated_at` ก็ต้องเขียน migration แก้ RPC อยู่ดี พอต้องเขียน migration เท่ากันแล้ว
เอาอันที่ถูกต้องบน edge case ดีกว่า

### 4.2 B — จะปิด race ยังไง

| ทางเลือก | ขนาดงาน | ครอบคลุม |
|---|---|---|
| **B1** เติม `FOR UPDATE` ใน `SELECT` ของ `media_publication_activate` | 1 บรรทัดใน migration ใหม่ | ปิด race ได้ครบ ไม่แตะ contract ไม่แตะ frontend |
| **B2** ทำ idempotency key เต็มรูปแบบตาม pattern booking (§1.4) | migration + route + frontend ส่ง header | ครอบคลุมกว่า แต่ status guard เดิมทำงานได้อยู่แล้วเมื่อมี lock |

**แนะนำ B1** — status guard มีอยู่แล้ว ขาดแค่ lock การเติม `FOR UPDATE` ปิดช่องได้ 100%
โดยไม่ต้องเปลี่ยนสัญญา API เลย และเนื่องจาก race ยังไม่เคยเกิดจริง (§1.3) B2 จึงเกินความจำเป็น
ชัดเจน — จ่าย contract เปลี่ยนทั้งสองฝั่งเพื่อปัญหาที่ 1 บรรทัดปิดได้

**หมายเหตุ UX ที่ต้องแก้คู่กัน:** retry ที่ได้ `Already active` แปลว่า publish **สำเร็จไปแล้ว**
แต่ตอนนี้ frontend โชว์เป็น error ([`usePublishDraft.ts:233-235`](../../src/features/publications/hooks/usePublishDraft.ts))
ต้อง map เคสนี้เป็น success — ต้องพึ่งงาน C

> `CREATE OR REPLACE FUNCTION` ไม่ replace ถ้า signature เปลี่ยน — B1 ไม่เปลี่ยน signature
> จึง replace ได้ตรงๆ ส่วน A1 เพิ่ม parameter → **ต้อง `DROP FUNCTION IF EXISTS <signature เดิม>` นำหน้า**

### 4.3 D — ยอมรับหรือแก้

**แนะนำยอมรับใน Phase 1** และบันทึกเหตุผลไว้ — draft resume ได้อยู่แล้ว ผู้ใช้กด Next ซ้ำได้
การทำ transactional RPC ตัวเดียวที่รับทั้ง basic+content+schedule เป็นงานใหญ่และรื้อ contract
ที่เพิ่งนิ่ง ไม่คุ้มกับความรุนแรงระดับต่ำ

---

## 5. งาน C ทำได้เลยวันนี้ (ไม่ต้องรอเคาะ)

1. ให้ `requestApi` เก็บ status ไว้บน error — เช่น `class ApiError extends Error { status: number }`
2. `usePublishDraft` แยกเคส `409` ออกจาก error ทั่วไป → แสดง UX reload/merge/retry
3. map `Already active` เป็น success ของ publish (ดู §4.2)
4. เขียน `.check.mts` ครอบการ map status → outcome ตาม pattern
   [`next-transition.check.mts`](../../src/features/publications/next-transition.check.mts)

**ยังไม่มี 409 จาก backend ให้ทดสอบจริง** — ต้อง test ด้วย mock/stub ที่ระดับ pure function
และบันทึกว่ายังไม่ได้ verify กับ backend จริงจนกว่างาน A จะ deploy

---

## 6. สิ่งที่ยังไม่ได้ตรวจ

- ไม่ได้ดู `media_publication_set_content` / route `[id]/content` ละเอียด (ดูแค่ว่า bump `updated_at`)
- ไม่ได้ทดสอบ race ของ activate จริงบน prod (ต้องยิงพร้อมกัน 2 request — ยังไม่ได้ทำเพราะ
  จะสร้าง publish job จริงบนจอจริง)
- **ไม่ได้อ่าน logic เต็มของ `media_job_poll`** รู้แค่ว่ามี `DISTINCT` อยู่ จึงยังตอบไม่ได้ว่า
  `publish_jobs` ซ้ำจะทำให้จอเล่นซ้ำจริงไหม — ถ้าจะทำงาน B ควรอ่านตรงนี้ให้จบก่อน
- ตัวเลข 24/24 เป็น snapshot วันที่ 2026-08-04 ไม่ใช่การพิสูจน์ว่า race เป็นไปไม่ได้
