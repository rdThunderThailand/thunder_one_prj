# Context — Thunder One (Communication OS / DOOH publishing)

ภาษากลางของโดเมนนี้ ตัดสินในเซสชัน grill 2026-07-23 (mockup "Create Publication" รอบ 1 และรอบ 2)

## กติกาศัพท์

**UI พูดตาม mockup / โค้ด·API·DB พูดตาม repo** — ห้ามให้คำของ UI รั่วเข้าโค้ด และห้าม rename ของ backend ตาม UI

| ผู้ใช้เห็น (UI) | โค้ด / API / DB | หมายเหตุ |
| --- | --- | --- |
| Content & Assets | `video` (`media_core.media_assets`) | **ห้าม**ใช้คำว่า `asset` เดี่ยว ๆ ในโค้ดฝั่งนี้ |
| Screen / Device | `screen` (`public.assets`) | Thunder_Core เรียกอุปกรณ์กายภาพว่า asset — คนละความหมายกับ UI |
| Media Workspace | `tenant` (`public.tenants`) | คำเดียวกัน คนละที่พูด |
| Channel | `channel` (`media_core.channels`) | ความหมายเปลี่ยนในรอบ 2 — ดูด้านล่าง |

## ศัพท์

**Video** — ไฟล์สื่อ 1 ชิ้นที่อัปโหลดแล้ว เป็นได้ทั้ง `kind = video` หรือ `kind = image` ไม่ใช่ playlist ไม่ใช่จอ

**Screen / Device** — จอ 1 ตัว = `public.assets` ที่มี `device_credentials` แล้ว จอที่ยังไม่ provision credential ไม่นับ (ไม่โผล่ใน `GET /media/screens`)

**Channel** — *ช่องทางเผยแพร่* หนึ่งช่อง มี **ชนิด** (`dooh`, `in_store`, `website`, `social`, `email`, `mobile_app`) — ไม่ใช่ "กลุ่มจอ" อีกต่อไป
ชนิดที่มีจอรองรับ (`dooh`, `in_store`) ผูกกับ screen ผ่าน `channel_devices` — **Phase 1 publish ได้เฉพาะสองชนิดนี้** ชนิดอื่นสร้างและเห็นใน UI ได้แต่เลือกตอน publish ไม่ได้
channel หนึ่งช่องมีได้ตั้งแต่จอเดียว ("Central World - LED Screen 1") ไปจนถึงทั้งเครือ ("KFC Drive Thru Screens / All branches")

**Playlist** — ลำดับของ video พร้อม duration ต่อชิ้น มี 2 ชนิด: `user` (ผู้ใช้สร้างเอง) กับ `single` (ระบบสร้างซ่อนให้ publication ที่มีชิ้นเดียว — ไม่โผล่ในหน้า Playlists)

**Publication** — "เอาอะไรขึ้นช่องทางไหน ช่วงเวลาไหน" หนึ่งฉบับ lifecycle `draft → active → expired | cancelled` — **draft ยังไม่ส่งอะไรถึงจอ** · ต้องสังกัด campaign เสมอ

**Publication Type** — `image | video | playlist | html | dynamic` เก็บไว้เป็น **เจตนา**ของผู้สร้าง ใช้ filter/report/แสดงผล **ไม่บังคับ**ชนิดไฟล์ที่เลือกจริง — เลือก type `image` แล้วหยิบไฟล์ .mp4 ได้ ระบบสลับ type ให้เอง

**Campaign** — กลุ่มของ publication ภายใต้แคมเปญโฆษณาเดียวกัน **บังคับ** ทุก publication ต้องมี

**Brand** — เจ้าของแบรนด์/ผู้ลงโฆษณา เป็นเจ้าของ campaign — publication **ไม่เก็บ brand ตรง ๆ** UI แสดง brand โดย derive ผ่าน campaign

**Approval status** — สถานะการอนุมัติของ video (`draft | pending | approved | rejected`) แยกจาก `status` ที่เป็นสถานะ*ไฟล์* (`processing | ready | failed`) — **publish ได้เฉพาะ video ที่ approved** อนุมัติด้วยคนกดปุ่ม ยังไม่บังคับ role

**Version** — ไฟล์ของ video แก้ได้โดยสร้างเวอร์ชันใหม่ ไม่ทับของเดิม **publication ปักเวอร์ชันที่ใช้ไว้ตอน activate** — อัปเวอร์ชันใหม่แล้วจอยังเล่นของเก่าจนกว่าจะ republish

**Loop** — สิ่งที่จอเล่นจริง: timeline เดียวที่ต่อชิ้นจากทุก publication ที่อยู่ในหน้าต่างเวลา ณ ขณะนั้นเข้าด้วยกัน วนซ้ำเมื่อจบรอบ ประกอบด้วย `slots[]` เรียงตาม `start_offset_seconds` — server คำนวณให้ครบทุกครั้งที่ poll (ดู Slot, Loop duration) `priority` เป็น**น้ำหนักส่วนแบ่งจำนวน slot ใน loop** ไม่ใช่ตัวตัดสินแพ้ชนะ · "ทุก 30 นาที / 48 ครั้งต่อวัน" เป็นค่า**ประมาณที่คำนวณจาก loop duration** เปลี่ยนไปตามเนื้อหาอื่นบนจอ ไม่ใช่ค่าที่ระบบรับประกัน ดู ADR 0004

**Slot** — หนึ่งช่วงเวลาใน loop ที่มีเนื้อหา 1 ชิ้นเล่น มี `start_offset_seconds` (นับจากต้น loop), `duration_seconds`, ผูกกับ `publication_id` และ `media_asset_id` หนึ่งชิ้น เรียงต่อกันไม่เหลื่อม Phase 1 generate ต่อกันรวดตามลำดับ publication ที่ in-window Phase 2 (slot allocator จริง) ค่อยกระจายตามความถี่ที่ขาย

**Loop duration** (`loop_duration_seconds`) — ความยาวรวมของหนึ่งรอบ loop นิยามเป็น**ผลรวม `duration_seconds` ของทุกชิ้นในรอบ** (ไม่ใช่ค่าคงที่ต่อจอ) เปลี่ยนทุกครั้งที่มี publication อื่นเข้า/ออกจากจอเดียวกัน

**Dwell** — เวลาที่ image ค้างบนจอ (วินาที) image ต้องมีค่านี้เสมอ วิดีโอไม่ต้อง (ใช้ความยาวไฟล์)

**Publish job** — คิวงานที่เกิดตอน publication เปลี่ยนเป็น active หนึ่ง job มีหลาย target (จอละ 1 แถว) สถานะ `pending → downloading → playing | failed`

**Channel status** — สถานะจอ 3 ระดับ derive จาก heartbeat lag: `< 2 นาที = online` · `2–5 นาที = warning` · `> 5 นาที = offline` — warning ยังนับว่ายิงได้ แต่ขึ้นเตือนตอน review ⚠️ *ยังไม่เคาะ*

## สิ่งที่ระบบนี้จงใจไม่ทำ (Phase 1)

transcode / แปลง codec · MQTT push (ใช้ poll 60 วิ) · token hashing · screenshots และ Device Preview รายเครื่อง · layouts & zones (Grid / Custom) · HTML/Web และ Dynamic Data · Format & Template / Text & Caption / Call to Action / Localization · My Assets / Favorites / Recently Used · AI Assistant และ Asset Recommendations · Publish Order และ delay ระหว่าง channel · publish ไปช่องทางที่ไม่มีจอ (social / website / email / mobile app)

## ADR

- [0001 — Single Content เก็บเป็น implicit playlist](.docs/adr/0001-single-content-as-implicit-playlist.md)
- [0002 — หน้าต่างเวลาและการหมดอายุ](.docs/adr/0002-publication-precedence-and-schedule-window.md) *(superseded ทั้งฉบับโดย 0004)*
- [0003 — ตัวตนผู้ใช้ส่งมากับ app key](.docs/adr/0003-actor-identity-for-media-writes.md)
- [0004 — จอเล่น timeline ที่ server คำนวณ](.docs/adr/0004-loop-playback-model.md)
- [0005 — Publication ปักเวอร์ชันของไฟล์](.docs/adr/0005-pin-asset-version-at-publish.md)

ส่วนต่างของ schema ที่ต้องทำใน Repo A: [.docs/media_redesign_db_delta.md](.docs/media_redesign_db_delta.md)
