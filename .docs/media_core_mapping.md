# ThunderOne Media Workspace → Thunder_Core mapping

จาก spec 2 ไฟล์ (Product Flow + Roadmap) → เอาลง DB `Thunder_Core` ยังไง

## ข้อสรุป

ไม่ต้องทำ DB ใหม่ ไม่ต้องเพิ่ม 40 ตารางตาม §21 ของ spec

1. ลงทะเบียนเป็น app หนึ่งใน platform: 1 row ใน `public.applications` + `public.organization_applications` (pattern เดิม)
2. Reuse `public.*` ที่มีอยู่แล้วสำหรับ org/user/role/location/device/file/notification/audit/webhook/SLA
3. สร้าง schema ใหม่ `media_core` เฉพาะ publishing engine — ตาม precedent ของ `booking_core` (migration 044–046): ไม่ expose ผ่าน PostgREST, เข้าถึงผ่าน RPC `SECURITY DEFINER` เท่านั้น

Phase 1 MVP = **10 ตารางใหม่** ไม่ใช่ 40

---

## 1. Reuse ได้เลย (ไม่ต้องสร้างใหม่)

| Spec entity | ตารางที่มีอยู่ | หมายเหตุ |
|---|---|---|
| Organization | `tenants`, `departments` | multi-tenant พร้อมแล้ว |
| User / Role / Permission | `users`, `memberships`, `membership_roles`, `roles`, `permissions`, `role_permissions`, `scopes` | RBAC ครบ — Administrator / Media Operator / Viewer เป็นแค่ rows ใน `roles` |
| App enablement | `applications`, `organization_applications`, `member_app_access` | เปิด/ปิด Media Workspace ต่อ org |
| Location | `locations`, `sites`, `provinces`/`districts`/`subdistricts` | มี geo hierarchy ไทยแล้ว |
| **Device (Player)** | `public.assets` | ดูข้อ 3 ด้านล่าง — สำคัญ |
| Device telemetry / heartbeat | `devices`, `device_telemetry_latest`, `device_credentials`, `device_types` | heartbeat, firmware, credential |
| Asset file storage | `files`, `file_versions`, `file_links`, `file_access_logs` | checksum / version / mime / soft-delete ครบตาม §6.2 |
| Alert / Incident | `alert_rules`, `alert_incidents` | ต้องแก้เล็กน้อย — ข้อ 4 |
| Customer Ticket + Incident workflow | `work_orders`, `work_order_tasks` | มี `source`, `source_ref_id`, priority, assign, `resolved_at`, `closed_at` ครบ — ไม่ต้องทำตาราง ticket ใหม่ใน MVP |
| SLA | `sla_plans` | uptime %, response/resolution hours |
| Notification (§19) | `notification_*` 9 ตาราง | channel/template/rule/inbox/preference ครบทั้ง In-App/Email/LINE |
| Audit Log (§Module 11) | `audit_events`, `audit_event_changes`, `audit_retention_policies` | |
| Webhook / Integration | `webhook_endpoints`, `webhook_delivery_logs`, `connector_*`, `integration_*` | |
| Tags / master data | `asset_tags`, `md_types`, `md_records` | |

## 2. ต้องสร้างใหม่ — schema `media_core` (Phase 1 MVP)

```
media_core.media_assets        -- domain layer ทับ public.files (duration, resolution, codec, approval, expiry)
media_core.channels            -- ปลายทาง publish
media_core.channel_devices     -- N:M, role primary/backup (spec สั่งให้ DB เผื่อ multi-device ไว้)
media_core.playlists
media_core.playlist_items      -- order, duration, transition
media_core.publications
media_core.publication_targets -- channel หรือ device
media_core.schedules           -- start/end/tz/recurrence
media_core.publish_jobs
media_core.publish_job_targets -- device-level status/retry/error
media_core.playback_logs       -- proof of play
```

Phase 2 ค่อยเพิ่ม: `screenshots`, `uptime_records`
Phase 3 ค่อยเพิ่ม: `layouts`, `layout_zones`, `campaigns`, `approval_requests`

**อย่าสร้าง** ตอนนี้: `asset_adaptations`, `layout_versions`, `schedule_recurrences`, `blackout_periods`, `sla_results`, `report_*`, `incident_activities`, `ticket_activities` — ยังไม่มีข้อมูลจริงมารองรับ

## 3. ⚠ ชนกัน: คำว่า "Asset"

- spec หมายถึง **ไฟล์สื่อ** (image/video)
- `public.assets` ใน Thunder_Core = **อุปกรณ์กายภาพ (EAM)** — และตอนนี้มันถือ field ของ signage player อยู่แล้ว: `screen_ratio`, `screen_dimension`, `app_version`, `capture_screen`, `capture_period`, `sync_media`, `download_mode`, `player_log_enable`, `media_log_days`, `cctv_url`, `last_heartbeat_at`, `connection_status` (~497 rows)

**ให้ทำแบบนี้:**
- Media "Asset" → ตาราง `media_core.media_assets` (ห้ามเอาไปยัดใน `public.assets`)
- Media "Device/Player" → `public.assets` (ของจริงอยู่ตรงนี้ 497 rows) ไม่ใช่ `public.devices` (~1 row, ไว้สำหรับ IoT sensor)
- `media_core.channel_devices.device_id → public.assets.id`

ล็อกคำศัพท์นี้ก่อนเริ่มเขียนโค้ด ตรงตาม Phase 0 §2 ของ roadmap

## 4. แก้ของเดิมเล็กน้อย (2 migration สั้น ๆ)

1. `alert_rules` ตอนนี้รองรับแค่ numeric threshold บน asset (`target_attribute` + `operator` + `threshold`) — media ต้องการ event alert (Device Offline / Publish Failed / Storage Low) → เพิ่มคอลัมน์ `event_code text` และทำ `alert_incidents.rule_id` เป็น nullable
2. `sla_plans.asset_category` ใช้ผูก scope ได้อยู่แล้ว — ไม่ต้องแตะ

## 5. ลำดับลงมือ

```
047 (ล่าสุดในโปรเจกต์) → เริ่มที่ 048
048_media_core_schema.sql       -- 11 ตาราง + index + REVOKE จาก anon/authenticated
049_media_core_functions.sql    -- RPC: media_publish, media_job_ack, media_playback_log, media_channel_upsert
050_media_core_alert_events.sql -- แก้ alert_rules/alert_incidents
```

แล้วทำ `src/lib/core/media.ts` เลียนแบบ `src/lib/core/booking.ts` (thin wrapper เรียก RPC) + route ใต้ `/api/core/v1/media/*`

## 6. ข้อตัดสินใจ (Phase 0 — เคาะแล้ว 2026-07-22)

ของที่มีอยู่จริงในโปรเจกต์ ณ วันที่เคาะ:

- `src/app/api/v0.1/player/` มี `register` / `retrieve` / `heartbeat` แล้ว → player คุย HTTP อยู่แล้ว
- `retrieve` ใช้ `device_credentials.access_token` เป็น activation code แล้ว
- **ไม่มี MQTT broker ในโค้ดเลย** — `mqtt_client_id` เป็นแค่คอลัมน์ ไม่มีใครใช้
- `heartbeat` เป็น stub — `console.log` เฉย ๆ ไม่เขียน DB
- signed URL มี precedent: `createSignedUrl(path, 60 * 60)` ที่ `src/features/tenant-assets/admin-actions.ts:132`

### 6.1 Content delivery — Pull (HTTP poll) ไม่เอา MQTT push

player poll `POST /api/core/v1/media/player/jobs` ทุก 60 วิ → ได้ `publish_job_targets` ที่ยัง pending → ทำเสร็จแล้ว ack กลับ

- MQTT push ต้องเพิ่ม broker + auth plane + monitoring ทั้งชุด แลกกับ latency 60 วิ ที่ signage ไม่สน — publish content ไม่ใช่ real-time control
- player ยิง HTTP อยู่แล้ว โครงสร้าง client ไม่ต้องแก้
- poll ผ่าน firewall/NAT ของลูกค้าได้เสมอ, MQTT persistent connection มักโดนบล็อก
- `publish_job_targets` เป็น queue ตรง ๆ — retry คือ poll รอบหน้า ไม่ต้องมี retry engine

### 6.2 Player auth — ใช้ `device_credentials` เดิม

`Authorization: Bearer <device_credentials.access_token>` → resolve เป็น `asset_id` + `tenant_id`

- ตารางมีอยู่ + มี `is_revoked` + ผูก `asset_id` แล้ว และ player ในสนามถือ token นี้อยู่แล้ว
- `applications.api_key` เป็น app-level (1 key ต่อแอป) — revoke ทีเดียวจอดับทั้งประเทศ ใช้กับ device ไม่ได้
- tenant scope บังคับที่ DB จาก token ไม่ใช่จาก client

ต้องแก้ควบคู่: ย้าย token จาก body → header (ตอนนี้ `retrieve` รับใน body = ติด log/proxy), rate-limit endpoint player ตาม `asset_id`

### 6.3 Media URL — signed URL 1 ชั่วโมง มินต์ตอน poll

player cache ไฟล์ในเครื่องด้วย `files.checksum` เทียบก่อนโหลด

- ตรงกับ precedent ที่มีอยู่ (`60 * 60`) ไม่เพิ่มค่าคงที่ใหม่ให้จำ
- TTL สั้นไม่เป็นปัญหาเพราะมินต์ตอน poll — จอออฟไลน์ข้ามคืนกลับมาก็ poll ใหม่ได้ URL ใหม่
- checksum ประหยัด bandwidth ได้มากกว่าการยืด TTL เยอะ

### 6.4 Heartbeat — ค่าคงที่ในโค้ด, offline เป็น derived value

heartbeat 60 วิ, offline = `now() - last_heartbeat_at > 5 min` ยังไม่แตะ `tenant_settings`

- ไม่ต้องมี job ไล่ mark offline — สถานะคำนวณตอน query ไม่มี state ค้าง ไม่มี sweeper ให้พัง
- ต้องแก้ `heartbeat/route.ts` ให้เขียนจริง: `assets.last_heartbeat_at`, `connection_status`, `app_version`, `ip_address` (คอลัมน์มีครบแล้ว)
- alert "Device Offline" ผูกกับ pg_cron sweep ทุก 5 นาที ใช้ pattern เดียวกับ `046_booking_core_schedule.sql`

### 6.5 ผลต่อ migration 048

- `publish_job_targets` ต้องมี `status` / `attempt_count` / `error_message` / `acked_at`
- `media_assets` ต้องมี `checksum` (หรือ join `files.checksum`)
- **ไม่ต้อง**สร้างตาราง config และตาราง device_status

---

## 7. ของที่จงใจยังไม่ทำ — เติมเมื่อไร (deferred ledger)

3 ข้อนี้ตัดออกโดยตั้งใจ ไม่ใช่ลืม แต่ละข้อมี trigger ชัดเจน ถ้า trigger มาถึงให้กลับมาอ่านหัวข้อนี้ก่อนลงมือ

| ของที่ตัด | trigger ที่ต้องเติม | เตรียมพร้อมไว้แล้วยังไง |
|---|---|---|
| **MQTT push** | มี requirement emergency takeover — "สั่งหยุด/เปลี่ยนจอเดี๋ยวนี้" ไม่ใช่ 60 วิ | ใช้ MQTT เป็น **สัญญาณกระตุ้นให้ poll ทันที** ไม่ใช่ช่องส่ง content — `publish_job_targets` ยังเป็น source of truth ตัวเดิม ไม่ต้องแก้ schema, `devices.mqtt_client_id` + `device_credentials.mqtt_client_id` มีอยู่แล้ว |
| **Token hashing** | ก่อน production security audit หรือก่อนเปิดให้ tenant ภายนอกรายแรก | เติม `token_hash` + `key_prefix` ใน `device_credentials` (pattern เดียวกับ `api_credentials.secret_hash`) แล้ว rotate ตอนเครื่องเข้ามา activate รอบถัดไป — ห้าม migrate ทีเดียวทั้ง fleet เพราะ player ในสนามถือ plaintext อยู่ |
| **Per-tenant config** (heartbeat interval / offline threshold) | ลูกค้ารายแรกที่ขอค่าต่างจาก default | อ่านจาก `tenant_settings` key `media.heartbeat_seconds` / `media.offline_threshold_seconds` — ตารางเป็น key/value jsonb รออยู่แล้ว ไม่ต้อง migration ใหม่ แค่แทนที่ค่าคงที่ในโค้ดด้วย 1 query |

trigger ยังไม่มา = อย่าเติม
