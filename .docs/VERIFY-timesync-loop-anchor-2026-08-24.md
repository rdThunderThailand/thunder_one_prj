# Verify checklist — schedule-anchored playback loop (ADR 0043)

**Branch:** `feat/timesync-loop-anchor`
**สถานะ DB:** apply แล้วบน prod (`sfiefevtxalqjizdkcsw`) — verify ผ่าน RPC แล้ว 2 จุด (ดูท้ายไฟล์)
**สถานะ frontend:** ยังไม่ deploy — ต้องรัน local dev หรือ preview เพื่อเช็คข้อด้านล่าง

## Pre-req

ต้องรันโค้ดจาก branch `feat/timesync-loop-anchor` ผ่าน local dev server ถ้าเช็คบน production URL
ตอนนี้จะยังไม่เห็นอะไรเปลี่ยน (frontend ยังไม่ deploy)

## Checklist

- [ ] **1. เข้าหน้า Channel list** — Communication → Channels

- [ ] **2. เปิด Channel "Channel for Screen 3-4"** (มี Screen 03/04, `sync_enabled = true` อยู่แล้วใน prod)

- [ ] **3. ดูใต้ชื่อ "ThunderOne Screen 03"** ในแผง detail — ต้องเห็นบรรทัดใหม่ต่อจาก "Heartbeat · ...":
      ```
      Sync · -1147 ms · loop 62s
      ```

- [ ] **4. ดูใต้ชื่อ "ThunderOne Screen 04"** — ต้องเห็นบรรทัดเดียวกัน:
      ```
      Sync · -1147 ms · loop 62s
      ```

- [ ] **5. เปิด Channel อื่นที่ `sync_enabled = false`** (Channel ทั่วไปที่ไม่ใช่ตัวข้างบน) —
      ต้อง**ไม่มี**บรรทัด "Sync · ..." ขึ้นเลย ไม่ว่าจอในนั้นจะมีค่า telemetry เก่าอยู่หรือไม่

- [ ] **6. เปิด browser devtools → Console** ระหว่างเปิดหน้า Channel ทั้งสองแบบ (ข้อ 2 และ 5) —
      ต้องไม่มี error สีแดง โดยเฉพาะเกี่ยวกับ `sync_phase_error_ms`, `sync_loop_duration_seconds`,
      หรือ "Channel device data is malformed"

## ถ้าเจอปัญหา

- **ไม่เห็นบรรทัด Sync เลยทั้งที่ `sync_enabled = true`:** เช็คว่า devtools Network tab เห็น
  `sync_phase_error_ms`/`sync_loop_duration_seconds` ใน response ของ `channel_rows` จริงไหม
  ถ้าไม่เห็นในเช็ค frontend อาจเรียก endpoint/cache เก่าอยู่
- **ขึ้น error "malformed":** แปลว่า parser (`parseChannelDevice`) เจอ shape ที่ไม่คาดคิด —
  แจ้งกลับพร้อม response body จาก Network tab

## อ้างอิง DB-level verification ที่ทำไปแล้ว (ไม่ต้องทำซ้ำ)

- `media_core.channel_rows` — คืนค่า `sync_phase_error_ms: -1147`, `sync_loop_duration_seconds: 62`
  ถูกต้องสำหรับทั้งสองจอ
- `public.media_job_poll` — รันได้ไม่ error บนจอจริง คืน `loop_anchor_at: null` ถูกต้องตอนที่จอไม่มี
  slot active (`loop_duration_seconds = 0`) ตรงตาม ADR 0043 decision 3
