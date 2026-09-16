# ตอบกลับ PLAYER_CONTRACT_V2_ZONES_PLAYER_IMPACT

ตอบ `Backend Coordination` 6 ข้อ และเติมรายละเอียดของ contract ที่เอกสารฝั่ง player ตกไป
ต้นทาง: `docs/layouts/contract-v2-zones.md` (spec), ADR 0044 / 0045 / 0049 / 0050 / 0054

สรุปก่อน: **เอกสารฝั่ง player อ่าน contract ถูกทั้งหมด** ลำดับ priority 8 ข้อและการซอย 3 phase
ใช้ได้เลย ไม่มีจุดไหนที่ต้องรื้อ ที่เหลือคือสถานะ deploy ฝั่ง server และรายละเอียด 4 ข้อข้างล่าง

## 1. Backend Coordination — ตอบครบ 6 ข้อ

### 1.1 route sign URL เดิน `zones[].slots` แล้วหรือยัง

**โค้ดมีแล้ว แต่ยังไม่ได้ deploy** — `Thunder_Core/src/app/api/core/v1/media/player/jobs/signable-slots.ts`
(commit `ebba675`) อยู่บน branch `feat/layout` เท่านั้น ยังไม่ merge เข้า `develop` ซึ่งเป็น branch ที่ deploy จริง

ผลตอนนี้บน production: zoned payload จะได้ `file.url = null` ทุก asset ตรงกับจุดเสี่ยงที่เอกสารฝั่ง player ระบุไว้เอง
เทส zoned download บน production ยังไม่ผ่านจนกว่าจะ merge

DB layer (`media_job_poll` ที่ emit `zones`) **apply บน production แล้ว** — payload มา แต่ URL ยังไม่ถูก sign

### 1.2 `zones` กับ `slots` mutually exclusive จริงไหม

จริง server ไม่ส่งพร้อมกัน และ zoned response มาจาก Publication เดียวเสมอ
(equal-priority overlap ที่มี Layout ถูกปฏิเสธตั้งแต่ตอน publish — ADR 0044 §8)
player ไม่ต้องมี logic merge หรือ arbitrate ระหว่าง Layout

### 1.3 `publication_snapshot_id` ส่งใน zoned payload เสมอไหม

ใช่ อยู่ระดับ top-level ของ `data` ไม่ใช่ต่อ zone

### 1.4 playback log endpoint accept `publication_snapshot_id` / `snapshot_zone_id` ไหม

accept ทั้งคู่แบบ optional และ **reject ทั้ง batch แบบ transactional** ถ้ามีแถวใดแถวหนึ่งไม่ผ่าน validation
3 ข้อ (zone เป็นของ snapshot / media เป็น item ของ zone / snapshot ถูก target มาที่ device นี้)
ไม่มี partial accept ไม่มีการ null field แล้วเก็บแถวไว้ — retry ส่ง batch เดิมซ้ำได้ไม่เกิด duplicate

เอกสารฝั่ง player เขียนข้อนี้ถูกแล้ว

### 1.5 heartbeat production มี `data.profile_required` แล้วหรือยัง

**ยัง** — ticket 18 apply บน `develop` เท่านั้น production ยังไม่ apply (เป็น R0 ต้องขออนุมัติแยก)
contract ของ field นี้ final แล้ว build ตามได้เลย แต่จะยังได้ค่าเฉพาะตอนยิงเข้า develop

ย้ำ shape: flag อยู่ที่ `data.profile_required` ไม่ใช่ top-level

### 1.6 device-profile accept `capabilities` ใน production แล้วหรือยัง

**รับแล้ว** (apply production 2026-08-27) เก็บลง `assets.player_capabilities`

แต่ **store อย่างเดียว ไม่ enforce** (ADR 0054) — ไม่ส่ง / ส่งไม่ครบ / เป็น NULL ไม่ block publish อะไรทั้งสิ้น
ทุก device ยังได้ zoned payload เหมือนเดิม ส่งค่า hardcode ต่อ build ตามที่เอกสารเสนอมาถูกแล้ว
ไม่ต้อง probe runtime

ตอนเปิด enforce ในอนาคต `max_video_zones` จะถูกเทียบกับ **จำนวน zone ที่มี item ชนิด video อย่างน้อย 1 อัน**
ไม่ใช่จำนวน video item (เพราะแต่ละ zone loop อิสระ จึงเล่นพร้อมกันได้หมด)

## 2. รายละเอียด contract ที่เอกสารฝั่ง player ตกไป

### 2.1 `playback` มาจาก zone ไม่ใช่จาก Publication

`playback` (`play_mode` / `repeat` / `start_from`, ADR 0031) ถูก stamp ต่อ slot เหมือนเดิม
แต่ **ค่ามาจาก zone ที่ slot นั้นสังกัด** (ADR 0045 §2)

แปลว่าใน Layout เดียวกัน zone หลัก loop ได้ ขณะที่ ticker ข้างล่าง play-once
scheduler ต่อ zone ต้องอ่านค่านี้จาก slot จริง ห้ามสมมติว่าทั้งจอใช้ mode เดียวกัน

### 2.2 guarantee ที่ยังไม่ได้ list

- `x + width <= 100` และ `y + height <= 100`
- ทุก zone มีอย่างน้อย 1 slot — server ไม่ส่ง zone เปล่า
- zoned response มาจาก Publication เดียวเสมอ (ข้อ 1.2)
- geometry เป็น percent เทียบ display area และคง percent ไว้ไม่ว่าจอกว้างแค่ไหน
  เครื่องเดียวกางหลายจอผ่าน `SpanAllDisplays` ได้ (`screen_width` ที่ report จะตามไปด้วย)
  แต่หลายเครื่องเล่นภาพเดียวกันแบบ sync ยัง out of scope

### 2.3 `snapshot_zone_id` ไม่ใช่ zone id ของ Layout

ตั้งใจส่ง id ของ snapshot ไม่ใช่ของ Layout เพราะ Layout แก้ได้หลัง publish
zone id ของ Layout จึง map ไปได้หลาย geometry ตามเวลา ระบุไม่ได้ว่าจริงๆ แล้วออกอากาศแบบไหน

**zone id ของ Layout ไม่เคยถูกส่งให้ player** อย่า cache map ที่ผูกกับ layout zone
`snapshot_zone_id` stable ตลอดอายุ snapshot นั้น echo กลับมาดิบๆ ใน playback log

### 2.4 snapshot เก่าไม่หมดอายุ

player ที่ offline คร่อม republish upload log ย้อนหลังกับ snapshot ที่ตัวเองเล่นจริงได้
**ระบบรับ ไม่ว่า snapshot จะเก่าแค่ไหน** — offline queue ไม่ต้องทิ้ง log เก่า
ขอแค่เก็บ `publication_snapshot_id` / `snapshot_zone_id` ที่เล่นจริงไว้คู่กับ session ตามที่เอกสารเขียนไว้แล้ว

## 3. ผลต่อแผนที่ฝั่ง player เสนอมา

Phase 1 (contract compatibility) ทำได้เลยทั้งหมด parse / model / capabilities ไม่ต้องรอ server

แต่ **verify บน production จะยังไม่เห็นผล 2 อย่าง** จนกว่าฝั่ง server จะเดินต่อ:

| ของที่เทสไม่ได้บน production ตอนนี้ | ติดอะไร |
|---|---|
| `file.url` ของ media ใน zoned payload | route signing ยังไม่ merge เข้า `develop` (ข้อ 1.1) |
| `data.profile_required` ใน heartbeat | ยังไม่ apply production เป็น R0 (ข้อ 1.5) |

ระหว่างนี้เทสสองอย่างนี้บน develop ได้ ส่วน `capabilities` ยิง production ได้เลย

ลำดับ priority 8 ข้อที่เสนอมาไม่ต้องแก้ — ข้อ 1-2 (parse `zones[]` + cache จาก `zones[].slots`)
คือของที่ block ทุกอย่างจริงตามที่วิเคราะห์มา
