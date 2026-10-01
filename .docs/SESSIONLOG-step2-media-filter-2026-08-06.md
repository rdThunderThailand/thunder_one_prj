# SESSIONLOG — Step 2 media filter + unapproved-asset guard — 2026-08-06

Repo: `thunder_one_prj` · branch `fix/thunderone` · commits `5a823a4`, `0c28fee`
(ต่อจาก `.docs/SESSIONLOG-description-textarea-2026-08-06.md` วันเดียวกัน)

## โจทย์

ตรวจ ticket: mapping filter ของ Step 2 (Content) ให้ default ตาม Publication Type
— Image→Images, Video→Videos, HTML/Web→Web Content, Dynamic→Dynamic Content
— อ่าน type จาก draft ไม่พึ่ง route param, fallback All Media, ผู้ใช้เปลี่ยน filter ได้,
เปลี่ยน filter ต้องไม่เปลี่ยน publication type, default ตรง type หลัง navigate/refresh,
filter error ต้องไม่ทำ draft เสียหาย

## ข้อเท็จจริงที่ยืนยันแล้ว — อย่า re-derive

จาก prod (`sfiefevtxalqjizdkcsw`):

- `media_core.media_assets` มี CHECK constraint `kind = ANY ('video','image')`
  → **asset ชนิด web/dynamic/playlist สร้างไม่ได้เลยระดับ DB** ต้อง migration เท่านั้น
- ข้อมูลจริง: video 6 (approved ทั้งหมด) · image 3 (approved 1, `draft` 2)
- `media_core.publications.publication_type` จริง: playlist 12, video 14, image 5 —
  **ไม่มี html หรือ dynamic อยู่เลยสักรายการ**
- `GET /media/videos` → RPC `media_videos_list(p_tenant_id)` ไม่มีพารามิเตอร์ filter
  กรองทั้งหมดฝั่ง client

## ผลตรวจ ticket — ผ่านอยู่ก่อนแล้ว 5 ใน 7 ข้อ

ผ่านอยู่แล้ว: อ่าน type จาก draft (ไม่มี route param ในไฟล์เลย) · เปลี่ยน filter ได้ ·
filter ไม่เขียนกลับ store · default ตรง type หลัง refresh (`CreatePublicationPage.tsx:246`
gate ด้วย `hasHydrated`) · default ตรง type หลัง navigate (`{step === 2 && ...}` =
unmount/remount → initializer รันใหม่) · filter error ไม่ทำ draft เสีย (`selectedAsset`
หาจาก `assets` ไม่ใช่ `filtered`)

ขาด: label ไม่ตรง req และ mapping html/dynamic

## Design fork ที่เคาะ (ผ่าน /grill-with-docs)

| ประเด็น | เลือก | ที่ไม่เลือก + เหตุผล |
|---|---|---|
| html/dynamic | map แล้ว fallback All Media | ใส่ option Web/Dynamic Content ไว้เลย — เลือกแล้วได้ 0 รายการเสมอ · ผลัก backend เพิ่ม kind ก่อน — เกิน scope ต้องแตะ DDL prod |
| playlist | All Media | Images/Videos — วันนี้ Step 2 ยังเป็นที่ประกอบ playlist จากหลาย asset ต้องเห็นทั้งภาพและวิดีโอ |
| filter ที่ผู้ใช้ตั้งเอง | reset ทุกครั้งที่กลับเข้า Step 2 | จำไว้ — ทำให้ AC "default ตรง type หลัง navigate" จริงแค่ครั้งแรก · persist ลง draft — ขัด req ที่ห้าม filter แตะ draft และต้องขึ้นเวอร์ชัน localStorage key |
| เก็บ mapping | ternary inline | ตาราง lookup — มีสมาชิกจริง 2 ตัว ยาวกว่าของที่มันแทน |

บันทึกทั้งหมดที่ `docs/adr/0009-step2-media-filter-from-publication-type.md`
รวม section consequences ที่ระบุว่าเมื่อ DB รองรับต้องเพิ่ม 3 บรรทัดไหนและแก้อะไรบ้าง
พร้อมทิศทางอนาคตที่ playlist จะกลายเป็น asset ชนิดหนึ่ง (มีหน้าสร้างแยก save แล้วใช้เหมือน asset ตัวอื่น)

## งานที่ 1 — filter mapping (commit `5a823a4`)

- `ContentStep.tsx` label: `All Types`→**All Media**, `Image`→**Images**, `Video`→**Videos**
- ลบคอมเมนต์ `// ponytail:` เดิมที่**เขียนผิด** (อ้างว่า filter ไม่ re-sync ตอน navigate กลับ
  ทั้งที่ conditional render ทำให้ remount) แทนด้วยคอมเมนต์ที่ถูกและชี้ไป ADR
- diff จริง 7 บรรทัด

## งานที่ 2 — บั๊กที่เจอตอน QA (commit `0c28fee`)

อาการ: เลือก media ที่ยังไม่ approve แล้วไปต่อไม่ได้ ขึ้น
`Invalid input: 1 media asset(s) are not approved`

**Root cause** (systematic-debugging, ดึง `prosrc` จาก prod มาอ่าน):
`public.media_publication_set_content` ปฏิเสธทั้ง save ถ้ามี item ใดชี้ asset ที่
`approval_status <> 'approved'` — แต่ frontend ไม่มีด่านไหนกันเลย:

| ชั้น | เช็ค approval ไหม |
|---|---|
| `AssetCard.tsx` | รู้จัก `approved` แต่เอาไปโชว์ badge เฉยๆ `onSelect` กดได้ไม่มีเงื่อนไข |
| `step-validation.ts` step 2 | เช็คแค่ `assetItems.length === 0` |
| `publish-eligibility.ts:43` | เช็คถูก **แต่อยู่ที่ step 5 (Publish)** สายเกินไป |

asset เสียจึงเข้าไปนอนใน draft ที่ persist ลง localStorage → **ทุก Next จาก step 2 และ
ทุก Save as Draft ยิง RPC ใหม่ พังทุกครั้ง ย้อนกลับไม่หาย reload ไม่หาย** ทางออกเดียวคือ
เอา asset ออก ซึ่งข้อความ error ไม่ได้บอก และเป็น error ดิบจาก DB (ขัด §8)

prod มี image 2 ใน 3 ชิ้นเป็น `draft` ⇒ คนสร้าง publication ชนิด Image เจอกับดักนี้ 2 ใน 3 ครั้ง

**ทางที่เลือก: กันตั้งแต่เลือก** (ไม่เลือก: ปล่อยเลือกแล้วบล็อกตอน Next — draft ยังมีของที่
save ไม่ได้อยู่ดี · ไม่เลือก: แปลงข้อความอย่างเดียว — ผู้ใช้ยังติดเหมือนเดิม)

- `draft-mapping.ts` — `isApprovedAsset()`, `dropUnapprovedItems()`
  ตัวหลัง**เก็บ** item ที่หา asset ไม่เจอไว้ ไม่ล้างทิ้ง (โหลด library พังต้องไม่กินของที่เลือกไว้)
- `AssetCard.tsx` — `disabled` + จางลง + badge `รออนุมัติ` + tooltip
- `ContentStep.tsx` — หลังโหลดสำเร็จล้าง item ที่ไม่ approve ออกจาก draft
  **นี่คือส่วนที่ปลดล็อกคนที่ติดอยู่แล้ว** ไม่งั้นแก้ไปก็ยังค้าง
- `api-error.ts` — จับ `media asset(s) are not approved` → ข้อความไทยที่บอกทางออก
- `unapproved-assets.check.mts` — 5 กลุ่ม assertion รวมเคส asset หายต้องไม่ถูกล้าง
  และเคสข้อความ error ต้องไม่รั่ว

## Verify

- `npx tsc --noEmit` → exit 0 · `npx eslint src` → exit 0
- `node src/features/publications/unapproved-assets.check.mts` → all assertions passed
- **Browser (ผู้ใช้เดินเองตาม checklist) ผ่านทั้งสองชุด** — filter mapping 13 เคส
  (ครบทุก type, dropdown มี 3 ตัวเลือก, filter ไม่แก้ type, reset ตอน navigate,
  asset ที่เลือกไม่หายตอนกรอง, F5) และ unapproved guard 9 เคส รวมข้อสำคัญที่สุด
  คือ draft ที่ติดตายอยู่แล้วปลดล็อกได้จริงและ Save ผ่าน
- ข้อที่ยังไม่ทดสอบผ่าน UI: การแปลงข้อความ error ตอน asset ถูกถอน approval กลางคัน
  (จำลองยากเพราะกันตั้งแต่ต้นทางแล้ว) — unit check ครอบไว้แทน

## งานที่ 3 — บั๊กที่สองจาก QA (commit `64fdcb5`)

อาการ: สร้าง publication ใหม่แล้วกด Save as Draft ทันที ขึ้น
`Invalid input: Too small: expected string to have >=1 characters`

**Root cause:** zod schema ฝั่ง Core (`api/core/v1/media/publications/route.ts:13`)
`name: z.string().min(1)` — และ `saveDraft` → `persistDraft(false)` → `saveBasicInfo`
**ยิงไปเลยโดยไม่ผ่าน validation ใดๆ** ต่างจากปุ่ม Next ที่วิ่งผ่าน `validateStep(1)` ก่อน
ช่องว่างคือสองปุ่มยิง endpoint เดียวกันแต่มีด่านไม่เท่ากัน

**ทางที่เลือก: บล็อกที่ frontend เช็คเฉพาะ `name`**
backend บังคับแค่ `name` (campaign_id/description/ที่เหลือ optional หมด) ร่างจึงควรบันทึกได้
โดยกรอกน้อยที่สุดเท่าที่ backend ยอม — ไม่เลือก `validateStep(1)` เต็มรูปเพราะจะบังคับ
campaign ด้วยทั้งที่ backend ไม่บังคับ และไม่เลือกตั้งชื่ออัตโนมัติเพราะเป็นการแต่งข้อมูลให้ผู้ใช้

- `usePublishDraft.ts` — เช็ค `name.trim()` ก่อนยิง → toast + inline error
- `api-error.ts` — ตาข่ายชั้นสุดท้าย: message ที่ขึ้นต้น `Invalid input:` แปลงเป็นข้อความไทย
- `unapproved-assets.check.mts` — เพิ่ม assertion กลุ่มที่ 6 กันไม่ให้ fallback ตัวใหม่
  **กลืน**ข้อความเฉพาะของ asset ที่ไม่ approve (สองอันขึ้นต้นเหมือนกัน ลำดับ branch จึงสำคัญ)

**ผลข้างเคียงที่รับไว้แล้ว:** error อื่นที่ขึ้นต้น `Invalid input:` จาก RPC (เช่น
`publication_type % does not take media assets`) ถูกเหมารวมเป็นข้อความกลางเหมือนกันหมด
ข้อความดิบยังดูได้ใน Network tab — อันไหนเจอบ่อยจนควรมีข้อความของตัวเอง ค่อยแยก branch

Verify: check file ผ่าน · `tsc`/`eslint` ผ่าน · browser 8 เคส ผ่านทั้งหมด รวมข้อที่พิสูจน์ว่า
กันถูกที่ (ไม่มี request ยิงออกเลย) และไม่ทับของเดิมบน server ด้วยชื่อว่าง

## เรื่องที่ตั้งใจไม่แตะ

`publish-eligibility.ts:43` เช็ค approval ที่ step 5 กลายเป็นด่านซ้ำที่แทบไม่มีวันโดน
แต่ยังเป็นตาข่ายกรณี asset ถูกถอน approval กลางเซสชัน — ปล่อยไว้ถูกแล้ว

## เหลือทำ

- ยังไม่ push (R0 — รออนุมัติ) branch มี 5 commit ค้าง: `517b793`, `045b4d1`, `5a823a4`,
  `0c28fee`, `64fdcb5`
- **รูปแบบที่เห็นซ้ำสองรอบวันนี้: ทางที่ผู้ใช้ไปถึง API ได้มีหลายทาง แต่ด่านตรวจมีทางเดียว**
  (Save as Draft เทียบกับ Next) ควรไล่หาว่ามีที่ไหนอีกที่ยิง `persistDraft` โดยข้ามด่าน
- ADR 0009 จะต้องอัปเดตเมื่อ `media_assets.kind` รองรับชนิดใหม่ (ระบุไว้ใน consequences แล้ว)
- งานค้างจากเซสชันก่อน: invited-membership dead end, ADR เรื่องใส่ tenant ใน access token
