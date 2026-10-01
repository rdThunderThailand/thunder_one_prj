# Plan: Thunder One Media MVP บน Thunder_Core

> เขียน 2026-07-22 · อัปเดต 2026-07-23 · สถานะ: **Repo A (backend) เสร็จ + deploy ขึ้น prod แล้ว** (migration 048–052) · **Repo B (frontend, repo นี้) ยังไม่เริ่ม** — scaffold เปล่า รอ B1 (กำลัง brainstorm BFF-proxy vs direct x-api-key อยู่)
> เอกสารพี่น้อง: [`media_core_mapping.md`](media_core_mapping.md) (entity mapping + Phase 0 decisions) · `../thunder_one_prj/CLAUDE.md` (ฝั่ง frontend)
> ไฟล์นี้เป็นสำเนาจาก `../Thunder_Core/docs/media_mvp_plan.md` (มีรายละเอียด C1/C2/F1–F3 เพิ่มเติมที่ไฟล์ต้นฉบับ)

**Definition of Done ของ MVP ทั้งก้อน:**
อัปโหลดวิดีโอ 1 ไฟล์ → ใส่ playlist → publish ไปจอ 1 จอ → player poll เจอ job → โหลดไฟล์ → ack → UI เห็นสถานะ `published` และจอขึ้น online

ทำ 2 repo ขนานกันไม่ได้ทั้งหมด — **backend contract ต้องมาก่อน** frontend ถึงจะไม่เขียนทิ้ง

---

## Repo A — Thunder_Core (backend, owner ของข้อมูล)

### A1. Migration 048 — schema `media_core` (11 ตาราง) — **เสร็จ, deploy prod แล้ว**

`supabase/migrations/048_media_core_schema.sql`

- [x] 11 ตารางตาม §2 ของ mapping + index + `REVOKE ALL ... FROM anon, authenticated` (precedent: `044_booking_core_schema.sql`)
- [x] `publish_job_targets` ต้องมี `status` / `attempt_count` / `error_message` / `acked_at` (ตาม §6.5)
- [x] `media_assets.file_id → public.files.id`, `channel_devices.device_id → public.assets.id`
- [x] ทุกตารางมี `tenant_id`

**ตรวจ:** migration ขึ้นผ่าน + ยิง query `media_core.*` ด้วย anon key แล้วต้องโดนปฏิเสธ

### A2. Migration 049 — RPC — **เสร็จ, deploy prod แล้ว**

`supabase/migrations/049_media_core_functions.sql` (+ `052_media_core_read_functions.sql` เพิ่ม read fn ทีหลัง)

`SECURITY DEFINER` ทุกตัว, resolve tenant จาก argument ที่ API ส่งมา ไม่เชื่อ client:

- [x] `media_video_register` / `media_video_delete`
- [x] `media_playlist_upsert` / `media_playlist_set_items`
- [x] `media_publish` — สร้าง publication + jobs + targets ในทรานแซกชันเดียว
- [x] `media_job_poll(device_token)` / `media_job_ack(target_id, status, error)`
- [x] `media_heartbeat(device_token, payload)`
- [x] `media_playback_log(batch)`

**ตรวจ:** publish 1 ครั้ง → จำนวน `publish_job_targets` = จำนวนจอใน channel — ✅ verify ผ่าน E2E แล้ว

### A3. Migration 050 — event alert — **เสร็จ, deploy prod แล้ว**

`supabase/migrations/050_media_core_alert_events.sql`

- [x] `alert_rules.event_code text` + ทำ `alert_incidents.rule_id` เป็น nullable
- [x] pg_cron sweep ทุก 5 นาที: จอที่ `now() - last_heartbeat_at > 5 min` → เปิด incident (pattern เดียวกับ `046_booking_core_schedule.sql`)

### A4. Storage + upload path ⚠ จุดตัดสินใจสำคัญ — **หลักเสร็จ deploy prod แล้ว (051)** — เหลือ orphan sweep

**เลือก: อัปโหลดตรงเข้า Supabase Storage ด้วย signed upload URL — ไม่ผ่าน Next API**

เหตุผล: วิดีโอ 50–500 MB ผ่าน Next route = ชน body limit + กิน memory serverless + timeout

- [x] bucket `media` แบบ private — `051_media_storage_bucket.sql` (500MB limit, mime allowlist)
- [x] flow: `POST /media/videos/upload-url` → คืน signed upload URL + `file_id` → client PUT ตรงเข้า storage → `POST /media/videos` ยืนยัน (เขียน `files` + `media_assets` + checksum)
- [x] อ่านไฟล์ผ่าน signed URL อายุ 1h เท่านั้น (ตาม §6.3)
- [ ] **ยังไม่ทำ** orphan sweep (ลบไฟล์อัปแล้วไม่ confirm) — เช็คแล้วไม่มี fn นี้ในทุก migration

### A5. API layer — **เสร็จ, deploy prod แล้ว** (14 route ไฟล์, commit `e89335c`, E2E HTTP verified)

- [x] `src/lib/core/media.ts` — thin wrapper เรียก RPC (เลียนแบบ `src/lib/core/booking.ts`)
- [x] routes ใต้ `src/app/api/core/v1/media/`

| Endpoint | auth |
|---|---|
| `POST/GET/DELETE /media/videos`, `POST /media/videos/upload-url` | `x-api-key` (app) |
| `GET /media/screens`, `GET /media/screens/[id]` | `x-api-key` |
| `POST/GET/PATCH /media/playlists` | `x-api-key` |
| `POST /media/publish`, `GET /media/publications/[id]` | `x-api-key` |
| `POST /media/player/jobs`, `POST /media/player/jobs/[id]/ack` | `Bearer` device token |
| `POST /media/player/heartbeat`, `POST /media/player/playback` | `Bearer` device token |

ทุก route ต้องผ่าน `requireUuid` guard + `internalError` sanitize (มีอยู่แล้วใน `core-api-utils.ts`)

### A6. ซ่อมของเดิม (เล็กแต่ห้ามข้าม) — **ยังไม่ทำ**

- [ ] `src/app/api/v0.1/player/heartbeat/route.ts` ตอนนี้ `console.log` เฉย ๆ → เขียน `assets.last_heartbeat_at` / `connection_status` / `app_version` / `ip_address` — **ยัง console.log อยู่จริง (เช็คแล้ว 2026-07-23)**
- [ ] `src/app/api/v0.1/player/retrieve/route.ts` รับ token ใน body → ย้ายไป `Authorization` header — **ยังรับ `activation_code` ใน body อยู่ (เช็คแล้ว)**
- [ ] rate-limit endpoint ฝั่ง player ตาม `asset_id`

### A7. เอกสาร — **เสร็จ**

- [x] `API_OVERVIEW.md` (§1.5 Media) — commit `35b7976`
- [x] `media_api_integration.md` สร้างใหม่ (integration guide)
- [x] `docs/hidden/SESSION_HANDOFF.md` อัปเดต
- [x] swagger (`public/swagger-core-v1.json`) — เพิ่ม Media tag + DeviceToken scheme + 14 paths — commit `d2f0865`
- [ ] `DATABASE_SCHEMA.md` — ยังไม่ทำ (เช็คแล้ว ไม่มีคำว่า media)
- [ ] เพิ่ม media เข้า Postman collection — ยังไม่ทำ (เช็คแล้ว)

---

## Repo B — thunder_one_prj (frontend)

เริ่มได้หลัง A5 มี contract แล้ว (จะ mock ก่อนก็ได้ แต่ต้อง lock endpoint shape ก่อน)

### B1. Shell
- [ ] `lib/api/client.ts` เพิ่ม interceptor: แนบ `x-api-key` + จับ error shape `{ error: { code, message } }`
- [ ] `features/auth` — login ผ่าน `/api/core/v1/auth/login`, เก็บ session, guard ที่ `(dashboard)/layout.tsx`
- [ ] `components/layout` — sidebar 3 เมนู (Videos / Screens / Playlists)

### B2. `features/videos`
- [ ] list + upload (2-step signed URL) + delete + สถานะ processing/ready

### B3. `features/screens`
- [ ] list จอ + badge online/offline (derived จาก `last_heartbeat_at`)
- [ ] หน้าจับคู่ activation code
- [ ] detail — กำลังเล่นอะไรอยู่

### B4. `features/playlists`
- [ ] สร้าง playlist + จัดลำดับวิดีโอ + ตั้ง duration
- [ ] ปุ่ม Publish → เลือกจอ → หน้าติดตามสถานะ job รายจอ

---

## ลำดับและ checkpoint

```
A1 → A2 → A3 ──┐
A4 ────────────┼→ A5 → A6 → [CHECKPOINT 1] → A7
               │
               └──────────────→ B1 → B2 → B3 → B4 → [CHECKPOINT 2]
```

- **CHECKPOINT 1** — publish ผ่าน curl แล้ว fake player (curl poll + ack) เดินครบวง **ถ้ายังไม่ผ่าน อย่าเริ่ม B** — **✅ ผ่านแล้ว** (E2E HTTP test 2026-07-22)
- **CHECKPOINT 2** — DoD ด้านบน — ยังไม่ถึง (รอ B1–B4, ยังไม่เริ่ม)

---

## ไม่ทำใน MVP

ยืนยันตาม §7 ของ mapping: MQTT push · token hashing · per-tenant config · screenshots · uptime report · layouts/zones · campaigns · approval workflow · SLA report

**ทางเลือกตัด scope เพิ่ม** (ถ้าอยากถึง DoD เร็วกว่านี้): ตัด playlist ออก ให้ publish วิดีโอเดี่ยวไปจอตรง ๆ ก่อน = ประหยัด B4 + 2 ตาราง (`playlists`, `playlist_items`)

---

## ความเสี่ยง

1. **จอ 497 ตัวใน `public.assets` เป็นข้อมูลจริงหรือ seed?** ถ้าจริง แปลว่ามี player firmware อยู่ในสนามที่ต้องรองรับ backward-compat — เช็คก่อนเริ่ม A6
2. **player client ใครเขียน** — ถ้ายังไม่มีทีม player ต้องทำ fake player ไว้ทดสอบ (อยู่ใน CHECKPOINT 1 แล้ว)
3. **transcode** — MVP รับไฟล์ตามที่อัปโหลดมาเลย ไม่แปลงความละเอียด/codec ถ้าจอเล่นไม่ได้ = ภาระของ operator
