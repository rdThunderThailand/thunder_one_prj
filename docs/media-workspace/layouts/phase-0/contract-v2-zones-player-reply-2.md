# ตอบกลับรอบสอง — แก้ 1 จุดใน BACKEND_REPLY_SUMMARY

ต่อจาก `contract-v2-zones-player-reply.md` · อ่านสรุปฝั่ง player
(`PLAYER_CONTRACT_V2_ZONES_BACKEND_REPLY_SUMMARY.md`) แล้ว **ถูกทุกข้อ ไม่ต้องรื้อแผน**
เหลือจุดเดียวที่ต้องแก้ก่อนลงมือ และอีก 2 ข้อที่หล่นหายตอนย่อ

## 1. แก้: "test zoned download กับ develop ได้" — ตอนนี้ยังไม่จริง

สรุปข้อ 1 เขียนว่า *"ต้อง test กับ develop หรือรอ backend merge/deploy route signing"*
**ตัวเลือกแรกใช้ไม่ได้ ณ ตอนนี้**

branch `develop` ที่ deploy อยู่ยังเดิน `result.slots` อย่างเดียว
(`src/app/api/core/v1/media/player/jobs/route.ts:33`) — ฟังก์ชัน `signableSlots` ที่เดิน
`zones[].slots` อยู่บน `feat/layout` เท่านั้น

ผล: **ทั้ง production และ develop ให้ `file.url = null` ในzoned payload เหมือนกัน** ไม่มี environment
ไหนเทส zoned download ได้จนกว่า PR จะ merge

- PR ที่รออยู่: `Thunder_Core#41` (Draft) — https://github.com/rdThunderThailand/Thunder_Core/pull/41
- คู่กัน frontend: `thunder_one_prj#18` (Draft)

**คำแนะนำระหว่างรอ:** ทำ parser / download plan / cache cleanup ด้วย **fixture JSON** ไปก่อน
อย่าให้ทีมรอ environment — logic ทั้งหมดใน priority ข้อ 1-2 เทสได้โดยไม่ต้องยิง server จริง

## 2. ยืนยัน: อีกสองข้อในตาราง "verify บน production ไม่ได้" ถูกแล้ว

- **`profile_required` เทสกับ develop ได้จริงตั้งแต่ตอนนี้** — flag มาจาก RPC `media_heartbeat`
  ที่ apply ลง DB develop แล้ว และ route แค่ห่อผลลัพธ์เป็น `{ success, data }` ส่งผ่านตรงๆ
  ไม่ต้องรอ merge อะไร (ต่างจากข้อ 1 ที่ติดโค้ด TypeScript)
- **`capabilities` ยิง production ได้เลย** — apply แล้ว 2026-08-27 store อย่างเดียว ไม่ enforce

## 3. สองข้อที่หล่นหายตอนย่อ

อยู่ในเอกสาร impact ฉบับแรกอยู่แล้ว แต่ไม่ได้ถูกยกมาในฉบับย่อ — ถ้าทีมอ่านแค่ฉบับย่อจะพลาด

1. **`loop_anchor_at` เป็น top-level ตัวเดียว ใช้ร่วมกันทุก zone**
   ที่แยกต่อ zone คือ `loop_duration_seconds` เท่านั้น

   ```
   phase = (server_now − loop_anchor_at) mod zone.loop_duration_seconds
   ```

   ถ้าเผลอเก็บ anchor แยกต่อ zone แต่ละ zone จะ drift ออกจากกันเอง

2. **zone มากสุด 4 zone ต่อ payload** — กำหนดขนาด container pool ตายตัวได้เลย ไม่ต้องโตแบบ dynamic

## สรุปสั้น

| เรื่อง | เริ่มได้เมื่อไหร่ |
|---|---|
| parse `zones[]` + cache plan | **ทันที** (ใช้ fixture) |
| device profile `capabilities` | **ทันที** ยิง production ได้ |
| heartbeat `profile_required` | **ทันที** verify กับ develop ได้ |
| zoned media download จริง | **รอ `Thunder_Core#41` merge + develop deploy** |

ลำดับ priority 8 ข้อไม่ต้องแก้
