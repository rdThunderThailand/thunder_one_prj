# ส่งต่อทีม Player: Zone กำหนดการแสดงผลและเสียงเองได้แล้ว (ADR 0064)

**วันที่:** 8 กันยายน 2026 · **สถานะ:** ขึ้น **production** แล้ว พร้อมให้ยิงเทสทันที

---

## 1. เรื่องนี้ทำอะไรได้

เดิม การตัดสินใจว่า "รูป/วิดีโอจะแสดงยังไงในกรอบ" (ครอป / ใส่ทั้งรูป / ยืดเต็ม) มาจาก **item หรือ Playlist** เท่านั้น ปัญหาคือ Playlist ไม่รู้ว่าตัวเองกำลังถูกเอาไปฉายในกรอบทรงอะไร

Playlist เดียวกันอาจถูกเอาไปใช้ใน Zone ทรงจัตุรัส และ Zone ทรงแถบยาวพร้อมกัน — ค่าเดียวกันจะสวยในกรอบหนึ่งแต่พังในอีกกรอบหนึ่งเสมอ

**ตอนนี้ Zone กำหนดเองได้ 2 อย่าง:**

| ตั้งค่าอะไรได้ | ค่าที่เป็นไปได้ | ผลลัพธ์ |
|---|---|---|
| **`media_fit`** — จะแสดงรูป/วิดีโอในกรอบยังไง | `fit` | ใส่ทั้งรูปให้เห็นครบ มีขอบดำ (contain / letterbox) |
| | `fill` | ครอปให้เต็มกรอบ ขอบถูกตัดทิ้ง (cover) |
| | `stretch` | ยืด/บีบให้พอดีกรอบ ภาพเบี้ยว |
| **`muted`** — บังคับเงียบ | `true` | **บังคับปิดเสียง Zone นี้เสมอ** |
| | `false` | ไม่บังคับอะไร ใช้ policy เสียงเดิมของ player |

### ทำไมถึงต้องมี `muted`

จอหนึ่งจอมีลำโพงชุดเดียว แต่มีได้หลาย Zone ถ้าทุก Zone เล่นวิดีโอที่มีเสียงพร้อมกัน เสียงจะทับกันมั่ว **ต้องมีคนตัดสินใจว่า Zone ไหนได้เสียง** — คนที่รู้เรื่องนี้คือคนจัด Layout ไม่ใช่คนทำ Playlist

> ⚠️ **`muted: false` ไม่ได้แปลว่า "บังคับให้มีเสียง"** แปลว่า "ไม่ยุ่ง ปล่อยตามเดิม" มีแค่ `true` เท่านั้นที่บังคับ

---

## 2. Player ต้องแก้อะไรบ้าง

| คีย์ | อยู่ตรงไหน | ต้องแก้โค้ดไหม |
|---|---|---|
| `slots[].fit` | มีอยู่แล้วแต่เดิม | **ไม่ต้อง** — ตอนนี้ค่านี้ถูกเซิร์ฟเวอร์คำนวณให้เป็นค่าของ Zone แล้วตั้งแต่ตอน activate อ่านเหมือนเดิมทุกประการ |
| `slots[].playback.media_fit` | **ใหม่** | **ไม่ต้อง** — ค่าเดียวกับ `fit` เป๊ะ ใส่ไว้ให้ `playback` มีหน้าตาครบชุดเท่านั้น จะใช้หรือไม่ใช้ก็ได้ |
| `slots[].playback.muted` | **ใหม่** | **ต้องแก้** — ไม่มีคีย์อื่นแทนได้ ถ้าไม่อ่านคีย์นี้ ฟีเจอร์ปิดเสียงจะไม่ทำงานเลย |

**สรุปงานฝั่ง player: อ่าน `playback.muted` เพิ่มอย่างเดียว** ถ้า `true` ให้ปิดเสียง Zone นั้น นอกนั้นไม่ต้องแตะอะไร

### ของเก่ายังทำงานเหมือนเดิม

Publication ที่ activate ไปก่อนหน้านี้จะไม่มีสองคีย์นี้เก็บไว้ เซิร์ฟเวอร์จะเติมค่า default ให้เป็น `fit` / `false` → **พฤติกรรมเหมือนเดิมทุกอย่าง ไม่มีอะไรพัง**

ถ้าอยากให้ publication เก่าได้ค่าใหม่ ต้อง **re-activate** ใหม่ (ระบบไม่ backfill ย้อนหลังให้)

---

## 3. ยิงเทสได้เลย — ของจริงรออยู่บน production

เตรียม fixture ไว้ให้แล้ว **ใช้งานได้ถึง 8 ตุลาคม 2026**

- ยิง poll ด้วย device token ของ **`ThunderOne Screen 01`** หรือ **`ThunderOne Screen 03`**
- ทั้งสองจออยู่บน channel *Channel for Screen 1,3* และ **ไม่มีอย่างอื่นฉายอยู่** ยิงได้ไม่กวนใคร
- Publication: `77a86302-5e5c-489a-b659-ecbdb077fb13`
- Layout: "Browser Verify Layout 2026-08-25" · 16:9 · พื้นหลัง `#000000`

### ตั้งค่าไว้ให้ต่างกันทั้ง 3 Zone ตั้งใจ — ถ้า render ผิดจะเห็นทันที

| Zone | ตำแหน่ง (%) | `media_fit` | `muted` | เนื้อหา | ลูป |
|---|---|---|---|---|---|
| **Main** | ซ้ายบน 70×50 | `fill` (ครอป) | `false` | รูป 2 ใบ | 20 วิ |
| **Side** | ขวา 30×100 | `fit` (ใส่ทั้งรูป) | `false` | รูป 5 ใบ | 50 วิ |
| **Main 2** | ซ้ายล่าง 70×50 | `stretch` (ยืดเบี้ยว) | **`true`** | **วิดีโอ mp4 ที่มีเสียง** | 10 วิ |

**"Main 2" คือตัวชี้ขาด** — ต้องเห็นวิดีโอ **ยืดเบี้ยวเต็มกรอบ** และ **ไม่มีเสียง** ถ้าได้ยินเสียง = ยังไม่ได้อ่าน `playback.muted`

### ผังหน้าจอ

```
┌───────────────────────────┬─────────┐
│ Main    70×50             │ Side    │
│ fill (ครอป)               │ 30×100  │
│ รูป 2 ใบ · ลูป 20 วิ       │ fit     │
├───────────────────────────┤ รูป 5 ใบ │
│ Main 2  70×50             │ ลูป 50 วิ│
│ stretch (ยืด) + ปิดเสียง   │         │
│ วิดีโอ 1 ตัว · ลูป 10 วิ    │         │
└───────────────────────────┴─────────┘
```

**แต่ละ Zone ลูปของตัวเองแยกกัน** ความยาวลูปไม่เท่ากันได้ (20 / 50 / 10 วิ) ไม่ต้องพยายามทำให้ตรงกัน

---

## 4. Payload เต็ม (ของจริงที่ดึงมาจาก production)

ครบทั้ง 3 zones 8 slots ไม่ตัดทอน

```json
{
  "device_id": "11110000-0000-4000-8000-000000000011",
  "publication_snapshot_id": "0de750e1-83eb-480a-bcec-18dce0000dad",
  "server_now": "2026-09-08T05:56:30.321682+00:00",
  "loop_anchor_at": "2026-09-08T05:55:41.266724+00:00",
  "sync_enabled": false,
  "next_poll_after_seconds": 57,
  "layout": {
    "name": "Browser Verify Layout 2026-08-25",
    "aspect_ratio": "16:9",
    "background": "#000000"
  },
  "zones": [
    {
      "snapshot_zone_id": "79a14416-21f1-4d53-9758-373ba652cd67",
      "name": "Main",
      "x": 0.000, "y": 0.000, "width": 70.000, "height": 50.000,
      "loop_duration_seconds": 20,
      "loop_duration_ms": 20000,
      "slots": [
        {
          "start_offset_seconds": 0, "start_offset_ms": 0,
          "duration_seconds": 10, "duration_ms": 10000,
          "kind": "image",
          "fit": "fill",
          "transition": "fade",
          "transition_duration_seconds": 1, "transition_duration_ms": 1000,
          "background_color": null,
          "media_asset_id": "94c8c2df-7c4f-4245-bf96-3fbfad440658",
          "publication_id": "77a86302-5e5c-489a-b659-ecbdb077fb13",
          "target_id": "a6cd8eab-f485-4456-be90-83ece125e0cf",
          "delivery_attempt": 0,
          "starts_at": "2026-09-08T05:55:41.266724+00:00",
          "ends_at": "2026-10-08T05:55:41.266724+00:00",
          "file": {
            "bucket_name": "media",
            "storage_key": "videos/cf405f9d-3cff-45b2-8b11-326db27e58d7.webp",
            "original_filename": "test-test.webp",
            "mime_type": "image/webp",
            "checksum": null
          },
          "playback": {
            "play_mode": "sequential", "repeat": "loop", "start_from": "first",
            "media_fit": "fill", "muted": false
          }
        },
        {
          "start_offset_seconds": 10, "start_offset_ms": 10000,
          "duration_seconds": 10, "duration_ms": 10000,
          "kind": "image",
          "fit": "fill",
          "transition": "fade",
          "transition_duration_seconds": 1, "transition_duration_ms": 1000,
          "background_color": null,
          "media_asset_id": "996ac6c8-e9c7-435a-9ee6-4c67070b20a7",
          "publication_id": "77a86302-5e5c-489a-b659-ecbdb077fb13",
          "target_id": "a6cd8eab-f485-4456-be90-83ece125e0cf",
          "delivery_attempt": 0,
          "starts_at": "2026-09-08T05:55:41.266724+00:00",
          "ends_at": "2026-10-08T05:55:41.266724+00:00",
          "file": {
            "bucket_name": "media",
            "storage_key": "videos/5d779c41-fea4-4a69-a80e-0bdcf6750603.png",
            "original_filename": "Screenshot 2569-07-27 at 10.29.53.png",
            "mime_type": "image/png",
            "checksum": null
          },
          "playback": {
            "play_mode": "sequential", "repeat": "loop", "start_from": "first",
            "media_fit": "fill", "muted": false
          }
        }
      ]
    },
    {
      "snapshot_zone_id": "c2fb57bf-726d-4ab9-9d79-eb0ee3d7c76c",
      "name": "Side",
      "x": 70.000, "y": 0.000, "width": 30.000, "height": 100.000,
      "loop_duration_seconds": 50,
      "loop_duration_ms": 50000,
      "slots": [
        {
          "start_offset_seconds": 0, "start_offset_ms": 0,
          "duration_seconds": 10, "duration_ms": 10000,
          "kind": "image",
          "fit": "fit",
          "transition": "fade",
          "transition_duration_seconds": 1, "transition_duration_ms": 1000,
          "background_color": null,
          "media_asset_id": "6458d862-afd1-4bc2-8825-adf670ddd7da",
          "publication_id": "77a86302-5e5c-489a-b659-ecbdb077fb13",
          "target_id": "a6cd8eab-f485-4456-be90-83ece125e0cf",
          "delivery_attempt": 0,
          "starts_at": "2026-09-08T05:55:41.266724+00:00",
          "ends_at": "2026-10-08T05:55:41.266724+00:00",
          "file": {
            "bucket_name": "media",
            "storage_key": "videos/a54d918f-09b0-462d-b659-e78cd90fcaf6.webp",
            "original_filename": "c1.webp",
            "mime_type": "image/webp",
            "checksum": null
          },
          "playback": {
            "play_mode": "sequential", "repeat": "loop", "start_from": "first",
            "media_fit": "fit", "muted": false
          }
        },
        {
          "start_offset_seconds": 10, "start_offset_ms": 10000,
          "duration_seconds": 10, "duration_ms": 10000,
          "kind": "image",
          "fit": "fit",
          "transition": "cut",
          "transition_duration_seconds": 0, "transition_duration_ms": 0,
          "background_color": null,
          "media_asset_id": "fb1bb971-78c9-4c43-a0bd-d01b1a2a2508",
          "publication_id": "77a86302-5e5c-489a-b659-ecbdb077fb13",
          "target_id": "a6cd8eab-f485-4456-be90-83ece125e0cf",
          "delivery_attempt": 0,
          "starts_at": "2026-09-08T05:55:41.266724+00:00",
          "ends_at": "2026-10-08T05:55:41.266724+00:00",
          "file": {
            "bucket_name": "media",
            "storage_key": "videos/df055733-e439-4d47-98b7-d9f8b73ab602.jpg",
            "original_filename": "canva-ภาพประกอบลูกไก่การ์ตูนน่ารัก-MAG7gm8VQuM.jpg",
            "mime_type": "image/jpeg",
            "checksum": null
          },
          "playback": {
            "play_mode": "sequential", "repeat": "loop", "start_from": "first",
            "media_fit": "fit", "muted": false
          }
        },
        {
          "start_offset_seconds": 20, "start_offset_ms": 20000,
          "duration_seconds": 10, "duration_ms": 10000,
          "kind": "image",
          "fit": "fit",
          "transition": "fade",
          "transition_duration_seconds": 1, "transition_duration_ms": 1000,
          "background_color": null,
          "media_asset_id": "0bd96f66-13d2-4777-b90b-c1a37532d7dd",
          "publication_id": "77a86302-5e5c-489a-b659-ecbdb077fb13",
          "target_id": "a6cd8eab-f485-4456-be90-83ece125e0cf",
          "delivery_attempt": 0,
          "starts_at": "2026-09-08T05:55:41.266724+00:00",
          "ends_at": "2026-10-08T05:55:41.266724+00:00",
          "file": {
            "bucket_name": "media",
            "storage_key": "videos/f65fc82f-eb0f-45a8-8041-fe2e7b8ba9a4.png",
            "original_filename": "ghost-8250317_1280.png",
            "mime_type": "image/png",
            "checksum": null
          },
          "playback": {
            "play_mode": "sequential", "repeat": "loop", "start_from": "first",
            "media_fit": "fit", "muted": false
          }
        },
        {
          "start_offset_seconds": 30, "start_offset_ms": 30000,
          "duration_seconds": 10, "duration_ms": 10000,
          "kind": "image",
          "fit": "fit",
          "transition": "cut",
          "transition_duration_seconds": 0, "transition_duration_ms": 0,
          "background_color": null,
          "media_asset_id": "3aab5d61-e59e-4ec8-8d70-13f04a759f8c",
          "publication_id": "77a86302-5e5c-489a-b659-ecbdb077fb13",
          "target_id": "a6cd8eab-f485-4456-be90-83ece125e0cf",
          "delivery_attempt": 0,
          "starts_at": "2026-09-08T05:55:41.266724+00:00",
          "ends_at": "2026-10-08T05:55:41.266724+00:00",
          "file": {
            "bucket_name": "media",
            "storage_key": "videos/97e3c1d3-bd6d-4596-899e-5fb143e81727.jpeg",
            "original_filename": "llrrfb7himte1.jpeg",
            "mime_type": "image/jpeg",
            "checksum": null
          },
          "playback": {
            "play_mode": "sequential", "repeat": "loop", "start_from": "first",
            "media_fit": "fit", "muted": false
          }
        },
        {
          "start_offset_seconds": 40, "start_offset_ms": 40000,
          "duration_seconds": 10, "duration_ms": 10000,
          "kind": "image",
          "fit": "fit",
          "transition": "fade",
          "transition_duration_seconds": 1, "transition_duration_ms": 1000,
          "background_color": null,
          "media_asset_id": "7bbb3d0c-8d7c-4208-b0da-70077156f694",
          "publication_id": "77a86302-5e5c-489a-b659-ecbdb077fb13",
          "target_id": "a6cd8eab-f485-4456-be90-83ece125e0cf",
          "delivery_attempt": 0,
          "starts_at": "2026-09-08T05:55:41.266724+00:00",
          "ends_at": "2026-10-08T05:55:41.266724+00:00",
          "file": {
            "bucket_name": "media",
            "storage_key": "videos/623575e4-6c51-454e-a0c1-316946d97bc9.png",
            "original_filename": "รูปการ์ตูน-สปาเก็ตตี้4.png",
            "mime_type": "image/png",
            "checksum": null
          },
          "playback": {
            "play_mode": "sequential", "repeat": "loop", "start_from": "first",
            "media_fit": "fit", "muted": false
          }
        }
      ]
    },
    {
      "snapshot_zone_id": "58daea1f-6cf0-4b88-b129-265db1b72f27",
      "name": "Main 2",
      "x": 0.000, "y": 50.000, "width": 70.000, "height": 50.000,
      "loop_duration_seconds": 10,
      "loop_duration_ms": 10000,
      "slots": [
        {
          "start_offset_seconds": 0, "start_offset_ms": 0,
          "duration_seconds": 10, "duration_ms": 10000,
          "kind": "video",
          "fit": "stretch",
          "transition": "cut",
          "transition_duration_seconds": 0, "transition_duration_ms": 0,
          "background_color": null,
          "media_asset_id": "974688e4-c1df-4eab-99c1-0a573544e4ab",
          "publication_id": "77a86302-5e5c-489a-b659-ecbdb077fb13",
          "target_id": "a6cd8eab-f485-4456-be90-83ece125e0cf",
          "delivery_attempt": 0,
          "starts_at": "2026-09-08T05:55:41.266724+00:00",
          "ends_at": "2026-10-08T05:55:41.266724+00:00",
          "file": {
            "bucket_name": "media",
            "storage_key": "videos/THUNDER_001/06409899-2f16-45df-b3e6-661b194e4360.mp4",
            "original_filename": "ThunderOne_BlackT_Kiosk_9x16_Fullscreen_android_baseline.mp4",
            "mime_type": "video/mp4",
            "checksum": null
          },
          "playback": {
            "play_mode": "sequential", "repeat": "loop", "start_from": "first",
            "media_fit": "stretch", "muted": true
          }
        }
      ]
    }
  ]
}
```

> **หมายเหตุ:** `file.url` (signed URL อายุ 1 ชั่วโมง) ถูกเติมโดย HTTP route ไม่ใช่โดย RPC — payload ข้างบนไม่มีเพราะดึงมาจาก RPC ตรงๆ ยิงผ่าน API endpoint จริงจะมี `url` เพิ่มมาในทุก `file`

---

## 5. เช็คลิสต์ตอนเทส

- [ ] `zones[]` มี 3 โซน (ไม่ใช่ `slots[]`)
- [ ] `Main` → `fit` = `"fill"` ทั้ง 2 slots
- [ ] `Side` → `fit` = `"fit"` ทั้ง 5 slots
- [ ] `Main 2` → `fit` = `"stretch"` และ `playback.muted` = `true`
- [ ] ทุก slot: `fit` เท่ากับ `playback.media_fit` เสมอ
- [ ] เปิด publication เก่า (activate ก่อน 8 ก.ย.) → ต้องได้ `fit` / `false` เหมือนเดิม ไม่มีอะไรเปลี่ยน
- [ ] วิดีโอใน `Main 2` **ต้องไม่มีเสียงออกลำโพง**

---

## 6. ⚠️ เรื่องที่ยังค้าง — ไม่ใช่ปัญหาของ payload

**Player ปัจจุบันยังอ่าน `zones[]` ไม่เป็นเลย**

Publication ที่ผูกกับ Composition จะคืน `zones[]` **แทนที่** `slots[]` — สองอันนี้**ไม่มาพร้อมกัน** ให้แยกสาขาจาก `response.data.zones != null`

Player Windows และ Android ตอนนี้อ่านแต่ `slots[]` อย่างเดียว → เปิด fixture ตัวนี้แล้วจะ **ไม่เจอคอนเทนต์เลย**

การทำ multi-zone renderer เป็น **Phase B** ตาม ADR 0064 §5 ยังไม่ถูก schedule → **ส่ง `media_fit` ไปถูกต้องแค่ไหน ก็ยังไม่มีอะไรขึ้นจอจริงจนกว่าจะทำตัวนี้**

---

## 7. ทดสอบอะไรไปแล้วบ้าง (ฝั่งเรา)

| ทดสอบ | ผล |
|---|---|
| Apply migration ลง prod | ✅ ทั้ง 3 ฟังก์ชันมี marker ครบ, ไม่มี overload ซ้อน, สิทธิ์ไม่เปลี่ยน |
| ตรวจ baseline ก่อน apply | ✅ prod ตาม migration chain ครบ ต่างแค่การแก้ครั้งนี้ (comment 2 บรรทัด + `COALESCE` 1 บรรทัด) |
| Snapshot bake ค่าถูกไหม | ✅ `media_fit` ของแต่ละ Zone ลงคอลัมน์ `fit` ของทุก slot ในโซนนั้นครบ |
| **E2E เรียก `media_job_poll` จริงบน prod** | ✅ ด้วย device token จริงของ Screen 01 → 3 zones ค่าถูกทุกโซน |

**ยังไม่ได้ทดสอบ:** การ render จริงบนจอ — เพราะยังไม่มี player ตัวไหนอ่าน `zones[]` ได้ (ดูข้อ 6)

---

## 8. ติดต่อ / อ้างอิง

- ADR เต็ม: `docs/adr/0064-zone-media-presentation.md` (repo `thunder_one_prj`)
- PR: rdThunderThailand/thunder_one_prj#61 (frontend) · rdThunderThailand/Thunder_Core#52 (backend)
- Swagger: `public/swagger-core-v1.json` ใน `Thunder_Core` — ดู description ของ `/media/player/jobs/poll`
- **เทสเสร็จแล้วบอกด้วย** จะได้ cancel publication `77a86302` ออกจาก prod
