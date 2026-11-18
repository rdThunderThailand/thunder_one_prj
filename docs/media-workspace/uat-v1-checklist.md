# UAT checklist — ThunderOne v1.0 (บน production)

เวอร์ชันที่ทดสอบ: One `v0.23.0` + Core `v0.26.0` บน prod · ร่างเมื่อ 2026-11-18 · ปรับตาม UAT รอบแรก 2026-11-18
แผนรวม: `plan-v1-release.md` · เกณฑ์ P0: `plan-v1-p0.md` · การตัดสินใจที่เปลี่ยน flow: ADR 0116

**ทดสอบครั้งเดียวบน v0.23.0:** ต้องผ่านทุกข้อ (หรือ owner ยอมรับเป็น known gap) ก่อนจึงจะตัด `v1.0.0` ถ้าเจอบั๊ก ทีม dev แก้แล้วออกเวอร์ชันใหม่ให้ทดสอบข้อที่เกี่ยวข้องซ้ำ รอบ UAT แรก (บน v0.22.0) พบว่า flow ของ Playlist editor และปุ่ม Publish ซับซ้อน จึงปรับไว้ใน v0.23.0 (#405) ข้อที่เกี่ยวข้องคือ A2, A4, A8, A9, A13–A16, C3, C6

## ผลรอบแรก (บน v0.22.0, 18 พ.ย.) ที่รู้แล้ว

- A2 / A4 (#401, #402): checklist เดิมระบุทางเข้าผิด Layout ที่ไม่ Active เข้า wizard จากปุ่ม Publish ใน editor ไม่ได้โดยตั้งใจ flow ใหม่ใน v0.23.0 คือกล่องถามให้ Activate ก่อน
- A8 (#403): ปุ่ม Save ไม่ถูกปิดโดยตั้งใจ ต้องกดแล้วระบบแจ้งเหตุผล
- C6 (#404): ข้อบกพร่องจริง Playlist ที่ Save แล้วเป็น Draft ไม่ขึ้นใน wizard แก้ใน v0.23.0

## กติกาก่อนเริ่ม

- URL: https://app.thunderone.asia · login บัญชี QA ของ tenant **thunder_qa** เท่านั้น ห้ามทำใน tenant ลูกค้า
- เครื่องเล่นทดสอบ: **Demo Kiosk Test 01** (Windows) ถ้าใช้เครื่องอื่นให้จดชื่อเครื่องและ OS ในช่องหมายเหตุ
- ทุกอย่างที่สร้างใหม่ ให้ตั้งชื่อขึ้นต้นด้วย **`zz-uat-`** (เช่น `zz-uat-playlist-01`) เพื่อไล่ลบภายหลัง **ห้ามลบเอง** ให้ทีม dev ลบหลังจบ UAT
- ห้ามแก้หรือ unpublish Program ที่ไม่ได้ขึ้นต้นด้วย `zz-uat-`
- ผลแต่ละข้อ: ✅ ผ่าน / ❌ ไม่ผ่าน (แนบภาพหน้าจอ + เวลา + URL) / ⏭️ ข้าม (ระบุเหตุผล)
- เจอบั๊ก: เปิด GitHub issue ที่ `rdThunderThailand/thunder_one_prj` ใส่ `[UAT v1.0]` นำหน้าชื่อ พร้อมขั้นตอน ผลที่ได้ ผลที่คาด และภาพ
- ก่อนเปิดบั๊ก เช็ค **"Known gaps"** ท้ายไฟล์ก่อน ข้อที่อยู่ในนั้นไม่ต้องเปิด issue ใหม่

## A. P0 + flow ที่ปรับหลัง UAT รอบแรก (ต้องผ่านทั้งหมด)

| ID | ขั้นตอน | ผลที่คาด | ผล | หมายเหตุ |
|---|---|---|---|---|
| A1 | สร้าง Layout `zz-uat-layout-draft` ใส่ Playlist ทุก Zone แต่**ไม่กด Activate** → Programs → สร้าง Program → เลือก Layout | ใน picker **ไม่มี** Layout ที่เป็น Draft/Inactive ให้เลือก | | |
| A2 | เปิด Layout `zz-uat-layout-draft` (Draft, ผูก Playlist ครบ) → กด **Publish to Channel** → ในกล่องที่ขึ้นมา กด **Save & Activate แล้วไปต่อ** | ขึ้นกล่อง "Layout ต้อง Active ก่อนเผยแพร่" · กดแล้ว Layout เป็น Active และเข้า Program wizard โดยผูก Layout นี้ไว้แล้ว | | |
| A3 | Programs → Create Program → เลือก Layout `zz-uat-layout-01` (Active) → ไปถึงขั้น 2 Prepare Content ค้างไว้ · อีกแท็บ: Layouts → ⋯ ของ `zz-uat-layout-01` → **Set inactive** · กลับมาแท็บ wizard → กด Next/Back เพื่อให้ขั้น 2 แสดงอีกครั้ง | มีคำเตือนภาษาไทยว่า Layout ยังไม่ Active พร้อมปุ่ม **Activate Layout** · กดแล้วคำเตือนหายโดยไม่ต้อง reload และไปต่อถึงขั้น 5 ได้ | | |
| A4 | สร้าง Layout `zz-uat-layout-unbound` ที่มี Zone ว่าง (ไม่ผูก Playlist) → Save → กด **Publish to Channel** | กล่องบอกว่ายังเปิดใช้งานไม่ได้ พร้อมจำนวนและชื่อ Zone ที่ยังไม่ผูก · มีแค่ปุ่มปิด ไม่มีปุ่ม Activate | | |
| A5 | ต่อจาก A3 ก่อนกด Activate Layout: ไปขั้น 5 Publish ขณะ Layout ยัง Inactive | ปุ่ม Publish กดไม่ได้ และบอกเหตุผล | | |
| A6 | Program แบบ Draft ที่ผูก Layout แบบ Draft → หน้า Edit Program | มีคำเตือน + ลิงก์ไป Layout และปุ่ม Publish กดไม่ได้ | | |
| A7 | ตั้งวันจบของ Program ให้เป็นเวลาที่ผ่านไปแล้ว (หรือรอให้เลยเวลาจบ) แล้วกด Publish | ถูกปฏิเสธก่อนส่ง พร้อมข้อความภาษาไทยที่บอกว่าต้องแก้วันจบ ไม่ใช่ "ข้อมูลไม่ครบ" แบบกว้างๆ | | |
| A8 | Create (ปุ่มบนขวา) → New Playlist → ตั้งชื่อชั่วคราว `zz-uat-tmp` → เพิ่มไฟล์ → **ลบชื่อให้ว่าง** → กด **Save & Activate** | ไม่มี Playlist ใหม่ถูกสร้าง · ขึ้นข้อความว่าต้องใส่ชื่อ และช่องชื่อเปิดให้พิมพ์ทันที (ปุ่มไม่ได้ถูกปิด — ตั้งใจ) | | |
| A9 | ต่อจาก A8 ใส่ชื่อ `zz-uat-playlist-01` → กด **Save & Activate** แล้วกดปุ่ม Save ที่เหลือซ้ำอีกครั้ง | บันทึกสำเร็จพร้อมไฟล์ครบ badge เป็น Inactive · กดซ้ำแล้ว**ไม่**เกิด Playlist ซ้ำ (หน้า Playlists มีชื่อนี้ 1 รายการ) | | |
| A10 | Layout editor: ลากให้ 2 Zone ซ้อนกัน ลองที่ zoom ของ Chrome 125% + canvas 125% แล้วลองที่ 100% และ 75% | Zone ที่ซ้อนถูกไฮไลต์ และปุ่ม Save กดไม่ได้ทุกระดับ zoom | | |
| A11 | Program แบบ Playlist 2 ตัว priority เท่ากัน ช่วงเวลาซ้อนกัน บนเครื่องเดียวกัน (Publish ทั้งคู่) | บนเครื่องเล่น เนื้อหาของทั้ง 2 ตัวเล่นต่อกันเป็น loop เดียว | | |
| A12 | Program แบบ Layout 2 ตัว priority เท่ากัน ช่วงเวลาซ้อนกัน | ตัวที่ Activate **ล่าสุด**ได้จอไป | | |
| A13 | Playlist ใหม่ `zz-uat-playlist-03` ใส่ไฟล์ → ดูปุ่มมุมขวาบน → กด **Save & Activate** → ดู badge และปุ่ม | ก่อนบันทึกปุ่มหลักเป็น **Save & Activate** (มี ▾ ที่มีเมนู **Save Draft**) · หลังบันทึก badge เป็น **Inactive** และเหลือปุ่ม **Save** ปุ่มเดียว | | |
| A14 | Playlist ใหม่ `zz-uat-playlist-04` ใส่ไฟล์ → ▾ → **Save Draft** | บันทึกแล้วยังเป็น **Draft** ปุ่มหลักยังเป็น Save & Activate · Program wizard → เลือก Playlist ที่มีอยู่ → ค้น `zz-uat-playlist-04` → **เจอ** (ติดป้าย Draft) | | |
| A15 | Playlist ที่ Active/Inactive อยู่แล้ว (เช่น `-03`) → เพิ่มไฟล์โดยไม่บันทึก → กด **Publish to Channel** | ขึ้นกล่อง "มีการแก้ไขที่ยังไม่บันทึก" ปุ่ม **Save แล้วไปต่อ** · กดแล้วบันทึกและเข้า wizard · ลองกดยกเลิกว่าไม่เกิดอะไร | | |
| A16 | ปุ่ม Publish ทั้ง Playlist editor และ Layout editor: เปิดตัวที่ **ยังไม่มี Program ใช้** และตัวที่ **มี Program ใช้อยู่** (Active/Scheduled) | ยังไม่มี Program: ปุ่มหลักเขียน **Publish to Channel** · มี Program ใช้: ปุ่มหลักเขียน **Publish Changes** และกดแล้วเห็นรายชื่อ Program (ลองกด Cancel ไม่ต้อง Publish) · ▾ ยังเลือกได้ทั้งสองทาง · เปิดเมนู Save ▾ แล้วเปิด Publish ▾ เมนูแรกต้องปิดเอง ไม่ซ้อนกัน | | |

## B. #388

| ID | ขั้นตอน | ผลที่คาด | ผล | หมายเหตุ |
|---|---|---|---|---|
| B1 | All Channels → `10 / page` → ไปหน้า 2 (ต้องมีมากกว่า 10 Channel) | ท้ายตารางเขียน "Showing 11 to N of N **channels**" | | ทดสอบหลัง release เท่านั้น ก่อนหน้านั้นยังขึ้น "playlists" อยู่ |

## C. Flow หลัก end-to-end

| ID | ขั้นตอน | ผลที่คาด | ผล | หมายเหตุ |
|---|---|---|---|---|
| C1 | Media Library → upload วิดีโอ MP4 (H.264) `zz-uat-video-01` และรูป JPG `zz-uat-image-01` | อัปโหลดสำเร็จ มีภาพตัวอย่าง (poster) สถานะพร้อมใช้ | | จดขนาดไฟล์และเวลาที่ใช้ |
| C2 | upload วิดีโอที่ต้องแปลงไฟล์ (High profile / HEVC ถ้ามี) | ขึ้นสถานะกำลังแปลง แสดงลำดับคิว/เวลารอ แล้วพร้อมใช้เมื่อแปลงเสร็จ | | ข้ามได้ถ้าไม่มีไฟล์ |
| C3 | Playlists → สร้าง `zz-uat-playlist-02` ใส่ C1 ทั้ง 2 ไฟล์ ตั้งเวลาแสดงรูป เรียงลำดับใหม่ → **Save & Activate** → reload | บันทึกได้ ลำดับและเวลาถูกต้องหลัง reload · badge เป็น Inactive | | |
| C4 | Layouts → New Layout `zz-uat-layout-01` 2 Zone ผูก Playlist ทุก Zone → Save → Activate | สถานะเป็น Active | | |
| C5 | Duplicate `zz-uat-layout-01` | ได้ตัว copy (Draft) ขนาดและ Zone เหมือนต้นฉบับ | | |
| C6 | Programs → wizard: Playlist `zz-uat-playlist-02` → Channel ที่มี Demo Kiosk Test 01 → ตั้งเวลาให้เริ่มตอนนี้ → Review → Publish | Playlist อยู่ใน picker · Publish สำเร็จ Program เป็น Active | | |
| C7 | ดูเครื่อง Demo Kiosk Test 01 | เครื่องเล่น `zz-uat-playlist-02` ตามลำดับ | | จดเวลาตั้งแต่กด Publish จนเห็นบนจอ |
| C8 | Now & Next | Channel นั้นขึ้น Live และแสดง Program `zz-uat-` ตัวนี้ | | |
| C9 | Calendar วันนี้ | มีบล็อกของ Program อยู่ในช่วงเวลาที่ถูกต้อง มี cover | | |
| C10 | Edit Program → เปลี่ยนวันจบ → Publish changes | บันทึกได้ เครื่องเล่นยังเล่นต่อ ไม่ดับ | | |
| C11 | Programs: wizard แบบ Layout `zz-uat-layout-01` → Channel เดิม priority สูงกว่า C6 → Publish | เครื่องสลับไปเล่น Layout | | |
| C12 | Cancel/Unpublish Program จาก C11 | เครื่องกลับไปเล่น C6 | | |
| C13 | Playback Proof → ช่วงวันนี้ → Channel ทดสอบ | มีแถวการเล่นของไฟล์ `zz-uat-` และ export CSV ได้ | | ข้อมูลอาจหน่วงไม่กี่นาที |
| C14 | Channel Groups → ดู Group ที่มี Channel ทดสอบ (ถ้ามี) | รายการสมาชิกและสถานะถูกต้อง | | ห้ามแก้ Group ที่ไม่ใช่ `zz-uat-` |
| C15 | สลับภาษา EN ↔ TH ในหน้าที่ทดสอบ | ข้อความ error และคำเตือนในข้อ A ขึ้นเป็นภาษาไทย ไม่มี error ภาษาอังกฤษดิบจากระบบหลังบ้าน | | |

## D. Known gaps (ไม่ต้องเปิด issue ใหม่)

- **วิดีโอไม่มี verdict:** วิดีโอที่ย้ายมาจากระบบเก่า (Aurora) ไม่ได้ถูกตรวจ codec จึงไม่ถูกแปลงไฟล์ บางไฟล์อาจกระตุกหรือค้างบางเครื่อง (Core #292, #295)
- **cover / poster:** วิดีโอที่ไม่มีภาพตัวอย่างจะดึงเฟรมแรกจากตัววิดีโอ ทำให้ Calendar และ Now & Next โหลดช้า (#236)
- **Calendar "Now":** แสดงตามตารางเวลา ไม่ได้แปลว่าเครื่องยืนยันว่ากำลังเล่น ให้ดูสถานะ Live ที่ Now & Next แทน (#237)
- **Edit Program ของ Layout:** รูปตัวอย่างข้าง Program Details แสดงแค่โครง Zone ไม่ใช่ cover เดียวกับหน้าอื่น (#231)
- **ลบ Channel:** ลบ Channel ที่เคย Active แล้วไม่ได้ ทำได้แค่ Disable (#261)
- **Zone ผูก Playlist ว่าง:** Publish ได้และ Zone นั้นจะว่าง (การตัดสินใจฝั่ง Core อยู่นอก v1.0)
- **Player update:** อัปเดตด้วย checksum อย่างเดียว เฉพาะเครื่องใน pilot ring
- **ปุ่ม Publish ในหน้า Preview ของ Playlist:** ยังเป็นแบบเดิม (ปิดไว้พร้อมเหตุผลเมื่อยังไม่พร้อม) ใช้ปุ่ม Publish ในหน้า editor แทน
- **เครื่อง Android 7 / 9:** ไม่ส่ง playback log จึงไม่มีข้อมูลใน Playback Proof

## สรุปผล (ผู้ทดสอบกรอก)

| | จำนวน |
|---|---|
| ✅ ผ่าน | |
| ❌ ไม่ผ่าน (ลิงก์ issue) | |
| ⏭️ ข้าม | |

ผู้ทดสอบ: ______ · วันที่: ______ · เครื่องที่ใช้: ______
