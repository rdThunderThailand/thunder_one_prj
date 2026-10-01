# Player contract — payload ใหม่ของ `media_job_poll` (timeline)

เอกสารนี้เขียนให้อ่านคนเดียวจบ ไม่ต้องเปิด ADR อื่นประกอบ ถ้าคุณทำ firmware ของจอ (player) นี่คือสิ่งที่เปลี่ยนกับ endpoint poll ที่คุณเรียกอยู่

## สรุปสั้น

- ทุกวันนี้ poll คืน **รายการ job** (คิว/inbox) — ตอบครั้งเดียวแล้ว "ใช้แล้วทิ้ง" เมื่อคุณ ack
- ของใหม่ poll คืน **timeline ที่จอควรเล่นอยู่ ณ ตอนนี้** — ตอบเหมือนเดิมทุกครั้งถ้าไม่มีอะไรเปลี่ยน (idempotent) ไม่ขึ้นกับว่าคุณ ack ไปแล้วหรือยัง

## ตัวอย่าง JSON — ของปัจจุบัน (ก่อน)

```json
{
  "device_id": "b3f1a2e4-0000-0000-0000-000000000001",
  "jobs": [
    {
      "target_id": "b7e2c1d0-0000-0000-0000-000000000002",
      "publication_id": "a1c4d5e6-0000-0000-0000-000000000003",
      "created_at": "2026-07-20T09:00:00Z",
      "playlist": {
        "id": "f9a0b1c2-0000-0000-0000-000000000004",
        "name": "KFC Central World - Promo"
      },
      "items": [
        {
          "media_asset_id": "d4e5f6a7-0000-0000-0000-000000000005",
          "position": 1,
          "duration_seconds": 15,
          "transition": "cut",
          "file": {
            "bucket_name": "media",
            "storage_key": "tenants/kfc/media/promo-v1.mp4",
            "checksum": "sha256:9f2c1a...",
            "mime_type": "video/mp4",
            "original_filename": "promo.mp4"
          }
        }
      ]
    }
  ]
}
```

`jobs[]` มีเฉพาะแถวที่ `status = 'pending'` — พอคุณ ack (เปลี่ยน status เป็น `downloading`/`playing`) แถวนั้นหลุดจากผลลัพธ์ **ถาวร** ไม่กลับมาอีก นี่คือปัญหา: ไม่มีทางถามระบบว่า "ตอนนี้จอควรเล่นอะไร" ได้เลยหลังจาก ack ไปแล้ว ต้องอาศัยความจำฝั่งจอเองล้วน ๆ

## ตัวอย่าง JSON — ของใหม่ (หลัง)

สมมติจอนี้มี publication 3 ตัว in-window พร้อมกัน ชิ้นละ 15 วินาที (สองคลิปวิดีโอ หนึ่งภาพนิ่ง):

```json
{
  "device_id": "b3f1a2e4-0000-0000-0000-000000000001",
  "loop_duration_seconds": 45,
  "next_poll_after_seconds": 58,
  "slots": [
    {
      "start_offset_seconds": 0,
      "duration_seconds": 15,
      "kind": "video",
      "transition": "cut",
      "publication_id": "a1c4d5e6-0000-0000-0000-000000000003",
      "target_id": "b7e2c1d0-0000-0000-0000-000000000002",
      "media_asset_id": "d4e5f6a7-0000-0000-0000-000000000005",
      "starts_at": "2026-08-11T09:00:00Z",
      "ends_at": "2026-08-11T12:00:00Z",
      "file": {
        "bucket_name": "media",
        "storage_key": "tenants/kfc/media/promo-v1.mp4",
        "checksum": "sha256:9f2c1a...",
        "mime_type": "video/mp4",
        "original_filename": "promo.mp4"
      }
    },
    {
      "start_offset_seconds": 15,
      "duration_seconds": 15,
      "kind": "video",
      "transition": "cut",
      "publication_id": "a2d5e6f7-0000-0000-0000-000000000006",
      "media_asset_id": "e5f6a7b8-0000-0000-0000-000000000007",
      "starts_at": "2026-08-11T09:00:00Z",
      "ends_at": null,
      "file": {
        "bucket_name": "media",
        "storage_key": "tenants/kfc/media/lunch-set-v2.mp4",
        "checksum": "sha256:1b7e44...",
        "mime_type": "video/mp4",
        "original_filename": "lunch-set.mp4"
      }
    },
    {
      "start_offset_seconds": 30,
      "duration_seconds": 15,
      "kind": "image",
      "transition": "fade",
      "publication_id": "a3e6f7a8-0000-0000-0000-000000000008",
      "media_asset_id": "f6a7b8c9-0000-0000-0000-000000000009",
      "starts_at": "2026-08-11T09:00:00Z",
      "ends_at": null,
      "file": {
        "bucket_name": "media",
        "storage_key": "tenants/kfc/media/delivery-promo.jpg",
        "checksum": "sha256:7cf03a...",
        "mime_type": "image/jpeg",
        "original_filename": "delivery-promo.jpg"
      }
    }
  ]
}
```

สาม slot × 15 วินาที = `loop_duration_seconds: 45` — นี่คือความยาวหนึ่งรอบ วนซ้ำจากต้นเมื่อเล่นครบ ไม่มีสัญญาณ "จบ" แยกต่างหาก จอวนเองตามเลข

**ฟิลด์ที่ต้องอ่านให้ครบ:**

- **`kind`** = `"video"` หรือ `"image"` — บอกตรง ๆ ว่าจะ render เป็นอะไร อย่าเดาจาก `mime_type` หรือนามสกุลไฟล์
  ถ้า `kind: "image"` ให้ค้างภาพไว้ `duration_seconds` วินาทีแล้วไป slot ถัดไป (ภาพนิ่งไม่มีความยาวในตัว ค่านี้คือเวลาค้างที่คนตั้งมา และจะมีค่าเสมอสำหรับ image)
- **`transition`** = `"cut"` หรือ `"fade"` — วิธีเปลี่ยนเข้า slot นั้น ฟิลด์นี้มีอยู่แล้วใน payload ปัจจุบัน (ระดับ `items[]`) แค่ย้ายมาอยู่ระดับ slot
- **`slots[].starts_at` / `slots[].ends_at`** (ISO timestamp, `ends_at` เป็น `null` ได้ = ไม่มีวันหมดอายุ) — ใช้หมดอายุ slot เองทันทีที่นาฬิกาจอผ่าน `ends_at` โดยไม่ต้องรอ poll รอบถัดไป ป้องกันกรณีเน็ตขาดแล้ว publication เล่นค้างเกินเวลาไม่มีกำหนด อย่าใช้ตัดสินใจว่าจะ "เริ่ม" เล่นอะไร (ตอนที่ได้ payload มา แปลว่าถึงเวลาเริ่มแล้วเสมอ — ฟิลด์นี้มีไว้ตัดสินใจ "หยุด" เท่านั้น)
- **`next_poll_after_seconds`** (จำนวนเต็ม หน่วยวินาที) — บอกว่าให้กลับมา poll อีกครั้งในอีกกี่วินาที **แทนที่ค่าคงที่ 60 วินาทีเดิม** เป็นระยะเวลานับจากตอนนี้ ไม่ใช่ timestamp (นาฬิกาจอเพี้ยนได้ไม่กระทบ) เฟสนี้เป็นค่าสุ่ม 55–65 เพื่อกระจายจอไม่ให้ poll พร้อมกันหลังไฟดับ ค่าจะแม่นขึ้นในอนาคตแต่**ความหมายของฟิลด์ไม่เปลี่ยน**
- **`slots[].playback`** (migration 099) — พฤติกรรมการเล่นของ playlist ที่ slot นั้นสังกัดอยู่ มากับทุก slot เสมอ (ไม่ใช่แค่ตัวแรก) เพราะ poll เดียวอาจ merge slot จากหลาย publication/playlist ที่ priority เท่ากันเข้าด้วยกัน:

  ```json
  {
    "start_offset_seconds": 0,
    "duration_seconds": 15,
    "publication_id": "a1c4d5e6-0000-0000-0000-000000000003",
    "playback": {
      "play_mode": "shuffle",
      "repeat": "once",
      "start_from": "resume"
    }
  }
  ```

  - **`play_mode`** = `"sequential"` หรือ `"shuffle"` — **shuffle เป็นหน้าที่จอ ไม่ใช่ server** server ไม่สลับ slot หรือแก้ `start_offset_seconds` ให้ ถ้าได้ `"shuffle"` จอสุ่มลำดับใหม่เองทุกรอบจาก slot ทั้งหมดที่มี `publication_id` เดียวกัน โดยทุก slot ต้องถูกเล่นครบหนึ่งครั้งต่อรอบ และห้ามเขียนทับลำดับที่ server ส่งมา
  - **`repeat`** = `"loop"` หรือ `"once"` — `"once"` แปลว่า หลัง item สุดท้ายของ publication นั้นจบ ให้ค้างเฟรมสุดท้ายไว้ (ห้ามขึ้นจอดำ) จนกว่า slot จะหายไปจากคำตอบ poll รอบถัดไป แทนที่จะวนกลับไปเล่นซ้ำ
  - **`start_from`** = `"first"` หรือ `"resume"` — `"resume"` แปลว่า จอกลับไปเล่นต่อจาก item สุดท้ายที่เล่นจบสำเร็จของ publication นี้ โดยใช้ความจำฝั่งจอเอง (server ไม่ได้เก็บ state ตัวนี้ไว้ให้) ถ้าไม่มีความจำนั้น หรือ item เดิมหายไปจาก `slots[]` ชุดปัจจุบันแล้ว ให้ fallback ไปเล่น item แรกอย่างปลอดภัย ห้าม error
  - จอรุ่นที่ไม่แก้อะไรเลย (เมิน `playback` ทิ้งตามกติกา "ข้ามฟิลด์ที่ไม่รู้จัก" ด้านล่าง) ยังทำงานถูกต้อง 100% เหมือนเดิม (sequential, loop, เริ่มจาก item แรก) — ฟิลด์นี้เป็นของเพิ่มเติมล้วน

## พฤติกรรมที่จอต้องทำ (ของใหม่)

1. **poll ตามค่า `next_poll_after_seconds`** ที่ได้จาก response ล่าสุด (ก่อนได้ response แรกให้ใช้ 60 วินาทีเป็นค่าตั้งต้น) — **เปลี่ยนจากค่าคงที่เดิม**
2. **diff ด้วย `file.checksum`** ที่มีอยู่แล้ว — ถ้า checksum เดิม ไม่ต้องโหลดไฟล์ซ้ำ (ไม่เปลี่ยน กลไกเดิม)
3. **หมดอายุ slot เองเมื่อนาฬิกาจอผ่าน `ends_at`** ของ slot นั้น (ถ้าไม่ใช่ `null`) ไม่ต้องรอ poll รอบถัดไปยืนยัน
4. **เล่นวนตาม timeline**: หาตำแหน่งปัจจุบันในรอบด้วย `(เวลาที่ผ่านไปตั้งแต่เริ่มรอบ) mod loop_duration_seconds` แล้วเล่น slot ที่ `start_offset_seconds <= ตำแหน่งนั้น < start_offset_seconds + duration_seconds` เมื่อครบ `loop_duration_seconds` วนกลับไป slot แรก

   > **"เริ่มรอบ" นับจากไหน — Phase 1 ปล่อยให้จอนับเอง** จากตอนที่รับ timeline ชุดนี้มา ไม่ได้ผูกกับนาฬิกากลาง แปลว่า **จอสองเครื่องที่มี timeline เหมือนกันจะไม่เล่นตรงกัน** และรับได้ในเฟสนี้ เพราะยังไม่มีการขายโฆษณาแบบระบุเวลานาฬิกา ถ้าวันหนึ่งต้องให้ตรงกัน (เช่น จอเรียงกันเล่นพร้อมกัน หรือขาย slot ตามเวลาจริง) จะมี anchor เวลาจาก server เพิ่มเข้ามาในรอบหน้า
5. **ทิ้ง slot ที่หายไปจากคำตอบล่าสุด** — แต่ละ poll คือ state ล่าสุดทั้งหมด ไม่ใช่ diff ถ้า `publication_id`/slot ที่เคยมีหายไปจากคำตอบรอบนี้ (publication หมดอายุ, ถูกยกเลิก, หรือจอถูกถอดออกจาก target) ให้เลิกเล่นทันที ไม่ต้องรอคำสั่ง "หยุด" แยกต่างหาก — **ไม่มี job ชนิด revoke** ในระบบนี้

## `ack` เปลี่ยนความหมาย (endpoint เดิม เรียกเหมือนเดิม)

`ack` ยังเป็น call เดิม ความถี่เดิม และยังใช้ **`target_id`** เป็นคีย์เหมือนเดิม — ค่านี้อยู่ในทุก slot ของ payload ใหม่ (`slots[].target_id`)

ความหมายเปลี่ยนจาก "จอเริ่มเล่น publication นี้แล้ว" เป็นแค่ **บันทึกสถานะไว้ดู (observability)**: จอได้รับ/โหลด/กำลังเล่น timeline เวอร์ชันไหน เพื่อ debug และ dashboard เท่านั้น — poll ไม่รอ ack ก่อนถึงจะคืนคำตอบใหม่ และ ack ไม่มีผลใด ๆ ต่อสิ่งที่ poll รอบถัดไปจะคืนให้

## Heartbeat — เพิ่ม telemetry ได้ (migration 082)

`POST /api/core/v1/media/player/heartbeat` ยัง endpoint เดิม, auth เดิม, ความถี่แนะนำ = จังหวะเดียวกับ jobs poll เดิม **body เดิม 2 ฟิลด์ยังใช้ได้เหมือนเดิมทุกประการ** — ส่วนนี้เป็นของเพิ่มเติมล้วน ไม่บังคับ:

```json
// req body (ทุกฟิลด์ optional, ส่งเท่าที่มี)
{
  "app_version": "3.14.1",
  "ip_address": "10.0.0.42",
  "screen_dimension": "1920x1080",
  "screen_ratio": "16:9",
  "storage_total_bytes": 64000000000,
  "storage_free_bytes": 12500000000
}
```

- **`screen_dimension` / `screen_ratio`** — string อิสระ (เช่น `"1920x1080"`, `"16:9"`) ไม่มี validation รูปแบบฝั่ง server
- **`storage_total_bytes` / `storage_free_bytes`** — หน่วย byte, จำนวนเต็ม `storage_free_bytes` ต้อง **≤** `storage_total_bytes` เสมอ (server ตอบ `400` ถ้าฝ่าฝืน) ส่วน "used" ไม่ต้องส่ง server คำนวณเองจาก `total - free`
- ไม่ส่งฟิลด์ไหนเลย = ไม่แตะค่าเดิมของฟิลด์นั้นใน DB (ค่าที่เคยรายงานไว้ยังอยู่ ไม่ถูกลบ)
- **⚠️ deprecated (ยังใช้ได้ ไม่บังคับย้าย):** `app_version`, `screen_dimension`, `screen_ratio` — ค่าเดียวกันนี้ (ยกเว้น `screen_dimension` ที่เปลี่ยนรูปเป็น `screen_width`/`screen_height` แยกตัวเลข) ย้ายไปอยู่ที่ endpoint ใหม่ `POST /device-profile` ด้านล่างแล้ว เพราะเป็นค่าที่ไม่เปลี่ยนทุกนาที ส่งผ่าน heartbeat ต่อได้ถ้ายังไม่พร้อมย้าย server จะไม่ตัดออกจนกว่าจะยืนยันว่าจอทุกเครื่อง migrate แล้ว
- response เพิ่ม key `telemetry` สะท้อนค่าล่าสุดที่ระบบเก็บไว้กลับมาให้ (มีประโยชน์ตอน debug ว่า server รับค่าที่ส่งไปจริงไหม) และเพิ่ม key ใหม่ **`profile_required`**:

```json
{ "success": true, "data": {
    "device_id": "...", "received_at": "2026-08-11T08:17:59Z",
    "profile_required": false,
    "telemetry": {
      "app_version": "3.14.1", "ip_address": "10.0.0.42",
      "screen_dimension": "1920x1080", "screen_ratio": "16:9",
      "storage_total_bytes": 64000000000, "storage_free_bytes": 12500000000
    } } }
```

- **`profile_required: true`** = server ไม่เคยได้รับ device profile จากจอนี้เลย (ทั้ง `os_version` และ `machine_name` ยังเป็น `null`) — ถ้าเจอค่านี้ ให้ยิง `POST /device-profile` ทันทีในรอบ heartbeat ถัดไป นี่คือทางกู้คืนสำหรับจอที่ boot ไปแล้วก่อนมี endpoint นี้ หรือจอที่ยิง `/device-profile` ตอน boot ไม่สำเร็จ

## Device profile — endpoint ใหม่ ยิงครั้งเดียวตอน boot + ตอนค่าเปลี่ยน (migration 096)

`POST /api/core/v1/media/player/device-profile` — auth เดิม (`Authorization: Bearer <device_token>`) **ไม่ใช่ endpoint ที่ยิงตามรอบเวลา** ยิงแค่:
1. ทุกครั้งที่จอ boot ขึ้นมา
2. ทุกครั้งที่ค่าพวกนี้เปลี่ยนจริง (เปลี่ยนความละเอียด, อัปเดต firmware, เปลี่ยนชื่อเครื่อง)

**ห้ามยิงทุก heartbeat** — endpoint นี้แยกออกมาเพราะฟิลด์พวกนี้ไม่เปลี่ยนทุกนาที

```json
// req body (ทุกฟิลด์ optional, ส่งเท่าที่มี — แต่แนะนำส่งครบตอน boot)
{
  "app_version": "3.14.1",
  "os_version": "Microsoft Windows 10.0.26100",
  "machine_name": "KIOSK-01",
  "screen_width": 1920,
  "screen_height": 1080,
  "screen_ratio": "16:9",
  "dpi_scale": 1.25,
  "orientation": "landscape"
}
```

- **`screen_width` / `screen_height`** — จำนวนเต็ม หน่วยพิกเซล **แยกเป็น 2 ฟิลด์ ไม่ใช่ string รวม** (ต่างจาก `screen_dimension` เดิมที่เป็น `"1920x1080"`) ต้อง `> 0` ทั้งคู่ ไม่งั้นโดน `400`
- **`screen_ratio`** — string อิสระ เช่น `"16:9"` (ไม่ใช่ `aspect_ratio` เป็นตัวเลข)
- **`orientation`** — รับแค่ `"landscape"` หรือ `"portrait"` เท่านั้น ค่าอื่นโดน `400`
- **`dpi_scale`** — ตัวเลข > 0
- ไม่ส่งฟิลด์ไหนเลย = ไม่แตะค่าเดิมของฟิลด์นั้นใน DB — เรียกซ้ำได้ปลอดภัย (idempotent) retry ได้อิสระถ้าเจอ error โดยไม่เสี่ยงข้อมูลเพี้ยน
- response echo ค่าที่เก็บจริงกลับมาใน key `profile`:

```json
{ "success": true, "data": {
    "device_id": "...", "received_at": "2026-08-18T09:00:00Z",
    "profile": {
      "app_version": "3.14.1", "os_version": "Microsoft Windows 10.0.26100",
      "machine_name": "KIOSK-01", "screen_width": 1920, "screen_height": 1080,
      "screen_ratio": "16:9", "dpi_scale": 1.25, "orientation": "landscape"
    } } }
```

## Ack — `media_asset_id` เสริมได้ (migration 084)

`POST /api/core/v1/media/player/jobs/{target_id}/ack` ยัง endpoint เดิม, `target_id` เดิม, body 2 ฟิลด์เดิม (`status`, `error`) ยังใช้ได้เหมือนเดิมทุกประการ — เพิ่มฟิลด์ optional 1 ตัว:

```json
{ "status": "failed", "error": "disk full", "media_asset_id": "d4e5f6a7-0000-0000-0000-000000000005" }
```

- ไม่ใส่ `media_asset_id` = ack ระดับ target ทั้งก้อนเหมือนเดิมทุกประการ (ค่า default, ไม่บังคับเปลี่ยนอะไรฝั่งจอ)
- ใส่ `media_asset_id` = รายงานผลของไฟล์นั้นแยกเก็บไว้เป็น diagnostic (ดูได้จาก dashboard ฝั่ง operator เท่านั้น, จอไม่ได้อ่านค่านี้กลับ) — **ถ้า `status: "failed"` พร้อม `media_asset_id` จะทำให้ target ทั้งก้อนกลายเป็น `failed` ด้วยเสมอ** (ไฟล์เดียวเล่นไม่ได้ = publication นั้นเล่นไม่ครบตามที่ publish ไว้)
- ack `"playing"`/`"downloading"` พร้อม `media_asset_id` **ไม่** ทำให้ target กลับจาก `failed` เป็นอย่างอื่น — ต้องรอ ack รอบใหม่ที่ไม่มี `media_asset_id` (ack ระดับ target) หรือ job ใหม่จาก publish รอบถัดไป

## Publication Download Report — callback หลังไฟล์พร้อมครบ (migration 20260821065750)

ทุก slot เพิ่ม `delivery_attempt` ซึ่งเท่ากับ `publish_job_targets.retry_count`. หลัง distinct Asset
ทุกตัวของ Publication พร้อมอยู่ใน local cache แล้ว ให้ส่ง callback หนึ่งครั้ง:

```json
{
  "publication_id": "f43449be-b78e-4889-9245-47d34a30fc64",
  "reported_at": "2026-08-20T06:33:54.1600000+00:00",
  "delivery_attempt": 0,
  "items": [{
    "media_asset_id": "94c8c2df-7c4f-4245-bf96-3fbfad440658",
    "target_id": "a1b2c3d4-0000-4000-8000-000000000000",
    "file_name": "94c8c2df-7c4f-4245-bf96-3fbfad440658.webp",
    "file_size": 545388,
    "checksum": null,
    "verified": false,
    "downloaded": true
  }]
}
```

`POST /api/core/v1/media/player/jobs/{publication_id}/publication` ใช้ Bearer token เดิม.
ข้อยกเว้นสำคัญ: `{id}` ของ route นี้คือ `publication_id`; route sibling `/jobs/{id}/ack` ยังใช้
`target_id`. `downloaded=false` = reuse cache และสำเร็จเหมือน fresh download. ถ้า jobs response
ให้ checksum ต้อง echo ค่าเดิมและ `verified=true`; ถ้าตรวจไม่ผ่านให้ส่ง ACK `failed` และห้ามส่ง
callback. Retry จะเพิ่ม `delivery_attempt`; callback ของ attempt เก่าจะได้ `409`.

## สิ่งที่ **ไม่** เปลี่ยน

- Auth: `Authorization: Bearer <device_credentials.access_token>`
- Heartbeat / ack: endpoint, `target_id`, และฟิลด์เดิมทุกตัวยังใช้ได้เหมือนเดิม — ของใหม่ทั้งหมดข้างบนเป็น "เพิ่มเติม" ล้วน จอที่ไม่แก้อะไรเลยยังทำงานถูกต้อง 100%

## Snapshot materialization — เนื้อหาหลังบ้านเปลี่ยน, payload ไม่เปลี่ยนสักฟิลด์ (ADR 0045)

**สรุปสั้นที่สุด: `POST /media/player/jobs` response ไม่เปลี่ยนรูปเลยสักตัวอักษร — ไม่ต้องแก้ firmware
อะไรทั้งสิ้นสำหรับเปลี่ยนนี้.** เอกสารนี้มีไว้บอกว่า "ทำไมมันแก้ปัญหาที่เคยมีให้" ไม่ใช่บอกให้แก้โค้ด.

**ปัญหาเดิมที่จอไม่เคยรู้:** ก่อนหน้านี้ poll อ่านเนื้อหาสด ๆ จาก Playlist ทุกครั้งที่ตอบ ถ้า operator
แก้ Playlist หลัง publish ไปแล้ว (สลับคลิป, เปลี่ยนลำดับ) **จอที่กำลังเล่น publication นั้นอยู่จะเห็นการ
เปลี่ยนแปลงทันทีใน poll รอบถัดไป** (~55–65 วิ) โดยไม่มีการ publish ใหม่เกิดขึ้นเลย — เหมือนมีคนแอบสลับ
ไฟล์ระหว่างที่จอกำลังเล่นอยู่

**ตอนนี้แก้แล้ว:** เนื้อหาถูก "ก๊อปแช่แข็ง" (snapshot) ไว้ ณ วินาทีที่ operator กด publish/activate
poll หลังจากนี้อ่านจาก snapshot นั้นเท่านั้น ไม่แตะ Playlist สดอีกต่อไป แปลว่า:
- แก้ Playlist ต้นทางหลัง publish ไปแล้ว **จะไม่กระทบ job ที่ยิงไปแล้ว** — จอจะยังเล่นของเดิมที่เห็นตอน
  publish จนกว่าจะมีการ publish/republish ใหม่จริง ๆ เท่านั้น
- ถ้าวันหนึ่งมี republish endpoint จริง (ยังไม่มีวันนี้) — job เก่ากับ job ใหม่จะไม่มีวันมีเนื้อหาปนกันแบบ
  สุ่ม ๆ อีก (บั๊กเดิม: item ที่ถูกลบออกจาก publish รอบใหม่แล้ว "โผล่ค้าง" ในบางจอ — เป็น class ของบั๊กที่
  snapshot นี้ปิดไปด้วยเลย ทั้งที่จอไม่ต้องรู้อะไรเกี่ยวกับมัน)

ไม่มีฟิลด์ไหนหาย ไม่มีฟิลด์ใหม่โผล่ใน `/media/player/jobs` — `slots[]`, `file.checksum`,
`next_poll_after_seconds`, `playback`, `starts_at`/`ends_at` ทุกตัวยังเหมือนตัวอย่างด้านบนทั้งหมด.

### ฟิลด์ optional ใหม่ที่ `/media/player/playback` เท่านั้น (proof of play) — ไม่บังคับใช้

`POST /media/player/playback` (log การเล่นจริง) เปิดฟิลด์ optional 2 ตัวต่อ log entry, **จอไม่ต้องส่งก็ได้
— ไม่ส่งเลยยังทำงานเหมือนเดิมทุกประการ**:

```json
{ "logs": [{
  "media_asset_id": "d4e5f6a7-0000-0000-0000-000000000005",
  "played_at": "2026-08-25T09:00:15Z",
  "duration_played_seconds": 15,
  "publication_snapshot_id": null,
  "snapshot_zone_id": null
}] }
```

- ต้องส่งเป็นคู่เท่านั้น — ส่งแค่ตัวเดียวโดนปฏิเสธทั้ง batch (400), ไม่ส่งทั้งคู่ = flat report แบบเดิม (ผ่าน)
- มีไว้เผื่ออนาคต (จอหลายโซน, ADR 0044) ที่ต้องการรู้ว่า log นี้มาจาก snapshot/zone ไหนเป๊ะ ๆ — **วันนี้
  ยังไม่มีเหตุผลให้จอส่งฟิลด์นี้เลย**, ปล่อยว่างไปก่อนได้จนกว่าจะมีประกาศเพิ่มเติม

## กติกาความเข้ากันได้ของสัญญานี้ (สำคัญมาก ต้องทำตามเสมอ)

payload นี้จะมีฟิลด์ใหม่เพิ่มเข้ามาอีกในอนาคต (เช่น รองรับจอหลายโซน) กติกาสองข้อนี้คือสิ่งที่ทำให้เราเพิ่มฟิลด์ได้เรื่อย ๆ โดยไม่ต้องแก้ firmware ทุกครั้ง — **จอต้องรองรับทั้งสองข้อ ไม่ใช่ทางเลือก:**

1. **ต้องข้ามฟิลด์ที่ไม่รู้จัก ห้าม error/crash** — parser ต้องอ่านเฉพาะคีย์ที่รู้จัก เจอคีย์แปลกใหม่ให้เมิน ไม่ใช่ปฏิเสธทั้ง payload
2. **สัญญานี้แก้ได้เฉพาะแบบ "เพิ่ม" เท่านั้น** — คีย์เดิมจะไม่ถูกเอาออกหรือเปลี่ยนความหมาย ถ้าวันหนึ่งมีจอหลายโซน `slots[]` ระดับบนสุดจะยังหมายถึง "โซนเต็มจอ" เหมือนเดิม จอรุ่นเก่าที่ยังอ่านแต่ `slots[]` จะยังทำงานถูกต้องเหมือนเดิมทุกประการ ส่วนโซนอื่นจะมาในฟิลด์ใหม่ต่างหาก
