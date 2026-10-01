# Browser checklist — MU-02 staged upload queue (issue #26)

**สถานะ:** โค้ดเสร็จ · `npx tsc --noEmit` 0 errors · lint ผ่านทุกไฟล์ที่แก้/เพิ่ม · `upload-queue.check.mts` ผ่าน
**ยังไม่ได้ทดสอบ:** ทุกอย่างที่ต้องผ่านเบราว์เซอร์ — นี่คือ checklist สำหรับจุดนั้น

## Setup

`.env.local` ของ repo นี้ชี้ `CORE_API_URL=http://localhost:3001` ค้างจากรอบ MU-01 อยู่แล้ว (บรรทัด `https://thundercore.vercel.app` ถูกคอมเมนต์ไว้) — **ห้ามแก้กลับ** ก่อนเทสต์รอบนี้ ไม่งั้นจะไปชนกับ Core บน `develop` ที่ยังเป็น route เก่า

1. Thunder_Core (branch `feat/upload-media-page`, มี MU-01 อยู่แล้ว):

```bash
cd /Users/arty/Desktop/Thunder/project/Thunder_Core && npm run dev -- -p 3001
```

2. thunder_one_prj (branch `feat/media-upload-page`):

```bash
npm run dev
```

3. เช็ค `http://localhost:3000/api/proxy/__config` ว่า `coreApiUrl` เป็น `http://localhost:3001`
4. Login ให้เรียบร้อยก่อน (TUS ใช้ access token ของ user จริง)
5. เตรียมไฟล์ทดสอบ: MP4/PNG/JPG/WebP ตัวเล็กหลายไฟล์ (พอสำหรับ 10 ไฟล์), ไฟล์ที่ไม่รองรับ 1 ไฟล์ (`.pdf` หรือ `.mov`), และถ้าเป็นไปได้ไฟล์ MP4 ที่ใหญ่พอจะเห็น progress เดินช้าๆ (หลาย MB) เพื่อจับจังหวะ 2-worker ให้ทัน

## หน้าที่เทสต์

`http://localhost:3000/media-workspace/assets/upload` — เข้าได้ 2 ทาง: พิมพ์ URL ตรง หรือกดปุ่ม **Upload** ที่ `/media-workspace/assets` (ต้องพาไปหน้านี้ ไม่ใช่เปิด file picker แบบเดิม)

## ขั้นตอนที่ต้องเช็ค

| # | ทำ | ผลที่คาดหวัง |
|---|---|---|
| 1 | เลือกหรือลากไฟล์ 3 ไฟล์ที่รองรับลงคิว | ไฟล์ขึ้นเป็นแถวสถานะ `Staged` ทันที **ไม่มี network request ออกไปเลย** (เช็ค Network tab ว่านิ่ง) |
| 2 | ลองเพิ่มไฟล์ชื่อ/ขนาดซ้ำกับที่อยู่ในคิวแล้ว | ถูกปฏิเสธ พร้อมข้อความ "ไฟล์นี้อยู่ในคิวแล้ว" ไม่เพิ่มแถวใหม่ |
| 3 | ลองเพิ่มไฟล์ `.pdf` หรือ `.mov` | ถูกปฏิเสธก่อนเข้าคิว ไม่มี request `upload-url` ออกไป |
| 4 | เพิ่มไฟล์จนครบ 10 แล้วลองเพิ่มไฟล์ที่ 11 | ไฟล์ที่ 11 ถูกปฏิเสธ พร้อมข้อความ "คิวเต็มแล้ว" |
| 5 | ยังไม่เลือก Folder แล้วกด `Start Upload` | ปุ่มถูก disable (ไม่ให้กด) จนกว่าจะเลือก Folder |
| 6 | เลือก Folder → กด `Start Upload` (มี 5+ ไฟล์ในคิว) | แถวแรกๆ เปลี่ยนเป็น `Waiting` แล้วเข้า `Uploading` **สูงสุด 2 แถวพร้อมกันเท่านั้น** ที่เหลือค้างที่ `Waiting` — ดู progress % เดินของทั้งสองแถวนั้น |
| 7 | ระหว่างมี 2 แถวกำลังอัปโหลด ดู Network tab | เห็น `PATCH` ไป `https://<ref>.storage.supabase.co/storage/v1/upload/resumable` สำหรับทั้งสองไฟล์พร้อมกัน (ไม่ใช่ทีละไฟล์) |
| 8 | ปล่อยให้ไฟล์หนึ่ง fail (เช่น ปิด Wi-Fi ตอนกำลังอัปโหลดไฟล์นั้น แล้วรอ retry ของ tus หมด หรือใช้ไฟล์ที่ทำให้ Core ปฏิเสธ) | เฉพาะแถวนั้นเปลี่ยนเป็น `Failed` **แถวที่กำลังอัปโหลดอีกแถวไม่หยุด/ไม่กระทบ** และแถวถัดไปใน `Waiting` เข้าคิวแทนที่ slot ที่ว่าง |
| 9 | กด `Retry` บนแถวที่ `Failed` | แถวกลับไป `Waiting` แล้วอัปโหลดใหม่จนสำเร็จ (ไม่ต้อง resume จาก chunk เดิม — resume แท้เป็นสโคปของ MU-03) |
| 10 | ระหว่างมีแถว `Waiting`/`Uploading` ค้างอยู่ ลองปิดแท็บหรือ refresh | เบราว์เซอร์ถามยืนยันก่อนออกจากหน้า (`beforeunload`) |
| 11 | อัปโหลดจนครบทุกไฟล์สำเร็จ (สถานะ terminal ทั้งหมด: `Completed`/`Failed`/`Canceled`) | ปุ่ม aggregate เปลี่ยนเป็น `Clear All` |
| 12 | กด `Clear All` | แถวหายจากคิว **แต่ Asset ที่ลงทะเบียนสำเร็จแล้วยังอยู่ใน Media Library ปกติ** (ไม่ถูกลบ) |
| 13 | เปิด Media Library ตรวจ Asset ที่เพิ่งอัปโหลดสำเร็จ | อยู่ใน Folder ที่เลือกไว้ตอน Start Upload ทุกตัว (ไม่ใช่ root) |
| 14 | ระหว่างมีแถว `Staged` (ยังไม่กด Start) ลองกด aggregate button | label เป็น `Clear Queue` และกดแล้วลบเฉพาะแถว staged |
| 15 | เช็คปุ่ม/ส่วนที่ต้อง disabled หรือซ่อนตาม control matrix | `Add from Source` และ `Tags` เห็นแต่กดไม่ได้ ("Coming in Phase 2") · `Pause All` และ Storage Usage **ไม่ปรากฏบนหน้าเลย** |

## Known scope — ไม่ต้องเช็ค (ของ ticket อื่น)

- TUS resume จริงหลัง interrupt (ต่อ chunk เดิม) — MU-03 (#27)
- server-side sweep ของ reservation ที่ถูกทิ้งค้าง (ปิดเบราว์เซอร์กลางคัน) — MU-03 (#27)
- Figma-faithful styling, thumbnail สวยงาม, Recent Uploads card — MU-04 (#28)
- Tags จริง — MU-05 (#29)

## หลังเทสต์เสร็จ

ไม่ต้องคืนค่า `.env.local` — MU-03/MU-04 จะใช้ setup เดิมต่อ (Core ต้องรัน local จนกว่า MU ชุดนี้เสร็จและ merge ขึ้น develop)
