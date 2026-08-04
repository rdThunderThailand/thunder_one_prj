# ThunderOne ClickUp Flow Audit — AI Handoff

> สถานะ ณ วันที่ 3 สิงหาคม 2026  
> ผลตัดสินรวม: `REWORK` — ทั้ง 6 การ์ดหลักยังไม่พร้อมย้ายจาก `IN PROGRESS` ไป `REVIEW`

## จุดประสงค์ของเอกสาร

เอกสารนี้สรุปช่องว่างระหว่าง ClickUp flow กับ implementation ปัจจุบัน เพื่อให้ AI หรือผู้พัฒนาคนถัดไปทราบทันทีว่า:

- กำลังทำงานอยู่ในหัวข้อใด
- ส่วนใดมี implementation แล้ว
- ส่วนใดยังขาดหรือทำงานไม่ตรง Definition of Done
- งานใดเป็น blocker ที่ต้องแก้ก่อน
- ต้องตรวจอะไรจึงถือว่างานพร้อม Review

## แหล่งอ้างอิง

- ClickUp flow: <https://app.clickup.com/3803720/v/l/3m2j8-157556>
- Tracking card: <https://app.clickup.com/t/3803720/86d3x3m6d>
- Personal audit document: <https://app.clickup.com/3803720/v/dc/3m2j8-157576/3m2j8-236776>
- Domain และ Product rules: [`CONTEXT.md`](./CONTEXT.md)

## Scope ที่ต้องเข้าใจก่อนแก้

- Phase 1 ไม่มี Approval Workflow ดังนั้น Publish gate ต้องตรวจ Content ว่า `Ready` และ persisted แล้ว แต่ไม่ต้องสร้าง approval gate ใหม่
- AI Media Assistant / AI Suggestions เป็น Out of Scope ตาม ClickUp หากไม่มีการเปลี่ยน Scope ให้ซ่อนหรือนำออกจาก flow
- Playlist behavior ที่ปรากฏใน wizard ต้องยึด ClickUp Phase 1 เป็นหลัก อย่าเพิ่ม implementation ต่อโดยไม่มี Scope ยืนยัน
- Publication lifecycle และ Publish Job delivery status เป็นคนละเรื่อง ห้ามรวม status vocabulary เข้าด้วยกัน ดูรายละเอียดใน `CONTEXT.md`

## สถานะรวมของ 6 Flow

| Flow | ClickUp subtasks | สถานะจาก Audit | พร้อม Review | ประเด็นหลักที่ยังขาด |
|---|---:|---|---|---|
| Media Workspace — Overview | 7 | Missing core data | ไม่พร้อม | Dashboard ส่วนใหญ่ยังใช้ mock |
| Basic Info | 8 | Partial | ไม่พร้อม | Restore/autosave/version conflict และ type behavior |
| Content | 7 | Partial | ไม่พร้อม | Upload lifecycle, validation, retry และ Ready gate |
| Channels | 9 | Partial | ไม่พร้อม | Category/filter/reach และ error handling |
| Schedule | 9 | Partial | ไม่พร้อม | Validation gate, advanced options และ conflict failure |
| Review & Publish | 10 | Blocked | ไม่พร้อม | Publish gate ไม่ผูก checklist และไม่มี idempotency |

ทั้ง 6 การ์ดยังอยู่ `IN PROGRESS` และส่วนใหญ่ไม่มี Assignee, Due date, Priority หรือ Time estimate จึงควรกำหนด owner และลำดับการส่งงานก่อนเริ่มแก้เป็นชุดใหญ่

---

## P0 — Blocker ข้ามทุก Flow

งานในส่วนนี้ต้องเสร็จก่อนย้าย Review & Publish ไป `REVIEW`

### P0.1 สร้าง Step contract กลาง — ✅ เสร็จ (2026-08-04)

**หัวข้อ:** Wizard navigation / persistence  
**ไฟล์หลัก:** [`CreatePublicationPage.tsx`](./src/features/publications/components/CreatePublicationPage.tsx), [`step-validation.ts`](./src/features/publications/step-validation.ts)  
**Design decision:** [`docs/adr/0001-wizard-step-contract.md`](./docs/adr/0001-wizard-step-contract.md) — เลือก pure function `validateStep()` แทน per-step controller interface

**ยังต้องทำ**

- [x] กำหนด contract กลาง — เป็น pure function `validateStep(step, state)` (ไม่ใช่ per-step object ตามที่ร่างไว้เดิม ดู ADR) + `persistDraft`/`saveStatus`/`savingNext` ที่มีอยู่แล้วใน `usePublishDraft.ts`
- [x] ให้ทุกปุ่ม Next ทำตามลำดับ `validate → persist → goNext` — verified ผ่าน browser จริง (เห็น `POST /api/proxy/media/publications → 201` ก่อนเปลี่ยน step)
- [x] ห้ามเปลี่ยน Step เมื่อ validation ไม่สำเร็จ — verified ผ่าน browser จริง (Step 1 ไม่ครบ, Step 2 ไม่เลือก asset)
- [ ] ห้ามเปลี่ยน Step เมื่อ **save** ไม่สำเร็จ — เขียนโค้ดแล้ว (catch ไม่เรียก `goNextAction`) แต่ยังไม่ได้ simulate API error จริงเพื่อทดสอบ
- [x] แสดงสถานะ `Saving` — verified ผ่าน browser จริง; `Save failed`/`Retry` เขียนโค้ดแล้วแต่ยังไม่ได้ทดสอบ
- [ ] รักษาข้อมูลในฟอร์มเมื่อ save ล้มเหลว — เขียนโค้ดแล้ว (store เขียนเฉพาะตอนสำเร็จ) ยังไม่ทดสอบจริง
- [ ] ป้องกัน double-click — เขียนโค้ดแล้ว (`savingNext` guard + disabled) ยังไม่ทดสอบจริง

**Acceptance criteria**

- [x] Required field ไม่ครบแล้ว Step ไม่เปลี่ยน — verified
- [ ] API save ตอบ error แล้ว Step ไม่เปลี่ยนและข้อมูลไม่หาย — ยังไม่ทดสอบ
- [x] Reload แล้ว restore ข้อมูลของ Step ล่าสุดได้ — ของเดิมอยู่แล้ว (zustand persist), ไม่ได้แก้รอบนี้
- [ ] การกด Next ซ้ำระหว่าง save ไม่สร้าง request ซ้ำ — ยังไม่ทดสอบ

**หมายเหตุ:** สร้าง test draft publication จริงบน backend ระหว่าง verify (`ทดสอบ P0.1 Step Contract`, Unassigned, ไม่ activate) — ยังไม่ลบ

### P0.2 ทำ Publish gate ให้เป็น source of truth เดียว — ✅ เสร็จ (2026-08-04)

**หัวข้อ:** Review & Publish eligibility  
**ไฟล์หลัก:** [`usePublishDraft.ts`](./src/features/publications/hooks/usePublishDraft.ts), [`ReviewPublishStep.tsx`](./src/features/publications/components/ReviewPublishStep.tsx), [`publish-eligibility.ts`](./src/features/publications/publish-eligibility.ts)  
**Design decision:** [`docs/adr/0002-publish-eligibility.md`](./docs/adr/0002-publish-eligibility.md)

**ยังต้องทำ**

- [x] สร้าง publish eligibility ผลลัพธ์เดียว (`computeEligibility()`) ที่ทั้ง checklist และปุ่ม Publish ใช้ร่วมกัน — verified ผ่าน browser จริง
- [x] ตรวจ Basic Info required fields — รวมเข้า `canPublish` (ไม่มี UI row แยกตามที่ ADR ระบุเหตุผล)
- [x] ตรวจ Content เป็น `Ready` (`approval_status === "approved"`) — verified ผ่าน browser จริง; **"persisted แล้ว" ยังไม่ตรวจแยก** (ใช้ assetItems ใน store ตรงๆ ยังไม่เทียบกับ backend)
- [x] ตรวจว่ามี Channel อย่างน้อย 1 รายการ (reuse `validateStep`) — verified; **"persisted แล้ว" ยังไม่ตรวจแยก** เช่นเดียวกับ Content
- [x] ตรวจ Schedule validity และ conflict — verified ผ่าน browser จริง (สร้าง conflict จริง 3 รายการ แล้วเห็น Publish ถูก disable)
- [x] ปิด Publish เมื่อ `loadingRefs`/`checkingConflicts` ยัง true — เขียนโค้ดแล้ว ยังไม่ได้ simulate จริง
- [ ] ตรวจ validation ซ้ำฝั่ง server ก่อน activate — **ไม่ได้ทำในทิกเก็ตนี้โดยตั้งใจ** (ดู ADR "Consequences") `activatePublication` เดิมที่มีอยู่แล้วจะ reject ฝั่ง backend และ error surface ผ่าน `usePublishDraft`'s `error` state อยู่แล้ว แต่ยังไม่ idempotent — เป็นสโคปของ P0.3

**Acceptance criteria**

- [x] Checklist fail หนึ่งรายการแล้ว Publish ต้อง disabled — verified (conflict fail → disabled)
- [x] Schedule invalid หรือ conflict API error แล้ว Publish ต้อง disabled — conflict-fail path verified, schedule-invalid path ยังไม่ทดสอบ
- [ ] UI และ server ให้ผล eligibility ตรงกัน — ยังไม่ verify เพราะยังไม่ได้กด Publish จริงตอนผ่านเกณฑ์ครบ (ไม่ได้ activate publication จริงระหว่าง verify รอบนี้)
- [x] Phase 1 ไม่เพิ่ม Approval Workflow ที่อยู่นอก Scope — checklist row policy คงเป็น manual/neutral เสมอตามที่ตั้งใจ

**หมายเหตุ:** ใช้ draft `ทดสอบ P0.1 Step Contract` เดิมต่อเพื่อ verify — เพิ่ม content/channel/schedule ให้ครบจนเจอ conflict จริง ยังไม่ activate/ลบ

### P0.3 ป้องกัน partial save, version conflict และ duplicate publish

**หัวข้อ:** Draft consistency / idempotency  
**ไฟล์หลัก:** [`usePublishDraft.ts`](./src/features/publications/hooks/usePublishDraft.ts)

**แตกเป็น 4 ปัญหาแยกกัน (2026-08-04)** — วิเคราะห์เต็มพร้อมหลักฐานจาก prod query อยู่ที่
[`docs/publications/plan-revision-409.md`](./docs/publications/plan-revision-409.md) อย่า
re-derive ที่นี่:

- [x] **C — error ทุกชนิดถูกยุบเป็น string เดียว, retry หลัง timeout โชว์ error ทั้งที่สำเร็จแล้ว**
  — **แก้แล้ว (2026-08-04)** `ApiError` เก็บ status code, `classifyApiError()` แยก
  `conflict`/`already-active`/`rejected`/`retryable`, `publishNow` map "Already active"
  (retry หลัง timeout) เป็น success แทน error — verify: tsc/eslint/build/`.check.mts` ผ่าน
  + mutation test ยืนยันเทสจับบั๊กจริง, `conflict` (409) ยัง verify ผ่าน HTTP จริงไม่ได้เพราะ
  backend ไม่เคยส่ง 409 มา (ผูกกับ A ที่ยังไม่ทำ)
- [ ] **B — duplicate activate จาก race** (`media_publication_activate` ไม่มี `FOR UPDATE`)
  — ยังไม่เคยเกิดจริงบน prod (24 publish_jobs / 24 publications, ตรวจ 2026-08-04) แนะนำ
  แก้ด้วย `FOR UPDATE` 1 บรรทัดถ้าจะทำ แต่ไม่เร่งด่วน
- [ ] **A — เพิ่ม draft `revision`/`version` กัน lost update** — **ตัดสินใจ (2026-08-04): YAGNI**
  ไม่มีหลักฐานว่าเคยเกิดจริง เครื่องมือ internal คนสร้าง publication มักทำคนเดียวจบในรอบเดียว
  รอจนมีคนรายงานว่าข้อมูลหายก่อนค่อยทำ (ต้อง migration + แก้ RPC 3 ตัว + contract สองฝั่ง)
- [ ] **D — partial save ระหว่าง Basic Info → Content → Schedule** — **ยอมรับใน Phase 1**
  draft resume ได้จาก localStorage/`?id=` อยู่แล้ว กด Next ใหม่ก็ save ทับ

---

## P1 — ช่องว่างแยกตาม Flow

## 1. Media Workspace — Overview

**สถานะ:** Missing core data  
**พื้นที่โค้ด:** [`src/features/overview`](./src/features/overview)

**มีแล้ว**

- Now & Next Publications โหลดข้อมูลจาก API
- Create Publication quick action ใช้งานได้

**ยังขาด/ไม่เรียบร้อย**

- [ ] KPI ยังใช้ mock data
- [ ] Alerts ยังใช้ mock data
- [ ] Channel Distribution ยังใช้ mock data
- [ ] Channel Status ยังใช้ mock data
- [ ] Top Channels ยังใช้ mock data
- [ ] ไม่มี dashboard refresh ที่ดึงข้อมูลใหม่จริง
- [ ] Now & Next คำนวณเวลาใหม่ทุก 60 วินาทีจากข้อมูลเดิม แต่ไม่ได้ refetch
- [ ] AI Media Assistant ยังแสดงทั้งที่ Out of Scope
- [ ] Quick Actions อื่นยัง disabled
- [ ] Loading/empty/error/refresh states ยังไม่ครบ

**ไฟล์ที่เกี่ยวข้อง**

- [`mock-data.ts`](./src/features/overview/mock-data.ts)
- [`NowNextPublicationsCard.tsx`](./src/features/overview/components/NowNextPublicationsCard.tsx)
- [`OverviewDashboard.tsx`](./src/features/overview/components/OverviewDashboard.tsx)

**พร้อม Review เมื่อ**

- Dashboard card ที่อยู่ใน Phase 1 ใช้ API จริงและมี loading/empty/error states
- Refresh ดึงข้อมูลใหม่จริง
- Component ที่ Out of Scope ถูกนำออกหรือปิดด้วย Scope ที่ชัดเจน

## 2. Basic Info

**สถานะ:** Partial  
**ไฟล์หลัก:** [`BasicInfoForm.tsx`](./src/features/publications/components/BasicInfoForm.tsx), [`usePublicationDraftStore.ts`](./src/features/publications/store/usePublicationDraftStore.ts)

**มีแล้ว**

- Form
- Campaign/Publication API บางส่วน
- Preview
- Manual Save

**ยังขาด/ไม่เรียบร้อย**

- [x] Name และ Description ไม่เป็น controlled inputs ที่ restore จาก store ได้แน่นอน — **แก้แล้ว
  (2026-08-04)** เพิ่ม `value={name}` / `value={description}` ให้ input/textarea ที่ขาดไป
  (`BasicInfoForm.tsx`) — verified ผ่าน browser จริง (Next → Back และ reload หน้าแล้วค่ายังอยู่)
- [x] Draft ที่โหลดกลับมาอาจมีข้อมูลใน store แต่ input ไม่แสดงค่า — เดียวกับข้อบน แก้พร้อมกัน
- [x] เปลี่ยน Publication Type แล้ว Selected Content อาจถูกตัดเหลือรายการเดียว — **แก้แล้ว
  (2026-08-04)** เพิ่ม confirm banner ก่อน apply เมื่อจะเปลี่ยนออกจาก Playlist ขณะเลือก asset
  มากกว่า 1 ชิ้น (`BasicInfoForm.tsx` `handleTypeClick`/`pendingType`), truncation logic เดิมใน
  `usePublicationDraftStore.setBasicInfo` ไม่ได้แก้ — แค่ gate การเรียกจาก UI
- [ ] Playlist behavior ยังปรากฏแม้ ClickUp ระบุว่า Out of Scope — **ตัดสินใจไว้ (2026-08-04):
  ไม่ทำรอบนี้** ผู้ใช้สั่งไม่ให้รื้อ ทิ้งไว้ตามเดิม
- [ ] ไม่มี Autosave และ `Saved` state — ยังไม่ได้คุยรอบนี้ (เกี่ยวโยงกับ revision conflict ด้านล่าง)
- [ ] ไม่มี revision conflict handling — ยังไม่ได้คุยรอบนี้
- [ ] Publication Type ไม่มี disabled configuration ตาม capability — **ยืนยันแล้ว (2026-08-04):
  backend gap จริง** ไม่มี config/capability API ใดๆ อยู่เบื้องหลัง `publicationTypes` เลย
  (`mock-data.ts` hardcode ล้วน) ตัดสินใจไม่ทำ ไม่สร้าง fake config UI
- [x] Step Content ไม่เปิด default media filter ตาม Publication Type — **แก้แล้ว
  (2026-08-04)** `ContentStep.tsx` เปิด default filter เป็น image/video ตาม
  `basicInfo.publicationType` (playlist ไม่ auto-filter เพราะผสมสื่อได้), แทนที่ dropdown
  "All Types" เดิมที่เป็นแค่ placeholder ด้วยของจริงที่ผู้ใช้เปลี่ยนทับได้ — verified ผ่าน
  browser จริง
- [ ] Permission/load error states ยังไม่ครบ

**พร้อม Review เมื่อ**

- Save → reload → restore แล้วทุก input แสดงค่าเดิม
- เปลี่ยน Type แล้วไม่ลบ Content แบบเงียบ ๆ
- Type ที่ใช้ไม่ได้แสดง disabled พร้อมเหตุผล
- Autosave และ manual save ใช้ version contract เดียวกัน

## 3. Content

**สถานะ:** Partial  
**ไฟล์หลัก:** [`ContentStep.tsx`](./src/features/publications/components/ContentStep.tsx), [`upload-api.ts`](./src/features/publications/services/upload-api.ts)

**มีแล้ว**

- Browse upload
- Upload progress
- Preview
- Remove จาก draft
- เก็บ selected content ใน draft

**ยังขาด/ไม่เรียบร้อย**

- [ ] Drag & Drop
- [ ] Cancel upload
- [ ] Validation ก่อน/หลัง upload เช่น file type, size, duration และ dimensions
- [ ] Processing lifecycle: `Uploading`, `Processing`, `Ready`, `Warning`, `Failed`
- [ ] Retry และ Replace actions ที่ชัดเจน
- [ ] Upload retry แบบ idempotent
- [ ] Gate ที่ยืนยันว่า Content `Ready` และ persisted แล้วก่อน Continue
- [ ] Restore upload/processing state หลัง reload
- [ ] Remove จาก Publication ต้องไม่ลบ Asset กลาง

**พร้อม Review เมื่อ**

- ไฟล์ไม่ถูกต้องถูกปฏิเสธพร้อมข้อความที่แก้ไขได้
- Upload cancel/retry/timeout ทำงานโดยไม่สร้าง Asset ซ้ำ
- Continue ได้เฉพาะเมื่อ content อยู่สถานะ `Ready` และ save สำเร็จ
- Reload ระหว่าง processing แล้ว UI กลับมาแสดงสถานะจริงได้

## 4. Channels

**สถานะ:** Partial  
**ไฟล์หลัก:** [`ChannelsStep.tsx`](./src/features/publications/components/ChannelsStep.tsx)

**มีแล้ว**

- Search
- Grid/List view
- Multi-select
- Remove และ Clear All
- Offline selection
- Draft restore

**ยังขาด/ไม่เรียบร้อย**

- [ ] ทุก Screen ถูกบังคับ category เป็น `dooh` ทำให้ Category อื่นว่าง — บล็อกเพราะ `Screen` type
  ไม่มี field รองรับ (ดูหมายเหตุด้านล่าง), มาร์ก `ponytail:` ไว้ในโค้ดแล้ว
- [ ] Type/Location filters ไม่มี logic — บล็อกด้วยเหตุผลเดียวกับ category (ไม่มี field);
  Status filter ยังไม่ implement เช่นกันแม้ `status_level` มีอยู่แล้ว (ไม่ทำรอบนี้เพราะเหลือ
  Type/Location ทำไม่ได้ ทำ Status เดี่ยวจะ UI ไม่สม่ำเสมอ)
- [ ] More Filters ไม่มี logic
- [ ] ไม่มี Estimated Reach/Coverage — บล็อกด้วยเหตุผลเดียวกัน (ไม่มี field จาก backend)
- [x] ~~Status Summary นับทุก Channel แทนเฉพาะรายการที่เลือก~~ — ไม่ใช่บั๊ก พฤติกรรมเดิม (นับทุก
  channel ที่ fetch มา) ถูกต้องแล้ว **revert กลับ (2026-08-04)** หลังแก้เป็นนับเฉพาะ selected ไปก่อนหน้านี้
- [x] จำนวน Channel เป็น 0 แล้วเปอร์เซ็นต์แสดง `NaN%` — **แก้แล้ว (2026-08-04)** guard
  division-by-zero ผ่าน `statusPercent()`, verified ผ่าน browser จริง (เคลียร์ selection แล้วเห็น `0%`)
- [x] Fetch error ถูกแปลงเป็น empty list ทำให้แยก Error กับ Empty ไม่ได้ — **แก้แล้ว (2026-08-04)**
  `usePublishDraft` เก็บ error message จริงแยกจาก empty state, เพิ่ม empty-state message ด้วย —
  **ยังไม่ได้ simulate fetch error จริงเพื่อทดสอบ** (verified เฉพาะ empty-state path)
- [ ] Selection persistence ต้องยืนยันกับ backend ไม่ใช่ local state อย่างเดียว

**พร้อม Review เมื่อ**

- Category และ filter ทุกตัวให้ผลตามข้อมูล API
- Summary คำนวณจาก selected channels เท่านั้นและไม่เกิด `NaN`
- Error, empty และ loading แสดงคนละ state
- Reach/Coverage แสดงค่าจริงหรือ `Unknown` โดยไม่เดาตัวเลข

## 5. Schedule

**สถานะ:** Partial  
**ไฟล์หลัก:** [`ScheduleStep.tsx`](./src/features/publications/components/ScheduleStep.tsx)

**มีแล้ว**

- Schedule Type 4 แบบ
- Date/Time/Timezone
- Expiration
- Recurring
- Calendar
- Summary
- Conflict check บางส่วน

**ยังขาด/ไม่เรียบร้อย**

- [ ] Publish Order เป็น disabled placeholder
- [ ] Delay Between Channels เป็น disabled placeholder
- [ ] Advanced Options ไม่มี state/API contract
- [ ] AI Assistant/Get Suggestions ไม่มี implementation และควรนำออกหาก Out of Scope
- [x] Next ไม่ถูกปิดเมื่อ Schedule invalid — **ไม่ใช่ gap แล้ว** covered โดย P0.1's
  `validateStep()` (ทุก step รวม step 4 ต้องผ่าน `isScheduleFormValid` ก่อน Next ถึงเปลี่ยน
  step ได้ — ปุ่มไม่มี `disabled` attribute ตาม validity แต่ block การเปลี่ยน step จริงเหมือน step อื่น)
- [ ] Save/Restore ครอบคลุมเฉพาะข้อมูลหลัก
- [x] Conflict API failure ถูกตีความเป็น "ไม่มี conflict" — **แก้แล้ว (2026-08-04)** เพิ่ม
  `conflictsError` ใน `usePublishDraft.ts` (pattern เดียวกับ `screensError`),
  `computeEligibility()` ตีเป็น `unknown` (บล็อก Publish) แทน `pass`, `ScheduleStep.tsx`
  แสดง error banner + "Unknown/Error" ใน summary — verified ผ่าน browser จริง (block
  `conflicts` endpoint ใน DevTools แล้วเห็น banner/Publish ถูกบล็อก, unblock แล้ว recover)
- [ ] Summary ต้องยืนยันว่ามาจากข้อมูล persisted ไม่ใช่ local state เท่านั้น

**พร้อม Review เมื่อ**

- Invalid date/time/recurrence แล้ว Continue ไม่ได้
- Save → reload แล้ว Schedule และ Advanced Options กลับมาครบ
- Conflict service error แสดง `Unknown/Error` และห้าม Publish
- Disabled feature ถูกเอาออกจาก Phase 1 UI หรือมี Scope/contract รองรับจริง

## 6. Review & Publish

**สถานะ:** Blocked  
**ไฟล์หลัก:** [`ReviewPublishStep.tsx`](./src/features/publications/components/ReviewPublishStep.tsx), [`usePublishDraft.ts`](./src/features/publications/hooks/usePublishDraft.ts)

**มีแล้ว**

- Publication Summary
- Checklist UI
- Offline warning
- Schedule conflict UI
- Activate API

**ยังขาด/ไม่เรียบร้อย**

- [ ] Checklist ไม่ควบคุมปุ่ม Publish
- [ ] Version `v.1`, Created by และ timestamps เป็น mock
- [ ] Summary อาจแสดงข้อมูลจาก localStorage ที่ยังไม่ถูกบันทึก backend
- [ ] ไม่มี confirmation/recovery ที่ชัดเจนสำหรับ partial publish
- [ ] Retry หลัง timeout อาจสร้าง operation/job ซ้ำ
- [ ] Success state ไม่มีหลักฐานสำคัญ เช่น Publication ID หรือ job summary
- [ ] ไม่มี server-side eligibility validation ที่ยืนยันผลจาก client

**พร้อม Review เมื่อ**

- Publish disabled จน checklist ผ่านจากข้อมูล persisted ทั้งหมด
- Metadata มาจาก backend จริง
- Retry เป็น idempotent
- Success แสดง Publication ID และสถานะ job ที่ติดตามต่อได้
- Failure มี recovery path และไม่ทำให้ผู้ใช้เข้าใจผิดว่า Publish สำเร็จ

---

## P2 — Tests และคุณภาพที่ยังขาด

**ผลตรวจล่าสุด**

- Production build: ผ่าน
- TypeScript: ผ่าน
- Lint: 0 errors, 4 warnings เรื่อง `<img>`
- `schedule.check.mts`: ผ่าน
- `content-items.check.mts`: ผ่าน

**ยังต้องเพิ่ม**

- [ ] Component/integration test สำหรับทุก Step transition
- [ ] Required validation และ Next gate tests
- [ ] Save failure, retry และ restore tests
- [ ] Revision conflict/409 tests
- [ ] Upload validation, cancel, retry และ idempotency tests
- [x] Channels empty/zero-count tests — `channels-logic.ts` + `channels-logic.check.mts`
  (2026-08-04): covers empty screens, missing `status_level` fallback, search filter,
  category counts, and the `statusPercent` zero-division guard (mutation-tested). Error-state
  and reach/coverage tests still open — reach has no backend field yet (see Channels flow
  section above), error-state is just a prop passthrough with little logic to test.
- [ ] Schedule invalid/conflict service failure tests
- [ ] Publish eligibility และ duplicate activation tests
- [ ] E2E: Create Draft → reload/restore → Publish
- [ ] แก้ `<img>` lint warnings หรือบันทึกเหตุผลที่ยอมรับได้

Build ผ่านเพียงอย่างเดียวยังไม่ถือว่า Flow พร้อม Review เพราะ behavioral tests ของ wizard และ failure paths ยังไม่มี

## ลำดับการทำงานที่แนะนำ

1. สร้าง Step contract กลางและเปลี่ยนทุก Next ให้ใช้ `validate → persist → goNext`
2. เพิ่ม draft revision/version และ save conflict handling
3. ทำ Content Ready gate, Channel persisted gate และ Schedule validity gate
4. รวม checklist กับ Publish eligibility ให้เป็น source of truth เดียว
5. ทำ Activate/Publish ให้ idempotent และมี recovery
6. ปิด gap ราย Flow ตาม P1
7. เพิ่ม integration/E2E tests ตาม P2
8. อัปเดต ClickUp owner, due date, priority และ acceptance evidence ก่อนย้าย `REVIEW`

## Definition of Ready for Review

การ์ดจะย้ายเข้า `REVIEW` ได้เมื่อครบทุกข้อที่เกี่ยวข้อง:

- [ ] P0 ทั้งหมดเสร็จและมี test ยืนยัน
- [ ] Happy path และ failure path ของ Flow ผ่าน
- [ ] ข้อมูลที่ใช้ตัดสินใจไม่มาจาก Phase 1 mock
- [ ] Save/restore ทำงานหลัง reload
- [ ] Error state ไม่ถูกแปลงเป็น empty/success state
- [ ] Build และ TypeScript ผ่าน
- [ ] Lint ไม่มี error และ warning ที่เหลือมีเหตุผลกำกับ
- [ ] มี Assignee, Due date, Priority และ Time estimate
- [ ] แนบ acceptance evidence เช่น test output, screenshot หรือ API response

## คำเตือนสำหรับ AI ตัวถัดไป

- อย่าแก้ปุ่ม Next แยกทีละหน้าโดยไม่มี contract กลาง เพราะจะสร้าง behavior ไม่สม่ำเสมอ
- อย่าถือว่า localStorage เท่ากับ persisted backend state
- อย่าตีความ API error หรือ unknown state ว่า validation ผ่าน
- อย่าสร้าง Approval Workflow เพิ่มใน Phase 1
- อย่าสร้าง Publish Job ใหม่เมื่อ Retry; ต้อง retry job/operation เดิมแบบ idempotent
- อย่าย้ายการ์ดไป `REVIEW` เพียงเพราะ build ผ่าน

