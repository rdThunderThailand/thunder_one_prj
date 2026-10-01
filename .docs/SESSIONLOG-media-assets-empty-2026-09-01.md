# SESSIONLOG — preview modal "Missing asset" / thumbnails ไม่ขึ้น (2026-09-01)

Branch: `codex/fix-layout-preview-modal`

## อาการ
- `/media-workspace/layouts/<id>?preview=1` → preview modal ขึ้น "Missing asset" ทุก zone
- หน้า composition editor ไม่แสดง thumbnail ของ asset และ playlist เลย

## Root cause
Thunder_Core migration `20260829040259_nested_feature_folders_and_trash.sql` เปลี่ยน RPC
`media_videos_list` ให้คืน `jsonb_build_object('items', ..., 'total', ..., 'stats', ...)`
→ `GET /api/core/v1/media/videos` คืน object ไม่ใช่ array

ฝั่ง frontend commit `ab9bad1` เพิ่ม `fetchMediaAssetPage()` ตัวใหม่ที่อ่าน shape ใหม่ถูก
แต่ไม่ได้แก้ `fetchMediaAssets()` ที่ยังเป็น `Array.isArray(data) ? data : []`
→ คืน `[]` เงียบๆ ไม่ throw

ผลกระทบต่อเนื่อง: `assets = []` → `previewIds = []` → effect ที่เรียก
`POST /media/videos/preview-urls` ไม่เคยยิงเลย → ไม่มี signed URL ทั้งหน้า
และ `PreviewSurface` หา asset ไม่เจอ → fallback เป็น "Missing asset"

## Fix
`src/lib/api/media-api.ts` — `fetchMediaAssets()` อ่าน `data.items` และ page ผ่านทั้งหมด
(`page_size=200`, วนจนได้หน้าที่ไม่เต็ม) กันเคส asset เกิน 200 ตัวขาดไปแบบเงียบๆ อีกรอบ

ไม่แตะ `fetchMediaAssetPage()` — หน้า library ตั้งใจ paginate อยู่แล้ว

## Verification
Checklist: `.docs/CHECKLIST-media-assets-empty-2026-09-01.md`
รันโดย gemini บน local (one:3000 → core:3001, ยืนยัน `coreApiUrl` ผ่าน `/api/proxy/__config`)

- backend คืน `{items,total,page,page_size,stats}`, total=17 — ยืนยัน root cause
- editor page: thumbnail ขึ้นทั้ง zone card / content picker / playlist cover
- `POST /media/videos/preview-urls` ยิงจริง 200 พร้อม `urls` ไม่ว่าง (ก่อน fix ไม่เคยยิง)
- preview modal: ไม่มี "Missing asset" แล้ว, Play เดินไทม์ไลน์ 0→9.3s / 63s ปกติ
- ไม่ regress หน้า `/media-workspace/assets`
- `npx tsc --noEmit` สะอาด

**หมายเหตุ:** verify โดย delegate ไม่ใช่ Claude รันเอง (ตัวเลือก 2 ตาม §3) —
ยืนยันเพิ่มด้วยการเปิด screenshot ของ modal ดูจริง เห็นมีเดียเรนเดอร์ครบทั้ง Main/Side zone

## ยังไม่ได้ทำ
- ยังไม่ commit / ยังไม่เปิด PR
- prod (`app.thunderone.asia`) ยังพังจนกว่าจะ deploy frontend ตัวนี้ — fix อยู่ฝั่ง frontend ล้วน ไม่ต้องแตะ DB
