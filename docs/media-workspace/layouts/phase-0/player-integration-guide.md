# Player Integration Guide — Thunder One media player API

เอกสารอ้างอิงเดียวสำหรับทีม player (Windows / Android) รวมทุก endpoint ที่ player ต้องใช้
รูปร่าง payload จริงที่ server ส่งออก และสถานะว่าอะไร deploy แล้วที่ไหน

อ่านคู่กับ: `contract-v2-zones.md` (สัญญา zoned) · `contract-v2-zones-player-reply.md` และ `-reply-2.md`
(ตอบคำถามรอบ 1-2) · เอกสารนี้เป็น superset ของทั้งสามไฟล์

**ปรับปรุงล่าสุด:** 2026-08-31 · ตรวจกับโค้ดบน `origin/develop` หลัง merge `Thunder_Core#41`

## อ่านตรงไหนก่อน (สำหรับรอบอัปเดต Layout นี้)

ถ้าเคยอ่านเอกสารรอบก่อนมาแล้ว ให้ข้ามไปอ่าน 4 จุดนี้ก่อน — เป็นของใหม่หรือของที่พลาดแล้วพัง:

| อ่าน | ทำไม |
|---|---|
| **§4.2 + §4.3** zoned payload กับ slot object | รูปร่างจริงที่ server ส่ง — zoned **ไม่มี** `loop_duration_seconds` ที่ top-level ถ้า parser บังคับ field นี้จะ crash ทันที |
| **§4.3 กล่อง `file.url`** | signed URL **หมดอายุใน 1 ชั่วโมง** และ RPC ไม่ได้ส่ง key `url` มาเลย (route เติมทีหลัง) — กระทบ offline/cache strategy โดยตรง |
| **§6 playback log** | `publication_snapshot_id` กับ `snapshot_zone_id` **ต้องมีทั้งคู่หรือไม่มีทั้งคู่** มีอันเดียวโดน 400 ทั้ง batch ตั้งแต่ชั้น validation |
| **§12 สถานะจริงวันนี้** | บอกว่าอะไรยิงเทสได้แล้ว อะไรยังไม่ได้ และติดอะไรอยู่ — อ่านก่อนวางแผน sprint |

ที่เหลือเป็นรายละเอียดเปิดดูตอนลงมือเขียนโค้ดแต่ละส่วน

---

## 1. Environment

| env | base URL | DB project |
|---|---|---|
| develop | `http://localhost:3001` — **รันบนเครื่องของแต่ละคนเอง** ไม่มี URL กลาง | `ftfmokgphewzyxzwjitv` |
| production | `https://thundercore.vercel.app` | `sfiefevtxalqjizdkcsw` |

ทุก path ขึ้นต้นด้วย `/api/core/v1/media/player/`

**develop ไม่มี host กลางให้ยิง** — ใครจะเทสกับ develop ต้องรัน Thunder_Core บนเครื่องตัวเอง
(`pnpm dev --port 3001` โดย `.env` ชี้ DB `ftfmokgphewzyxzwjitv`) แล้วยิงเข้า `localhost` ของเครื่องนั้น
ส่วน `thundercore.vercel.app` คือ **production** ไม่ใช่ develop

## 2. Authentication

ทุก endpoint ใช้ **device token** ผ่าน header เดียว:

```
Authorization: Bearer <device_access_token>
```

- token คือ `device_credentials.access_token` ที่ผูกกับ 1 device (asset)
- ไม่มี app key ไม่มี user JWT สำหรับ path ของ player — device token อย่างเดียว
- token ที่ถูก revoke → `401 {"error":"Unauthorized: invalid or revoked device token"}`

## 3. Endpoint ทั้งหมด

| method | path | ใช้ทำอะไร |
|---|---|---|
| POST | `/jobs` | poll timeline ที่ต้องเล่น — **หัวใจของระบบ** |
| POST | `/jobs/{target_id}/ack` | ตอบกลับสถานะ delivery ของ job |
| POST | `/jobs/{target_id}/publication` | รายงานผลดาวน์โหลด/verify ไฟล์ |
| POST | `/heartbeat` | ทุก ~60 วิ · ส่ง telemetry · รับ `profile_required` |
| POST | `/device-profile` | ส่งข้อมูลเครื่อง (จอ, OS, capabilities) |
| GET | `/server-time` | วัด clock offset (ADR 0041) |

### Error envelope

ทุก endpoint คืน error รูปแบบเดียว:

```jsonc
{ "error": "ข้อความ" }
```

status mapping: `401` unauthorized · `403` permission denied · `404` not found ·
`409` conflict/already/quota · `400` invalid input · `500` อื่นๆ

ส่วน success ทุกตัวคือ `{ "success": true, "data": { ... } }`

---

## 4. POST /jobs — payload ที่ต้องเล่น

Request body: **ไม่มี** (เฉพาะ header)

Response มี **2 shape** ที่ไม่มีทางมาพร้อมกัน:

```text
if (response.data.zones != null)  -> zoned rendering
else                              -> flat slots[] rendering (path เดิม ไม่เปลี่ยน)
```

### 4.1 Flat payload (Publication ที่ไม่มี Composition — เหมือนเดิมทุกประการ)

```jsonc
{
  "success": true,
  "data": {
    "device_id": "uuid",
    "loop_duration_seconds": 120,          // รวมทั้ง timeline
    "next_poll_after_seconds": 61,         // สุ่ม 55-65
    "server_now": "2026-08-31T03:36:08.056065+00:00",
    "sync_enabled": true,
    "loop_anchor_at": "2026-08-31T00:00:00+00:00",   // null ได้ถ้าไม่มี slot
    "slots": [ /* slot object — ดูข้อ 4.3 */ ]
  }
}
```

### 4.2 Zoned payload (Publication ที่มี Composition)

```jsonc
{
  "success": true,
  "data": {
    "device_id": "uuid",
    "next_poll_after_seconds": 58,
    "server_now": "2026-08-31T03:36:08.056065+00:00",
    "sync_enabled": true,
    "loop_anchor_at": "2026-08-31T00:00:00+00:00",   // top-level ใช้ร่วมทุก zone
    "publication_snapshot_id": "uuid",               // echo กลับใน playback log
    "layout": {
      "name": "Corporate Lobby 3-Zone",
      "aspect_ratio": "16:9",
      "background": "#000000"
    },
    "zones": [
      {
        "snapshot_zone_id": "uuid",
        "name": "Main Content",
        "x": 0, "y": 0, "width": 100, "height": 55.5,
        "loop_duration_seconds": 62,
        "slots": [ /* slot object เดียวกับ flat ทุก field */ ]
      }
    ]
  }
}
```

**ต่างจาก flat ตรงไหน:**

- **ไม่มี `slots` ที่ระดับ top-level**
- **ไม่มี `loop_duration_seconds` ที่ระดับ top-level** — loop เป็นของแต่ละ zone
- เพิ่ม `publication_snapshot_id`, `layout`, `zones`

### 4.3 Slot object — เหมือนกันทั้งสอง shape ทุก field

```jsonc
{
  "start_offset_seconds": 0,         // ตำแหน่งใน loop ของ zone ตัวเอง (zoned) หรือของ timeline (flat)
  "duration_seconds": 15,
  "kind": "image",                   // image | video
  "transition": "fade",
  "publication_id": "uuid",
  "target_id": "uuid",               // ใช้กับ /jobs/{target_id}/ack
  "delivery_attempt": 0,
  "media_asset_id": "uuid",          // ใช้กับ playback log
  "starts_at": "2026-08-31T00:00:00+00:00",
  "ends_at": null,
  "file": {
    "bucket_name": "media",
    "storage_key": "tenant/xxx/file.jpg",
    "checksum": "sha256...",         // null ได้
    "mime_type": "image/jpeg",
    "original_filename": "poster.jpg",
    "url": "https://...signed..."    // ดูคำเตือนข้างล่าง
  },
  "playback": {
    "play_mode": "sequential",       // default 'sequential'
    "repeat": "loop",                // default 'loop'
    "start_from": "first"            // default 'first'
  }
}
```

**เรื่อง `file.url` ที่ต้องรู้:**

1. RPC ในฐานข้อมูล **ไม่ได้ส่ง key `url` มาเลย** — HTTP route เป็นคนเติมให้หลัง sign
2. **signed URL หมดอายุใน 1 ชั่วโมง** (`createSignedUrl(key, 3600)`) — ต้องดาวน์โหลดให้เสร็จภายใน
   1 ชม. หลัง poll ถ้าเกินให้ poll ใหม่เอา URL ใหม่ **อย่าเก็บ URL ลง disk เพื่อใช้วันหลัง**
3. ถ้า `bucket_name` หรือ `storage_key` ว่าง → `url` จะเป็น `null`
4. route เดินทั้ง `slots[]` และ `zones[].slots[]` แล้ว (merge `Thunder_Core#41`) — ถ้าเจอ `url: null`
   ทั้งที่ `storage_key` มีค่า แปลว่า deploy ยังไม่ถึง ให้แจ้งฝั่ง backend

**เรื่อง `playback` ที่ต้องรู้:** ค่ามาจาก **zone ที่ slot นั้นสังกัด** ไม่ใช่จาก Publication
zone หลัก loop ได้ขณะที่ ticker ข้างล่าง play-once ในจอเดียวกัน — scheduler ต่อ zone ต้องอ่านค่าจาก
slot จริง ห้าม assume ว่าทั้งจอเหมือนกัน

### 4.4 Zone object

| field | type | หมายเหตุ |
|---|---|---|
| `snapshot_zone_id` | uuid | **ไม่ใช่ zone id ของ Layout** — echo verbatim ใน playback log |
| `name` | string | label ให้ operator ดู ไม่ใช่ input ของ renderer · ไม่มี field `role` |
| `x` `y` `width` `height` | number | **percent 0-100 ทศนิยม 3 ตำแหน่ง** — ใช้ `double`/`Float` ห้ามใช้ `Int` |
| `loop_duration_seconds` | int | loop ของ zone นี้ อิสระจาก zone อื่น |
| `slots` | array | slot object ตามข้อ 4.3 |

**ทำไมต้องเป็น snapshot zone id:** Layout แก้ได้หลัง publish zone id ของ Layout จึง map ไปได้หลาย
geometry ตามเวลา ระบุไม่ได้ว่าออกอากาศจริงแบบไหน — **zone id ของ Layout ไม่เคยถูกส่งให้ player**

### 4.5 Guarantee ที่ server รับประกัน

- zone มากสุด **4** zone ต่อ payload และมาจาก Publication เดียวเสมอ
- zone **ไม่ overlap** กัน — ไม่มี field `z` ไม่มีลำดับ compositing ให้ตัดสิน
- zone **อาจไม่เต็มจอ** — พื้นที่ที่ไม่มี zone ให้ทาด้วย `layout.background`
- `x + width <= 100` และ `y + height <= 100`
- ทุก zone มีอย่างน้อย 1 slot — ไม่มี zone เปล่าถูกส่ง
- geometry เป็น percent เทียบ display area และคง percent ไม่ว่าจอกว้างแค่ไหน
  เครื่องเดียวกางหลายจอได้ (`SpanAllDisplays`) · หลายเครื่อง sync เป็น video wall ยัง out of scope

---

## 5. Timesync

```text
flat:   phase = (server_now - loop_anchor_at) mod loop_duration_seconds
zoned:  phase = (server_now - loop_anchor_at) mod zone.loop_duration_seconds
```

- **`loop_anchor_at` เป็น top-level ตัวเดียว ใช้ร่วมทุก zone** — ที่แยกต่อ zone มีแค่
  `loop_duration_seconds` ถ้าเก็บ anchor แยกต่อ zone แต่ละ zone จะ drift ออกจากกันเอง
- `loop_anchor_at` เป็น `null` ได้ (ตอนไม่มี slot) — ต้อง handle
- ไม่ต้องมี readiness handshake ระหว่าง zone ไม่ต้องมี master zone
- `sync_enabled: false` → ไม่ต้องทำ phase sync
- ควร persist anchor ล่าสุดไว้เพื่อเล่นต่อได้ตอน offline

---

## 6. POST /playback — proof of play

```jsonc
// request
{
  "logs": [
    {
      "media_asset_id": "uuid",              // required
      "played_at": "2026-08-31T03:40:00Z",   // required
      "duration_played_seconds": 17,          // required, integer
      "publication_snapshot_id": "uuid",      // optional
      "snapshot_zone_id": "uuid"              // optional
    }
  ]
}
```

**กติกาที่พลาดแล้วโดน 400 ทั้ง batch:**

1. **`publication_snapshot_id` กับ `snapshot_zone_id` ต้องมีทั้งคู่ หรือไม่มีทั้งคู่**
   มีอันเดียวโดน validation ปฏิเสธทันที: `publication_snapshot_id and snapshot_zone_id must both
   be present or both be absent`
   - flat mode → ไม่ต้องส่งทั้งคู่ (omit หรือ null)
   - zoned mode → ส่งทั้งคู่ 1 log ต่อ 1 zone
2. **server validate 3 ข้อ และ reject ทั้ง batch แบบ transactional** ถ้าแถวใดแถวหนึ่งไม่ผ่าน:
   - `snapshot_zone_id` เป็นของ `publication_snapshot_id` จริง
   - `media_asset_id` เป็น item ของ zone นั้นจริง
   - `publication_snapshot_id` มาจาก Job ที่ target มาที่ device ของ token นี้
3. **ไม่มี partial accept** — retry ส่ง batch เดิมซ้ำได้ ไม่เกิด duplicate
4. **echo ค่าจาก payload verbatim ห้ามสร้างเอง** และต้องเก็บ id ตั้งแต่ตอนเริ่มเล่นจริง
   ไม่ใช่มาหาตอน upload
5. **snapshot เก่าไม่หมดอายุ** — player ที่ offline คร่อม republish upload ย้อนหลังได้ ระบบรับ
   ไม่ว่าเก่าแค่ไหน → offline queue ไม่ต้องทิ้ง log เก่า

---

## 7. POST /heartbeat

```jsonc
// request (ทุก field optional)
{
  "app_version": "1.4.2",
  "ip_address": "10.0.0.5",
  "screen_dimension": "1920x1080",
  "screen_ratio": "16:9",
  "storage_total_bytes": 64000000000,
  "storage_free_bytes": 12000000000,
  "phase_error_ms": -120,            // signed — ล่วงหน้า/ล้าหลัง คนละความหมาย
  "loop_duration_seconds": 62
}
```

ข้อจำกัด: `storage_free_bytes` ต้องไม่เกิน `storage_total_bytes` (ไม่งั้น 400)

```jsonc
// response
{
  "success": true,
  "data": {
    "device_id": "uuid",
    "received_at": "2026-08-31T03:40:00Z",
    "profile_required": true,        // <-- อยู่ใน data ไม่ใช่ top-level
    "telemetry": { "app_version": "...", "phase_error_ms": -120, "loop_duration_seconds": 62, "..." : "..." }
  }
}
```

### `profile_required` — สิ่งที่ player ต้องทำ

- **อ่าน response body** — ปัจจุบัน Windows ลดเหลือ `bool`, Android เหลือ HTTP status code
  ทั้งคู่ต้องเริ่มอ่าน body
- `data.profile_required === true` → ยิง `/device-profile` (idempotent ส่งซ้ำไม่เสียหาย)
- **rate-limit การส่ง** — heartbeat ทุก 60 วิ เครื่องที่หา field ไม่เจอจริงๆ ต้องไม่ยิง profile
  ทุกนาที ให้ back off หรือส่งมากสุด 1 ครั้งต่อ session ต่อ prompt
- **เก็บ trigger เดิมไว้ทั้งหมด** — Windows: start / settings change / display change ·
  Android: player shell entry · flag นี้เพิ่ม path ใหม่ ไม่ได้แทนของเดิม
- **ส่งเท่าที่รู้** — เครื่องที่อ่าน `screen_width` ไม่ได้ ต้องส่ง field ที่เหลือไปด้วย ไม่งั้น flag
  ไม่มีวันเคลียร์

flag เป็น `true` เมื่อ **ข้อใดข้อหนึ่ง** ขาด: `os_version`, `machine_name`, `screen_width`,
`screen_height` — **ทุก build ที่มีอยู่วันนี้เติมได้ครบทั้ง 4** `false` จึงเป็นเป้าที่ไปถึงได้จริง

`player_capabilities` **ไม่ได้อยู่ในเงื่อนไขนี้โดยตั้งใจ** (ถ้าใส่ flag จะค้าง `true` ตลอดกาล
เพราะไม่มี build ไหนส่ง) — capability prompting จะกลับมาพร้อม ticket 08

---

## 8. POST /device-profile

```jsonc
{
  "app_version": "1.4.2",
  "os_version": "Windows 11 23H2",
  "machine_name": "LOBBY-PC-01",
  "screen_width": 1920,              // integer > 0
  "screen_height": 1080,
  "screen_ratio": "16:9",
  "dpi_scale": 1.5,
  "orientation": "landscape",        // landscape | portrait เท่านั้น
  "capabilities": {
    "multi_zone_v1": true,
    "max_video_zones": 1
  }
}
```

- ทุก field optional · `capabilities` เป็น loose object เพิ่ม key ใหม่ได้โดยไม่ต้องแก้ route
  แต่ถ้าส่งค่าที่ไม่ใช่ object จะโดนปฏิเสธ
- **server เก็บ `capabilities` อย่างเดียว ไม่ enforce อะไรทั้งสิ้น** (ADR 0054) — ไม่ส่ง/เป็น NULL
  ก็ไม่ block publish ทุก device ได้ zoned payload เหมือนกันหมด
- **hardcode ค่าไว้ต่อ build ไม่ต้อง runtime probing** แนะนำเริ่มที่ `max_video_zones: 1`
  ทั้ง Android และ Windows จนกว่าจะวัดบน hardware จริง
- ตอนเปิด enforce ในอนาคต `max_video_zones` จะถูกเทียบกับ **จำนวน zone ที่มี item ชนิด video
  อย่างน้อย 1 อัน** ไม่ใช่จำนวน video item รวม (เพราะ zone loop อิสระ จึงเล่นพร้อมกันได้หมด)

---

## 9. POST /jobs/{target_id}/ack

```jsonc
{
  "status": "delivered",             // required, string
  "error": "ข้อความ",                 // optional
  "media_asset_id": "uuid"           // optional
}
```

`target_id` ใน path คือ `slot.target_id` จาก payload

## 10. POST /jobs/{target_id}/publication — รายงานผลดาวน์โหลด

```jsonc
{
  "publication_id": "uuid",
  "reported_at": "2026-08-31T03:40:00+07:00",   // ISO8601 ต้องมี offset
  "delivery_attempt": 0,
  "items": [
    {
      "media_asset_id": "uuid",
      "target_id": "uuid",
      "file_name": "poster.jpg",
      "file_size": 184320,
      "checksum": "sha256...",      // null ได้
      "verified": true,
      "downloaded": true
    }
  ]
}
```

กติกา validation:

- `items` ห้ามว่าง · ทุก item ต้องใช้ `target_id` เดียวกัน · `media_asset_id` ห้ามซ้ำ
- `checksum: null` → `verified` ต้องเป็น `false` · มี `checksum` → `verified` ต้องเป็น `true`

**สำหรับ zoned mode:** ต้อง flatten media จากทุก zone (`zones.flatMap(z => z.slots)`) ก่อนทำ
download plan, hash verify, cache cleanup และรายงานตัวนี้ — **ถ้า cleanup ยังมองแค่ flat playlist
จะลบไฟล์ของ zone อื่นผิด**

## 11. GET /server-time

ใช้วัด clock offset เท่านั้น (ADR 0041) ไม่ใช่ protocol ของ synchronized playback

```jsonc
{ "success": true,
  "data": { "db_at": "...", "db_start_ms": 1.2, "db_end_ms": 8.4, "xmit_ms": 9.1 } }
```

สูตรอยู่ใน comment ของ route — ค่า node-side ทุกตัวเป็น ms นับจากตอนเข้า route ไม่ใช่เวลาสัมบูรณ์

---

## 12. สถานะจริงวันนี้ — ทดสอบอะไรได้แล้วบ้าง

สองชั้นที่ต้องแยกกันให้ออก: **ชั้น database (RPC)** apply ตรงเข้า DB มีผลทันที ·
**ชั้นโค้ด (HTTP route)** ต้องรอ deploy

| ของ | ชั้นไหน | develop (localhost) | production (`thundercore.vercel.app`) |
|---|---|---|---|
| RPC ส่ง `zones[]` | database | ✅ | ✅ |
| `data.profile_required` (geometry-aware) | database | ✅ | ✅ apply 2026-08-28 |
| device-profile รับ `capabilities` | database | ✅ | ✅ |
| route sign URL ใน `zones[].slots` | **โค้ด** | ✅ ถ้า pull `develop` แล้วรันเอง | ❌ **ยังไม่ promote** |
| **มี composition Publication ให้ poll จริง** | data | ❌ **0 อัน** | ❌ **0 อัน** |

### ตัวบล็อกตอนนี้มี 2 อัน

**1. production ยังเป็นบิลด์ก่อน merge** — โค้ดอยู่บน `develop` ที่ commit `f9e7bbf`
(Merge PR #41 ซึ่งพา `ebba675 feat(media-player): return zoned slots in the job poll payload` เข้ามา)
แต่ยังไม่ถูก promote ขึ้น production

เช็คเองได้ด้วยคำสั่งเดียว:

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://thundercore.vercel.app/api/core/v1/media/compositions
```

`401` = deploy ถึงแล้ว ใช้ได้ · `404` = ยังเป็นบิลด์เก่า (สถานะ ณ 2026-08-31)

**2. ไม่มี composition Publication ที่ active เลยทั้งสอง environment** — อันที่เคยใช้ทดสอบ
(`7b6cb708…`) ถูก cancel ไปเมื่อ 2026-08-28

แปลว่ายิง `/jobs` ตอนนี้จะได้ **flat payload เปล่า** (`slots: []`) ไม่ใช่ zoned — ไม่ได้แปลว่าโค้ดพัง
แปลว่ายังไม่มีอะไรให้เล่น ต้องมีคนสร้างผ่าน UI ของ Thunder One ก่อน:
สร้าง Layout → สร้าง Composition ผูก Playlist เข้าแต่ละ zone → สร้าง Publication type `composition`
→ activate → target มาที่ device ที่ใช้ทดสอบ

### ทดสอบได้ทันทีโดยไม่ต้องรออะไร

- `/heartbeat` — อ่าน `data.profile_required` ได้ทั้ง localhost และ production (ตรรกะอยู่ใน RPC
  ไม่ต้องรอ deploy)
- `/device-profile` — ส่ง `capabilities` ได้เลยทั้งสอง env ด้วยเหตุผลเดียวกัน
- `/jobs` flat path — ทำงานปกติเหมือนเดิม ไม่มีอะไรเปลี่ยน
- parser / model / download plan ของ zoned — **ทำด้วย fixture JSON ตาม §4.2 ได้เลย
  ไม่ต้องรอ environment ใดๆ ทั้งสิ้น**

---

## 13. ลำดับงานที่แนะนำ

1. **parse `zones[]` โดยไม่ทำ flat path พัง** — branch ที่ `data.zones != null` เท่านั้น
2. **download / cache plan จาก `zones[].slots`** — flatten ทุก zone ก่อนทำ cleanup
3. **device profile `capabilities`** — ยิง production ได้เลย
4. **heartbeat `profile_required`** — เริ่มอ่าน response body
5. **zoned renderer** — container ต่อ zone ตาม geometry percent, background ทาพื้นที่ที่เหลือ
6. **per-zone timesync** — anchor ร่วม, duration แยก
7. **zoned proof-of-play** — เก็บ snapshot/zone id ตั้งแต่เริ่มเล่น
8. **cleanup / test / performance บน hardware จริง**

ข้อ 1-4 ทำได้วันนี้ทั้งหมด ข้อ 5-7 ต้องมี composition Publication จริงถึงจะ verify ได้

## 14. สิ่งที่ไม่อยู่ใน contract นี้

Scene / scene carousel · `angle` · `opacity` · `z` · `role` · schedule ต่อ zone · priority ต่อ zone ·
anchor ต่อ zone · widget / live-data zone · ticker text แบบมีสไตล์หรือเลื่อน · video wall ข้ามเครื่อง ·
`compositions[]` (หลาย Layout ใน response เดียว)

เหตุผลที่แต่ละอันถูกตัดอยู่ใน ADR 0044 และ ADR 0049
