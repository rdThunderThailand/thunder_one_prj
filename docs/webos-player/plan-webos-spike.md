# Spike — webOS Signage player บน LG 43UH5Q-E

**สถานะ:** ยังไม่เริ่ม · **timebox:** 2 วันทำงาน · **ร่าง:** 2026-11-10

## ทำไมต้อง spike ก่อน ADR

เราตัดสินใจทำ player ตัวที่สามบน LG webOS Signage เพื่อให้ Thunder One เล่นบนจอได้เลยโดยไม่ต้องมีกล่องเสริม
แต่มีคำถามหลายข้อที่ตอบได้บนจอจริงเท่านั้น ถ้าเขียน ADR ก่อนแล้วผล spike ออกมาค้าน ก็ต้องรื้อ ADR

**สิ่งที่ตกลงกันแล้ว (grilling 2026-11-10):**

| # | เรื่อง | ข้อสรุป |
|---|---|---|
| Q1 | รูปแบบการส่งแอป | packaged `.ipk` ที่ติดตั้งลงเครื่อง ถ้าข้อ S4 ไม่ผ่านให้ถอยไปใช้ hybrid shell |
| Q2 | คนทำ | ทีมเรา (One/Core) |
| Q3 | จอเป้าหมาย | LG ก่อน · เครื่องเทส 43UH5Q-E (webOS 8.0) |
| Q4 | ขอบเขต v1 | MVP: poll `/jobs` + zone เดียว + playlist + heartbeat + playback log แล้วให้ capability gate (ADR 0054) กันฟีเจอร์ที่ยังไม่รองรับ |
| Q6 | โค้ด | repo ใหม่ `signage/thunder-webos-player` · TypeScript + Vite · ไม่ใช้ React |
| Q7 | การอัปเดต | ใช้ Update Ring ของ Core ADR 0028 โดยเพิ่ม track `webos-signage` ถ้าข้อ S4 ไม่ผ่านให้ใช้ hybrid |
| Q8 | การติดตั้งครั้งแรก | ตั้ง SI Server ให้ชี้ไปที่ `.ipk` ใน public bucket · ใช้ USB ตอนเทส |

## ต้องเตรียมก่อนเริ่ม

- [ ] สมัคร **LG webOS Signage developer account** เพื่อเปิดอ่านเอกสาร SDK (เจ้าของบัญชีต้องสมัครเอง)
- [ ] ติดตั้ง webOS CLI (`ares-package`, `ares-install`, `ares-inspect`) บนเครื่อง dev
- [ ] วางจอเทสกับเครื่อง dev ไว้ใน LAN เดียวกัน
- [ ] เตรียมไฟล์ทดสอบ 4 ไฟล์ ได้แก่ H.264 1080p30, H.264 4K30, HEVC 4K30 และ JPEG 4K หนึ่งรูป
- [ ] เตรียม device token ของเครื่องเทสบน prod tenant `thunder_qa` ห้ามเขียน token ลงในไฟล์นี้หรือ commit

## สิ่งที่ต้องตอบให้ได้

แต่ละข้อจบด้วย ✅ / ❌ / ⚠️ พร้อมหลักฐาน (screenshot, log หรือค่าที่วัดได้)

| # | คำถาม | วิธีทดสอบ | ผ่านเมื่อ | ข้อนี้ใช้ตัดสินอะไร |
|---|---|---|---|---|
| S1 | ติดตั้งผ่าน SI Server แล้วแอปเปิดเองตอนบูตหรือไม่ | แพ็กแอป hello-world ด้วย `ares-package` เปิด server ใน LAN (`python3 -m http.server`) ตั้ง SI Server ไปที่ URL นั้น เลือก Launch Mode = Local, Type = IPK แล้วถอดปลั๊กจอและเสียบใหม่ | แอปขึ้นเองหลังบูต โดยไม่ต้องกดรีโมต | ใช้ Q8 ได้จริง |
| S2 | ดาวน์โหลดวิดีโอมาเก็บในเครื่องแล้วเล่นแบบออฟไลน์ได้หรือไม่ | ใช้ storage API ใน SDK ดาวน์โหลดไฟล์ทดสอบทั้ง 4 ไฟล์ แล้วถอดสาย LAN และปิด Wi-Fi ก่อนสั่งเล่น | เล่นได้หลังรีบูตทั้งที่ยังไม่มีเน็ต และจดไว้ว่าเก็บไฟล์ได้สูงสุดกี่ GB | ใช้ cache ในเครื่องได้จริง · รู้ว่ามี codec ไหนให้รายงานใน `/device-profile` |
| S3 | `fetch` ไปที่ Core ได้หรือไม่ และ origin ของแอปคืออะไร | เรียก `GET https://thundercore.vercel.app/api/core/v1/media/player/server-time` โดยแนบ `Authorization: Bearer <token>` (header นี้ทำให้ browser ยิง preflight) แล้ว log `location.origin` | ได้ 200 ทั้ง preflight และ request จริง | ต้องแก้ CORS ใน `Thunder_Core/next.config.ts` หรือไม่ (ดูหมายเหตุ) |
| S4 | แอปสั่งอัปเกรดตัวเองได้หรือไม่ | หา API สำหรับ upgrade หรือ install ในเอกสาร SDK แล้วสั่งติดตั้ง `.ipk` เวอร์ชัน 0.0.2 จาก URL โดยไม่แตะรีโมต | แอปที่เปิดขึ้นมาหลังอัปเกรดเป็นเวอร์ชันใหม่ | ใช้ Q7 ทาง ADR 0028 ได้ ถ้าไม่ได้ให้ถอยไปใช้ hybrid |
| S5 | สลับ `<video>` สองตัวได้ลื่นแค่ไหน | เล่นคลิป 10 วินาที 2 ตัวสลับกันเป็นเวลา 30 นาที | จดว่ามีจอดำตอนสลับกี่ ms และดู memory ก่อนกับหลังผ่าน `ares-inspect` | ข้อมูลประกอบเรื่อง fade (ADR 0094) ใน v2 และสัญญาณแรกของ memory leak |
| S6 | API ควบคุมจอตัวไหนใช้ได้จริงบน webOS 8 | ลองสั่งเปิดปิดจอ ตั้งเวลาเปิดปิด และอ่านข้อมูลเครื่อง (serial, model, firmware) | ทำตารางว่าแต่ละ API ใช้ได้หรือไม่ได้ (PADS4 รายงานว่า Turn Off Display ใช้ไม่ได้บน webOS 8) | อะไรควรใส่ใน v1 และค่าที่จะรายงานใน `/device-profile` |

**หมายเหตุ S3:** ตอนนี้ `next.config.ts` ส่ง `ALLOWED_ORIGINS` ที่เป็น **array** ไปใส่ใน `Access-Control-Allow-Origin`
ซึ่ง header นี้รับค่าได้ทีละ origin เดียว และแอปที่ติดตั้งในเครื่องมักมี origin เป็น `file://` หรือ `null`
คาดว่า S3 จะไม่ผ่านถ้ายังไม่แก้ Core ข้อนี้ยังเป็นการคาดเดา ให้บันทึกผลตามที่เกิดขึ้นจริง

## ไม่อยู่ในขอบเขตของ spike

การลงทะเบียนเครื่องด้วยรีโมต, การ parse `/jobs` และ zoned payload, sync playback, เขียนโค้ดสำหรับ production,
แก้ Core (ถ้า S3 ไม่ผ่านก็แค่บันทึกไว้ และจะแก้ในงานถัดไป) และ Samsung

## ผลลัพธ์ที่ต้องได้

1. `docs/webos-player/spike-results.md` ตาราง S1–S6 พร้อมหลักฐาน และระบุ firmware ของจอให้ชัด
2. โค้ด spike เก็บไว้ใน branch `spike/webos` ของ repo ใหม่ ใช้เป็นข้อมูลอ้างอิงเท่านั้น ห้าม merge
3. หลังจากนั้นค่อยถาม grilling รอบต่อไปเรื่องการลงทะเบียนเครื่อง, CORS และนโยบาย cache แล้วเขียน ADR ของ webOS player

## เงื่อนไขหยุดก่อนครบ timebox

- ถ้า **S1 หรือ S2 ไม่ผ่าน** ให้หยุดทันทีและกลับมาคุยใหม่ เพราะแปลว่าทาง (b) ใช้กับจอนี้ไม่ได้
- ถ้า **S4 ไม่ผ่าน** ให้ทดสอบต่อให้ครบ แต่บันทึกไว้ว่าต้องเปลี่ยน Q7 ไปเป็นแบบ hybrid
