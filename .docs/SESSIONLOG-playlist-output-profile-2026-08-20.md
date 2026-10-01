# SESSIONLOG — Playlist Type & Output Profile (2026-08-20)

## โจทย์

ตรวจ ClickUp ticket `86d3xxkab` ("Playlist Type & Output Profile", subtask ของ `86d3xxk5b`) พร้อมซับ
4 ใบ (4.1 Playlist Type, 4.2 Resolution, 4.3 Frame Rate, 4.4 Output Profile Validation) — ตรวจกับ
`thunder_one_prj` base `856b7e9` → head `07be050` (branch `feat/playlistOverview`) และ `Thunder_Core`
working tree, บวก query จริงเข้า prod (read-only) เพื่อเช็คว่ามี playlist ใช้ type `dynamic/loop/manual`
อยู่จริงหรือไม่

## ผลตรวจ (ก่อนแก้)

**Overall: Failed.** Selector ทุกตัวมีอยู่และดูถูกต้อง แต่ Output Profile ทั้งชุดอยู่แค่ frontend —
backend ไม่ validate อะไรเลย, resolution เก็บเป็น string ไม่ใช่ตัวเลข, aspect ratio อยู่แค่ใน label,
และไม่มี combination validation เลย รายละเอียดเต็มอยู่ในแผน
`/Users/arty/.claude-thunder/plans/https-app-clickup-com-t-3803720-86d3xxka-async-otter.md`

Prod check: `media_core.playlists` 62 แถว — `standard` ×5, ไม่มี profile ×57, ไม่มีแถวไหนใช้
`dynamic`/`loop`/`manual` เลย

## Design fork ที่เคาะ (ผู้ใช้ตัดสิน, บันทึกใน ADR 0032)

1. Type enum เหลือ `standard` + `dynamic` (สำรอง, ยังผลิตไม่ได้เฟสนี้) — ตัด `loop`/`manual` ทิ้ง
2. แหล่ง enum: zod enum ที่ Thunder_Core routes (ไม่เพิ่ม config endpoint)
3. Resolution: เพิ่ม `width`/`height` เป็นตัวเลขใน metadata, aspect ratio คำนวณ ไม่เก็บ
4. 4.4: validate รายฟิลด์เท่านั้น ไม่มีกฎข้ามฟิลด์ (ไม่มีข้อมูล player capability จริง)

**แก้คำแนะนำตัวเองระหว่างวางแผน:** เดิมจะขึ้น `METADATA_VERSION` ตอนเพิ่ม width/height — ผิด เพราะ
`decodeMetadata` คืนค่าว่างทันทีถ้า version ไม่ตรง จะทำให้ 62 playlist เดิมเสีย description/campaign/
tags/cover หมด → ไม่ขึ้นเวอร์ชัน เพิ่มเป็น key เสริมแทน

## งานที่ทำ

**Frontend (`thunder_one_prj`):**
- ใหม่ `src/features/playlists/output-profile.ts` — single source ของ RESOLUTIONS/FRAME_RATES/
  CREATABLE_PLAYLIST_TYPES + `parseResolution`/`aspectRatio`/`resolutionLabel`
- `src/features/playlists/output-profile.check.mts` — ใหม่, ผ่าน
- `types/index.ts` — `PLAYLIST_TYPES` เหลือ `["standard","dynamic"]`, เพิ่ม `CREATABLE_PLAYLIST_TYPES`,
  `PlaylistInfo` เพิ่ม `width?`/`height?`
- `metadata.ts` — encode คำนวณ width/height จาก resolution, decode อ่าน width/height แล้ว fallback
  parse resolution ให้แถวเก่า, import `PLAYLIST_TYPES` แทนลิสต์ literal ซ้ำ
- `BasicInfoStep.tsx` — ใช้ค่าจาก `output-profile.ts` แทนลิสต์ hardcode ในไฟล์
- `content-compatibility.ts` — ใช้ `parseResolution` ร่วมแทนของตัวเอง
- `PlaylistSummary.tsx`/`PlaylistProperties.tsx`/`PlaylistPanelTabs.tsx` — โชว์ resolution ผ่าน
  `resolutionLabel()` (แก้ inconsistency 4K เดิม label `(4K)` ตอนอันอื่น `(16:9)`)

**Backend (`Thunder_Core`, คนละ repo, ยังไม่ deploy):**
- ใหม่ `src/lib/core/playlist-metadata.ts` — `validatePlaylistOutputProfile()` เช็ค
  `metadata.info.{playlist_type,resolution,width,height,frame_rate}` ด้วย zod, throw
  `Invalid input: …` (apiHandler แปลงเป็น HTTP 400)
- wire เข้า `media/playlists/route.ts` (POST) และ `media/playlists/[id]/route.ts` (PATCH)

**Docs:**
- `docs/adr/0032-playlist-output-profile.md` — บันทึกทั้ง 4 มติ + rejected options

## Verify

**Static (รันจริงแล้ว):**
- `node output-profile.check.mts` — ผ่าน
- `node content-compatibility.check.mts` — ผ่าน
- `node metadata.check.mts`, `node list-filtering.check.mts` — **รันไม่ได้** ด้วย environment ปัจจุบัน
  (`Node v22.23.2`) เพราะ `ERR_UNSUPPORTED_DIR_IMPORT` บน barrel `./types` — **ยืนยันแล้วว่าเป็นปัญหา
  เดิมของ repo ไม่เกี่ยวกับงานนี้** (`git stash` แล้วรันซ้ำ พังเหมือนกันก่อนแก้โค้ดเลย) — ไม่ได้แก้ เพราะ
  นอก scope ของ ticket นี้ ควรแจ้งแยกต่างหาก
- `npx tsc --noEmit` (thunder_one_prj) — ผ่าน, 0 error
- `npx eslint` เฉพาะไฟล์ที่แก้ (thunder_one_prj) — ผ่าน
- `pnpm build` (thunder_one_prj) — ผ่าน
- `npx tsc --noEmit` (Thunder_Core, ทั้ง repo) — มี error เดิมของ repo (tenant-assets, tenant-fuel ฯลฯ)
  แต่ **ไม่มี error ในไฟล์ playlist ที่แก้เลย**
- `npx eslint` เฉพาะไฟล์ที่แก้ (Thunder_Core) — ผ่าน
- probe script ชั่วคราว (ลบแล้ว, ไม่มี test convention ใน Thunder_Core ให้ผูก) เช็ค
  `validatePlaylistOutputProfile` 10 เคส (valid full profile, dynamic reserved, type/resolution/
  frame_rate/width ที่ไม่รองรับ, key อื่นผ่านเฉยๆ) — ผ่านหมด

**ยังไม่ได้ทำ (ต้องถามก่อนทุกครั้งตาม §3):**
- Browser test ผ่าน UI จริง (Step 1 dropdown, Save Draft network payload, playlist เก่าเปิดแล้วไม่พัง)
- curl ยิง endpoint จริงเช็ค 400 — **ต้อง deploy Thunder_Core ก่อน (R0) ยังไม่ได้ deploy/ขออนุมัติ**

จนกว่าจะ verify ผ่าน browser + curl ครบ ให้ถือว่า **unverified ที่ layer ผู้ใช้ใช้จริง** — PR (ถ้าเปิด)
ต้องเป็น Draft ตาม §4

## ยังไม่ทำ / ไม่ได้ทำต่อ

- ไม่ได้แก้ ClickUp ticket (amend AC 4.1-4.4) — ผู้ใช้ยังไม่สั่งให้ mutate ticket
- ไม่ได้ deploy Thunder_Core (R0 — ต้องขออนุมัติแยก)
- ปัญหา `ERR_UNSUPPORTED_DIR_IMPORT` ของ `metadata.check.mts`/`list-filtering.check.mts` (pre-existing,
  Node version regression) — แจ้งแล้ว ไม่ได้แก้ นอก scope ticket
