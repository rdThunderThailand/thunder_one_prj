# Plan — ClickUp Flow Audit remediation (P0 → P1 → P2)

> อ่านคู่กับ [`CLICKUP_FLOW_AUDIT_GAPS.md`](../../CLICKUP_FLOW_AUDIT_GAPS.md) (ต้นฉบับ audit — มี checklist ละเอียดกว่านี้ต่อ Flow)
> ADR: [`0001-wizard-step-contract.md`](../adr/0001-wizard-step-contract.md), [`0002-publish-eligibility.md`](../adr/0002-publish-eligibility.md)

## ข้อเท็จจริงที่ยืนยันแล้ว — อย่า re-derive

- **P0.1 (Step contract)** เสร็จและ verify ผ่าน browser จริงแล้ว: `validateStep()` ที่
  [`step-validation.ts`](../../src/features/publications/step-validation.ts), wiring อยู่ใน
  [`CreatePublicationPage.tsx`](../../src/features/publications/components/CreatePublicationPage.tsx)
  (`handleNext`). เห็น `POST /api/proxy/media/publications → 201` เกิดก่อนเปลี่ยน step จริง,
  เห็น validation error message ("กรุณากรอกชื่อ Publication" ฯลฯ) render จริงตอน field ไม่ครบ.
  **ยังไม่ทดสอบจริง** (เขียนโค้ดแล้วเท่านั้น): save-failure path, double-click guard,
  Retry button.
- **P0.2 (Publish eligibility)** เสร็จและ verify ผ่าน browser จริงแล้ว: `computeEligibility()`
  ที่ [`publish-eligibility.ts`](../../src/features/publications/publish-eligibility.ts),
  ใช้ร่วมกันโดย `usePublishDraft.ts` (`canPublish`) และ `ReviewPublishStep.tsx` (checklist
  icons). สร้าง conflict จริง 3 รายการแล้วเห็น Publish ปุ่ม disabled + checklist row ขึ้น
  amber ตรงกัน, policy row (index 3) เป็น neutral เสมอตามที่ตั้งใจ (ไม่ใช่ approval workflow).
  **ยังไม่ทดสอบจริง**: schedule-invalid path, `loadingRefs`/`checkingConflicts` true ระหว่าง
  render, กด Publish จริงตอนผ่านเกณฑ์ครบ (ไม่ได้ activate publication ระหว่าง session นี้).
- ทั้งสอง P0 delegate ให้ `agy` (Gemini 3.1 Pro High) ตาม spec ที่เขียนไว้ล่วงหน้า แล้ว Claude
  ตรวจ diff ทุกไฟล์ + รัน `tsc`/`lint` + verify ผ่าน browser เอง ไม่ได้เชื่อ report ของ agy ตรงๆ
  (พบ 1 จุดที่ agy รายงานผิด: อ้างว่าไฟล์ ≤300 บรรทัดทั้งที่จริง 302 — แก้เองแล้ว).
- `npx tsc --noEmit` และ `npm run lint` ผ่านทั้งคู่ (0 error, 4 warning `<img>` เดิมที่ไม่เกี่ยวกับงานนี้).
- สร้าง **test draft publication จริงบน backend** ระหว่าง verify — ชื่อ
  `ทดสอบ P0.1 Step Contract`, campaign `Unassigned`, มี content 1 asset + channel 1 ตัว +
  schedule (จงใจให้ conflict) — **ไม่ได้ activate และยังไม่ได้ลบ**. ลบเองไม่ได้เพราะ delete
  ข้อมูลจริงเป็น R0 ต้องขอ user ก่อน.
- **ยังไม่ commit อะไรเลย** ในรอบนี้ — ทุกอย่างเป็น working tree changes รอสั่ง.

## DECISION PENDING — P0.3 (revision/version + idempotency)

หยุดก่อนเริ่ม P0.3 เพราะพบว่า **ไม่ใช่แค่ frontend gap** — `publications-api.ts` ไม่มี
`revision`/`version` field ให้ส่งเลย และ endpoint `/media/publications/{id}/activate` ไม่มี
idempotency key รองรับ ต้องแก้ backend (`Thunder_Core`, ชี้ prod DB, migration ต้องผ่าน
Supabase MCP `apply_migration`) ไม่ใช่แค่โค้ดใน repo นี้.

สามทางที่เสนอไว้ (ยังไม่เคาะ):

1. **ข้าม P0.3 ไปทำ P1 gaps ต่อในนี้ก่อน** (แนะนำ) — P0.1/P0.2 ปลดบล็อกงานส่วนใหญ่แล้ว, P1
   ทุกข้อ (Overview mock data, Basic Info restore, Content lifecycle, Channels filter,
   Schedule advanced options) อยู่ใน repo นี้ทั้งหมด ไม่ต้องแตะ prod schema วันนี้.
2. **เปิด `Thunder_Core` แล้ววาง ADR สำหรับ backend schema change** — ต้อง apply migration
   จริงบน prod, เสี่ยงสูงกว่า ควรทำเป็น session แยกที่ focus บน backend อย่างเดียว.
3. **ทำเฉพาะส่วน frontend ที่ทำได้โดยไม่รอ backend** (เช่น disable retry ซ้ำ, dedupeในหน้า)
   — ได้ไม่ครบตาม acceptance criteria เดิมเพราะไม่มี revision จริงจาก server, เป็นแค่ patch
   ชั่วคราว.

**ผู้ใช้ยังไม่เลือก** — เซสชันถัดไปต้องถามคำถามนี้ก่อนเริ่ม P0.3 ห้ามเดาแล้วเปิด Thunder_Core
เอง.

## ลำดับต่อจากนี้ (อ้างจาก audit doc "ลำดับการทำงานที่แนะนำ")

1. ~~สร้าง Step contract~~ ✅
2. **[DECISION PENDING]** เพิ่ม draft revision/version + save conflict handling (P0.3)
3. Content Ready gate / Channel persisted gate / Schedule validity gate แบบเจาะ Flow — ยัง
   ไม่เริ่ม (P1 รายละเอียดอยู่ใน audit doc หัวข้อ 1–6)
4. ~~รวม checklist กับ Publish eligibility~~ ✅
5. Activate/Publish idempotent — ผูกกับ P0.3
6. ปิด gap ราย Flow ตาม P1 (Overview, Basic Info, Content, Channels, Schedule, Review&Publish)
7. เพิ่ม integration/E2E tests ตาม P2 — ยังไม่เริ่มเลย, repo นี้ไม่มี test runner (ดู
   `test-handoff` skill ถ้าต้องเขียนจริง)
8. อัปเดต ClickUp owner/due date/priority/evidence ก่อนย้าย `REVIEW` — ยังไม่ทำ

## Workflow ที่ใช้ได้ผลรอบนี้ (ทำต่อแบบเดิมได้)

สำหรับแต่ละ P0/P1 item ที่เป็น design fork:
1. อ่านโค้ดจริงที่เกี่ยวข้องก่อน (ไม่เดา) — ใช้ Explore agent ถ้าต้องอ่านหลายไฟล์
2. เขียน ADR สั้นๆ ที่ `docs/adr/000N-*.md` — เคาะ contract/shape เอง พร้อม rejected
   alternatives
3. เขียน handoff spec ที่ `/tmp/handoff-<task>.md` (plan-handoff skill format) อ้าง ADR
   เป็น context ให้ agy อ่านก่อนเริ่ม
4. Delegate ให้ `agy --model gemini-3.1-pro-high` ผ่าน Terminal window จริง (osascript),
   รอด้วย `.done` sentinel
5. ตรวจ diff จริงทุกไฟล์ (`git diff`) — อย่าเชื่อ finish report เปล่าๆ, เจอ agy รายงานผิดมาแล้ว 1 ครั้ง
6. รัน `tsc --noEmit` + `npm run lint`
7. Verify ผ่าน browser จริง (dev server มักรันอยู่แล้วที่ port 3001 ไม่ใช่ 3000 — เช็คก่อน
   เรียก `preview_start`, อย่า kill process ของ user)
8. อัปเดต checklist ใน `CLICKUP_FLOW_AUDIT_GAPS.md` ให้ตรงกับอะไร verified จริง vs. เขียนโค้ด
   แล้วแต่ยังไม่ทดสอบ — ห้ามเหมาว่า "เสร็จ" ทั้งที่ยังไม่ verify
