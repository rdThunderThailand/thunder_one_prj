# Runbook — migration 055 (media_core redesign DDL)

ไฟล์: `../Thunder_Core/supabase/migrations/055_media_redesign_schema.sql` (183 บรรทัด)
เทสแล้วบน Supabase local `trysupabase` (Postgres 17.6.1.063 เวอร์ชันเดียวกับ prod) · **ยังไม่ได้ลง prod**

---

> **อัปเดต 2026-07-24:** migration **056** (functions) เขียนเสร็จและทดสอบบน local แล้ว → ลง **055 + 056 พร้อมกัน** ปัญหาด้านล่างหายไป
> `supabase db push` จะรันทั้งสองไฟล์เรียงกันเอง · ผลทดสอบอยู่ท้ายไฟล์

## 🛑 ห้ามลง 055 เดี่ยว ๆ — จะทำให้ publish พังทันที

RPC `media_publish` ใน migration 049 บรรทัด 258 เขียนไว้แบบนี้:

```sql
INSERT INTO media_core.publications (tenant_id, playlist_id, published_by)
VALUES (p_tenant_id, p_playlist_id, p_published_by)
```

055 ทำให้ `name` และ `campaign_id` เป็น `NOT NULL` แต่ INSERT นี้ไม่ได้ส่งทั้งคู่ และไม่มี default

พิสูจน์แล้วบน local ที่ลง 055 ไปแล้วจริง:

```
ERROR: null value in column "name" of relation "publications" violates not-null constraint
```

แปลว่าหลังลง 055 ปุ๊บ **`POST /media/publish` ทุกครั้งจะ 500** จนกว่า migration 056 (functions) จะตามลง

**ทางเลือก:**

| ทาง | ผล |
|---|---|
| **รอ 056 แล้วลงพร้อมกัน** (แนะนำ) | ไม่มีช่วงพัง — แต่ต้องเขียน 056 ให้เสร็จก่อน |
| ลง 055 เลย ยอมให้ publish พังชั่วคราว | รับได้ก็ต่อเมื่อยังไม่มีใครใช้ publish จริง (ตอนนี้ prod มี publication แค่ 2 แถวจาก 1 tenant) |
| แก้ 055 ให้ `name` มี default ชั่วคราว + `campaign_id` ยัง nullable | ลงได้ทันทีไม่พัง แต่ต้องกลับมาบังคับ NOT NULL ทีหลัง = migration เพิ่มอีกรอบ |

---

## เพิ่มอะไรบ้าง

### ตารางใหม่ 2 ตาราง

| ตาราง | คอลัมน์ |
|---|---|
| `media_core.brands` | `id, tenant_id, name, logo_file_id?, status(active\|inactive), created_at, updated_at` · unique `(tenant_id, name)` |
| `media_core.campaigns` | `id, tenant_id, brand_id→brands, name, status(draft\|active\|ended), starts_at?, ends_at?, created_at, updated_at` · unique `(tenant_id, name)` · check `ends_at > starts_at` |

### คอลัมน์ที่เพิ่มเข้าตารางเดิม

| ตาราง | เพิ่ม |
|---|---|
| `publications` | `name` **NOT NULL** · `description` · `campaign_id` **NOT NULL** →campaigns · `publication_type`(image\|video\|playlist\|html\|dynamic, default `playlist`) · `priority`(low\|normal\|high\|urgent, default `normal`) · `language` · `metadata jsonb` · `activated_at` · `updated_at` |
| `playlists` | `kind`(single\|user, default `user`) |
| `playlist_items` | `file_version_no int` (ไม่มี FK — `public.file_versions` ยังว่าง) |
| `media_assets` | `kind`(video\|image, default `video`) · `approval_status`(draft\|pending\|approved\|rejected, default `draft`) · `approved_by` · `approved_at` · `language` |
| `channels` | `channel_type`(dooh\|in_store\|website\|social\|email\|mobile_app, default `dooh`) · `location_id`→`public.locations` · `estimated_daily_impressions` |

### เปลี่ยนของเดิม

- `publications.status` check: `active\|cancelled` → **`draft\|active\|expired\|cancelled`**
- constraint ใหม่ `media_assets_image_needs_duration` — `kind='image'` ต้องมี `duration_seconds` เสมอ
- bucket `media` allowed mime: เพิ่ม `image/jpeg, image/png, image/webp` (เดิมมีแต่ video 4 ตัว) · `file_size_limit` 500MB ไม่แตะ
- index ใหม่: `idx_brands_tenant_status`, `idx_campaigns_tenant_status`, `idx_media_assets_tenant_approval`, `idx_channels_tenant_type`, `idx_publications_campaign`

### Backfill ที่จะเกิดกับข้อมูล prod

| ทำอะไร | กระทบกี่แถวบน prod |
|---|---|
| `publications.name` ← `'(migrated) ' \|\| ชื่อ playlist` | 2 |
| `publications.activated_at` ← `created_at` | 2 |
| สร้าง brand + campaign ชื่อ `Unassigned` ต่อ tenant ที่มี publication | 1 tenant → 1 brand + 1 campaign |
| `publications.campaign_id` ← campaign `Unassigned` ของ tenant ตัวเอง | 2 |
| `media_assets.approval_status` ← `approved` เมื่อ `status='ready'` | **3 จาก 3** |

---

## สถานะ prod ตอนนี้ (เช็คแล้ว)

- migration ที่ apply แล้ว: `047, 048, 049, 050, 051, 052, 053, 054` → **`db push` จะรันแค่ 055 ตัวเดียว** ไม่มีตัวค้าง
- ข้อมูล: `publications` 2 · `playlists` 2 · `playlist_items` 3 · `media_assets` 3 (ready ทั้งหมด) · `channels` 1 · `publish_jobs` 2
- publication ทั้งหมดมาจาก **tenant เดียว** และ status เป็น `active` ทั้งคู่
- playlist ทุกอันมี publication ผูกครบ (2/2) ชื่อ playlist ยาวสุด 4 ตัวอักษร → `(migrated) ` + ชื่อ ไม่ล้น `varchar(200)`

---

## เช็คก่อนกด

- [ ] ตัดสินเรื่อง **056** ก่อน (ดูตารางทางเลือกด้านบน) — นี่คือข้อเดียวที่เป็น blocker จริง
- [ ] backup / รู้ว่า PITR ของ project เปิดอยู่ไหม (rollback ของ migration นี้ทำลายข้อมูล ดูท้ายไฟล์)
- [ ] ยืนยันว่าไม่มีใครกำลังใช้ `/e2e` หรือ dashboard publish อยู่ตอนรัน
- [ ] `channels` บน prod มี 1 แถว แต่ **local ที่เทสมี 0 แถว** — เส้นทาง alter `channels` ยังไม่เคยเจอข้อมูลจริง (เป็น `ADD COLUMN` ที่มี default ครบ ความเสี่ยงต่ำ แต่ไม่ใช่ศูนย์)
- [ ] ทั้ง migration อยู่ใน transaction เดียว + มี `SET NOT NULL` ที่ล็อกแบบ ACCESS EXCLUSIVE — ตารางเล็กมาก ใช้เวลาไม่ถึงวินาที แต่ถ้ามี long-running query ค้างอยู่จะรอคิว

---

## รัน

```bash
cd /Users/arty/Desktop/Thunder/project/Thunder_Core
supabase db push
```

หรือ apply ผ่าน MCP `apply_migration` ก็ได้ผลเดียวกัน

---

## เช็คหลังรัน

```sql
-- 1. ทุก publication ต้องมี name + campaign_id ครบ
select count(*) filter (where name is not null and campaign_id is not null) || '/' || count(*)
from media_core.publications;                                        -- คาดหวัง 2/2

-- 2. brand/campaign Unassigned ถูกสร้าง
select (select count(*) from media_core.brands) || '/' || (select count(*) from media_core.campaigns);  -- 1/1

-- 3. asset เดิมยังใช้ได้ (ไม่กลายเป็น draft)
select approval_status, count(*) from media_core.media_assets group by 1;  -- approved: 3

-- 4. status check ใหม่
select pg_get_constraintdef(oid) from pg_constraint
where conrelid = 'media_core.publications'::regclass and conname = 'publications_status_check';

-- 5. bucket รับรูปได้แล้ว
select allowed_mime_types from storage.buckets where id = 'media';   -- ต้องมี 7 ค่า
```

แล้วเปิด `/e2e` กด **Refresh Screens** / **Refresh List** ต้องยัง 200 ตามเดิม
(**Publish จะยัง 500** ถ้ายังไม่ลง 056 — เป็นพฤติกรรมที่คาดไว้ ไม่ใช่ของเสีย)

---

## ผลเทสบน local (อ้างอิง)

| เช็ค | ผล |
|---|---|
| รันครั้งแรก | ถึง `COMMIT` ไม่มี error |
| รันซ้ำรอบ 2 | ไม่มี error · brand/campaign ยังเป็น 1/1 ไม่เพิ่ม (idempotent จริง) |
| backfill | 3/3 publications ได้ name+campaign · 2/2 assets → approved |
| negative test | `kind='image'` + `duration_seconds=null` → โดน constraint ปฏิเสธถูกต้อง |
| index ซ้ำ | ไม่มี — `(tenant_id, status)` เหลือตัวเดียว |

---

## ผลเทส migration 056 บน local (รันต่อจาก 055)

`../Thunder_Core/supabase/migrations/056_media_redesign_functions.sql` — 16 functions, ~1,000 บรรทัด

| เช็ค | ผล |
|---|---|
| รัน 056 ต่อจาก 055 | ถึง `COMMIT` ไม่มี error · รันซ้ำก็ไม่ error |
| `media_publish` (ตัวที่ 055 ทำพัง) | กลับมาทำงาน คืน `{job_id, device_count, publication_id}` คีย์เดิมครบ |
| `media_job_poll` ทรงใหม่ | คืน `loop_duration_seconds: 60` + `slots[]` 2 ชิ้น จาก **2 publication คนละอัน** offset `0` และ `30` |
| **ack แล้วยังเห็น (state ไม่ใช่ inbox)** | ack ทุก target แล้ว poll ยังคืน 2 slots — โค้ดเดิมจะคืน 0 |
| **หมดอายุแล้วหลุดเอง** | เซ็ต `ends_at` เป็นอดีต → เหลือ 1 slot, `loop_duration` 60→30 **โดยไม่ต้องมี revoke job** (พิสูจน์ข้ออ้างหลักของ ADR 0004) |
| ยังไม่ถึง `starts_at` | คืน `slots: []` |
| `media_screens_list` | มี `status_level` ใหม่ และยังคง `is_online` เดิมไว้ (frontend ที่ใช้อยู่ไม่พัง) |
| `media_publish_single` | สร้าง playlist ซ่อนแล้ว publish ได้ `device_count: 1` |
| playlist ซ่อนไม่รั่ว | `media_playlists_list` คืน 1 จาก 2 playlist ที่มีจริง |
| `media_asset_approve` | คืน `{media_asset_id, approval_status: approved}` |
| negative: register รูปไม่ใส่ duration | `ERROR: Invalid input: duration_seconds is required for image assets` (prefix ถูก → API map เป็น 400) |

**บั๊กที่เจอตอนรีวิวแล้วแก้แล้ว:** `media_video_register` ถูกเพิ่มพารามิเตอร์ต่อท้าย ทำให้ `CREATE OR REPLACE` สร้าง **overload ตัวที่สอง** แทนที่จะแทนของเดิม → ทุก call เดิมจะพังด้วย `function public.media_video_register(...) is not unique` (คือ `POST /media/videos` ทั้ง endpoint) แก้โดยเพิ่ม `DROP FUNCTION IF EXISTS` ของ signature 8 พารามิเตอร์เดิมก่อน CREATE · ยืนยันแล้วว่าไม่เหลือ function ที่มี overload ซ้ำ

**ยังไม่ได้ทดสอบ:** เส้นทาง `file_version_no` (ตาราง `public.file_versions` ยังว่าง 0 แถวทั้ง local และ prod จึงวิ่ง fallback ไป `public.files` เสมอ) · target แบบ `channel` (local ไม่มี channel เลย prod มี 1)

## ถ้าต้องถอย

**ไม่มี down migration และการถอยทำลายข้อมูล** — `DROP COLUMN` จะลบ name/description/tags ที่ผู้ใช้กรอกไปแล้วทั้งหมด

ถ้าจำเป็นจริง ๆ:

```sql
BEGIN;
ALTER TABLE media_core.publications
  DROP COLUMN IF EXISTS name, DROP COLUMN IF EXISTS description,
  DROP COLUMN IF EXISTS campaign_id, DROP COLUMN IF EXISTS publication_type,
  DROP COLUMN IF EXISTS priority, DROP COLUMN IF EXISTS language,
  DROP COLUMN IF EXISTS metadata, DROP COLUMN IF EXISTS activated_at,
  DROP COLUMN IF EXISTS updated_at;
ALTER TABLE media_core.publications DROP CONSTRAINT IF EXISTS publications_status_check;
ALTER TABLE media_core.publications
  ADD CONSTRAINT publications_status_check CHECK (status IN ('active','cancelled'));
ALTER TABLE media_core.playlists      DROP COLUMN IF EXISTS kind;
ALTER TABLE media_core.playlist_items DROP COLUMN IF EXISTS file_version_no;
ALTER TABLE media_core.media_assets
  DROP CONSTRAINT IF EXISTS media_assets_image_needs_duration,
  DROP COLUMN IF EXISTS kind, DROP COLUMN IF EXISTS approval_status,
  DROP COLUMN IF EXISTS approved_by, DROP COLUMN IF EXISTS approved_at,
  DROP COLUMN IF EXISTS language;
ALTER TABLE media_core.channels
  DROP COLUMN IF EXISTS channel_type, DROP COLUMN IF EXISTS location_id,
  DROP COLUMN IF EXISTS estimated_daily_impressions;
DROP TABLE IF EXISTS media_core.campaigns;
DROP TABLE IF EXISTS media_core.brands;
UPDATE storage.buckets
SET allowed_mime_types = ARRAY['video/mp4','video/webm','video/quicktime','video/x-matroska']
WHERE id = 'media';
-- ลบแถวออกจาก supabase_migrations.schema_migrations ด้วยถ้า push ไปแล้ว
COMMIT;
```

> สคริปต์ถอยนี้ **ยังไม่ได้ทดสอบ** — ถ้าจะพึ่งจริงควรลองบน local ก่อน
