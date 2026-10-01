# SESSIONLOG — validation UX rollout + review — 2026-08-18

Branch: `feat/client-side-validation` · base `origin/dev` @ `2397dea`
ClickUp 8.1: https://app.clickup.com/t/86d3xxqqa (ยังเป็น `in progress` ไม่ได้ขยับ)

## กฎที่ตกผลึกจากงานนี้

| step เป็นแบบไหน | UI |
|---|---|
| ฟอร์มที่มี field ให้กรอก | inline ใต้ field + `aria-invalid` + border แดง โผล่หลังกด Next ที่ fail แล้วหายทันทีที่แก้ (คำนวณสดทุก render ไม่มี state เก็บ error) |
| ตัวเลือก/ตะกร้า ("ยังไม่ได้เลือกอะไรเลย") | modal |

ครอบคลุมแล้ว: Publication 1 inline · 2 modal · 3 modal · 4 inline · 5 ไม่แตะ
(Pre-Publish Checklist อธิบายตัวเองอยู่แล้ว) · Playlist 1 inline · 2 modal · 3 ไม่มีกติกา · 4 read-only

## ที่ทำในเซสชันนี้

**รวม `origin/dev`** — merge สะอาด 5 ahead / 0 behind merge-base คือ `f2e6eff` และฝั่ง dev
ไม่มีไฟล์เปลี่ยนนับจากจุดนั้น (PR #4 ที่ merge เข้า dev คือ branch ที่ commit เหล่านี้แตกมา)
merge จึงไม่มีเนื้อหาโค้ดเปลี่ยนเลย

**รีวิว `787a590`** (inline errors + modals ทั้งสอง wizard — งานที่ agy ทำแล้วยังไม่มีใครตรวจ)
อ่านทีละไฟล์ ผ่านทั้งหมด ยกเว้นบั๊กหนึ่งตัวข้างล่าง

**รีวิว `195b531`** (delivery progress) — เจอบั๊ก 1 ตัว ไม่ได้แก้ (คนละงาน)

## บั๊กที่เจอและแก้แล้ว — ขอบแดงฝั่ง playlists ไม่ขึ้น

`BasicInfoStep.tsx` ต่อท้าย `border-red-400` เข้ากับ `inputClasses` ที่มี `border-zinc-200`
อยู่แล้ว **Tailwind ตัดสิน conflict ด้วยลำดับใน stylesheet ไม่ใช่ลำดับใน class attribute**
ทั้งสองคลาสมี specificity เท่ากัน ตัวที่มาทีหลังใน CSS ชนะ

พิสูจน์จาก CSS ที่ build จริง: `.border-red-400` อยู่ byte 23071 · `.border-zinc-200` อยู่ 23560
→ zinc ชนะ ขอบแดงไม่ขึ้นเลยทั้งที่ `aria-invalid` และข้อความ error ทำงานถูก

แก้เป็น `border-red-400!` (Tailwind v4 ใช้ `!` ต่อท้าย) build ใหม่ยืนยันได้
`.border-red-400\!{border-color:var(--color-red-400)!important}` — ชนะทั้ง light และ dark
เพราะ `!important` ไม่สนลำดับ

ฝั่ง publications ไม่โดนบั๊กนี้เพราะใช้ ternary **สลับ**คลาส
(`${err ? "border-red-400" : "border-zinc-200"}`) ไม่ได้ต่อท้าย

> บทเรียน: ถ้าจะ override utility ของ Tailwind ที่มาจาก const ที่แชร์กัน ให้ใช้ `!`
> หรือสลับคลาสไปเลย อย่าต่อท้ายแล้วหวังว่าจะชนะ

## บั๊กที่เจอใน `195b531` — รายงานไว้ ไม่ได้แก้ (คนละงาน)

`summarizeDelivery()` ใน `src/features/publications/delivery-progress.ts` **รับพารามิเตอร์
`schedule` มาแต่ไม่ได้ใช้เลย** ในตัวฟังก์ชัน ผลคือ publication ที่ตั้งเวลาเริ่มไว้ในอนาคต
พอพ้น settle window 10 นาทีนับจาก `activated_at` จะสรุปว่า **`Publish Failed`**
เพราะ `stage3Done === 0` (ยังไม่มีเครื่องไหนเล่น — ก็ยังไม่ถึงเวลา)

รันพิสูจน์แล้วสองเคส (`now = 2026-08-18T10:00Z`, `activated_at` = 09:30Z):

| targets | schedule | ผลลัพธ์ |
|---|---|---|
| 2 เครื่อง `delivered`, online | `starts_at` 12:00Z | `Publish Failed`, `overallPercent` 0 ทั้งที่ `stage2Done` 2/2 |
| 1 เครื่อง `pending`, online | `starts_at` พรุ่งนี้ | หัวเรื่อง `Publish Failed` แต่แถวอุปกรณ์บอก `processing` / `queued` |

`deriveDeviceProgress` จัดการเคสนี้ถูกแล้ว (คืน `waiting-scheduled` / `processing`)
สองมุมมองบนหน้าเดียวกันจึงขัดกันเอง การที่ `schedule` ถูกส่งเข้ามาแล้วไม่ถูกอ่าน
บอกว่าเคสนี้ตั้งใจจะรองรับแต่หล่นหาย — `delivery-progress.check.mts` ก็ไม่มี assertion
ของ `summarizeDelivery` ที่ `starts_at` เป็นอนาคต

**ทางแก้ที่เสนอ:** ถ้า `schedule.starts_at` ยังไม่ถึง ให้ผลลัพธ์เป็น `Publishing`
(หรือสถานะ "รอเวลาเริ่ม") แทนที่จะตัดสินจาก `stage3Done` แล้วเติม assertion ในไฟล์ check

## ตรวจแล้วผ่าน

```
.check.mts 23 ไฟล์  → PASS ทั้งหมด
npx tsc --noEmit    → 0 error ทั้ง repo
npm run lint        → สะอาด
npm run build       → ผ่าน 13 route
```

## ยังไม่ได้ verify

**ไม่เคยเปิด browser ดู step 3/4 และ playlist wizard เลย** ทุกอย่างข้างบนพิสูจน์แค่ระดับ
logic กับคอมไพล์ Checklist เต็มอยู่ใน `/Users/arty/.claude/plans/86d3xxqqa-plan-binary-pretzel.md`
หัวข้อ Verification ที่ต้องเน้น:

1. Pub Step 3 ไม่เลือก channel → modal `ยังไม่ได้เลือกช่องทาง`
2. Pub Step 4 เลือก Recurring แล้วกด Next ทันที → error โผล่ **ใต้ Repeat On และใต้ End Date พร้อมกัน**
3. ติ๊กวันในสัปดาห์ → error ใต้ Repeat On หายทันทีโดยไม่ต้องกด Next
4. Daily Window เวลาจบมาก่อนเวลาเริ่ม → `เวลาจบรายวันต้องอยู่หลังเวลาเริ่ม` ใต้ช่องจบ
5. Pub Step 4 แบบ `now` → ไม่มี error เลย
6. ไม่มีตัวหนังสือแดงกองใต้ปุ่ม Next อีกแล้วทุกสเต็ป
7. Playlist Step 1 เคลียร์ชื่อ → Next → error ใต้ช่อง **พร้อมขอบแดง** (จุดที่เพิ่งแก้) พิมพ์แล้วหายทันที
8. Playlist Step 2 ไม่เลือก media → modal `ยังไม่ได้เลือก media`
9. dark mode ทั้งสอง wizard

**ยืนยัน migration 091/093/094 บน prod ไม่ได้** — รีโปนี้ไม่มี Supabase creds
(คุยผ่าน `thundercore.vercel.app` อย่างเดียว) และ Supabase MCP ที่ต่ออยู่ไม่เห็นโปรเจกต์ Thunder
ต้องไปเช็คจาก Thunder_Core ตาม §6

## หนี้ที่รู้ตัว ไม่ได้แก้

- `ScheduleStep.tsx` ~700 บรรทัด, `CreatePublicationPage.tsx` ~540 (เพดาน 300)
  ทิ้ง `// ponytail:` ไว้แล้วว่าให้แยกคอลัมน์ขวาออกตอนแตะรอบหน้า
- `playlists/ReviewStep.tsx` เขียนข้อความ validation ซ้ำเองแทนที่จะใช้ `step-validation.ts`
- playlists `WizardStepId` เป็น `1 | 2 | 3` แต่ wizard มี 4 step
- playlists `handleSubmit` ไม่เรียก `validateStep`/`canSubmit` เลย
- `PlaylistStepper` กดข้ามไป step ไหนก็ได้ เลี่ยง `goNext` จึงเลี่ยง validation ไปด้วย
- `publish-eligibility` ใช้ `basicInfoOk` gate `canPublish` แต่ไม่มีแถวใน checklist
- resume prompt ฝั่ง playlists ยังเป็น inline Card ส่วน publications เป็น Modal แล้ว

## ค้าง

- browser verification ตาม checklist ข้างบน
- ตั๋ว 8.1 ยังไม่ขยับสถานะ · ยังไม่เปิด PR (ถ้า verify ไม่ครบต้องเป็น Draft ตาม §4)
- บั๊ก `summarizeDelivery` รอตัดสินว่าจะแก้ในตั๋ว 10 หรือแยก
