# Browser checklist — MU-01 TUS upload (issue #25)

**สถานะ:** โค้ดเสร็จ · typecheck / lint / `upload-limits.check.mts` ผ่าน · DB + Storage อัปเดตแล้วทั้ง develop และ prod
**ยังไม่ได้ทดสอบ:** ทุกอย่างที่ต้องผ่านเบราว์เซอร์ (upload จริง, RLS ตอนใช้ user token จริง, Media Library)

## ทำไมต้องรัน Core ที่เครื่อง

`CORE_API_URL` ชี้ `https://thundercore.vercel.app` ซึ่ง deploy จาก `develop` — ยังเป็น route เก่า (key แบบ `videos/{uuid}.{ext}`, ไม่มี `storage_api_key`) ถ้าเทสต์กับตัวนั้น TUS จะพังแน่นอน

## Setup

1. Thunder_Core (branch `feat/upload-media-page`):

```bash
cd /Users/arty/Desktop/Thunder/project/Thunder_Core && npm run dev -- -p 3001
```

2. `thunder_one_prj/.env.local` — สลับสองบรรทัดนี้ชั่วคราว:

```
# CORE_API_URL=https://thundercore.vercel.app
CORE_API_URL=http://localhost:3001
```

3. รีสตาร์ต dev server ของ `thunder_one_prj` (ค่านี้อ่านตอน boot เท่านั้น) แล้วเช็ค `http://localhost:3000/api/proxy/__config` ว่า `coreApiUrl` เป็น localhost:3001

4. Login เข้าระบบให้เรียบร้อย (TUS ใช้ token ของ user จริง ไม่ใช่ signed token แล้ว)

## ขั้นตอนที่ต้องเช็ค

| # | ทำ | ผลที่คาดหวัง |
|---|---|---|
| 1 | เปิด `/media-workspace/assets` → Upload Asset → เลือกไฟล์ MP4 เล็ก (< 6 MB) | progress เดินจนครบ, asset ใหม่โผล่ในลิสต์, thumbnail ขึ้น |
| 2 | ดู Network tab ระหว่างอัปโหลด | มี `POST` แล้ว `PATCH` ไป `https://<ref>.storage.supabase.co/storage/v1/upload/resumable` (ไม่ใช่ PUT ไป `/object/upload/sign/`) |
| 3 | อัปโหลดไฟล์ที่ใหญ่กว่า 6 MB (เช่น MP4 ~20 MB) | เห็น `PATCH` หลายก้อน ก้อนละ 6 MB, progress เดินเป็นช่วง, จบแล้ว asset ใช้งานได้ |
| 4 | ตรวจ key ของ asset ใหม่ใน Supabase Storage (`media` bucket) | key เป็น `videos/THUNDER_001/<uuid>.mp4` — มี tenant_code คั่น ไม่ใช่ `videos/<uuid>.mp4` |
| 5 | เลือกไฟล์ `.mov` หรือ `.pdf` | ถูกปฏิเสธที่หน้าเว็บ ไม่มี request ออกไปเลย |
| 6 | เลือกโฟลเดอร์ใน Media Library แล้วอัปโหลด | asset ใหม่อยู่ในโฟลเดอร์นั้น ไม่ใช่ root |
| 7 | เปิด asset เก่าที่ key เป็น `videos/<uuid>.<ext>` (ของเดิม) แล้วกด preview / play | ยังเล่นได้ตามปกติ ไม่มี migration |
| 8 | ระหว่างอัปโหลดไฟล์ใหญ่ ปิด Wi-Fi ~10 วิ แล้วเปิดใหม่ | tus retry เอง (`retryDelays`) แล้วไปต่อจากจุดเดิม ไม่เริ่มนับ 0 ใหม่ |

## เช็คฝั่ง server (ไม่ต้องใช้เบราว์เซอร์ ผมรันให้ได้ถ้าต้องการ)

- ยิง `POST /media/videos` ซ้ำด้วย `file_id` เดิม → ต้องได้ `media_asset_id` ตัวเดิม ไม่เกิด asset ใหม่
- ยิง `POST /media/videos/upload-url` ด้วย `file_size_bytes` > 5 GB หรือ `mime_type: application/pdf` → ต้องได้ `Invalid input: ...`

## ถ้าเจอ 403 "new row violates row-level security policy"

แปลว่า token ที่เบราว์เซอร์ส่งไม่ผูกกับ membership ที่ `status='active'` หรือ tenant_code ไม่ตรง — เช็คด้วย SQL:

```sql
select public.media_upload_prefix_allowed('videos/THUNDER_001/x.mp4');
```

(ต้องรันในบริบทของ user นั้น — `set local role authenticated; set local request.jwt.claims = '{"sub":"<user_id>"}';`)

## หลังเทสต์เสร็จ

คืนค่า `CORE_API_URL` ใน `.env.local` กลับเป็น `https://thundercore.vercel.app`
