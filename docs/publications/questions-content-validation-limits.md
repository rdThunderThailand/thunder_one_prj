# คำถามถึงทีมที่เกี่ยวข้อง — Content step file-type validation limits

## บริบท

`CLICKUP_FLOW_AUDIT_GAPS.md` § 3 Content ระบุว่า Content step ยังไม่มี validation ก่อน/หลัง
upload (file type, size, duration, dimensions) — ดู [`ContentStep.tsx`](../../src/features/publications/components/ContentStep.tsx)
และ [`upload-api.ts`](../../src/features/publications/services/upload-api.ts)

`CONTEXT.md` ยืนยันเฉพาะ **ชนิดไฟล์ที่รองรับ**: JPG, PNG, MP4 (H.264) — ไม่มีตัวเลข limit ใดๆ
ระบุไว้ทั้งใน CONTEXT.md, ClickUp, และโค้ด (backend/frontend) จึงยังเขียน validation ไม่ได้
(NO MAGIC — ห้ามเดาตัวเลข)

## คำถามที่ต้องการคำตอบ

### ขนาดไฟล์ (file size)
- จำกัดขนาดสูงสุดต่อไฟล์เท่าไหร่? แยกตามชนิดไฟล์ (image vs. video) หรือใช้ค่าเดียวกันหมด?
- มีขั้นต่ำไหม (กันไฟล์เสีย/ว่าง)?

### รูปภาพ (JPG/PNG)
- ขนาด (dimension) ต่ำสุด/สูงสุดที่รับ (เช่น กว้าง×สูงเป็นพิกเซล)?
- ต้องบังคับ aspect ratio ตาม screen orientation (portrait/landscape) ไหม หรือ crop/fit ทีหลังได้?

### วิดีโอ (MP4/H.264)
- ความยาว (duration) สูงสุด/ต่ำสุดที่รับ?
- resolution สูงสุด/ต่ำสุด?
- จำกัด framerate/bitrate ไหม หรือปล่อยผ่านตามไฟล์ที่ผ่าน format check?

### พฤติกรรมเมื่อไฟล์ไม่ผ่าน
- Reject ทันทีก่อน upload (client-side) หรือ upload แล้วค่อย reject (server-side หลัง process)?
- ข้อความ error ที่ควรแสดงให้ user ต้องระบุอะไรบ้าง (เช่น "ไฟล์เกิน 50MB" ชัดๆ หรือ generic พอ)?

## ผลกระทบถ้าไม่ตอบ

ข้อนี้ยังคง "blocked" ใน `CLICKUP_FLOW_AUDIT_GAPS.md` § 3 — จะยังไม่เขียน validation logic หรือ
test จนกว่าจะได้ตัวเลขจริงอย่างน้อยหนึ่งชุด (image size limit, video duration/size limit)
