# MW-003 bug triage — Media Workspace user test

วันที่: 2026-10-06 (rev.3 หลัง scrutinize รอบ 2) · ที่มา: การ์ด MW-003-BUG-01..10 (FigJam "Media Workspace", node 1811-779)
สถานะ: **triage เท่านั้น — ยังไม่ได้แก้โค้ด** · root cause ทุกข้อมาจากการอ่านโค้ด ยังไม่ได้ repro
Evidence ใน FigJam ยังไม่ได้ดู (board ต้อง login, Figma MCP ยังไม่เปิด) — วิดีโอ (01, 07, 08) ดูไม่ได้อยู่แล้ว
Migration ที่อ้าง: เทียบแล้วว่า definition ล่าสุดตรงกันทั้ง Thunder_Core `origin/develop` และ checkout ปัจจุบัน (`codex/core-142-mutation-guards`) — ก่อนลงมือแก้ต้องสลับไป `develop`

## คำศัพท์ที่เคาะ

- **Content** = สิ่งที่ zone เล่น (Media หรือ Playlist) · **Media** = ไฟล์ใน library (ตอบคำถามใน BUG-04)
- "layout" ในการ์ด 01/04/06/07/08 = **Composition** (route `/media-workspace/layouts/[layoutId]`, ตาราง `media_core.compositions`) ไม่ใช่ Template (`/layouts/templates`)

## สรุป

| # | Issue | เรื่อง | Root cause (ย่อ) | มั่นใจ | Tag | ลำดับ |
|---|---|---|---|---|---|---|
| 01b | #220 | Undo ข้ามจุด save/fork | history ไม่ถูก reset → zone id เก่ากลับมา | กลไกสูง, ความถี่ต่ำ | R2 | **1 (ก่อนหรือพร้อม 04)** |
| 04 (=05) | #221 | ลบ zone ที่มี content แล้ว save ไม่ได้ | RPC บล็อก binding ของ composition ตัวเอง | สูง | migration → R0 ตอน apply | **1** |
| 10 | #222 | เลือกวันเวลาย้อนหลังได้ | ไม่มี `min`, validate แค่วัน, backend ไม่เช็ค | สูง | R2 (FE) + migration (R0) | 2 |
| 08 | #223 | editor ว่างกระพริบ | `loading` ปิดก่อน geometry มา | สูง | R2 | 2 |
| 09 | #224 | preview Create Channel ไม่ตรง config | preview เป็น flex แถวเดียว ไม่อ่าน rows/cols/aspect | สูง | R2 | 2 |
| 01 | #225 | Undo ไม่ย้อนการลบวิดีโอ | history เก็บแค่ geometry | สูง | design fork → ADR | 3 |
| 02 / 03 | #226 | draft วิดีโอ → รูป ไม่ติด | การเปลี่ยนไม่ถูก save ขึ้น server | กลาง-ต่ำ | R2 | 3 |
| 02b | #227 | Playlist → Media fail ตอน Next | upsert `COALESCE` เก็บ `playlist_id` เดิม | กลาง | migration → R0 ตอน apply | 3 |
| 07 | #228 | Publish to channel กลับ step 1 | resume prompt ทิ้ง seed เงียบๆ (ADR 0072 §3) | กลาง-สูง | design fork → ADR | 3 (หลังหรือพร้อม 02) |
| 06 | #229 | ใช้ชื่อซ้ำหลังลบไม่ได้ | soft delete + `UNIQUE(tenant_id, name)` ไม่ partial | สูง | design fork → ADR + R0 | 3 |

ข้อ 01b และ 02b ไม่ได้มาจาก QA — เจอระหว่างไล่โค้ด

---

## BUG-01 / 01b — Undo/redo ในหน้า Composition editor

"Reverse Zone" ไม่มีในโค้ด — คือปุ่ม Undo/Redo (`CompositionEditorHeader.tsx:162`, Ctrl/Cmd+Z)

**Root cause (01):** `useZoneHistory` เก็บแค่ `LayoutZone[]` (`compositions/hooks/useZoneHistory.ts:14-15`, comment ที่ `:3`)
— ADR 0063 §5 รับ undo/redo มาแบบ client-only แต่ไม่ได้เขียนว่า "geometry เท่านั้น"; ขอบเขตนี้มาจากตัว hook
การเอา item ออกจาก content list เป็น binding change (`ZoneContentList.tsx:120` → `setBinding`, `CompositionEditorPage.tsx:140-145`) ไม่มี checkpoint → Undo ไปย้อน geometry edit ก่อนหน้าแทน
(ลบทั้ง zone แล้ว undo ใช้ได้ เพราะ binding ไม่ถูกลบออกจาก state)

**สาเหตุที่เป็นไปได้อีกข้อ:** Ctrl/Cmd+Z เป็น global listener ที่ `preventDefault` แม้อยู่ใน text input (`useZoneHistory.ts:50-67`) — แย่ง undo ของช่องพิมพ์ อาจเป็นสิ่งที่ QA เห็นว่า "reverse ไม่ทำงาน"
(อีกจุด ไม่อยู่ใน scope: `undo`/`redo` เรียก `setFuture`/`onChange` ใน updater ของ `setPast` — StrictMode เรียกซ้ำใน dev)

**01b:** `absorbLayout` (`CompositionEditorPage.tsx:150-154`) ไม่ reset `past`/`future` และ hook ไม่มี `reset()` (`useZoneHistory.ts:69`)
- zone ที่ save แล้วคง id เดิม (RPC `UPDATE` แถวเดิม) — id เปลี่ยนเฉพาะ zone ที่ client สร้างใหม่ (`CompositionEditorToolbar.tsx:55,64,72`) และ path blank/preset (`save-composition.ts:120-146`)
- Save draft / Save & Activate navigate ออก (`CompositionEditorPage.tsx:244, 246-249`) history หายไปเอง — path ที่ยังค้างบนหน้าคือ Publish Changes (`:173-180`), save ที่ล้มหลัง `absorbLayout` ถูกเรียกแล้ว (`save-composition.ts:109,142`) และ **fork** (`:181-194`) ซึ่ง undo จะคืน zone id ของ Template เข้า layout ที่ fork แล้ว
- **ผลกระทบตอนนี้:** save ถัดไปชน guard ของ BUG-04 → "save ไม่ได้" (บางเคสที่รายงานเป็น 04 อาจเป็นอันนี้)
- **หลังแก้ 04:** zone จริงถูกลบ-สร้างใหม่ และ binding ที่ผูก id เดิมไม่ถูก remap (`zone-bindings.ts:266-279`, `save-composition.ts:169`) → **binding หายเงียบๆ** ⇒ 01b ต้องขึ้นก่อนหรือพร้อม 04

**แก้ (Q7 = c):**
1. ตอนนี้: เพิ่ม `reset()` ใน `useZoneHistory` เรียกใน `absorbLayout` และ `handleForkLayout` · ให้ Ctrl/Cmd+Z ข้ามเมื่อ focus อยู่ใน input/textarea/select/contenteditable
2. ภายหลัง: ADR ใหม่ ขยาย undo ให้คลุม geometry + binding เป็น snapshot เดียว

**ต้อง repro:** "ลบวิดีโอ" = เอา item ออกจาก content list หรือลบทั้ง zone · กด undo ด้วยปุ่มหรือคีย์ลัด และ focus อยู่ที่ไหน

## BUG-04 (= 05) — ลบ zone ที่มี content แล้ว save ไม่ได้

**Root cause:** `persistComposition` เขียน geometry ก่อน (`upsertLayout`, `save-composition.ts:92`) แล้วค่อยแทน binding (`setCompositionZones`, `:199`)
`media_layout_upsert` (definition ล่าสุด `Thunder_Core/supabase/migrations/20260826120000_composition_schema_and_rpcs.sql:482-660`) หา composition ที่อ้าง zone ที่หายไปโดยไม่ยกเว้นตัวเอง
→ `RAISE 'Invalid input: zone is used by composition(s) %'` (`:610-620`)
Error นี้ไม่ match ข้อความไหนใน `status-display.ts:27-55` → ผู้ใช้เห็นแค่ "บันทึก Composition ไม่สำเร็จ"
ขั้น "เพิ่ม zone ใหม่ + content" ไม่จำเป็น — `toSetZonesPayload` เขียนแถวเฉพาะ zone ที่มี content (`zone-bindings.ts:216`) ลบ zone ที่ binding ถูก save แล้วอย่างเดียวก็พัง

**แก้ (Q8 = a, Q14 = ก):** migration แก้ `media_layout_upsert`
- inline layout มี composition ได้มากสุดหนึ่งตัว — บังคับใน RPC (`media_composition_upsert` lock `FOR UPDATE` + นับ `v_other_uses`, `20260827103121_layout_kind_template_split.sql:79-86`) ไม่ใช่ด้วย constraint
- guard ยังทำงานอยู่ แต่เมื่อ layout เป็น `kind = 'inline'` ให้ยกเว้นเฉพาะ composition ที่ `c.layout_id = v_layout_id` (ไม่ข้าม guard ทั้งหมด — `media_composition_duplicate` มี fallback `COALESCE(new_zone.id, cz.layout_zone_id)` ที่ `20260827111500…:52` ซึ่งในทางทฤษฎีอาจทิ้งแถวของ composition อื่นที่อ้าง zone นี้ไว้)
- **และต้อง `DELETE FROM media_core.composition_zones` เฉพาะของ composition เจ้าของ สำหรับ zone ที่จะลบ ก่อน** `DELETE FROM layout_zones` (`20260826120000_composition_schema_and_rpcs.sql:621`) — FK `ON DELETE RESTRICT` (`20260826120000_…sql:70`) ไม่งั้นได้ raw 23503
- ไม่ชนกับ `set_zones` ใน save เดียวกัน: `set_zones` ทำ DELETE + INSERT ทั้งชุด (`20260908150000_zone_media_fit_and_mute.sql` ~`:133-135`) และ `layout_upsert` ไม่แตะ `compositions.revision` · ถ้า save ล้มระหว่างสองขั้น สถานะยังสอดคล้อง (zone หายพร้อม binding)
- signature ไม่เปลี่ยน → `CREATE OR REPLACE` ได้ ไม่ต้อง DROP/GRANT ใหม่ · คง `SET search_path = ''` และ qualify `media_core.`
- Template (ร่วม) ยังบล็อกเหมือนเดิม — แม้มี composition ใช้แค่ตัวเดียว; map "zone is used by" เป็นข้อความที่อ่านรู้เรื่องสำหรับเคสนี้

**ต้อง repro:** response ของ PATCH `/media/layouts/:id` (คาด 400 พร้อมชื่อ composition ตัวเอง)

## BUG-06 — ใช้ชื่อ layout ซ้ำหลังลบไม่ได้

**Root cause:** Move to Trash = ตั้ง `deleted_at` (`media_composition_trash`, `20260908160000_block_trashing_used_compositions.sql`) แต่ `media_core.compositions` มี `UNIQUE (tenant_id, name)` แบบไม่ partial (`20260826120000_...sql:56`, ไม่มี migration ไหนแก้ทีหลัง)
→ `media_composition_upsert` (`20260827103121_layout_kind_template_split.sql:70-114`) raise "Already exists" → "มี Composition ชื่อนี้อยู่แล้ว"
"Delete forever" ปลดชื่อได้ แต่ถูกบล็อกถ้ามีแถว publication ใดๆ แม้เป็น draft (`20260901043400_composition_library_lifecycle.sql:36-56`)

**path ที่สอง:** แถว `layouts` แบบ inline ถูก rename เป็น `comp:<id>` (`20260827103121_...sql:29`) จึงชนได้เฉพาะ Template ที่มีอยู่จริง หรือแถวกำพร้าจาก save ที่ล้มระหว่าง step 1–2 (`save-composition.ts:123-140`)
ถ้าข้อความเป็น "มี Template ชื่อนี้อยู่แล้ว" = path นี้ — partial index **ไม่ช่วย**

**แก้ (Q9 = a, Q13 = a):**
- partial unique index `WHERE deleted_at IS NULL` — query ชื่อ constraint จริงจาก DB ก่อน DROP
- `media_composition_restore` ที่ชื่อชน → ต่อท้าย " (2)", " (3)"… จับ `unique_violation` แล้ว retry (กัน race)
- restore ตอนนี้คืน `void` (`20260901043400_...sql:26-34`) ต้องเปลี่ยนเป็นคืนชื่อใหม่ → **DROP + CREATE + REVOKE/GRANT ใหม่** (`CREATE FUNCTION` ให้ PUBLIC execute) + แก้ route/FE ให้ toast ชื่อใหม่
- upsert/duplicate ใช้ `EXCEPTION WHEN unique_violation` อยู่แล้ว ทำงานกับ partial index ได้
- ต้องเขียน ADR · apply บน prod = **R0**

## BUG-08 — editor ว่างกระพริบตอนเปิด

**Root cause:** `loading` เป็น false ทันทีที่ `loadCompositionDraft` เสร็จ แต่ geometry โหลดแบบ fire-and-forget (`CompositionEditorPage.tsx:115-134`, `void fetchLayout(...)`)
และ `fetchLayouts()` ดึงแค่ `kind=template` (`layouts-api.ts:10`) จึงไม่มี geometry inline → หนึ่งรอบ render เป็น "Start from the Template Picker" (`:327-331`)
ใน `media-workspace` ไม่มี `loading.tsx` และ route ใช้ `<Suspense fallback={null}>`
ถ้า `fetchLayout` ล้ม (`.catch(() => undefined)`, `:131`) editor ค้างหน้านั้นถาวร พร้อมปุ่ม "+ New Layout" บน composition ที่มีอยู่แล้ว

**แก้ (Q10 = a):** ให้ `loading` รอ geometry ด้วย + skeleton ของ editor + **แสดง error เมื่อ `fetchLayout` ล้ม** (ไม่งั้นได้ spinner หรือหน้าว่างค้างแทน)

## BUG-09 — preview ใน Create Channel ไม่ตรง display config

**Root cause:** `channels/components/create-wizard/Step2Setup.tsx:100-115` วาดเป็น `flex` แถวเดียว ช่องกว้างเท่ากัน อ่านแค่ `screen.resolution` เป็นตัวหนังสือ
ไม่อ่าน `rows`/`cols` (`display-config.ts:12-19`) หรือสัดส่วน resolution → 2×1/3×1 ไม่ซ้อน, 2×2 เป็น 1×4, portrait เปลี่ยนแค่ตัวหนังสือ · single-screen ไม่มี preview

**แก้ (Q6 = c):** CSS grid ตาม rows×cols + `aspect-ratio` ตาม resolution, รวม single-screen
ไม่มี ADR กำหนดหน้าตา — เช็ค Lovable ก่อนว่ามี mockup ไหม (ถ้ามี ยึดตามนั้นตาม AGENTS.md)

## BUG-02 / 03 (+ 02b) — draft วิดีโอ → รูป ไม่ติด

03 = Media branch ใน Step 1 — ไม่มีทางเข้าจากหน้า Media จริง (ไม่มีลิงก์ `?assetId=`) จึงเป็น path เดียวกับ 02

**Root cause (สมมติฐาน):** chain save/reload ถูกต้อง (`commitMedia` → `setBasicInfo` → `persistDraft` ส่ง `publication_type` → upsert)
แต่หน้า Create save ขึ้น server ที่ปุ่ม Next เท่านั้น (`CreatePublicationPage.tsx:313-345`)
- เลือก content แล้ว auto-advance (`:492`) และ stepper กระโดดได้ (`:481`) โดยไม่ save
- `saveDraft` ใน `usePublishDraft.ts:288-319` ไม่ถูกใช้ในหน้า Create (`:195-213`)
- การเปลี่ยนจึงอยู่แค่ localStorage (`thunderone.publications.create-draft.v14`, `usePublicationDraftStore.ts:229`)
- หลักฐานสนับสนุน: `:139` ถ้า `?id=` ตรงกับ `publicationId` ใน local จะข้ามการโหลดจาก server → ใน browser เดิมดูเหมือน save ติด แต่ browser อื่น / หลัง Cancel / หน้า Detail ได้วิดีโอจาก server

**02b:** เปลี่ยน Playlist → Media: `setBasicInfo` ตั้ง `playlistId` null (`usePublicationDraftStore.ts:136-147`) → `basicInfoToForm` ละ key (`draft-mapping.ts:25-27`)
→ upsert `COALESCE(p_playlist_id, playlist_id)` เก็บ playlist เดิม (`20260913250000_...sql:169,206`) → `set_content` raise "linked to a playlist it does not own" (`20260910232248_...sql:105-106`)
ส่ง `playlist_id: null` จาก FE **ไม่ได้ผล** — route schema `z.string().uuid().optional()` ไม่ nullable (`publications/route.ts:26`) และ `COALESCE` ก็เก็บค่าเดิมอยู่ดี

**แก้ (Q11 = a, Q15 = ข):**
- ปุ่ม "Save draft" ใน header (ใช้ `saveDraft` ที่มี) + stepper/auto-advance save ก่อนเลื่อน
- Save draft ต้อง disable จนกว่าจะมีชื่อ (`saveDraft` ขึ้น toast error เมื่อชื่อว่าง, `usePublishDraft.ts:294-299`; `persistDraft` คืนเงียบๆ `:223-225`)
- 02b: migration แก้ `media_publication_upsert` ทั้งสอง UPDATE branch (`20260913250000_…sql:166-169` idempotency replay และ `:203-206` by-id; INSERT `:134-137` ไม่ต้องแก้) → **R0 ตอน apply** · FE ไม่ต้องแก้
  - **กฎ (Q18 = a, แทน Q15 ข):** ล้าง `playlist_id` เมื่อ `publication_type` เปลี่ยนจากค่าที่เก็บไว้ **และ** `p_playlist_id IS NULL`
    เหตุผล: กฎ Q15 ข (ล้างเมื่อ playlist ไม่ใช่ `single` และ type ไม่ใช่ playlist) ไม่ครอบทิศกลับ — Media → Playlist โดยยังไม่เลือก playlist จะเหลือ `single` ตัวเดิมค้างเป็น type playlist แล้ว activate ผ่านและออกอากาศ playlist ที่ซ่อนอยู่
  - path single playlist ที่ซ่อนอยู่ไม่โดนผลกระทบ: `playlist_id` เป็น NULL แล้ว `set_content` สร้าง single ใหม่เอง (`20260910232248_…sql` ~`:69-75`)

**ต้อง repro:** หลังเปลี่ยนเป็นรูปกดอะไร (Next / stepper / ออกจากหน้า) · กลับมาทางไหน · Network มี PATCH + PUT `/content` ไหม

## BUG-07 — "Publish to channel" จาก Layout กลับไป step 1

**Root cause:** `CompositionEditorPage.tsx:240` → `/media-workspace/program/create?compositionId=<id>` ทางสะอาด skip ไป step 2 ได้ถูกต้อง
แต่ถ้ามี local draft ที่ "มี content" (`resume-prompt.ts` นับแม้แค่ชื่อหรือ `step > 1`) จะเด้ง prompt "มี draft ที่ทำค้างไว้"
"ทำต่อ" (ปุ่มหลัก) และการปิดด้วย X/Esc → `resolveSeed` คืน `discard` → Layout ถูกทิ้งเงียบๆ (`seed-resolver.ts`, `CreatePublicationPage.tsx:411-421`)
local draft ล้างแค่ตอน Cancel/publish → prompt เด้งเกือบทุกครั้ง
เป็นพฤติกรรมตาม ADR 0072 §3 (`seed-resolver.check.mts:13-16`) — ปัญหาอยู่ที่ design

**แก้ (Q12 = b, Q16):**
- prompt บอกชื่อ Layout ที่ส่งมา, ปุ่มหลัก "ใช้ Layout นี้", X/Esc = ใช้ Layout นี้
- ไม่นับ draft ที่ **save ขึ้น server แล้วและไม่มีแก้ค้าง** ว่าเป็น "draft ที่ทำค้าง":
  `publicationId && serializeDraftFields(s) === s.savedSnapshot` (ไม่ใช่แค่ `publicationId` — Next ไม่เรียก `markSaved` จึงมีแก้หลัง Next ค้างใน local ได้)
  - ต้องเพิ่ม `markSaved()` หลัง `handleNext` persist สำเร็จ → **07 ต้องขึ้นหลังหรือพร้อม 02**
  - ก่อน apply seed เมื่อ local draft มี `publicationId` ให้เรียก `usePublicationDraftStore.getState().cancelDraft()` — ไม่งั้น seed เขียนทับ store ที่ยังถือ `publicationId` เดิม แล้ว Next ถัดไป PATCH ทับ draft บน server เงียบๆ (ADR 0072 §3 ห้ามไว้)
  - **ห้ามใช้ `performCancel`** — มันลบแถวบน server เมื่อ `!explicitlySaved` (`CreatePublicationPage.tsx:294-296`)
  - แก้ `Pick<>` ของ `hasDraftContent` ให้รวม `publicationId` + เพิ่ม case ใน `resume-prompt.check.mts`
  - ผลข้างเคียง: เปิด `/create` เปล่าๆ กับ draft ที่ save แล้วจะ resume โดยไม่ถาม
  - ห้ามล้าง local draft ตอนเปิด `?id=` เพราะ `?id=` โหลดเข้า store ตัวเดียวกัน (`:136-166`) · ถ้าเปลี่ยน shape ของ store ต้องขึ้น key เป็น `v15`
- ADR ใหม่แทน ADR 0072 §3 + แก้ `seed-resolver.check.mts`

**ต้อง repro:** ผู้ใช้เห็น prompt ไหม — ถ้าไม่เห็น ยังไม่มี path อื่นที่อธิบายได้

## BUG-10 — schedule เลือกวันเวลาย้อนหลังได้

**Root cause:**
- `DateField`/`TimeField` (`edit/schedule/ScheduleConfigFields.tsx:45, 86`) ไม่มี `min`
- `validateDraft` (`schedule-preset.ts:151-182`): continuous เช็คแค่ `endDate < today` · weekly/monthly ยอม start ย้อนหลัง · one-time ไม่ดูเวลา (วันนี้ 09:00 ผ่านตอน 15:00) · custom dates error เมื่ออดีต *ทุก* วันเท่านั้น
- `today` ถูกตั้งครั้งเดียวตอน mount (`ScheduleStep.tsx:31`, `EditScheduleModal.tsx:43`)
- backend `media_publication_set_schedule` เช็คแค่ `ends_at > starts_at` (`20260930180000_recurrence_custom_dates.sql:300`) และรับเฉพาะ draft (`:201`); activate ไม่มีเช็ค now()

**แก้ (Q5 = a, Q17 = ข):** ปฏิเสธเฉพาะช่วงที่ไม่มีทางได้ออกอากาศ
- end ของ one-time/continuous ก่อน now
- custom date ในอดีต **เฉพาะวันที่เพิ่มใหม่** (วันที่ผ่านไปแล้วของ Live program ปล่อยไว้ ไม่ prune)
  - baseline = schedule บน server จาก `detail`/`baseline` ของ `useProgramEdit` (`:132`) — **ไม่ใช่** prop `schedule` ของ `EditScheduleModal` (`:31,44`) ซึ่งเป็นค่าที่ `onApply` ล่าสุด
  - `validateDraft` รับ baseline เป็น optional — caller ใน wizard (`step-validation.ts:70`, `publish-eligibility.ts:93`, `ReviewStep.tsx:56`, `ProgramSummaryRail.tsx:99`, `PublishStep.tsx:16`, `usePublishDraft.ts:141,270`) ไม่ส่ง = ทุกวันเป็นของใหม่
  - หน้า Edit ของ program ที่ยังเป็น draft (`set_schedule`, `useProgramEdit.ts:148-149`) ใช้กฎ draft = ทุกวันเป็นของใหม่
- start ย้อนหลังของ recurring ยังยอม — Edit ของ Live program มี start ในอดีตเป็นปกติ
- UI: `min` เฉพาะช่อง end และวันที่ของ one-time/custom (ห้ามใส่ที่ start ของ recurring) + คำนวณ `today` ใหม่ทุกครั้งที่ validate
- backend (migration, R0): เช็คตอน activate **และ** ใน RPC update-published (path แก้ Live program ผ่าน `updatePublishedPublication`, `useProgramEdit.ts:116`)

---

## ADR ที่ต้องเขียน

1. ขอบเขต Undo ครอบคลุม binding (BUG-01)
2. ชื่อ Composition หลังลบ + restore ชื่อชน (BUG-06)
3. Handoff จาก editor เทียบ local draft (BUG-07, แทน ADR 0072 §3)

## ขั้นต่อไป

1. คุณเช็ค report นี้
2. repro ข้อที่มั่นใจต่ำ (02, 07, 01b) — ขอ evidence หรือ export รูปจาก FigJam ของ 02/04
3. ~~สร้าง GitHub Issues~~ — สร้างแล้ว #220–#229 (2026-10-06)
