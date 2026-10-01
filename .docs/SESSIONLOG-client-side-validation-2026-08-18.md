# SESSIONLOG — 8.1 Client-Side Validation (Step 1) — 2026-08-18

ClickUp: [86d3xxqqa](https://app.clickup.com/t/86d3xxqqa) (parent 8. Save, Validation & Recovery)
Branch: `feat/client-side-validation` (base `dev` @ `1d00f67`, branch head at start `f2e6eff`)

## จุดตั้งต้น — ตั๋วเทียบของจริง

Gate ของ Next มีอยู่แล้วตาม ADR 0001 (`attemptNext` → `validateStep` → `persistDraft` → `goNext`)
แต่ตัว validation เองครอบแค่ 3 อย่าง และ error โผล่เป็น flat list ใต้ปุ่ม Next

| ตั๋วขอ | สถานะเดิม |
|---|---|
| Required ไม่ครบ ไป Step 2 ไม่ได้ | มีแล้ว (`next-transition.ts`) |
| ตรวจ Campaign | เช็คแค่ว่าง |
| ตรวจ Publication Name | เช็คแค่ว่าง — ไม่เช็คความยาว |
| ตรวจ Publication Type | ไม่มีเลย (store default `"image"` ทำให้ `*` เป็นของประดับ) |
| ตรวจ Maximum Length | มีเฉพาะ description |
| ตรวจ Selected Value Availability | ไม่มี — campaign ที่หายไปโชว์ Brand เป็น `—` เงียบๆ แล้วปล่อยผ่าน |
| Error อยู่ใกล้ field / หายเมื่อแก้ | ไม่มี — list ใต้ปุ่ม ล้างเฉพาะตอนกด Next แล้วผ่าน |

## ที่ทำ

**`step-validation.ts`** — เพิ่ม `validateBasicInfo(basicInfo, ctx?)` คืน error ต่อ field
(`campaignId` / `name` / `publicationType` / `description`) แล้วให้ `validateStep(1)` แบนมันเป็น
`errors: string[]` เหมือนเดิม → `publish-eligibility.ts` ไม่ต้องแก้เลย
`validateStep` รับพารามิเตอร์ที่ 3 `ctx?: Step1Context` แบบ optional ผู้เรียกเดิมส่ง 2 อาร์กิวเมนต์ยังใช้ได้

กติกาใหม่: name เกิน `nameMaxLength` (100), `publicationType` ต้องอยู่ใน `publicationTypes`,
campaign ที่ค้างใน draft ต้องยังอยู่ใน list ที่โหลดมา

**`next-transition.ts`** — `attemptNext` ส่ง `ctx` ผ่านเข้า `validateStep` เท่านั้น `NextOutcome` ไม่เปลี่ยน

**`components/basic-info-fields.tsx`** (ใหม่) — ย้าย `FieldWrapper` + `DerivedField` ออกมา
และให้ `FieldWrapper` มี slot `error` `BasicInfoForm.tsx` เดิม 327 บรรทัดเกินเพดาน 300 อยู่แล้ว

**`BasicInfoForm.tsx`** — prop `showErrors`, คำนวณ `fieldErrors` สดทุก render (ไม่มี state เพิ่ม)
→ error หายทันทีที่แก้ถูก; Campaign/Name ได้ `aria-invalid` + border แดง; Publication Type ได้ error slot
Description ไม่แตะ — มี live error ของตัวเองอยู่แล้ว ไม่เรนเดอร์ซ้ำ

**`CreatePublicationPage.tsx`** — `showStep1Errors` เปิดเมื่อกด Next แล้ว invalid ที่ step 1,
ปิดเมื่อ persist สำเร็จ; flat list ใต้ปุ่มถูกซ่อนที่ step 1 (inline พูดแทนแล้ว) step 2-4 เหมือนเดิม

**`basic-info-limits.check.mts`** — เพิ่ม 10 assertion ครอบทุกกติกาใหม่ + regression ว่า
`validateStep(1, draft)` แบบ 2 อาร์กิวเมนต์ยังคืนข้อความเดิม

## เคาะไว้

- inline error โผล่ **หลังกด Next ที่ fail** ไม่ใช่ live ตั้งแต่เปิดหน้า — ฟอร์มเปล่าไม่ควรแดงทั้งใบ
- ปุ่ม Next **ไม่ disable** คงพฤติกรรมตาม ADR 0001 — ปุ่มที่ disable เฉยๆ ไม่บอกเหตุผล
- Selected Value Availability = ค่าที่ค้างใน draft ต้องยังมีอยู่จริงใน list ที่โหลดมา

## กับดักที่เจอ

`campaigns` ใน `usePublishDraft.ts:41` เริ่มที่ `[]` แล้วโหลด async — ถ้าส่ง `campaignIds: []`
เข้า availability check ตรงๆ campaign ที่ถูกต้องจะโดนฟ้องว่า "ไม่มีอยู่แล้ว" ระหว่างโหลด
(และตลอดไปถ้า fetch พัง) แก้โดยส่ง ctx เฉพาะตอน `campaigns.length > 0` — list ว่างแปลว่า
"ยังไม่โหลด" ไม่ใช่ "ไม่มี campaign"

## Verification

รันจริงแล้ว:

```
node src/features/publications/basic-info-limits.check.mts   → all assertions passed (exit 0)
node src/features/publications/next-transition.check.mts     → all assertions passed (exit 0)
node src/features/publications/publish-eligibility.check.mts → all assertions passed (exit 0)
npx tsc --noEmit  → ไม่มี error ในไฟล์ที่แก้ทั้ง 6 (repo มี error ค้างที่อื่นอยู่ก่อน)
npm run lint      → สะอาด
```

**ยังไม่ได้ verify ระดับ UI** — ไม่ได้เปิด browser ดูที่ `/publications/create` เลย
ทุกอย่างข้างบนพิสูจน์แค่ระดับ logic + คอมไพล์ ไม่ใช่ระดับที่ผู้ใช้ใช้จริง
Checklist ที่ต้องเดินก่อนถือว่าเสร็จ:

1. เปิด `/publications/create` ใหม่ → ไม่มีข้อความแดงโผล่ก่อนกดอะไร
2. เคลียร์ Name + ไม่เลือก Campaign → กด Next → ค้าง Step 1, ข้อความแดงอยู่ใต้ Campaign และใต้ Name, ไม่มี list ซ้ำใต้ปุ่ม
3. พิมพ์ชื่อ → error ใต้ Name หายทันทีโดยไม่ต้องกด Next
4. เลือก Campaign + ใส่ชื่อ → กด Next → ไป Step 2 ได้
5. ไป Step 2/3 แล้วกด Next โดยยังไม่เลือกอะไร → list ใต้ปุ่มยังทำงานเหมือนเดิม
6. availability: แก้ `localStorage["thunderone.publications.create-draft.v6"]` ให้ `campaignId` เป็น id มั่ว → reload → กด Next → "Campaign ที่เลือกไว้ไม่มีอยู่แล้ว กรุณาเลือกใหม่"
7. ปิด network ของ `/media/campaigns` (หรือ throttle) → กด Next ตอน list ยังว่าง → **ต้องไม่** ขึ้น error availability

## ค้างอยู่

- ยังไม่ commit (รอคำสั่ง)
- ตั๋วยังเป็น `in progress` — ไม่ขยับสถานะจนกว่า checklist ข้างบนจะผ่าน
- Backend ไม่มี length enforcement เลย (`media_core.publications.name` เป็น `varchar(200)`
  และ Postgres error แทนที่จะ truncate) — client cap ที่ 100 ยังปลอดภัย แต่ 8.x ฝั่ง backend validation ยังไม่ทำ
