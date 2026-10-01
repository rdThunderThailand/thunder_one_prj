# Checklist — #25 browser verification

Written 2026-09-06. Ticket: `docs/layouts/Phase1/tickets/25-layout-properties-panel.md`
Report back per item: PASS / FAIL + what you actually saw.

## Setup (ต้องครบก่อนเริ่ม ไม่งั้นผลลวง)

- [ ] `Thunder_Core` รันที่ `localhost:3001` บน branch `feat/layoutV2`
      — `.env.local` ของ frontend ชี้ `CORE_API_URL=http://localhost:3001` อยู่แล้ว
      **ถ้าไม่รัน:** `PUT /media/compositions/:id/tags` (ticket 23) จะ 404 เพราะ route ยังไม่ merge
      เข้า `develop` → Tags จะพังทั้งหมด แต่ไม่ใช่บั๊กของ #25
- [ ] `npm run dev` ของ `thunder_one_prj` บน branch `feat/layoutV2`
- [ ] เปิด DevTools ค้างไว้ทั้ง session — Console tab (ต้องไม่มี error แดง) + Network tab
- [ ] ตรวจว่า proxy ชี้ถูกจริง: เปิด `/api/proxy/__config` → ต้องเห็น `localhost:3001`

เส้นทาง: `/media-workspace/layouts` = **Compositions (Layout)** ·
`/media-workspace/layouts/templates` = **Templates**

---

## A. ของ #25 เอง (5 ข้อ)

### A1 — Layout ใหม่จาก picker: badge `Unsaved` และไม่มีการเขียนอะไรเลย

1. ไป `/media-workspace/layouts` → กด **Create** → Template Picker เด้ง
2. **เคลียร์ Network tab ตรงนี้** แล้วค่อยเลือก template สักอัน (หรือ `Create from Scratch`)
3. เอดิเตอร์เปิดขึ้นมา

คาดว่า:
- ใต้ชื่อหน้าอ่านว่า **`Unsaved`** (ไม่ใช่ `Saved just now`, ไม่ใช่ `Last saved …`)
- ใน Network **ไม่มี** request ที่เป็น POST/PUT/PATCH ไปที่ `/media/compositions*` เลย
  (GET ได้ — มันโหลด playlists/layouts มาแสดง)
- ปุ่ม **Open full preview** disabled และ hover แล้วขึ้น tooltip `บันทึก Draft ก่อนเปิด preview เต็มจอ`
- ถ้าเลือก `Create from Scratch`: ปุ่ม **Save draft** disabled, tooltip
  `กรุณาเลือก Template หรือ Start blank`

### A2 — ชื่อเดียว สองช่อง

1. ในเอดิเตอร์อันเดิม พิมพ์ชื่อลงในหัวข้อใหญ่ด้านบน (ช่องที่เป็นตัวหนาใหญ่)
2. ดูช่อง **Layout name** ใน panel ขวา

คาดว่า: เปลี่ยนตามทันทีทุกตัวอักษร ไม่หน่วง ไม่ต้อง blur

3. ทำกลับทาง — พิมพ์ที่ panel ขวา ดูหัวข้อด้านบน

คาดว่า: เปลี่ยนตามเหมือนกัน ทั้งสองทาง cursor ไม่กระโดดไปท้ายช่องระหว่างพิมพ์

### A3 — Folder + Tags persist ข้าม reload

1. Layout เดิมนี้ ตั้งชื่อให้จำได้ เช่น `T25 folder tags`
2. panel ขวา: เลือก **Folder** สักอัน (ไม่เอา `Uncategorized`)
3. **Tags**: พิมพ์ `alpha` Enter, พิมพ์ `beta` Enter → เห็น chip สองอัน
4. เลือก resolution สักอัน (ถ้ายังไม่มี) แล้วกด **Save draft**
5. รอ badge เปลี่ยนเป็น **`Last saved HH:MM`** (ตรงกับเวลาจริง)
6. ใน Network ตรวจลำดับ — ต้องเห็น `set_zones` (หรือ `/zones`) **ก่อน** แล้วค่อย
   `/move` และ `PUT …/tags` ตามหลัง
7. **F5 reload หน้าเดิม**

คาดว่า: Folder ยังเป็นอันเดิม, chip `alpha` `beta` ยังอยู่ครบสอง, ชื่อยังอยู่

8. กลับไป `/media-workspace/layouts` → หา `T25 folder tags` ในลิสต์

คาดว่า: อยู่ใต้ folder ที่เลือก และแสดง tag ทั้งสอง

> ⚠️ ถ้า tags หายหลัง reload แต่ Network ตอน save เป็น 200 → นั่นคือบั๊กที่ ticket กลัวไว้จริง
> (`detail.tags` เป็น `undefined`) รายงานมาพร้อม response body ของ GET composition

### A4 — เปลี่ยน resolution บน Layout ที่ Template ถูกใช้ร่วมหลายอัน → ต้องขัดจังหวะ

หา Layout ที่ Template ถูกใช้ ≥ 2 อันก่อน — เปิด Layout ไหนก็ได้แล้วดูว่ามี
**แถบเหลือง** `This Template is used by N Layouts…` โผล่เหนือ canvas ไหม (N ≥ 2)
ถ้าไม่เจอเลย: สร้าง Layout ใหม่สองอันจาก template ตัวเดียวกันใน picker แล้ว Save draft ทั้งคู่

1. เปิด Layout ที่มีแถบเหลือง จด **ชื่อ Layout พี่น้อง** กับ resolution ปัจจุบันของมันไว้
2. panel ขวา → เปลี่ยน **Resolution** เป็นค่าอื่น

คาดว่า:
- `window.confirm` เด้ง ข้อความ `This Template is used by N Layouts. Changing it affects all of them.`
- กด **Cancel** → resolution **ไม่เปลี่ยน** (dropdown เด้งกลับค่าเดิม)
- เปลี่ยนอีกครั้ง กด **OK** → resolution เปลี่ยน กรอบ canvas เปลี่ยนสัดส่วนตาม
- **Zone ทุกอันยังอยู่ที่เดิมเชิงสัดส่วน** ไม่มีอันไหนหลุดออกนอกกรอบหรือทับกัน
- เปลี่ยน resolution **ครั้งที่สองในหน้าเดิม** → **ไม่ถามซ้ำ** (อนุมัติแล้วทั้ง session)

3. กด **Make this Layout its own copy** ที่แถบเหลือง → confirm อีกอัน
   `This Template is used by N Layouts. Make this Layout its own copy?` → กด OK

คาดว่า:
- แถบเหลือง**หายไป**
- Zone bindings ที่ผูกไว้ยังอยู่ครบ ไม่หลุด
- เปิด Layout พี่น้อง (จากข้อ 1) ในอีกแท็บ → **geometry เดิมไม่ถูกแตะ** resolution ยังเป็นค่าที่จดไว้

### A5 — Layout ที่ geometry เป็นของตัวเอง → ห้ามขัดจังหวะ

1. เปิด Layout ที่**ไม่มี**แถบเหลือง (เช่นอันที่เพิ่ง fork จาก A4)
2. เปลี่ยน **Resolution** และเปลี่ยน **Background**

คาดว่า: ไม่มี confirm เด้งเลยสักครั้ง เปลี่ยนได้ทันที

---

## B. Regression sweep — เพราะ #25 ผ่าไฟล์ 734 → 300 บรรทัด

ทำกับ **Composition เดิมที่มีข้อมูลอยู่แล้ว** ไม่ใช่อันที่เพิ่งสร้าง
เรียงตามลำดับนี้ในหน้าเดียวรวดเดียว

| # | ทำ | คาดว่า |
|---|---|---|
| B1 | เปิด Composition เดิมจาก `/media-workspace/layouts` | canvas วาด zone ครบ, binding เดิมโชว์ครบ, Folder/Tags/Resolution/Background ใน panel ตรงกับที่บันทึกไว้, badge = `Last saved HH:MM` |
| B2 | คลิก zone หนึ่ง → ผูก Playlist ใหม่ | ชื่อ playlist ขึ้นบน zone, thumbnail preview เปลี่ยนตาม |
| B3 | **Split Zone** บน zone นั้น | ได้ 2 zone, ทั้งคู่ยังอยู่ในกรอบ, binding เดิมไม่หายจาก zone อื่น |
| B4 | กด **Preview** | preview เล่นในหน้า, ทุก zone ที่ผูกไว้มีภาพ, Console ไม่มี error |
| B5 | กด **Save draft** | badge อัปเดตเป็นเวลาปัจจุบัน, ไม่มี error card แดง |
| B6 | กด **Open full preview** | เปิดได้ (ไม่ disabled แล้วเพราะ save แล้ว), เล่นเต็มจอถูกต้อง, กลับมาแล้วสถานะไม่เพี้ยน |
| B7 | กด **Activate** | สำเร็จ ไม่มี error. ถ้ามี zone ที่ยังไม่ผูก → ปุ่มต้อง disabled พร้อม tooltip `ยังไม่ได้ผูก Content ให้ Zone: <ชื่อ>` |
| B8 | กด **Save as Template** | สำเร็จ, ไปดู `/media-workspace/layouts/templates` เจอ template ใหม่ |
| B9 | กด **Cancel** | กลับลิสต์ ถ้ามีของยังไม่ save ต้องเตือนก่อน |

---

## C. หนี้เก่าที่ยังค้าง (ถ้าว่างช่วยเช็คด้วย ไม่บังคับ)

- [ ] **#29** — จากแถวใน `/media-workspace/layouts` สั่ง move-to-folder → ย้ายจริง ลิสต์อัปเดต
- [ ] **#29** — สั่ง delete จากแถว → มีขั้นยืนยันก่อน, กด Cancel แล้วไม่ลบ
- [ ] **#24** — ใน Template Picker กลุ่ม **Recently Used** เรียงตามที่ใช้ล่าสุดจริง
      (ใช้ template A → กลับมาเปิด picker → A ต้องอยู่บนสุดของกลุ่มนั้น)

---

## รายงานกลับ

พอเช็คเสร็จ ตอบกลับแบบนี้ก็พอ:

```
A1 PASS · A2 PASS · A3 FAIL (tags หายหลัง reload, GET คืน tags: null)
A4 PASS · A5 PASS
B1–B6 PASS · B7 FAIL (error 500) · B8 PASS · B9 PASS
C ข้าม
```

ข้อไหน FAIL ขอ Console error + Network request/response ของตัวที่พังด้วย
