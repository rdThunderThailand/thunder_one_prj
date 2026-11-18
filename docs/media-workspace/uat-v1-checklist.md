# UAT checklist — ThunderOne v1.0 (บน production)

เวอร์ชันที่ทดสอบ: One `v0.22.0` + Core `v0.26.0` บน prod · ร่างเมื่อ 2026-11-18 · ปรับตาม UAT รอบแรก 2026-11-18
แผนรวม: `plan-v1-release.md` · เกณฑ์ P0: `plan-v1-p0.md` · การตัดสินใจที่เปลี่ยน flow: ADR 0116

## แบ่ง 2 รอบ

หลังผล UAT รอบแรก เรามีการแก้ flow ของ Playlist editor / ปุ่ม Publish (PR #405) ซึ่งยังไม่อยู่บน prod จึงแบ่งเป็น 2 รอบ ดูที่แท็ก **R1** / **R2** หน้า ID

- **R1 — ทดสอบได้เลยบน prod ตอนนี้ (v0.22.0):** ข้อที่ไม่ขึ้นกับ #405
- **R2 — ทดสอบหลัง release 1.0.0 ขึ้น prod:** ข้อที่ตรวจ flow ใหม่ (A2, A4, A13–A16, B1) ทีม dev จะแจ้งเมื่อพร้อม ข้อ A8/A9/C3/C6 ทำใน R1 ได้เลยและแก้ขั้นตอนไว้ให้เหมาะกับ v0.22.0 แล้ว (ทำซ้ำใน R2 เฉพาะข้อที่ระบุ)
- ห้ามเปิด issue เรื่อง "Playlist ที่ Save แล้วหาไม่เจอใน wizard" ใน R1 เป็นเรื่องที่รู้แล้ว (#404) และแก้ใน R2

## ผลรอบแรก (18 พ.ย.) ที่รู้แล้ว

- A2 / A4 (#401, #402): checklist เดิมระบุทางเข้าผิด Layout ที่ไม่ Active เข้า wizard จากปุ่ม Publish ใน editor ไม่ได้โดยตั้งใจ flow ใหม่คือกล่องถามให้ Activate ก่อน (ทดสอบใน R2)
- A8 (#403): ปุ่ม Save ไม่ถูกปิดโดยตั้งใจ ต้องกดแล้วระบบแจ้งเหตุผล ไม่ได้กดจึงเห็นไม่ครบ
- C6 (#404): ข้อบกพร่องจริง Playlist ที่ Save แล้วเป็น Draft ไม่ขึ้นใน wizard แก้ใน #405

## กติกาก่อนเริ่ม

- URL: https://app.thunderone.asia · login บัญชี QA ของ tenant **thunder_qa** เท่านั้น ห้ามทำใน tenant ลูกค้า
- เครื่องเล่นทดสอบ: **Demo Kiosk Test 01** (Windows) ถ้าใช้เครื่องอื่นให้จดชื่อเครื่องและ OS ในช่องหมายเหตุ
- ทุกอย่างที่สร้างใหม่ ให้ตั้งชื่อขึ้นต้นด้วย **`zz-uat-`** (เช่น `zz-uat-playlist-01`) เพื่อไล่ลบภายหลัง **ห้ามลบเอง** ให้ทีม dev ลบหลังจบ UAT
- ห้ามแก้หรือ unpublish Program ที่ไม่ได้ขึ้นต้นด้วย `zz-uat-`
- ผลแต่ละข้อ: ✅ ผ่าน / ❌ ไม่ผ่าน (แนบภาพหน้าจอ + เวลา + URL) / ⏭️ ข้าม (ระบุเหตุผล)
- เจอบั๊ก: เปิด GitHub issue ที่ `rdThunderThailand/thunder_one_prj` ใส่ `[UAT v1.0]` นำหน้าชื่อ พร้อมขั้นตอน ผลที่ได้ ผลที่คาด และภาพ
- ก่อนเปิดบั๊ก เช็ค **"Known gaps"** ท้ายไฟล์ก่อน ข้อที่อยู่ในนั้นไม่ต้องเปิด issue ใหม่

## A. P0 ที่แก้ใน v0.22.0 + flow ที่ปรับหลัง UAT รอบแรก (ต้องผ่านทั้งหมด)

| ID | ขั้นตอน | ผลที่คาด | ผล | หมายเหตุ |
|---|---|---|---|---|
| A1 · R1 | สร้าง Layout `zz-uat-layout-draft` ใส่ Playlist ทุก Zone แต่**ไม่กด Activate** → Programs → สร้าง Program → เลือก Layout | ใน picker **ไม่มี** Layout ที่เป็น Draft/Inactive ให้เลือก | | |
| A2 · R2 | เปิด Layout `zz-uat-layout-draft` (Draft, ผูก Playlist ครบ) → กด **Publish to Channel** → ในกล่องที่ขึ้นมา กด **Save & Activate แล้วไปต่อ** | ขึ้นกล่อง "Layout ต้อง Active ก่อนเผยแพร่" · กดแล้ว Layout เป็น Active และเข้า Program wizard โดยผูก Layout นี้ไว้แล้ว | | |
| A3 · R1 | Programs → Create Program → เลือก Layout `zz-uat-layout-01` (Active) → ไปถึงขั้น 2 Prepare Content ค้างไว้ · อีกแท็บ: Layouts → ⋯ ของ `zz-uat-layout-01` → **Set inactive** · กลับมาแท็บ wizard → กด Next/Back เพื่อให้ขั้น 2 แสดงอีกครั้ง | มีคำเตือนภาษาไทยว่า Layout ยังไม่ Active พร้อมปุ่ม **Activate Layout** · กดแล้วคำเตือนหายโดยไม่ต้อง reload และไปต่อถึงขั้น 5 ได้ | | |
| A4 · R2 | สร้าง Layout `zz-uat-layout-unbound` ที่มี Zone ว่าง (ไม่ผูก Playlist) → Save → กด **Publish to Channel** | กล่องบอกว่ายังเปิดใช้งานไม่ได้ พร้อมจำนวนและชื่อ Zone ที่ยังไม่ผูก · มีแค่ปุ่มปิด ไม่มีปุ่ม Activate | | |
| A5 · R1 | ต่อจาก A3 ก่อนกด Activate Layout: ไปขั้น 5 Publish ขณะ Layout ยัง Inactive | ปุ่ม Publish กดไม่ได้ และบอกเหตุผล | | |
| A6 · R1 | Program แบบ Draft ที่ผูก Layout แบบ Draft → หน้า Edit Program | มีคำเตือน + ลิงก์ไป Layout และปุ่ม Publish กดไม่ได้ | | |
| A7 · R1 | ตั้งวันจบของ Program ให้เป็นเวลาที่ผ่านไปแล้ว (หรือรอให้เลยเวลาจบ) แล้วกด Publish | ถูกปฏิเสธก่อนส่ง พร้อมข้อความภาษาไทยที่บอกว่าต้องแก้วันจบ ไม่ใช่ "ข้อมูลไม่ครบ" แบบกว้างๆ | | |
| A8 · R1 | Create (ปุ่มบนขวา) → New Playlist → ตั้งชื่อชั่วคราว `zz-uat-tmp` → เพิ่มไฟล์ → **ลบชื่อให้ว่าง** → กดปุ่มบันทึก (**Save** หรือ **Save & Activate** ตามที่เห็น) | ไม่มี Playlist ใหม่ถูกสร้าง · ขึ้นข้อความว่าต้องใส่ชื่อ และช่องชื่อเปิดให้พิมพ์ทันที (ปุ่มบันทึกไม่ได้ถูกปิด — ตั้งใจ) | | |
| A9 · R1 | ต่อจาก A8 ใส่ชื่อ `zz-uat-playlist-01` → กดปุ่มบันทึกแล้วกดซ้ำอีกครั้ง | บันทึกสำเร็จพร้อมไฟล์ครบ กดซ้ำแล้ว**ไม่**เกิด Playlist ซ้ำ (หน้า Playlists มีชื่อนี้ 1 รายการ) · ใน R2 ปุ่มจะเป็น Save & Activate และ badge จบที่ Inactive ไม่ใช่ Draft | | |
| A10 · R1 | Layout editor: ลากให้ 2 Zone ซ้อนกัน ลองที่ zoom ของ Chrome 125% + canvas 125% แล้วลองที่ 100% และ 75% | Zone ที่ซ้อนถูกไฮไลต์ และปุ่ม Save กดไม่ได้ทุกระดับ zoom | | |
| A11 · R1 | Program แบบ Playlist 2 ตัว priority เท่ากัน ช่วงเวลาซ้อนกัน บนเครื่องเดียวกัน (Publish ทั้งคู่) | บนเครื่องเล่น เนื้อหาของทั้ง 2 ตัวเล่นต่อกันเป็น loop เดียว | | |
| A12 · R1 | Program แบบ Layout 2 ตัว priority เท่ากัน ช่วงเวลาซ้อนกัน | ตัวที่ Activate **ล่าสุด**ได้จอไป | | |
| A13 · R2 | Playlist ใหม่ `zz-uat-playlist-03` ใส่ไฟล์ → ดูปุ่มมุมขวาบน → กด **Save & Activate** → ดู badge และปุ่ม | ก่อนบันทึกปุ่มหลักเป็น **Save & Activate** (มี ▾ ที่มีเมนู **Save Draft**) · หลังบันทึก badge เป็น **Inactive** และเหลือปุ่ม **Save** ปุ่มเดียว | | |
| A14 · R2 | Playlist ใหม่ `zz-uat-playlist-04` ใส่ไฟล์ → ▾ → **Save Draft** | บันทึกแล้วยังเป็น **Draft** ปุ่มหลักยังเป็น Save & Activate · Program wizard → เลือก Playlist ที่มีอยู่ → ค้น `zz-uat-playlist-04` → **เจอ** (ติดป้าย Draft) | | |
| A15 · R2 | Playlist ที่ Active/Inactive อยู่แล้ว (เช่น `-03`) → เพิ่มไฟล์โดยไม่บันทึก → กด **Publish to Channel** | ขึ้นกล่อง "มีการแก้ไขที่ยังไม่บันทึก" ปุ่ม **Save แล้วไปต่อ** · กดแล้วบันทึกและเข้า wizard · ลองกดยกเลิกว่าไม่เกิดอะไร | | |
| A16 · R2 | ปุ่ม Publish ทั้ง Playlist editor และ Layout editor: เปิดตัวที่ **ยังไม่มี Program ใช้** และตัวที่ **มี Program ใช้อยู่** (Active/Scheduled) | ยังไม่มี Program: ปุ่มหลักเขียน **Publish to Channel** · มี Program ใช้: ปุ่มหลักเขียน **Publish Changes** และกดแล้วเห็นรายชื่อ Program (ลองกด Cancel ไม่ต้อง Publish) · ▾ ยังเลือกได้ทั้งสองทาง · เปิดเมนู Save ▾ แล้วเปิด Publish ▾ เมนูแรกต้องปิดเอง ไม่ซ้อนกัน | | |

## B. #388 (หลัง v1.0.0 ขึ้น)

| ID | ขั้นตอน | ผลที่คาด | ผล | หมายเหตุ |
|---|---|---|---|---|
| B1 · R2 | All Channels → `10 / page` → ไปหน้า 2 (ต้องมีมากกว่า 10 Channel) | ท้ายตารางเขียน "Showing 11 to N of N **channels**" | | ทดสอบหลัง release เท่านั้น ก่อนหน้านั้นยังขึ้น "playlists" อยู่ |

## C. Flow หลัก end-to-end

| ID | ขั้นตอน | ผลที่คาด | ผล | หมายเหตุ |
|---|---|---|---|---|
| C1 · R1 | Media Library → upload วิดีโอ MP4 (H.264) `zz-uat-video-01` และรูป JPG `zz-uat-image-01` | อัปโหลดสำเร็จ มีภาพตัวอย่าง (poster) สถานะพร้อมใช้ | | จดขนาดไฟล์และเวลาที่ใช้ |
| C2 · R1 | upload วิดีโอที่ต้องแปลงไฟล์ (High profile / HEVC ถ้ามี) | ขึ้นสถานะกำลังแปลง แสดงลำดับคิว/เวลารอ แล้วพร้อมใช้เมื่อแปลงเสร็จ | | ข้ามได้ถ้าไม่มีไฟล์ |
| C3 · R1 | Playlists → สร้าง `zz-uat-playlist-02` ใส่ C1 ทั้ง 2 ไฟล์ ตั้งเวลาแสดงรูป เรียงลำดับใหม่ → บันทึก → reload | บันทึกได้ ลำดับและเวลาถูกต้องหลัง reload · **บน v0.22.0:** Playlist เป็น Draft ให้ไปหน้า Playlists → ⋯ ของแถวนี้ → **Mark as ready** ก่อนไปข้อ C6 | | |
| C4 · R1 | Layouts → New Layout `zz-uat-layout-01` 2 Zone ผูก Playlist ทุก Zone → Save → Activate | สถานะเป็น Active | | |
| C5 · R1 | Duplicate `zz-uat-layout-01` | ได้ตัว copy (Draft) ขนาดและ Zone เหมือนต้นฉบับ | | |
| C6 · R1 | Programs → wizard: Playlist `zz-uat-playlist-02` → Channel ที่มี Demo Kiosk Test 01 → ตั้งเวลาให้เริ่มตอนนี้ → Review → Publish | Publish สำเร็จ Program เป็น Active · ถ้าไม่เห็น Playlist ใน picker ให้เช็คว่า Mark as ready ใน C3 แล้ว (ไม่ใช่บั๊กใหม่) | | |
| C7 · R1 | ดูเครื่อง Demo Kiosk Test 01 | เครื่องเล่น `zz-uat-playlist-02` ตามลำดับ | | จดเวลาตั้งแต่กด Publish จนเห็นบนจอ |
| C8 · R1 | Now & Next | Channel นั้นขึ้น Live และแสดง Program `zz-uat-` ตัวนี้ | | |
| C9 · R1 | Calendar วันนี้ | มีบล็อกของ Program อยู่ในช่วงเวลาที่ถูกต้อง มี cover | | |
| C10 · R1 | Edit Program → เปลี่ยนวันจบ → Publish changes | บันทึกได้ เครื่องเล่นยังเล่นต่อ ไม่ดับ | | |
| C11 · R1 | Programs: wizard แบบ Layout `zz-uat-layout-01` → Channel เดิม priority สูงกว่า C6 → Publish | เครื่องสลับไปเล่น Layout | | |
| C12 · R1 | Cancel/Unpublish Program จาก C11 | เครื่องกลับไปเล่น C6 | | |
| C13 · R1 | Playback Proof → ช่วงวันนี้ → Channel ทดสอบ | มีแถวการเล่นของไฟล์ `zz-uat-` และ export CSV ได้ | | ข้อมูลอาจหน่วงไม่กี่นาที |
| C14 · R1 | Channel Groups → ดู Group ที่มี Channel ทดสอบ (ถ้ามี) | รายการสมาชิกและสถานะถูกต้อง | | ห้ามแก้ Group ที่ไม่ใช่ `zz-uat-` |
| C15 · R1 | สลับภาษา EN ↔ TH ในหน้าที่ทดสอบ | ข้อความ error และคำเตือนในข้อ A ขึ้นเป็นภาษาไทย ไม่มี error ภาษาอังกฤษดิบจากระบบหลังบ้าน | | |

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
| ✅ ผ่าน (นับแยก R1 / R2) | |
| ❌ ไม่ผ่าน (ลิงก์ issue) | |
| ⏭️ ข้าม | |

ผู้ทดสอบ: ______ · วันที่: ______ · เครื่องที่ใช้: ______
