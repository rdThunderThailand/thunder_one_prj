# SESSIONLOG — MU-01 tenant-scoped 5 GB TUS upload (issue #25)

**วันที่:** 2026-09-02
**Branch:** `thunder_one_prj@feat/media-upload-page`, `Thunder_Core@feat/upload-media-page`
**อ้างอิง:** [ADR-0059](../docs/adr/0059-staged-resumable-media-upload.md), [plan](../docs/media-library/plan-media-upload.md), issue #25

## สิ่งที่ทำ

### Thunder_Core

- `media/videos/upload-url/route.ts` — validate MIME/นามสกุล/ขนาด (1 byte–5 GB) ก่อนจอง `files` row, resolve `tenants.tenant_code` ฝั่ง server แล้วสร้าง key `videos/{tenant_code}/{uuid}.{ext}`, เพิ่ม `bucket` / `upload_endpoint` / `storage_api_key` / `max_file_size_bytes` ใน response (คง `upload_url` + `token` เดิมไว้ไม่ให้ contract พัง)
- migration `20260902100000_media_video_register_idempotent.sql` — `media_video_register` คืน asset เดิมถ้า `(tenant_id, file_id)` มีอยู่แล้ว
- migration `20260902110000_media_storage_tenant_scoped_upload.sql` — `media_upload_prefix_allowed()` + RLS INSERT policy บน `storage.objects`

### thunder_one_prj

- `+ tus-js-client` (อนุมัติแล้ว — TUS resume/retry/chunk เขียนเองไม่กี่บรรทัดไม่ได้)
- `upload-api.ts` — `uploadToStorage` เปลี่ยนจาก signed PUT เป็น TUS 6 MB chunk ยิงตรง `*.storage.supabase.co`, `registerVideo` type ตรงกับ contract จริง `{ media_asset_id, status }`, เพิ่ม `resolveUploadMimeType` ให้ picker กับ request ส่ง mime ค่าเดียวกัน
- `api/auth/storage-token/route.ts` — route ใหม่ อ่าน cookie `to_at` (httpOnly) ส่ง access token ให้ browser เฉพาะงาน TUS
- `useAssetUpload.ts` — หลัง register แล้ว `fetchMediaAsset(media_asset_id)` เพื่อให้ callback ที่ auto-select ได้ asset จริง (เดิมได้ `undefined` เงียบๆ มาตลอด)
- `upload-limits.ts` — เพดาน 5 GB + กันไฟล์ว่าง, `upload-limits.check.mts` เพิ่มเคส boundary

### Production (R0 — อนุมัติแล้วทั้งหมด)

| การกระทำ | develop `ftfmokgphewzyxzwjitv` | prod `sfiefevtxalqjizdkcsw` |
|---|---|---|
| `media_video_register` idempotent | ✅ | ✅ |
| `media_upload_prefix_allowed` + RLS policy | ✅ | ✅ |
| bucket `media` `file_size_limit` → 5 GB | ✅ (เดิม 500 MB) | เดิม 5 GB อยู่แล้ว |
| bucket `media` `allowed_mime_types` เหลือ mp4/jpeg/png/webp | ✅ | ✅ (ตัด webm/quicktime/mkv) |

ตรวจหลัง apply: grants ของ `media_video_register` ยังเป็น `service_role`/`postgres` เท่านั้น (CREATE OR REPLACE ไม่ได้เปิดให้ PUBLIC), prod body เดิมไม่มี drift จาก develop

## เรื่องที่เจอระหว่างทาง

- **Supabase Storage 1.71.0 ไม่รองรับ presigned resumable (`x-signature`)** ทั้ง develop และ prod — ยิงทดสอบ 4 แบบ: `x-signature` เดี่ยว → `Invalid Compact JWS`, `x-signature`+apikey → RLS error (คือถูกมองเป็น anon), service key → 201. เอกสาร Supabase เขียนว่ารองรับ แต่เวอร์ชันที่รันอยู่ไม่ใช่
  → ต้องใช้ user JWT จริงในเบราว์เซอร์ แล้วย้ายการบังคับ tenant prefix ไปอยู่ที่ RLS (design fork นี้ผู้ใช้เคาะแล้ว)
- **`CREATE OR REPLACE` พังถ้าไม่ใส่ parameter default เดิม** — `cannot remove parameter defaults from existing function` ต้อง copy `DEFAULT NULL` ครบทุกตัว
- **`LIKE` มองว่า `_` เป็น wildcard** — policy รุ่นแรกใช้ `p_name LIKE 'videos/' || tenant_code || '/%'` ซึ่ง `THUNDER_001` ทำให้ `videos/THUNDERX001/…` ผ่านได้ (ยิงทดสอบแล้วผ่านจริง) แก้เป็นเทียบ `split_part()` ทีละ segment

## Verified — ทุก AC ของ #25

| AC | ผล | layer ที่ทดสอบจริง |
|---|---|---|
| 1. MP4/PNG/JPG/WebP อัปโหลดผ่าน TUS แล้วลงทะเบียนเป็น 1 Asset | ✅ | เบราว์เซอร์ (ผู้ใช้): MP4 5.8 MB และ 12 MB, เห็น `POST`/`PATCH` ไป `.storage.supabase.co/storage/v1/upload/resumable`, chunk ละ 6 MB |
| 2. key เป็น `videos/{tenant_code}/{uuid}.{ext}` และ client เลือก prefix เองไม่ได้ | ✅ | เบราว์เซอร์ (key เป็น `videos/THUNDER_001/<uuid>.mp4`) + SQL: policy predicate ปฏิเสธ tenant อื่น / lookalike `THUNDERX001` / key เก่า / root อื่น |
| 3. Core และ Storage ปฏิเสธ type ที่ไม่รองรับและไฟล์เกิน 5 GB | ✅ | Core: `upload-url/schema.check.mts` (mime ไม่รองรับ, นามสกุลไม่ตรง mime, > 5 GB, size 0/ไม่ส่ง) · Storage: pdf/mov/webm ตอบ `415 invalid_mime_type` ทั้ง develop และ prod · client: `.pdf` ถูกปฏิเสธในเบราว์เซอร์ |
| 4. register คืน `{media_asset_id, status}` และ retry `file_id` เดิมไม่สร้าง Asset ซ้ำ | ✅ | RPC บน develop: เรียกซ้ำด้วย `file_id` เดิม → `media_asset_id` ตัวเดิม, จำนวนแถว 1 → 1 · `file_id` ข้าม tenant → `not found: file not found for this tenant` |
| 5. Folder ที่เลือกถูกบันทึกแบบ atomic และ Asset โผล่ใน Media Library | ✅ | RPC บน develop ในทรานแซกชันที่ ROLLBACK: `folder_id` ถูกเซ็ตโดย INSERT ของการลงทะเบียนเอง, `media_videos_list` กรองด้วยโฟลเดอร์นั้นเจอ 1 รายการ, ตรวจแล้วไม่มีข้อมูลตกค้าง |
| 6. object เดิม `videos/{uuid}.{ext}` ยัง preview/play ได้โดยไม่ต้อง migrate | ✅ | Storage บน prod: sign + download คืน 200 พร้อม byte ครบ ทั้ง `.mov` (27.9 MB) `.webp` `.jpg` — รวมถึงไฟล์ quicktime ที่ mime ไม่อยู่ใน allowed list แล้ว (list กันเฉพาะ upload) |

**layer ที่ต้องพูดให้ตรง:** AC 4 และ 5 ทดสอบที่ชั้น RPC ไม่ใช่ผ่าน HTTP route — route เป็นตัวส่งผ่าน (ดึง tenant จาก membership แล้วส่ง arg ต่อ) ส่วน happy path ของ route ผู้ใช้ยิงผ่านเบราว์เซอร์จริงแล้วใน AC 1

**ไม่ได้ทดสอบ (อยู่นอก AC ของ #25):** TUS resume หลังเน็ตหลุด — เป็นขอบเขตของ MU-03 (#27)

## ค้างไว้

- ~~global upload limit ระดับ project~~ — ผู้ใช้ตั้งเป็น 5 GB แล้ว 2026-09-02
- `videos/TUSCHECK/…` — ระหว่างทดสอบไม่มีไฟล์ไหนอัปโหลดสำเร็จ (ทุกครั้งโดนปฏิเสธ) จึงไม่มีขยะค้างใน develop
- issue #25 ปิดแล้ว · PR รอเปิดตอนจบ MU ทั้งชุด (#26–#29) ตามที่ผู้ใช้สั่ง
