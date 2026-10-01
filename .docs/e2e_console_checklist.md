# E2E Test Console — วิธีใช้ + checklist กดจริง

หน้า POC สำหรับกดทดสอบ Media API ทั้งวง (คล้าย Swagger UI แต่กดตาม flow ได้เลย) — **ไม่ใช่หน้า dashboard จริง**

## เตรียม

1. กรอก [.env.local](../.env.local):
   - `CORE_API_URL` = origin ของ Thunder_Core (เช่น `http://localhost:3001`) ห้ามมี `/` ปิดท้าย ห้ามใส่ `/api`
   - `CORE_API_KEY` = `x-api-key` ของ application Thunder One ที่ลงทะเบียนใน Thunder_Core
2. `pnpm dev` → เปิด http://localhost:3000/e2e
3. มุมขวาบนต้องขึ้น `Proxy Target: <CORE_API_URL>` ไม่ใช่ `(Not set)` และแถบเตือนสีส้มต้องหาย

## Seed data (ลงบน prod ThunderCore แล้ว — ดู [seed_thunderone.sql](seed_thunderone.sql))

| อะไร | ค่า |
|---|---|
| tenant | `ThunderOne` / `THUNDERONE` — `11110000-0000-4000-8000-000000000001` |
| application + `x-api-key` | `Thunder One` — key อยู่ใน `.env.local` แล้ว |
| จอ 01 | `11110000-0000-4000-8000-000000000011` · device token `dtk_6625464d12389e2235c325738ba6dbde3bf7f4edd55d6c80` |
| จอ 02 | `11110000-0000-4000-8000-000000000012` · device token `dtk_d92b8fbab4fc461aaea04f3b5137b1a6121d4c0f7cfc2495` |
| channel | `ThunderOne Lobby Channel` — `11110000-0000-4000-8000-000000000021` (มีจอ 01+02) ไว้เทส `target_type:"channel"` |

membership/users ยังไม่ผูก — user จัดการเอง · rollback SQL อยู่ท้ายไฟล์ seed

ไฟล์วิดีโอตัวอย่างพร้อมกดอยู่แล้วที่ `public/sample/sample-360p-10s.mp4` (mp4 h264 360p 10 วิ ~968KB) — ปุ่ม **"ใช้ไฟล์ตัวอย่าง"** ในหน้า Videos ดึงมาให้เอง หรือจะ Choose File ไฟล์ตัวเองก็ได้

## Checklist (ทำตามลำดับ ทุกขั้นต้องเห็น log status 2xx ในแผง Request Log ขวามือ)

- [ ] **1. Videos** → "ใช้ไฟล์ตัวอย่าง" → Upload Video
      ต้องเห็น 3 request: `POST /media/videos/upload-url` → PUT เข้า Supabase Storage (progress bar เดิน) → `POST /media/videos`
- [ ] **2. Videos** → Refresh List เห็นวิดีโอที่เพิ่งอัป
- [ ] **3. Screens** → Refresh Screens เห็นจอ + badge online/offline → ติ๊กเลือกอย่างน้อย 1 จอ
      *(จอจะโผล่เฉพาะ asset ที่มี `device_credentials` แล้ว)*
- [ ] **4. Playlists** → ตั้งชื่อ → Create → เพิ่มวิดีโอเข้า playlist → ตั้ง duration → Save items
- [ ] **5. Publish** → Publish Playlist → ได้ publication id → เปิด auto refresh 5s เห็น target status = `pending`
- [ ] **6. Player** → วาง device token (`device_credentials.access_token` ของจอที่เลือก) → Poll Jobs
      ต้องเห็น job + `file.url` → กดลิงก์/เล่นใน `<video>` ได้จริง = **ไฟล์ไปถึงจอจริง**
- [ ] **7. Player** → Ack `playing` → กลับไปกด 5 ซ้ำ เห็น status เปลี่ยน → Poll Jobs อีกรอบต้องไม่มี job เดิม
- [ ] **8. Player** → Send Heartbeat → กลับไป Screens Refresh เห็น badge online
- [ ] **9. Player** → Simulate Playback Log ผ่าน

ครบ 9 ข้อ = CHECKPOINT 2 (DoD ของ MVP) ผ่าน

## หมายเหตุ

- Browser ไม่ยิง Thunder_Core ตรง ๆ — ผ่าน BFF proxy `/api/proxy/*` ในรีโปนี้ (`src/app/api/proxy/[...path]/route.ts`) เพื่อไม่ให้ API key หลุดเข้า browser และไม่ต้องแก้ CORS ที่ Thunder_Core
  ยกเว้นขั้น PUT ไฟล์ที่ยิงตรงเข้า Supabase Storage ตามดีไซน์ (ไฟล์ 50–500MB ไม่ควร proxy)
- ยังไม่ได้ verify กับ Thunder_Core จริง — `pnpm build` / `pnpm lint` ผ่าน และหน้า render + log panel ทำงาน แต่ยังไม่มี `CORE_API_URL`/`CORE_API_KEY` ตอนทดสอบ
- แผง **Raw HTTP Request** ไว้ยิง endpoint ที่ยังไม่มีปุ่ม (ใส่ path/JSON เอง, ติ๊ก device token ได้)
