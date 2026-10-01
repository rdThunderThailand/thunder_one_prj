# SESSIONLOG — AC 12 Content Compatibility · 2026-08-17

**Branch:** `feat/playlist` · **เข้าเซสชันจาก:** `/tmp/handoff-thunder-playlist-step1-2026-08-17.md`
**โจทย์:** "มาออกแบบเรื่อง AC12" — design fork → grilling → ADR → implement

## ที่ทำ

1. เก็บข้อเท็จจริงก่อนถาม (ไม่โยนคำถามที่หาเองได้ให้ผู้ใช้)
2. grilling 2 รอบ รอบละ 5 คำถามพร้อมคำตอบที่แนะนำ — ผู้ใช้เคาะตามคำแนะนำทั้ง 10 ข้อ
3. `docs/adr/0019-playlist-content-compatibility.md` — ตัดสินใจ + ทางที่ไม่เลือก 4 ทาง
4. โค้ด 5 ไฟล์ + checklist + อัปเดต plan Phase 3 + อัปเดตตั๋ว ClickUp

## สิ่งที่เจอ ซึ่งเปลี่ยนรูปงานทั้งหมด

plan และตั๋วเขียนตรงกันว่า AC 12 "ไม่ติดเรื่องข้อมูล" เพราะ `media_assets` มี `width`/`height`
และ `media_videos_list` ส่งกลับหน้าบ้าน — **จริงครึ่งเดียว** คอลัมน์มี route รับ แต่ฝั่งหน้าบ้าน
`registerVideo()` ไม่เคยส่งขึ้นไป

ยิงนับที่ prod: `media_core.media_assets` 17 แถว (video 7 / image 10) — `width`, `height`, `codec`
**NULL ทั้งหมด** มีแต่ `duration_seconds` ครบ

ถ้าเขียน compat check โดยไม่แตะ upload path จะได้โค้ดที่เงียบ 100% และผ่าน `tsc` สบายๆ

> **บทเรียนซ้ำของ repo นี้:** ครั้งก่อนคือ "endpoint ไม่มี ทั้งที่มี" (members) ครั้งนี้กลับด้าน —
> "คอลัมน์มี เลยคิดว่าข้อมูลมี" · มีคอลัมน์ ≠ มีข้อมูล ต้องนับแถวจริง

## การตัดสินใจ (เต็มใน ADR 0019)

- incompatible = เรขาคณิตเท่านั้น: aspect ต่างเกิน 1% หรือด้านใดด้านหนึ่งต่ำกว่า 90% ของ profile
- ตัด frame rate (ไม่มีคอลัมน์เก็บของ asset) และ codec (เป็นของ ADR 0016 + แบบสอบถาม firmware)
- เตือน ไม่บล็อก · คำนวณสด ไม่เก็บ · ไม่รู้ขนาด = เงียบ · รูปกับวิดีโอกฎเดียวกัน
- แสดงที่ Selected list + Review · ไม่แสดงบนกริด Content Library
- เก็บขนาดที่ browser ตอน upload · ไม่ backfill 17 แถวเดิม

## ไฟล์

| ไฟล์ | |
|---|---|
| `docs/adr/0019-playlist-content-compatibility.md` | ใหม่ |
| `src/features/playlists/content-compatibility.ts` | ใหม่ |
| `src/features/playlists/content-compatibility.check.mts` | ใหม่ (15 assertion) |
| `src/features/playlists/components/SelectedItems.tsx` | pill เหลือง + tooltip ขนาดจริง |
| `src/features/playlists/components/ReviewStep.tsx` | บรรทัดที่ 3 ใน Validation Summary |
| `src/features/publications/services/upload-api.ts` | `readMediaDimensions()` + payload 2 field |
| `src/features/publications/components/AssetLibraryStep.tsx` | เรียกใช้ตอน upload |
| `docs/playlists/verify-ac12-browser-checklist.md` | ใหม่ — ยังไม่ได้รัน |
| `docs/playlists/plan-create-playlist-step1.md` | Phase 3 ปิด + แก้ข้อความที่ผิด |

## Verification

**ผ่าน:** `npx tsc --noEmit` · `npx eslint` (5 ไฟล์ที่แตะ) · `pnpm build` · `.check.mts` 7/7
**ยังไม่ได้ทำ:** browser — ทำ checklist ให้ผู้ใช้กดเอง (ตัวเลือกที่ 2) ยังไม่มีผลกลับ
เทสยากกว่าปกติเพราะต้อง upload ไฟล์ใหม่ก่อน asset เดิมไม่มีขนาดสักตัว

**ClickUp 86d3xxk5b:** อัปเดตแล้ว (ขออนุมัติก่อน) — AC 12 เติมเกณฑ์เต็ม, คำถามค้างข้อ 2 ปิด,
แก้หมายเหตุที่ผิดเรื่อง "ไม่ติดเรื่องข้อมูล", Out of Scope เพิ่มบรรทัดไม่ transcode ·
อ่าน description กลับมายืนยันแล้ว · ยิงสองรอบ รอบแรก markdown เพี้ยนที่ AC 14/16
(`****` โผล่จาก code span ที่ติดกับ bold ของเซสชันก่อน) รอบสองแก้แล้ว

## ค้าง

- browser checklist ยังไม่ได้รัน → ถ้าเปิด PR ต้องเป็น **Draft**
- commit ยังไม่ได้ทำ — วางแผนแยก 2 ก้อน: upload path / playlist check
- AC 10 กับ AC 30 ยังติด product เหมือนเดิม
- คำตอบ codec จากทีม firmware ยังไม่มา และ **Q6 ยังไม่เคยถูกส่งไป** (ROI สูงสุดของอีกสายงาน)
