# Checklist ตรวจ #34 ผ่าน browser

Dev server ต้องชี้ไป Thunder_Core dev branch (`ftfmokgphewzyxzwjitv`, migration `item_kinds`
apply แล้ว) — เช็คด้วย `CORE_API_URL` หรือ `/api/proxy/__config` ถ้าไม่แน่ใจว่าชี้ไปที่ไหน

เปิด `/media-workspace/playlists`

## 1. Stat tiles
- [ ] เห็น 4 ใบเรียง **Total → Draft → Active → Inactive**
- [ ] ตัวเลขรวมกัน Draft+Active+Inactive = Total
- [ ] ไม่มีปุ่ม Upload บนหัวหน้า, ไม่มีปุ่มสลับมุมมอง list/grid/compact

## 2. Type column (ต้องมี playlist อย่างน้อย 1 ใบที่มีทั้ง video และ image เพื่อเช็ค Mixed)
- [ ] playlist ที่มีแต่ video → คอลัมน์ Type ขึ้น **Video**
- [ ] playlist ที่มีแต่ image → คอลัมน์ Type ขึ้น **Image**
- [ ] playlist ที่มีทั้งสอง → คอลัมน์ Type ขึ้น **Mixed**
- [ ] playlist ที่ไม่มี item เลย → คอลัมน์ Type ขึ้น **—**
- [ ] filter "All Types" มีตัวเลือก Video / Image / Mixed (ไม่ใช่ standard/dynamic แบบเดิม) และกรองได้ตรงกับคอลัมน์

## 3. Mark as ready
- [ ] มี playlist สถานะ **Draft** อย่างน้อย 1 แถว (ถ้าไม่มี สร้างผ่าน wizard เดิมหรือ API ชั่วคราว)
- [ ] เปิดเมนู "..." ของแถว draft → เห็นตัวเลือก **Mark as ready** อยู่บนสุด
- [ ] เปิดเมนู "..." ของแถวที่ไม่ใช่ draft → **ไม่เห็น** Mark as ready
- [ ] กด Mark as ready → badge เปลี่ยนจาก **Draft → Inactive** (ไม่ใช่ Active — ถูกต้องตาม ADR 0028 เพราะยังไม่มี publication ชี้)
- [ ] เปิดหน้า Create Publication → เลือก content → playlist ที่เพิ่ง mark ready **เลือกได้แล้ว** (ก่อนหน้านี้เลือกไม่ได้เพราะยังเป็น draft)

## 4. Search / filter / sort / pagination (ของเดิม ต้องยังทำงาน)
- [ ] พิมพ์ค้นหาชื่อ playlist → กรองถูกต้อง
- [ ] เปลี่ยน sort คอลัมน์ Type → เรียงตาม Video/Image/Mixed ถูกต้อง
- [ ] เปลี่ยนหน้า pagination → ทำงานปกติ

รายงานกลับ: ข้อไหนผ่าน/ไม่ผ่าน พร้อม screenshot หรือคำอธิบายถ้าอันไหนพัง
