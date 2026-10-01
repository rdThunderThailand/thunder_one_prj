# SESSIONLOG — Description textarea (Step 1 Basic Info) — 2026-08-06

Repo: `thunder_one_prj` · branch `fix/thunderone` · commit `517b793`

## โจทย์

ตรวจ textarea Description ของ Step 1 Basic Info ตาม requirement:
character counter, max length จาก configuration, รองรับไทย/อังกฤษ, sanitize ข้อความที่ paste,
optional, เกินกำหนดต้องแสดง validation, reload แล้วข้อมูลยังอยู่

## ผลตรวจของเดิม

อ่าน `BasicInfoForm.tsx:136-150`, `step-validation.ts`, `usePublicationDraftStore.ts`

ผ่านอยู่แล้ว: counter, ไทย/อังกฤษ, optional (step 1 เช็คแค่ name + campaignId), persist ผ่าน zustand `persist`

ช่องว่างที่เจอ 3 จุด:
1. `maxLength={300}` และ `{description.length}/300` hardcode ใน JSX
2. ไม่มี sanitize ตอน paste — React escape ตอน render จึงไม่ execute แต่ raw `<script>` ถูกส่งไป backend
3. **`maxLength` บล็อกไม่ให้พิมพ์เกิน → validation "เกินกำหนด" ไม่มีทางเกิดขึ้นเลย** และข้อความที่ paste เกินถูกตัดทิ้งเงียบๆ

## Design fork ที่เคาะ

| ประเด็น | ทางที่เลือก | ทางที่ไม่เลือก + เหตุผล |
|---|---|---|
| จัดการ over-limit | เอา `maxLength` ออก ให้พิมพ์/วางเกินได้ แล้วโชว์ error + บล็อกปุ่ม Next | คง `maxLength` แล้วโชว์ hint ตอนถูกตัด — ไม่ตรง req และผู้ใช้เสียข้อความที่ paste มา |
| แหล่ง max length | constant `PUBLICATION_LIMITS` ใน `src/config/limits.ts` | env var (ต้อง redeploy) · ดึงจาก Core API (ต้องเพิ่ม endpoint ฝั่ง backend เกิน scope) |
| ระดับ sanitize | strip HTML tags เฉพาะตอน `onPaste` | sanitize ทุก `onChange` — พิมพ์ `<` แล้วตัวอักษรหายทันที ใช้งานงง |

ยังไม่ได้เขียน ADR — เป็น fork ระดับ component ไม่ใช่ data model/สัญญา API

## สิ่งที่ทำ

Delegate ให้ `agy` (`gemini-3.1-pro-high`) ผ่าน spec `/tmp/handoff-desc-textarea.md` แล้ว Claude verify เอง

ใหม่:
- `src/config/limits.ts` — `PUBLICATION_LIMITS = { nameMaxLength: 100, descriptionMaxLength: 300 }`
- `src/features/publications/sanitize.ts` — `stripHtmlTags` (regex บรรทัดเดียว ไม่เพิ่ม dependency)
- `src/features/publications/basic-info-limits.check.mts` — 5 assertions (strip tags, ไทยไม่โดนแตะ, ว่างได้, พอดีลิมิตผ่าน, เกิน 1 ตัวไม่ผ่าน)

แก้:
- `BasicInfoForm.tsx` — เอา `maxLength` ออกจาก description, `onPaste` sanitize + splice ตาม selection, counter แดงเมื่อเกิน, error inline, `aria-invalid`; Name ใช้ `PUBLICATION_LIMITS.nameMaxLength`
- `step-validation.ts` — step 1 เพิ่มเช็ค `description.length > descriptionMaxLength`

## Verify

- `npx tsc --noEmit` → exit 0
- `npx eslint src` → exit 0
- `node src/features/publications/basic-info-limits.check.mts` → all assertions passed
- `grep 300 BasicInfoForm.tsx` → เหลือแต่ Tailwind class ไม่มีเลขลิมิต
- อ่านโค้ดยืนยัน `CreatePublicationPage.tsx:216` `outcome.kind === "invalid"` → `return` = Next ถูกบล็อกจริง
- **Browser (ผู้ใช้เดินเองตาม checklist 10 ข้อ) → ผ่านทั้งหมด** รวม paste กลางประโยค, paste ทับ selection, F5 ทั้งเคสปกติและเคสเกินลิมิต

## เรื่องที่เจอระหว่างทาง

- `mcp__plugin_context-mode` พังในเซสชันนี้ — `better_sqlite3.node` compile กับ NODE_MODULE_VERSION 137 แต่ Node ที่รันต้องการ 127 ต้อง `/ctx-upgrade` หรือ rebuild ก่อนใช้ได้อีก ระหว่างนี้ตกกลับไปใช้ Bash
- ชื่อ model ของ `agy` เปลี่ยนไปจากที่ skill เขียนไว้ — ของจริงคือ `gemini-3.1-pro-high` (ไม่มีวงเล็บ) ต้องรัน `agy models` ก่อนทุกครั้ง
- `.check.mts` รันแล้วมี warning `MODULE_TYPELESS_PACKAGE_JSON` เพราะ import ข้ามไป `src/config/limits.ts` — เป็น warning เฉยๆ assertion ผ่านปกติ

## งานต่อเนื่อง — Toast ตอน Save as Draft (commit `045b4d1`)

โจทย์: กด Save as Draft แล้วต้องมี toast โดยระบุให้ใช้ `sonner`

ตัดสินใจไม่ delegate ให้ `agy` — ติดตั้ง dependency + แก้ ~10 บรรทัดใน 3 ไฟล์ เล็กกว่าค่า
round-trip ของ spec เอง (ตรงกับหัวข้อ "When NOT to use" ของสกิล `plan-handoff` เอง)

- `sonner@2.0.7` — dependency ใหม่ (R1) ผู้ใช้ระบุชื่อมาเอง ถือว่าเคาะแล้ว
- `src/app/layout.tsx` — `<Toaster position="top-right" richColors />`
- `usePublishDraft.ts` — `toast.success("บันทึกร่างแล้ว")` ตอนสำเร็จ, `toast.error(...)` ตอนพลาด

**เคส conflict ตั้งใจไม่ toast** — banner เตือน revision conflict มีอยู่แล้ว ถ้า toast ด้วย
จะเตือนซ้ำสองที่ (เป็นเหตุผลเดียวกับคอมเมนต์เดิมที่มีอยู่ในโค้ดตรง `classified.kind !== "conflict"`)

เคส error อื่นตอนนี้แสดงทั้ง toast และ inline error เดิม — ไม่ถอด inline ออกเพราะเกิน scope
ที่สั่ง ผู้ใช้ดูแล้วรับได้ในรอบ QA

Verify: `tsc` + `eslint` ผ่าน · browser 7 เคส (สำเร็จ, ปุ่ม Saving…, กดรัว, ข้าม step,
offline → toast แดง, สองแท็บชนกัน → ไม่มี toast, ตำแหน่ง toast ไม่บังอะไร) ผ่านทั้งหมด

**กับดักที่เจอ:** repo นี้ใช้ **pnpm** (`pnpm-lock.yaml` + `node_modules/.pnpm`) — `npm install`
พังด้วย `Cannot read properties of null (reading 'matches')` เพราะ arborist อ่าน tree ของ pnpm
ไม่ได้ ต้องใช้ `pnpm add` เท่านั้น

## เหลือทำ

- ยังไม่ push (R0 — รออนุมัติ)
- `descriptionMaxLength` เป็นแค่ค่าฝั่ง frontend — backend ยังไม่บังคับความยาว ถ้าอยากให้เป็นสัญญาจริงต้องคุยเรื่องดึงจาก Core API
- งานค้างจากเซสชันก่อน (ยังไม่แตะวันนี้): invited-membership dead end, ADR เรื่องใส่ tenant ใน access token
