# Browser checklist — ticket 04 (Publication of type `composition`)

**รันเมื่อ** 2026-08-26 · branch `feat/layout` ทั้งสอง repo · ผลกรอกกลับมาที่ท้ายไฟล์

## ก่อนเริ่ม — ยืนยัน 3 อย่าง

| เช็ค | ค่าที่ต้องได้ | ทำไมสำคัญ |
|---|---|---|
| `thunder_one_prj/.env` → `CORE_API_URL` | `http://localhost:3001` | ถ้าเป็น `thundercore.vercel.app` จะเทสไม่เจอโค้ดใหม่เลย |
| `Thunder_Core/.env` → `NEXT_PUBLIC_SUPABASE_URL` | `ftfmokgphewzyxzwjitv` (**develop**) | ticket 04 apply แค่บน develop ถ้าชี้ prod จะพังเพราะไม่มีคอลัมน์ `composition_id` |
| ทั้งสอง dev server รันอยู่ | `:3000` และ `:3001` | ตรวจแล้วเมื่อกี้ ตอบ 307 / 401 ตามลำดับ |

> ถ้าข้อไหนไม่ตรง **หยุด** แล้วบอกกลับมา อย่าเทสต่อ ผลจะไม่มีความหมาย

---

## A — ต้องมี Composition ที่ `active` ก่อน

หน้า Composition ยังไม่มีใน sidebar (ตั้งใจ — ticket 15 จะเอามาใส่) ต้องพิมพ์ URL เอง

1. ไป `http://localhost:3000/media-workspace/compositions/create`
2. ตั้งชื่อ เลือก Layout ที่มี Zone อย่างน้อย 2 อัน
3. คลิกทีละ Zone ผูก Playlist ให้ **ครบทุก Zone**
4. กด Activate

**คาดหวัง:** บันทึกได้ สถานะขึ้น `active`
**ถ้าเหลือ Zone ที่ยังไม่ผูก** → Activate ต้องถูกปฏิเสธ **และข้อความต้องบอกชื่อ Zone ที่ยังว่าง** (ลองเว้นไว้หนึ่ง Zone ดูสักครั้งก่อนผูกครบ)

- [ ] A ผ่าน / ไม่ผ่าน → ผลจริง: ______

---

## B — step 1 มีชนิด "Layout" ให้เลือก

1. ไป `http://localhost:3000/media-workspace/publications/create`

**คาดหวัง:** ในตัวเลือกชนิดคอนเทนต์มี **Layout** อยู่ข้างๆ Image / Video / Playlist
**คำที่ operator เห็นต้องเป็น "Layout" ไม่ใช่ "Composition"** — ถ้าเห็นคำว่า Composition ที่ไหนในหน้าจอ ถือว่าไม่ผ่าน

- [ ] B ผ่าน / ไม่ผ่าน → คำที่เห็นจริง: ______

---

## C — step 2 โชว์ Composition picker อย่างเดียว

1. เลือกชนิด **Layout** แล้วกดไป step 2

**คาดหวัง:**
- เห็นรายการให้เลือก Layout(=Composition) และเห็นอันที่สร้างจาก A
- **ต้องไม่มี** ปุ่มสลับ *Full screen / Layout* (ของโมเดลเก่าที่ถูกลบไปแล้ว)
- **ต้องไม่มี** ช่องผูกคอนเทนต์รายZone ในหน้านี้
- รายการต้องมีเฉพาะตัวที่ `active` — ลองสร้าง Composition ทิ้งไว้เป็น `draft` แล้วเช็คว่า**ไม่โผล่**

- [ ] C ผ่าน / ไม่ผ่าน → ผลจริง: ______

---

## D — publish ได้จริง (ข้อที่พังง่ายที่สุด)

1. เลือก Composition จาก A → เดินต่อจนครบทุก step → ตั้งเวลา เลือกจอ → กด Publish

**คาดหวัง:** ปุ่ม Publish **กดได้** และ publish สำเร็จ

> ข้อนี้คือจุดที่ `publish-eligibility.ts` เคยพลาด: ถ้าโค้ดตกเคส `composition` มันจะไหลไปทางเช็ค asset
> แล้ว publication แบบ Layout ที่ไม่มี `assetItems` จะถูกตัดสินว่า **ห้าม publish** อาการคือ
> **ปุ่ม Publish เทาค้าง ทั้งที่กรอกครบแล้ว** ถ้าเจออาการนี้ให้จดไว้ตรงนี้ชัดๆ

- [ ] D ผ่าน / ไม่ผ่าน → ปุ่ม Publish กดได้ไหม: ______

---

## E — detail และ list แสดงผลถูก

1. หลัง publish เปิดหน้ารายละเอียดของ publication ที่เพิ่งสร้าง
2. กลับไปหน้า list `http://localhost:3000/media-workspace/publications`

**คาดหวัง:**
- หน้า detail บอกชนิดเป็น Layout และ**ชี้ไปยัง Composition ที่ถูกตัว** (ชื่อตรงกับ A)
- แถวในหน้า list แสดงชนิดถูก ไม่ว่าง ไม่ขึ้น `-` หรือ `unknown`

> ข้อนี้เทส migration ตัวที่สอง (`publication_composition_in_reads`) โดยตรง — read function
> ประกอบ JSON เองด้วยมือ ถ้าตัวนั้นไม่ทำงาน `composition_id` จะหายไปตรงนี้

- [ ] E ผ่าน / ไม่ผ่าน → ผลจริง: ______

---

## F — Duplicate ต้องพา Composition ไปด้วย

1. ที่ publication จาก D กด Duplicate

**คาดหวัง:** ตัวที่ copy มาชี้ไปยัง **Composition เดียวกัน** ไม่ใช่ของว่าง
(ต่างจาก playlist ที่ duplicate แล้วปั้น Playlist ใหม่ให้)

- [ ] F ผ่าน / ไม่ผ่าน → ผลจริง: ______

---

## G — regression: 3 ชนิดเดิมต้องไม่พัง

ข้อนี้สำคัญเท่า A–F เพราะ ticket นี้ไป**แก้ signature ของ `media_publication_upsert`** ซึ่งทุกชนิดใช้ร่วมกัน

สร้าง publication ให้ครบทั้งสามแบบ แบบละหนึ่ง เดินจนถึง publish:

- [ ] **Image** — สร้าง + publish ได้ตามปกติ → ______
- [ ] **Video** — สร้าง + publish ได้ตามปกติ → ______
- [ ] **Playlist** — สร้าง + publish ได้ตามปกติ → ______

**อาการที่ต้องระวังเป็นพิเศษ:** error ที่มีคำว่า **`ambiguous`** หรือ **`function ... is not unique`**
= มี `media_publication_upsert` สองเวอร์ชันซ้อนกันอยู่ ซึ่งคือความเสี่ยงหลักของ ticket นี้
**ถ้าเจอ ให้หยุดทั้งหมดแล้วบอกกลับมาทันที อย่า apply อะไรลง production**

---

## H — draft เก่าต้องไม่ทำหน้าจอพัง

ถ้าเคยมี draft ค้างใน localStorage จากก่อนหน้านี้ (เคยกดสร้าง publication แล้วปิดหนีกลางทาง)

**คาดหวัง:** เปิดหน้า create แล้ว draft เก่าถูก**ทิ้ง**เงียบๆ ไม่ใช่ rehydrate แล้วจอขาว
(key ถูกขึ้นเวอร์ชันแล้วใน ticket นี้ ถ้าทำถูก draft เก่าจะหายไปเฉยๆ ซึ่งเป็นพฤติกรรมที่ตั้งใจ)

- [ ] H ผ่าน / ไม่ผ่าน → ผลจริง: ______

---

## ถ้าเจอ error ให้เก็บอะไรกลับมา

1. ข้อความ error ที่เห็นบนหน้าจอ (คัดลอกทั้งประโยค)
2. Console ของเบราว์เซอร์ — F12 → Console → มีสีแดงอะไรบ้าง
3. Terminal ที่รัน `localhost:3001` — บรรทัดท้ายๆ ตอนกดปุ่มที่พัง
4. อยู่ขั้นตอนไหน (A–H) ตอนเจอ

---

## สรุปผล (กรอกกลับมา)

- ผ่าน: ______
- ไม่ผ่าน: ______
- ไม่ได้เทส: ______

**ยังไม่ apply migration ลง production จนกว่า A–H จะเคลียร์**
