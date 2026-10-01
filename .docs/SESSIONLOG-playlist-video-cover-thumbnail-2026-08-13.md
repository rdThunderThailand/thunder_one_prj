# SESSIONLOG — Playlist video-cover thumbnails 500 (2026-08-13)

## อาการ

หน้า `/playlists` thumbnail ไม่ขึ้นเลย console มี 3 บรรทัด:

```
GET /_next/image?url=https%3A%2F%2F...%2Fmedia%2Fvideos%2Fdb2b1bcf-....mp4%3Ftoken%3D...&w=128&q=75 500
```

## Root cause

`MediaThumb.tsx:14` ตัดสิน video/image จาก prop `kind`/`mimeType` เท่านั้น ถ้าไม่มีทั้งคู่จะ default ไป `<Image>` (มี comment เขียนไว้ตรงๆ ว่า "unknown → เดาว่าเป็นรูป")

จุดที่แสดง cover ของ playlist **ไม่มีข้อมูลนั้นให้ส่ง**:
- `PlaylistsListPage.tsx:59` และ `PlaylistDetailPanel.tsx:69` รู้แค่ `cover_asset_id` ไม่เคย fetch ตัว `MediaAsset` มาเลย
- `resolveCoverAssetId` (`metadata.ts:131-140`) fallback ไปใช้ `media_asset_id` ของ item แรกใน playlist เมื่อไม่ได้ตั้ง cover ไว้ — ซึ่งมักเป็นวิดีโอ
- preview URL ที่ได้เป็น signed URL ของ **ไฟล์ต้นฉบับ** ไม่ใช่ poster → `.mp4`

next/image โหลด mp4 มาแล้วถอดรหัสเป็นภาพไม่ได้ → 500

`PlaylistSummary.tsx:61` ไม่พังเพราะ join หา asset จริงแล้วส่ง `kind` มาด้วย (`:46`)

## ข้อเท็จจริงจาก prod ที่ตัดสินทางแก้ (อย่า re-derive)

- **ไม่มี poster/thumbnail ของวิดีโอในระบบเลย** — `media_core.media_assets` ไม่มีคอลัมน์ thumbnail/poster และ `metadata` เป็น `{}` ทุกแถว (10/10) ทางแก้แบบ "ใช้ฟิลด์ที่มีอยู่" จึงเป็นไปไม่ได้
- **โฟลเดอร์ใช้แยกประเภทไม่ได้** — ไฟล์รูปก็อยู่ใต้ `videos/` เหมือนกัน เช่น `videos/5d779c41-....png` เป็น `image/png` จริง
- `files.file_extension` เป็น NULL ทุกแถว ใช้ไม่ได้
- นามสกุลที่มีจริง: วิดีโอ `.mp4` (x5) `.mov` (x1, `video/quicktime`) · รูป `.png` (x3) `.webp` (x1)
- `media_assets.kind` เป็น `'image'`/`'video'` สะอาดดี แต่ไม่ไหลมาถึงหน้า playlist list
- **playlist ที่ไม่ใช่ draft ทั้ง 5 ตัวมี cover เป็น mp4 หมด** ไม่มีตัวไหน cover เป็นรูปเลย → หน้า `/playlists` พังทั้งหน้า ไม่ใช่บางแถว

## ทางแก้ที่เลือก

`src/lib/media-kind.ts` (ใหม่) — `isVideoUrl(url)` ดูนามสกุลท้าย URL โดยตัด `?token=` ออก (`/\.(mp4|mov|webm|m4v)(?:$|[?#])/i`)

ใช้เป็น **fallback ชั้นสุดท้ายเท่านั้น** — เงื่อนไขใน `MediaThumb` เป็น `!kind && !mimeType && isVideoUrl(url)` เพราะฉะนั้น call site เดิมที่ส่ง `kind` มาอยู่แล้วพฤติกรรมไม่เปลี่ยนเลย

แก้ 2 จุด:
- `MediaThumb.tsx` → ครอบคลุม `PlaylistsListPage` + `PlaylistDetailPanel`
- `AssetCard.tsx` playlist branch → ใช้ `<Image>` ตรงๆ ไม่ผ่าน MediaThumb เลยต้องแยก branch เอง (บั๊กเดียวกันในหน้า asset library ของ wizard)

ไม่เปลี่ยน `MediaThumb` ให้ใช้ `<img>` แทน next/image เพราะ `<img>` ชี้ไป mp4 ก็ได้ไอคอนรูปแตกอยู่ดี และเสีย optimization ของรูปจริงไปด้วย

**ทางที่ไม่เลือก:** ให้ endpoint `preview-urls` คืน `kind` มาด้วย — แก้ที่ต้นเหตุจริงกว่า แต่ต้องแก้ Thunder_Core + deploy ถึงจะเห็นผล บันทึกไว้ใน `ponytail:` comment ว่าถ้ารูปแบบไฟล์ที่รับเพิ่มขึ้นให้ไปทางนั้นแทนการต่อ list นามสกุล

## ที่ verify แล้ว

- `media-kind.check.mts` ผ่าน — assertion สองทาง (`.mp4`/`.mov` ต้องเป็น true, `.png`/`.webp` ใต้โฟลเดอร์ `videos/` ต้องเป็น false, กันเคส `mp4-poster.png` และ token ที่มี `.mp4` อยู่ข้างใน)
- `tsc --noEmit` 0 error · `eslint` 0 error
- **Browser: ผู้ใช้กดตาม checklist เองแล้วรายงานว่าผ่าน** (หน้า `/playlists`, detail panel, asset library ใน wizard, และ regression ของ asset การ์ดเดี่ยว)

## ยังไม่ได้ verify

เคส cover เป็น **รูป** และเคส **`.mov`** ยังไม่ได้เห็นด้วยตา เพราะ prod ไม่มีข้อมูลแบบนั้นอยู่เลย — ครอบคลุมด้วย unit check เท่านั้น

## Commit

`ae37fa6` fix(playlists): render video covers as video, not next/image (branch `feat/playlist`)
