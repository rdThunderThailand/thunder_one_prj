# ตอบกลับ: Windows Player Auto Update ผ่าน Realtime

ถึงทีม Player · 17 พฤศจิกายน 2026 · ตอบเอกสาร "Windows Player Auto Update ผ่าน Realtime"

Backend จะส่ง event ตามที่ขอ โดยใช้ช่องเดียวกับ `poll_now` มีจุดที่ต่างจากเอกสาร 3 ข้อ

## สิ่งที่ Backend ส่ง

| ค่า | ค่า |
|---|---|
| Channel | `player:<device_id>` (`device_id` ตัวเดียวกับที่ได้จาก `/jobs`) |
| Broadcast event | `player_update_available` |
| Payload | `{"id": "<uuid>"}` |
| ช่อง | public broadcast, Supabase project เดียวกับ `poll_now` |

## จุดที่ต่างจากเอกสาร

1. **ส่งตอนตั้ง version ให้กลุ่ม ไม่ใช่ตอน Approve** การ Approve ยังไม่ทำให้ `/update-check` เสนอ release ให้เครื่องไหน Backend จึงส่ง event ใน 3 จังหวะนี้
   - เมื่อตั้ง version ให้ Update group (เดิมชื่อ Test group) เป็น release ใหม่
   - เมื่อกด Resume updates
   - เมื่อเพิ่มเครื่องเข้ากลุ่มขณะที่กลุ่มมี version และไม่ได้ pause (ส่งให้เฉพาะเครื่องที่เพิ่ม)

   Pause, Withdraw และการล้าง version จะไม่ส่ง event
2. **payload ไม่ได้ว่าง** Supabase เติม `id` ให้ทุกข้อความ เหมือนที่ `poll_now` ได้อยู่แล้ว ขอให้ Player ไม่สนใจ field ใน payload
3. **ส่งให้ทุกเครื่องใน Update group โดยไม่กรอง** เครื่องที่ยังไม่รองรับหรือไม่ใช่ `windows-x64` จะได้ event ไปด้วย แต่ `/update-check` ยังเป็นตัวตัดสินเหมือนเดิม ring `production` ไม่ได้รับ event

ถ้าส่งไม่สำเร็จ การตั้ง version ยังสำเร็จตามปกติ และเครื่องจะเจอ release ในรอบ `check_interval_seconds`

## ทดสอบบน Dev

Backend พร้อมให้เทสบน develop แล้ว ตัวส่ง event อยู่บน develop ตั้งแต่ 16 พ.ย. 2026 และเช็คแล้วว่าตอนตั้ง version ให้กลุ่ม ข้อความ `player_update_available` ถูกสร้างจริงครบ 1 ข้อความต่อเครื่องในกลุ่ม ที่ยังไม่ได้ทดสอบคือการรับ event บนเครื่องจริง ซึ่งต้องใช้ Player 1.0.10

ก่อนหน้านี้ Realtime บน develop ส่งข้อความไม่ออกมาตั้งแต่ปลายเดือนตุลาคม รวมถึง `poll_now` ด้วย ตอนนี้แก้แล้ว ถ้าช่วงนั้นเครื่องบน develop ไม่ตอบ `poll_now` สาเหตุมาจากฝั่ง Backend ไม่ใช่ Player

ขั้นตอนที่เสนอ (บน develop ก่อน)
1. อัปโหลด `1.0.10` และ `1.0.11`
2. ตั้ง `1.0.10` เป็น version ของกลุ่ม Screen 01 (`1.0.9`) จะอัปเดตเองตามรอบปกติ
3. ตั้ง `1.0.11` แล้วเก็บเวลาที่ตั้ง version, เวลาที่ส่ง event และเวลาที่เห็น `/update-check`
4. กรณีเครื่องนอกกลุ่ม Backend จะเช็คจากข้อความที่ส่งออกจริงว่ามีเฉพาะเครื่องในกลุ่ม

เรื่องการเก็บเวลา: Backend ดูเวลาตั้ง version ได้จาก audit และเวลาส่ง event ได้จากข้อความที่ส่งออก แต่ตาราง
`/update-check` เก็บไว้แค่ครั้งล่าสุดต่อเครื่อง จึงต้องดึงทันทีหลังเครื่อง check รอบแรก ถ้าฝั่ง Player เก็บ log
เวลาที่ได้รับ event และเวลาที่ยิง `/update-check` ไว้ด้วย จะเทียบได้แน่นอนกว่า

## สถานะบน Production

ขึ้น production แล้วเมื่อ 17 พ.ย. 2026 (Core v0.25.0 และ ThunderOne v0.21.0) ทั้งตัวส่ง event, หน้า Update group และ Rollout แต่ยังไม่มีเครื่องไหนได้อัปเดตอัตโนมัติ เพราะ

- Update group บน production ยังว่าง ยังไม่มี release และยังไม่ได้ตั้ง version จึงยังไม่มี event ถูกส่ง
- แต่ละเครื่องต้องลง build ที่เป็น checksum-only (`1.0.5` ขึ้นไป) ด้วยมือก่อน แล้วค่อยเพิ่มเข้ากลุ่ม เครื่องที่เป็น `1.0.4` (9 เครื่อง) ThunderOne จะไม่ยอมให้เพิ่ม
- ring `production` ยังปิดอยู่ เครื่องที่อยู่นอก Update group จะไม่ได้รับ release และไม่ได้รับ event

แผนคือเทสบน develop ให้ผ่านก่อน แล้วเลือกเครื่อง production 1–2 เครื่องลง build ด้วยมือ เพิ่มเข้า Update group แล้วตั้ง version เป็นรอบแรก

## สิ่งที่ขอจากทีม Player

1. อัปโหลด `1.0.10` และ `1.0.11` แล้วแจ้ง Backend เพื่อนัดเวลาเทสร่วมกัน
2. ยืนยันว่า Player ไม่สนใจ field ใน payload ของ `player_update_available` (เช่น `id`)
3. ส่ง log ฝั่ง Player ของรอบเทส (เวลาได้รับ event และเวลาที่ยิง `/update-check`)
