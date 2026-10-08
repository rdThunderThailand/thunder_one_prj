# Player spec — Playback Proof (ภาษาไทย)

สำหรับ: ทีม Player (Android / Windows) · ฉบับภาษาอังกฤษ: `spec-playback-proof-player-contract.md`
(ถ้าสองฉบับขัดกัน ให้ยึดฉบับภาษาอังกฤษ) · เหตุผลเบื้องหลัง: `docs/adr/0089-playback-proof-records-player-reported-outcomes.md`

**เอกสาร API (Swagger):** ดู `POST /media/player/jobs` และ `POST /media/player/playback` ใน Swagger ของ Core v1
ที่ <https://thundercore.vercel.app/api-docs/v1> (tag **Media**) หน้านั้นแสดงของ production จะเห็นฟิลด์ใหม่หลัง
release เท่านั้น ระหว่างนี้ให้ดูไฟล์บน `develop`:
<https://github.com/rdThunderThailand/Thunder_Core/blob/develop/public/swagger-core-v1.json>
ถ้าเอกสารนี้กับ Swagger ไม่ตรงกัน ให้ถามทีม server อย่าเดาเอง

## สรุปในประโยคเดียว

**ทุกครั้งที่ไฟล์หนึ่งเล่นจบรอบบนจอ หรือเล่นไม่ขึ้น ให้จด record เล็กๆ 1 อัน เก็บไว้ในคิวในเครื่อง
แล้วอัปโหลดคิวขึ้น server ประมาณนาทีละครั้ง**

server เอา record พวกนี้ไปทำรายงาน Playback Proof ("อะไรเล่นที่จอไหน เมื่อไหร่ นานเท่าไหร่ อะไรเล่นไม่ขึ้น")
ถ้า Player ไม่รายงาน รายงานก็แสดงไม่ได้

## ⚠️ ลำดับการทำงาน

ฝั่ง server ต้องแก้ poll ให้ส่ง id ครบทุก slot ก่อน (ticket A2b) ทีม Player เริ่มเขียนโค้ดได้เลย
แต่ **ทดสอบกับ develop ได้จริงหลังจาก A2b ขึ้น develop แล้ว** — ทีม server จะแจ้งอีกครั้ง

## Flow ครบ loop

```
 ┌──────────────────────────────────────────────────────────────────────────┐
 │ 1. POLL       POST /api/core/v1/media/player/jobs     (ทุก ~60 วินาที)  │
 │               ← ได้ slot / zone มา แต่ละ slot มี id 3 ตัว:               │
 │                 media_asset_id, publication_snapshot_id, snapshot_zone_id│
 │                                    │                                     │
 │ 2. PLAY       เล่น slot บนจอ                                             │
 │               จำไว้: เวลาที่เริ่มขึ้นจอ + id 3 ตัวของ slot นั้น           │
 │                                    │                                     │
 │ 3. RECORD     slot จบ (เล่นจบ / ถูกข้าม / retry แล้วยอมแพ้)               │
 │               → เพิ่ม record 1 อันลงคิวในเครื่อง (บันทึกลง disk)          │
 │                                    │                                     │
 │ 4. UPLOAD     POST /api/core/v1/media/player/playback                    │
 │               หลัง poll ทุกรอบ หรือทันทีถ้าคิวมี ≥ 100 record              │
 │               ครั้งละไม่เกิน 500 record เรียงจากเก่าไปใหม่                │
 │                                    │                                     │
 │ 5. RESULT     2xx       → ลบ record ชุดนั้นออกจากคิว                     │
 │               4xx       → ลบออกเหมือนกัน (ส่งกี่รอบก็ไม่ผ่าน)              │
 │                           แล้วจดลง error log ในเครื่อง                    │
 │               5xx / ไม่มีเน็ต → เก็บไว้ ส่งใหม่รอบหน้า                    │
 └──────────────────────── กลับไปข้อ 1 ─────────────────────────────────────┘
```

**ตอน offline:** ข้อ 1, 4, 5 หยุด แต่ข้อ 2, 3 ทำต่อตามปกติ พอเน็ตกลับมาให้อัปโหลดคิวจากเก่าไปใหม่
**คิวต้องไม่หายแม้ Player restart**

## ข้อ 1 — ของที่ได้จาก poll

ทุก slot ใน response ของ poll (ทั้งแบบมี Layout และไม่มี Layout) จะมี:

- `media_asset_id` — ไฟล์ที่จะเล่น
- `publication_snapshot_id` — Program เวอร์ชันที่ publish ซึ่ง slot นี้เป็นของมัน
- `snapshot_zone_id` — โซนของจอ (Program แบบเต็มจอก็มีโซน 1 โซนเหมือนกัน)

ถือ id 3 ตัวนี้ไว้กับ slot ตลอดที่มันเล่น **อย่าเอาค่าจาก poll รอบก่อนมาใช้** ให้ใช้ค่าจาก response
ของ poll ที่ slot นั้นมาจริงๆ

## ข้อ 3 — หน้าตา record

เล่นได้ปกติ:

```json
{
  "media_asset_id": "3f0c…",
  "publication_snapshot_id": "9a12…",
  "snapshot_zone_id": "77be…",
  "played_at": "2026-10-08T10:32:15.120+07:00",
  "duration_played_seconds": 10,
  "outcome": "played"
}
```

เล่นไม่ขึ้น:

```json
{
  "media_asset_id": "3f0c…",
  "publication_snapshot_id": "9a12…",
  "snapshot_zone_id": "77be…",
  "played_at": "2026-10-08T10:32:25.004+07:00",
  "duration_played_seconds": 0,
  "outcome": "failed",
  "failure_reason": "decode_error",
  "failure_message": "MediaCodec: unsupported profile High 4:4:4"
}
```

| field | ใส่อะไร |
|---|---|
| `played_at` | เวลาที่ slot **เริ่มขึ้นจอ** (ไม่ใช่เวลาที่อัปโหลด) มีมิลลิวินาที และ**ต้องมี timezone** (`Z` หรือ `+07:00`) ถ้าไม่มีทั้ง batch จะถูกปฏิเสธ (400) |
| `duration_played_seconds` | จำนวนวินาทีเต็มที่อยู่บนจอจริง ถ้าไม่ขึ้นจอเลยใส่ `0` ห้ามติดลบ |
| `outcome` | `played` หรือ `failed` |
| `failure_reason` | ใส่เฉพาะตอน `failed`: `decode_error` (ถอดรหัสไม่ได้) · `file_missing` (ไม่มีไฟล์) · `file_corrupt` (ไฟล์เสีย) · `playback_stalled` (เล่นค้าง) · `other` (อื่นๆ) |
| `failure_message` | ไม่บังคับ ใส่เฉพาะตอน `failed` ไม่เกิน 500 ตัวอักษร — รายละเอียดทางเทคนิคไว้ให้ทีม support |

กติกา:

- **1 record ต่อ 1 slot ต่อ 1 โซน** — จอมี 2 โซนเล่นพร้อมกัน → 2 record ในเวลาเดียวกัน
- **retry ไม่นับเป็น record แยก** — ล้มแล้ว retry จนเล่นได้ → `played` 1 อัน · retry จนยอมแพ้แล้วข้าม → `failed` 1 อัน
- `publication_snapshot_id` กับ `snapshot_zone_id` ต้องมาคู่กัน: มีทั้งคู่ หรือไม่มีทั้งคู่
- ถ้าไม่ใส่ `outcome` server จะถือว่าเป็น `played` (Player รุ่นปัจจุบันจึงยังใช้ได้)

## ข้อ 4 — การอัปโหลด

```
POST /api/core/v1/media/player/playback
Authorization: Bearer <device token>
Content-Type: application/json

{ "logs": [ record, record, … ] }      ← 1 ถึง 500 record
```

ตอบกลับ `200`: `{ "success": true, "data": { "logged": 498, "duplicates": 2 } }`

- `duplicates` มากกว่า 0 ไม่ใช่ปัญหา: แปลว่าส่ง record ที่ server มีอยู่แล้วซ้ำ (เช่นรอบก่อนส่งถึงแต่
  คำตอบหายระหว่างทาง) server ไม่เก็บซ้ำ
- request เป็นแบบ **ทั้งหมดหรือไม่มีเลย**: ถ้ามี record ผิดแม้แต่อันเดียว จะได้ 4xx และ **ไม่มี record ไหน
  ในชุดนั้นถูกเก็บเลย** — เพราะแบบนี้ 4xx ถึงต้องทิ้ง ไม่ใช่ส่งใหม่ (ไม่งั้นคิวจะค้างตลอดไป)

## สรุปสิ่งที่เปลี่ยนสำหรับทีม Player

| | ตอนนี้ | หลังทำตาม spec |
|---|---|---|
| snapshot + zone id | ไม่ได้ส่ง | ส่งทุก record |
| เล่นไม่ขึ้น | ไม่ได้รายงาน | รายงานเป็น `outcome: "failed"` |
| ตอน offline | (ยังไม่ทราบ) | เก็บคิวลง disk แล้วส่งตอนเน็ตกลับมา |
| ขนาดต่อครั้ง | ไม่จำกัด | ไม่เกิน 500 |
| ได้ 4xx | (ยังไม่ทราบ) | ทิ้งชุดนั้น จด log ในเครื่อง |

## ไม่อยู่ใน spec นี้

ภาพหน้าจอ, ตำแหน่งที่กำลังเล่นแบบ live, สถานะของแต่ละ output, heartbeat — ไม่เปลี่ยน
