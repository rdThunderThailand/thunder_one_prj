# SESSIONLOG — asset preview performance (2026-08-14)

Branch: `feat/playlist`

## คำถามตั้งต้น

1. โปรเจกต์ควรใช้ SWR หรือ Redis ทำ caching มั้ย
2. หน้าเลือก content ทำให้ preview ของ asset โหลดเร็วกว่านี้ได้มั้ย
3. ควรรับ upload วิดีโอทุกฟอร์แมตแล้วแปลงเองมั้ย

## สรุปข้อ 1 — ไม่เอาทั้ง SWR และ Redis

- frontend เป็น BFF บางๆ เรียก `thundercore.vercel.app` ข้อมูลเป็น per-tenant + mutate บ่อย → hit rate ต่ำ invalidation แพง
- แคชผิดชั้นแล้ว tenant leak คือบั๊ก security ไม่ใช่บั๊ก perf
- ไม่มีตัวเลข latency ที่วัดแล้วมารองรับ → YAGNI
- ถ้าจำเป็นจริงในอนาคต ใช้ของที่ Next 16.2 มีอยู่แล้ว (`'use cache'` + `cacheLife`/`cacheTag` + `revalidateTag`) ไม่ต้องเพิ่ม dependency
  - ยืนยันว่ามีจริงในเวอร์ชันนี้: `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/cacheTag.md`

## ข้อเท็จจริงที่ยืนยันแล้ว — อย่า re-derive

query prod DB (Supabase MCP `execute_sql`) เมื่อ 2026-08-14:

- ตาราง `files` **ไม่มีคอลัมน์ thumbnail / poster / preview** — มีแค่ `storage_key`, `mime_type`, `file_size_bytes`
- `file_versions` ก็มีแค่ `storage_key`, `file_size_bytes`
- ขนาดไฟล์จริงในระบบ:

  | mime_type | จำนวน | เฉลี่ย | สูงสุด |
  |---|---|---|---|
  | `video/mp4` | 8 | 11 MB | 24 MB |
  | `video/quicktime` | 1 | 27 MB | 27 MB |
  | `image/png` | 3 | 501 kB | 1022 kB |
  | `image/jpeg` | 1 | 31 kB | 31 kB |
  | `image/webp` | 1 | 43 kB | 43 kB |

- **คอขวดจริงคือขนาด payload ไม่ใช่จำนวนครั้งที่ยิง** — กริดเรนเดอร์ `<video src="...#t=0.1" preload="metadata">` ทุกใบพร้อมกัน `#t=0.1` บังคับ browser ให้ seek + decode จริง = ดาวน์โหลดวิดีโอ 11–27 MB มาวาดรูปนิ่ง 1 เฟรม
- มี `video/quicktime` อยู่ในระบบแล้ว 1 ไฟล์ ทั้งที่ระบบตั้งใจรับแค่ mp4 — `accept="video/*,image/*"` รับทุกอย่างแล้วปล่อยไปพังทีหลัง
- signed URL หมุน token ทุกครั้งที่ mount (`usePreviewUrls` อายุ 1 ชม.) → URL ไม่ซ้ำ → **browser HTTP cache ไม่เคย hit และ `/_next/image` optimizer miss ทุกรอบ** ต้อง refetch ต้นฉบับมา resize ใหม่ทุกครั้งที่เข้าหน้า

## ที่ทำไปแล้วในเซสชันนี้

### lazy-mount video thumbnail (ตัวเลือกที่ 2 จาก 4 ตัวเลือกที่เสนอ)

ไฟล์ใหม่ `src/components/ui/LazyVideo.tsx` — `<video>` ที่ยังไม่ set `src`
จนกว่าจะเข้าใกล้ viewport (IntersectionObserver, `rootMargin: 200px`) ใช้ native
API ไม่เพิ่ม dependency

เปลี่ยน call site ที่เป็น grid thumbnail 3 จุด:

- `src/components/ui/MediaThumb.tsx:31`
- `src/features/publications/components/AssetCard.tsx` (branch playlist + branch asset)

**ไม่แตะ** `ContentSummaryPanel.tsx:51` และ `ScheduleStep.tsx:547` — สองอันนั้นเป็น
player เดี่ยวมี `controls` อยู่บนสุดของหน้า lazy ไปก็ไม่ได้อะไร

### upload format gate

ไฟล์ใหม่ `src/features/publications/upload-limits.ts` + `upload-limits.check.mts`

เดิม `accept="video/*,image/*"` รับทุกอย่างแล้วปล่อยไปพังทีหลัง (จึงมี `.mov` 27 MB
ค้างอยู่ใน prod) ตอนนี้:

- `accept` แคบลงเป็น `.mp4,.png,.jpg,.jpeg,.webp` เพื่อให้ OS picker กรองก่อน
- `rejectUploadReason()` เป็น gate จริงใน `handleFilePicked` — `accept` เป็นแค่ hint ที่ผู้ใช้ override ได้
- วิดีโอที่ไม่ใช่ mp4 ได้ข้อความบอกให้แปลงก่อน ส่วนไฟล์อื่นได้ข้อความทั่วไป
- `File.type` ว่าง → fallback ไปดูนามสกุล (เคสที่ทำให้ `.mov` หลุดเข้ามา)
- แสดง "รองรับ MP4, PNG, JPG, WebP" ที่แถบสถานะเหนือกริด — เดิมไม่บอกอะไรเลย

**นี่คือมาตรการชั่วคราวระหว่างรอ decision เรื่อง transcoding** ถ้าเคาะว่าทำ pipeline
แล้ว gate นี้ต้องคลายออกเป็น "รับกว้าง แล้วแปลง"

## ที่ verify แล้ว / ยังไม่ได้ verify

- `node src/features/publications/upload-limits.check.mts` ผ่าน exit 0
- `npx tsc --noEmit` ผ่าน exit 0
- `npx eslint` บนไฟล์ที่แก้ทุกไฟล์ ผ่าน ไม่มี warning
- **ยังไม่ได้ทดสอบผ่าน browser** — ผู้ใช้เลือกรับ checklist ไปเช็คเอง ยังไม่มีผลกลับ
  → งานนี้นับเป็น **unverified** ถ้าเปิด PR ต้องเป็น Draft

  upload gate ก็ยังไม่ได้กดลองผ่าน UI จริง — logic มี check ครอบแล้ว แต่ยังไม่เห็น
  ข้อความ error ขึ้นบนหน้าจอ

checklist ที่ส่งให้: เปิด DevTools → Network → filter Media → Disable cache แล้วดูว่า
(ก) ตอนยังไม่เลื่อน มี request `.mp4` เฉพาะการ์ดที่อยู่ในจอ ไม่ใช่ครบทุกใบ
(ข) เลื่อนแล้ว request ทยอยเข้ามา (ค) การ์ดที่เลื่อนผ่านแล้วเฟรมแรกขึ้น ไม่ค้างเทา
(ง) thumbnail วิดีโอในหน้า `/playlists` ยังขึ้นเหมือนเดิม

## ทางเลือกที่เสนอแต่ยังไม่ได้ทำ

เรียงตามคุ้ม→แพง:

1. **backend สร้าง poster ตอน upload เก็บเป็น `thumbnail_key`** ← ตัวจริง ทางอื่นคือการเกลี่ยความช้า อันนี้คือการเอาออก · แตะ `Thunder_Core` + migration + design fork
2. lazy-mount video ← **ทำแล้ว**
3. **signed URL ปัด expiry เป็นช่วง (เช่นปัดเป็นชั่วโมง)** เพื่อให้ URL ซ้ำ → browser cache และ Next image optimizer hit ได้ · แก้ที่จุด sign ฝั่ง backend ไม่กี่บรรทัด
4. **ตัด waterfall** — ตอนนี้ `/media/videos` → `/media/videos/preview-urls` → โหลดรูป = 3 hop เรียงกันก่อนเห็นภาพแรก ถ้า list endpoint คืน signed URL มาเลยจะเหลือ 2

## DECISION PENDING — transcoding pipeline

คำถามข้อ 3 ยังไม่เคาะ ยังไม่มี ADR

ความเห็นที่ให้ไป: **เห็นด้วยกับทิศทาง แต่ไม่ควรอยู่ใน sprint นี้**

- transcoding ไม่ใช่ feature แต่เป็นระบบ — ffmpeg บน Vercel serverless รันไฟล์ 27 MB
  ไม่ไหว (timeout/memory) ต้องมี worker แยก + job queue + สถานะ `processing`/`failed`
  ใน UI + retry + cost ของ compute
- แต่ **thumbnail generation กับ transcoding คือ pipeline เดียวกัน** (upload → job →
  ffmpeg → เก็บ) ต่างกันแค่ ffmpeg ทำอะไร ถ้าจะสร้าง pipeline ควรออกแบบให้รองรับทั้งสอง
  ตั้งแต่แรก แต่ sprint นี้ส่งแค่ thumbnail — ได้คุณค่าส่วนใหญ่ด้วย compute ที่ถูกกว่ามาก
- ถ้าเคาะว่าเอา ให้เปิด `grill-with-docs` ซอย pipeline ก่อน แล้วลง ADR
