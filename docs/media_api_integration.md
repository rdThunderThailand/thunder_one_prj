# Thunder One Media API — คู่มือทีมที่มาต่อ (frontend / player)

> DOOH video publishing. อัปโหลดวิดีโอ → ใส่ playlist → publish ไปจอ → player โหลดไปเล่น
> Endpoint schema เต็ม: [`API_OVERVIEW.md` §1.5](./API_OVERVIEW.md#15-media--dooh-video-publishing--thunder-one).
> Design + เหตุผลเบื้องหลัง: [`media_mvp_plan.md`](./media_mvp_plan.md), [`media_core_mapping.md`](./media_core_mapping.md).

## 0. อ่านตรงนี้ก่อนเขียนโค้ด

- **สถานะ:** `048`–`052` verify บน local ครบ flow แล้ว **ยังไม่รันบน prod** — ก่อนใช้จริงต้อง `supabase db push` migration ชุดนี้ขึ้น prod ก่อน.
- **ไม่มี transcode/probe:** MVP รับไฟล์ตามที่อัปมาเลย วิดีโอ status = `ready` ทันที ถ้าจอเล่น codec ไม่ได้ = ภาระ operator.
- **คำว่า "Asset" ที่นี่ = ไฟล์วิดีโอ** ไม่ใช่จอ. จอ = "screen" (`public.assets`). อย่าปนกัน.
- **ตาราง `media_core.*` แตะตรงไม่ได้** — เข้าผ่าน REST endpoint นี้เท่านั้น (schema ไม่ expose ผ่าน PostgREST).

## 1. Auth

| ใคร | header | ได้ tenant มาจากไหน |
|---|---|---|
| **App/dashboard** (frontend) | `x-api-key: <app_api_key>` | app ที่ถือ key ผูกกับ tenant เดียว |
| **Player** (จอ) | `Authorization: Bearer <device_credentials.access_token>` | resolve จาก token → asset_id + tenant_id |

`tenant_id` **ไม่เคยส่งใน body** — DB เป็นคน resolve เอง. token player ผิด/ถูก revoke → `401`.

## 2. Flow ปกติ

```
[dashboard]  upload-url → PUT ไฟล์เข้า Storage → POST /videos (ยืนยัน)
             POST /playlists → PUT /playlists/{id}/items
             POST /publish {playlist, targets:[จอ]}   ──┐
                                                          │  (publish_job_targets = คิว)
[player]     ทุก 60 วิ: POST /player/jobs  ←─────────────┘
             โหลดไฟล์จาก file.url (signed 1h, cache ด้วย checksum)
             POST /player/jobs/{target_id}/ack {status:"playing"}
             POST /player/heartbeat  (ทุก 60 วิ)
[dashboard]  GET /publications/{id} → เห็นสถานะรายจอ / GET /screens → เห็น online
```

## 3. ทีละขั้น

### 3.1 อัปโหลดวิดีโอ (3 ขั้น — สำคัญ)
วิดีโอ 50–500MB **ไม่ proxy ผ่าน Next** ต้องอัปตรงเข้า Storage:
1. `POST /media/videos/upload-url` `{ filename, mime_type }` → ได้ `{ file_id, storage_key, upload_url, token }`.
2. `PUT <upload_url>` body = ไฟล์วิดีโอ (client ยิงตรงเข้า Supabase Storage เอง, header `Content-Type: <mime>`).
3. `POST /media/videos` `{ file_id, title, duration_seconds?, width?, height? }` → ยืนยัน ได้ `media_asset_id`.

> ถ้าข้าม 3.3 (ไม่ยืนยัน) จะมีไฟล์ค้างใน Storage แต่ไม่มี media_asset — ไม่โผล่ใน `GET /videos`.

### 3.2 สร้าง playlist
- `POST /media/playlists` `{ name }` → `playlist_id`.
- `PUT /media/playlists/{id}/items` `{ items:[{media_asset_id, position, duration_seconds?, transition?}] }` — แทนที่ทั้งชุด (ส่ง items ทั้งหมดทุกครั้งที่ save). `position` ห้ามซ้ำ.

### 3.3 Publish
- `POST /media/publish` `{ playlist_id, targets:[{target_type:"device", device_id}] }` (หรือ `target_type:"channel"`).
- คืน `device_count` = จำนวนจอที่ได้ job. จอเดิมถูกส่งซ้ำ (ตรง + ผ่าน channel) นับครั้งเดียว.

### 3.4 Player loop
- `POST /media/player/jobs` (Bearer) → `jobs[].items[].file.url` = signed URL 1 ชม. โหลดได้เลย. cache ด้วย `file.checksum` เทียบก่อนโหลดซ้ำ.
- โหลด+เริ่มเล่นเสร็จ → `POST /media/player/jobs/{target_id}/ack {status:"playing"}`. โหลดพัง → `{status:"failed", error}`.
- job target ที่ ack แล้วจะไม่โผล่ใน poll รอบหน้า (pending เท่านั้นที่คืน). publish ใหม่ = job ใหม่.

### 3.5 ติดตามผล (dashboard)
- `GET /media/publications/{id}` → `job_status` + `targets[].status` รายจอ.
- `GET /media/screens` → `is_online` (derived: heartbeat ล่าสุด < 5 นาที). `GET /media/screens/{id}` → `now_playing`.

## 4. Error
ใช้ convention เดียวกับทั้งไฟล์: body = `{ "error": "<message>" }`, status map จาก prefix (`Invalid`→400, `not found`→404, `Unauthorized`→401, `Already`→409). ดู [API_OVERVIEW §1 error table](./API_OVERVIEW.md#error-convention-ใช้กับทุก-v01-endpoint-ที่ผ่าน-apihandler).

## 5. ที่ Thunder **ไม่ได้** ทำให้ (MVP)
transcode/แปลง codec · MQTT push (ใช้ poll 60 วิแทน) · token hashing (`access_token` เก็บ plaintext) · per-tenant config (heartbeat/offline hardcode 60วิ/5นาที) · screenshots · layouts/zones · campaigns · approval workflow. ดู deferred ledger ใน [`media_core_mapping.md` §7](./media_core_mapping.md).

## 6. Device Offline alert
pg_cron sweep ทุก 5 นาที: จอที่ `now() - last_heartbeat_at > 5 นาที` → เปิด incident (`alert_incidents.event_code='device_offline'`), กลับมา online → auto-resolve. ไม่มี column mark สถานะ — offline เป็น derived ตอน query.

## 7. Checklist ก่อน go-live
- [ ] `supabase db push` `048`–`052` ขึ้น prod (ตอนนี้ verify แค่ local).
- [ ] สร้าง application + `x-api-key` สำหรับ Thunder One บน prod, enable ให้ tenant เป้าหมาย.
- [ ] จอจริง provision `device_credentials` (มี `access_token`) — `GET /screens` กรองเฉพาะ asset ที่มี credential.
- [ ] ยืนยัน player firmware ยิง `Bearer` header (ไม่ใช่ token ใน body).
- [ ] rate-limit endpoint `/media/player/*` ตาม asset_id (ยัง deferred — เปิดก่อนรับ fleet จริง).
