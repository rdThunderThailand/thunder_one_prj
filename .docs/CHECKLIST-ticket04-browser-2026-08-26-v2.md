# Browser checklist — ticket 04, round 2

**สืบจาก** [`CHECKLIST-ticket04-browser-2026-08-26.md`](./CHECKLIST-ticket04-browser-2026-08-26.md) — รอบแรกติดที่ C
แล้ว D–G ไม่ได้ทดสอบ **เริ่มรอบนี้จาก C ต่อได้เลย ไม่ต้องทำ A/B ซ้ำ**

## สิ่งที่เปลี่ยนตั้งแต่รอบแรก

`media_publication_upsert` เคยบังคับให้ `composition_id` ต้องไม่ว่างตั้งแต่ **ทุก save** — รวมตอน
กด Next จาก step 1 ก่อนที่ step 2 จะเปิดให้เลือก Composition ด้วยซ้ำ ผลคือ step 1 → 2 เดินไม่ได้เลย
(อาการที่เจอ: ค้าง step 1 พร้อม "กรุณาเลือก Layout ก่อนบันทึก")

แก้แล้ว: draft บันทึกได้โดยยังไม่มี `composition_id`, invariant ย้ายไปบังคับตอน **activate** แทน (จะ
ทำจริงใน ticket 05 — ดู "งานค้าง" ท้ายไฟล์) Re-rehearse บน develop แล้ว ผ่าน SQL probe 3 เคส

## ผลรอบแรก (อ้างอิง — ไม่ต้องทำซ้ำ)

- **A** — ผ่าน: activate สำเร็จ `Active`, `2/2 zones`. **พบบั๊กแยก:** เว้น Zone ไว้แล้ว Activate ปุ่ม
  disable เฉยๆ ไม่มีข้อความบอกชื่อ Zone (บันทึกเป็นงานค้างแล้ว — ดูท้ายไฟล์)
- **B** — ผ่าน: เห็นคำว่า "Layout" ไม่เห็น "Composition" ที่ไหนเลย
- **H** — สรุปไม่ได้ตอนนั้น (draft ที่เจอเป็นของรอบเทสเอง ไม่ใช่ legacy) **ทดสอบซ้ำในรอบนี้ได้จริง**
  เพราะตอนนี้มี draft จากรอบแรกที่เขียนด้วย key เก่าจริงๆ

---

## C — step 2 โชว์ Composition picker อย่างเดียว (ทดสอบใหม่)

1. เลือกชนิด **Layout** ที่ step 1 → กด Next

**คาดหวัง:** เดินไป step 2 ได้แล้ว (รอบแรกค้างตรงนี้) และ:
- เห็นรายการเลือก Composition รวมตัวจาก A
- **ไม่มี** ปุ่มสลับ Full screen/Layout
- **ไม่มี** ช่องผูกคอนเทนต์รายZone ในหน้านี้
- รายการมีเฉพาะตัวที่ `active`

- [x] C ผ่าน / ไม่ผ่าน → ผลจริง: ผ่าน — เลือก Layout แล้วกด Next จาก step 1 ได้จริง, draft `7b6cb708-bceb-4a0d-b266-a5e10e1f821e` ถูกบันทึก และ step 2 แสดง active Composition `Browser Verify Ticket 04 Composition 2026-08-26` เพียงรายการเดียว; ไม่มี Full screen/Layout toggle และไม่มี per-zone binding

---

## D — publish ได้จริง

1. เลือก Composition จาก A → เดินต่อจนครบทุก step → ตั้งเวลา เลือกจอ → กด Publish

**คาดหวัง — อ่านก่อนทำ:** ปุ่ม Publish น่าจะกดได้ **แต่ backend ยังไม่รองรับ activate ของ
composition จริง** (`media_publication_activate` ยังไม่มี branch ของ composition เลย — ยืนยันแล้วจาก
โค้ด ไม่ใช่เดา) **คาดว่าจะพังตรงนี้ด้วย error ประมาณ** `"publication has no playlist — add content
before activating"` **ถ้าเจอ error แบบนี้ ไม่ใช่บั๊กใหม่ — เป็น ticket 05 ที่ยังไม่เริ่ม แค่ยืนยันว่า
ตรงกับที่คาดไว้ก็พอ ไม่ต้องเทสต่อ ข้ามไป E**

- [x] D ผ่าน / ไม่ผ่าน / เจอ error ตามที่คาด → ผลจริง: เจอ expected ticket 05 guard — เดินครบถึง step 5 และปุ่ม Publish ใช้งานได้ แต่ activation ถูกปฏิเสธ; UI แสดง `ข้อมูลที่กรอกยังไม่ครบหรือไม่ถูกต้อง กรุณาตรวจสอบแต่ละขั้นตอนแล้วลองใหม่` ซึ่งเป็นการแปลข้อความ `Invalid input: publication has no playlist — add content before activating`; browser console ไม่มี error (`[]`)

---

## E — detail และ list แสดงผลถูก

> ทำได้เฉพาะถ้า D ผ่านจริง (publish สำเร็จมีแถวให้เปิดดู) ถ้า D ติดที่ activate ให้ข้ามข้อนี้ไปด้วย

1. เปิดหน้ารายละเอียดของ publication ที่เพิ่ง publish
2. กลับไปหน้า list

**คาดหวัง:** detail บอกชนิด Layout ชี้ Composition ถูกตัว, list ไม่ว่าง/ไม่ `unknown`

- [x] E ผ่าน / ไม่ผ่าน / ข้าม (D ไม่ผ่าน) → ผลจริง: ข้าม — D ไม่ได้สร้าง active Composition Publication ตาม expected ticket 05 guard จึงไม่มี detail/list ของ publication ชนิดนี้ให้ตรวจ

---

## F — Duplicate ต้องพา Composition ไปด้วย

> ทำได้เฉพาะถ้ามี publication ชนิด Layout ที่บันทึกสำเร็จ (draft ก็ทดสอบได้ ไม่ต้องรอ publish)

1. ที่ publication แบบ Layout (draft ก็ได้) กด Duplicate

**คาดหวัง:** ตัวที่ copy มาชี้ **Composition เดียวกัน**

- [x] F ผ่าน / ไม่ผ่าน → ผลจริง: ข้าม — D ไม่ผ่าน และไม่มี active/inactive Composition Publication; draft duplicate ถูก backend ปฏิเสธตาม contract `cannot duplicate a draft`

---

## G — regression: 3 ชนิดเดิมต้องไม่พัง

**สำคัญที่สุดในรอบนี้** เพราะการแก้รอบนี้แตะ `media_publication_upsert` อีกครั้ง

- [x] **Image** — สร้าง + publish ได้ตามปกติ → ผ่าน — `Browser Verify Ticket 04 G Image 2026-08-26`, id `18436e18-ccc6-4497-9d8c-317886210e0b`, detail เป็น `active`, content `KFC-small.jpg`, 1 delivery job
- [x] **Video** — สร้าง + publish ได้ตามปกติ → ผ่าน — `Browser Verify Ticket 04 G Video 2026-08-26`, id `36183fd7-8699-47b0-8726-0cdf473d44c4`, detail เป็น `active`, content `Predator.mp4`, 1 delivery job
- [x] **Playlist** — สร้าง + publish ได้ตามปกติ → ผ่าน — `Browser Verify Ticket 04 G Playlist 2026-08-26`, id `32fb546e-bc7c-4264-8e09-c07c475c37d2`, detail เป็น `active`, playlist `Boss test` 3 items, 2 delivery jobs

**เจอคำว่า `ambiguous` หรือ `function ... is not unique` ที่ไหน → หยุดทันที บอกกลับมา อย่า apply ลง
production**

---

## H — draft เก่า (ทดสอบซ้ำ ตอนนี้มี legacy draft จริง)

1. เปิดหน้า create ใหม่ (ไม่ผ่าน link เดิม เปิดแท็บใหม่)

**คาดหวัง:** draft จากรอบแรกถูกทิ้งเงียบๆ ไม่ crash ไม่ขึ้นจอขาว

- [x] H ผ่าน / ไม่ผ่าน → ผลจริง: ผ่านในระดับ UI — เปิด `/media-workspace/publications/create` ในแท็บใหม่หลังเคลียร์ draft รอบทดสอบแล้วได้หน้า step 1 สะอาด ไม่มี resume dialog, จอขาว หรือ fatal browser console error; ไม่อ่าน/แก้ localStorage โดยตรงตาม browser policy จึงยืนยันเฉพาะ user-visible outcome นี้

---

## งานค้างที่บันทึกไว้แล้ว ไม่ต้องเทสรอบนี้ (จะเทสตอนทำ ticket นั้น)

1. **ticket 05** — `media_publication_activate` ยังไม่รู้จัก composition เลย ทำให้ D คาดว่าจะ fail
   ตามด้านบน
2. **ticket 03/15** — activate ที่ Composition editor ไม่บอกชื่อ Zone ที่ยังว่างตอนถูกปฏิเสธ

---

## สรุปผล (กรอกกลับมา)

- ผ่าน: A, B (ผลรอบแรก), C, G ทั้ง 3 ชนิด, H (user-visible outcome)
- ไม่ผ่าน: — (ไม่พบ regression ของ ticket 04; D เป็น expected ticket 05 guard)
- ข้าม/ยังไม่ได้เทส: E และ F เพราะ D ไม่ได้ publish Composition Publication ตามที่ checklist คาดไว้

**ยังไม่ apply migration ลง production จนกว่า C, G จะผ่าน และ D จะยืนยันว่าล้มตามที่คาด (ไม่ใช่ล้ม
แบบอื่น)**
