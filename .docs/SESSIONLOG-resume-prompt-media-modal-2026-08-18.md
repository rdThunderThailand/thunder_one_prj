# SESSIONLOG — resume prompt + Step 2 media modal — 2026-08-18

Branch: `feat/client-side-validation` (ต่อจากงาน 8.1 ในเซสชันเดียวกัน ยังไม่ commit ทั้งคู่)

## โจทย์

1. เข้า `/publications/create` แล้ว draft เก่าถูก rehydrate จาก localStorage เงียบๆ
   ไม่มีทางเริ่มใหม่นอกจากกด Cancel ซึ่งพาออกจากหน้าไปเลย
2. Step 2 ไม่ได้เลือก media → ข้อความเล็กๆ ใต้ปุ่ม Next มองข้ามง่าย ต้องเป็น modal

## ที่ทำ

**`src/components/ui/Modal.tsx` (ใหม่)** — modal ตัวแรกของ repo นี้ ใช้ native `<dialog>` +
`showModal()` ได้ focus trap / Escape / `::backdrop` มาฟรี ไม่เพิ่ม dependency ไม่ทำ portal
ไม่ทำ scroll-lock เอง API คือ `{ open, onClose, title, children, footer }`
ปิดด้วย backdrop ผ่านการเทียบ `e.target === ref.current`

**`src/features/publications/resume-prompt.ts` (ใหม่)** — pure, React-free
- `hasDraftContent(draft)` — true เมื่อมี name/campaign/description/tags/assets/playlist/channels
  หรือ `step > 1`
- `shouldShowResumePrompt({ hadContentAtHydration, isEditMode, dismissed })` — port มาจาก
  `src/features/playlists/resume-prompt.ts` พร้อม docblock เดิม

**`CreatePublicationPage.tsx`**
- snapshot `hasDraftContent()` ลง ref ครั้งเดียวตอน `hasHydrated` เป็นจริง (ลอกจาก `CreatePlaylistPage.tsx:53-61`)
- modal "มี draft ที่ทำค้างไว้" → `ทำต่อ` (dismiss) / `เริ่มใหม่` (`cancelDraft()` แล้ว dismiss)
- ไม่ขึ้นเมื่อเข้าด้วย `?id=` — นั่นคือตั้งใจมาแก้ draft นั้น
- modal "ยังไม่ได้เลือกสื่อ" ผูกกับ `step === 2 && validationErrors.length > 0` ไม่มี state ใหม่
- guard ของ list ใต้ปุ่มเปลี่ยนจาก `step !== 1` เป็น `step > 2` — step 3/4/5 เหมือนเดิม

**`resume-prompt.check.mts` (ใหม่)** — 9 assertion

## เคาะไว้

- **"เริ่มใหม่" ล้างเฉพาะในเครื่อง** เรียก `cancelDraft()` อย่างเดียว ไม่ `deletePublication`
  draft ที่เคย save ขึ้นระบบยังอยู่ในหน้า Publications เปิดต่อด้วย `?id=` ได้ ไม่มีของหายถาวร
  (ต่างจาก `performCancel` ที่ลบ orphan row ทิ้ง)
- modal ขึ้นเมื่อ draft มีเนื้อหาจริง ไม่ใช่ทุกครั้งที่มี state

## กับดัก

**อย่าอ่าน state สด** — `src/features/playlists/resume-prompt.ts` มี docblock เตือนว่าเคยทำแบบนั้น
แล้ว prompt เด้งตอนพิมพ์ตัวอักษรแรกของงานใหม่ (ADR 0014) ต้อง snapshot ตอน hydrate ลง ref

**`hasDraftContent` ต้องไม่แตะ `scheduleForm`** — `makeDefaultScheduleForm()`
(`schedule.ts:76-89`) ฝังวันเวลาปัจจุบัน เทียบกับ default ยังไงก็ไม่ตรง draft เปล่าจะดูมีเนื้อหาตลอด
กันไว้ที่ระดับ type: signature รับแค่ `Pick<DraftFields, "basicInfo" | "assetItems" | "playlistId" | "channelIds" | "step">`
คอมไพเลอร์บังคับให้เอง ไม่ต้องมี assertion runtime

## Verification

รันจริงแล้ว:

```
node src/features/publications/resume-prompt.check.mts        → all assertions passed (exit 0)
node src/features/publications/basic-info-limits.check.mts    → all assertions passed
node src/features/publications/next-transition.check.mts      → all assertions passed
node src/features/publications/publish-eligibility.check.mts  → all assertions passed
npx tsc --noEmit  → ไม่มี error ในไฟล์ที่แก้
npm run lint      → สะอาด
```

**ยังไม่ได้ verify ระดับ UI** — ไม่ได้เปิด browser เลย modal เป็นของใหม่ทั้งชิ้นและ `<dialog>`
ยังไม่เคยใช้ใน repo นี้ ต้องเห็นของจริงก่อนถือว่าเสร็จ Checklist:

1. localStorage เปล่า → เข้า create → **ไม่มี** modal · พิมพ์ชื่อแล้วยัง**ไม่มี** (กับดัก ADR 0014)
2. กรอกชื่อ → ออกไป `/publications` → เข้า create ใหม่ → modal "มี draft ที่ทำค้างไว้" ขึ้น
3. `ทำต่อ` → ค่าเดิมอยู่ครบ modal ไม่กลับมาอีก
4. reload → modal ขึ้นอีก → `เริ่มใหม่` → ฟอร์มว่าง `localStorage` key หาย
5. Escape ปิด modal ได้ = เท่ากับ `ทำต่อ` · คลิก backdrop ปิดได้
6. เข้าด้วย `?id=<draft>` → **ไม่มี** modal
7. Step 2 กด Next โดยไม่เลือก media → modal `ยังไม่ได้เลือกสื่อ` ขึ้น ไม่ไป Step 3
8. Step 3 กด Next โดยไม่เลือก channel → ยังเป็นตัวหนังสือใต้ปุ่ม ไม่ใช่ modal
9. ดู dark mode ของ modal ด้วย (`Card` มี dark variant, modal ลอกมา)

## ค้างอยู่

- ยังไม่ commit ทั้งงาน 8.1 และงานนี้ — อยู่ใน working tree เดียวกัน ควรแยกเป็นสอง commit
- ยังไม่มี ADR สำหรับ Modal primitive — ถ้ามี modal ตัวที่สองเมื่อไหร่ค่อยเขียน
