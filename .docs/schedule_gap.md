# Recheck DB: schedule — สรุปสั้น

ตรวจบน prod `ThunderCore` (`sfiefevtxalqjizdkcsw`) 2026-07-23

## ตอบตรง ๆ: **ยังทำ schedule type ไม่ได้**

`media_core.schedules` มีจริง แต่ไม่มีคอลัมน์ประเภท และไม่มีใครอ่านมันเลย

```
media_core.schedules
  id              uuid  pk
  tenant_id       uuid  NOT NULL
  publication_id  uuid  NOT NULL
  starts_at       timestamptz NOT NULL  default now()
  ends_at         timestamptz NULL
  timezone        varchar NOT NULL      default 'Asia/Bangkok'
  recurrence      jsonb   NOT NULL      default '{}'
  created_at      timestamptz
CHECK schedules_window: ends_at IS NULL OR ends_at > starts_at   ← มี constraint ตัวเดียว
```

## 4 ช่องว่างที่เจอ

| # | ปัญหา | หลักฐาน |
|---|---|---|
| 1 | **ไม่มี `schedule_type`** และ `recurrence` jsonb ไม่มี CHECK บังคับรูปร่าง → เก็บอะไรก็ได้ ไม่มีทางรู้ว่าเป็น daily/weekly/dayparting | `information_schema.columns` + `pg_constraint` (มีแค่ `schedules_window`) |
| 2 | **ส่งค่า schedule เข้าไปไม่ได้** — `media_publish(p_tenant_id, p_playlist_id, p_targets, p_published_by)` insert แถว schedule ด้วย **default ล้วน** (`starts_at=now()`, `ends_at=null`, `recurrence={}`) | prosrc: `INSERT INTO media_core.schedules (tenant_id, publication_id) VALUES (...)` |
| 3 | **ไม่มี RPC ตัวไหนอ่าน schedules เลย** — โดยเฉพาะ `media_job_poll` → ต่อให้เขียนแถว schedule เองด้วย SQL ก็ไม่มีผล จอได้ job ทันทีเสมอ ไม่สน `starts_at`/`ends_at` | scan `pg_proc` ทุก `media_*`: มีแต่ `media_publish` ที่แตะ schedules (เขียนอย่างเดียว) |
| 4 | **ไม่มี API/endpoint** — `POST /media/publish` zod รับแค่ `{playlist_id, targets}` · ไม่มี `/media/schedules` | `src/app/api/core/v1/media/publish/route.ts` |

สรุป: schedule ตอนนี้เป็น **แถวประดับ** — เขียนแล้วไม่มีใครใช้ ทุก publication = "เล่นทันที ตลอดไป"

state ปัจจุบัน: มี schedule 1 แถว (จาก publication ที่เพิ่งเทส) `starts_at=now()`, `ends_at=null`, `recurrence={}`

## ที่ต้องแก้ถ้าจะให้ schedule type ใช้ได้จริง (งานฝั่ง Repo A / Thunder_Core)

1. **migration 053** — เพิ่ม `schedule_type text NOT NULL default 'always'` + CHECK จำกัดค่า, และ fix รูปร่าง `recurrence` ต่อ type
2. **`media_publish`** — รับ schedule params เพิ่ม (หรือแยก `media_schedule_upsert` ออกมา เผื่อแก้ schedule ทีหลังโดยไม่ต้อง publish ใหม่)
3. **`media_job_poll`** — กรองด้วย window ที่ active จริง (`now()` อยู่ในช่วง + ตรง recurrence) ← ข้อนี้คือหัวใจ ถ้าไม่ทำ schedule ก็ยังไม่มีผล
4. **API + console panel** — `POST/PUT /media/schedules` แล้วเพิ่ม panel ในหน้า `/e2e`

**ยังไม่ได้ทำอะไรทั้งนั้น** — รอเคาะว่าจะรองรับ type ไหนบ้างก่อน (ตัวเลือกทั่วไปของ DOOH: `always` / `once` (ช่วงวันเดียว) / `daily` (dayparting เวลาเดิมทุกวัน) / `weekly` (เลือกวันในสัปดาห์ + ช่วงเวลา))
