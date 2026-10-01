# SESSIONLOG — Playlist Detail Page + Publication Preview Integration (2026-08-18)

## โจทย์ตั้งต้น

Create Publication step 5 (Content Preview) ไม่โชว์อะไรเลยเมื่อ publication type = playlist — `assetItems[0]` ที่มันอ่านอยู่ playlist ไม่เคยเติม และไม่มีหน้าไหนในระบบให้ดู media content ข้างใน playlist แต่ละอันเลย มีแค่ side panel ที่โชว์ status/count/duration

## กระบวนการ

`/grill-with-docs` 19 คำถาม แบ่งเป็น 3 sub-project (root question เสนอ 3 ทาง พร้อม trade-off ทุกข้อ) → เคาะครบ → เขียน `docs/adr/0020-playlist-detail-page.md` → แตก branch `feat/preview/playlist` จาก `feat/playlist` → สลับ Sonnet execute ตาม ADR

## เอกสารที่เขียน

- `docs/adr/0020-playlist-detail-page.md` — ตัดสินใจหลัก + ทางที่ไม่เลือก 8 ทาง (panel คู่ขนาน, ไม่ทำ route ใหม่, ไม่ join asset, เล่นทั้ง playlist, หน้าแก้ไขได้, เก็บ name/cover ลง draft store, ลบ fetchPlaylist ฝั่ง publications เฉยๆ, ย้ายทั้งไฟล์ playlists-api เข้า lib)
- `docs/playlists/verify-preview-playlist-browser-checklist.md` — checklist A–I (ขยายเพิ่ม 2 รอบระหว่างเซสชัน)

## ข้อเท็จจริงที่ยืนยันแล้ว (อย่า re-derive)

- `fetchPlaylist` เคยมี **2 ชุดซ้ำกัน** (`playlists-api.ts` กับ `publications-api.ts`) — ชุดของ publications type อ่อนกว่า (ไม่มี `revision`/`metadata`/`created_by`, `status`/`transition` เป็น `string` เปล่า)
- `media_playlist_get` **ไม่คืน `created_at`** — มีแต่ `media_playlists_list` ที่คืน จึงตัด "Created At" ออกจากหน้า playlist detail แทนที่จะใส่ค่าว่าง
- `media_publication_get` **ไม่คืน `updated_at`** ทั้งที่คอลัมน์มีจริงบน `media_core.publications` และถูก bump ทุกครั้งที่เขียน (เช็คจาก migration `060`–`071` ใน Thunder_Core) — ตัด "Last updated" ออกจาก Step 5 แทนที่จะใส่ค่าปลอม เป็น backend gap ที่ยังไม่ได้แก้ (คนละ repo, ต้อง migration)
- asset ที่มี `width`/`height` เป็น NULL (ของเก่าก่อน ADR 0019) ต้องแสดง `—` ในตาราง resolution ไม่ error — ตั้งใจ
- ปุ่ม Archive/Activate ต้องซ่อนเมื่อ playlist status เป็น `draft` (ต่อเนื่องจาก ADR 0014 — draft ยังไม่ผ่าน validateStep)

## สิ่งที่ทำจริง (7 commits บน `feat/preview/playlist`, ทั้งหมดใน `thunder_one_prj`)

1. **`refactor(playlists)`** — รวม `fetchPlaylist`/`fetchPlaylists` เหลือจุดเดียวใน `src/lib/api/media-api.ts` (read-only, cross-feature), ย้าย `PlaylistDetail`/`PlaylistItem`/`PlaylistStatus`/`Transition`/`Creator`/`PlaylistListItem` ไป `src/types/domain.ts`, `features/playlists/types` re-export กันพัง import เดิม
2. **`feat(playlists)`** — หน้า `/playlists/[playlistId]` ใหม่ (`PlaylistDetailPage` + `PlaylistItemsTable` + `PlaylistProperties`) แทน `PlaylistDetailPanel` (ลบทิ้ง) — properties ครบ, ตาราง media join `fetchMediaAssets()` เอา resolution/size/ชื่อไฟล์จริง, คลิกแถวเล่นตัวอย่างในกรอบพรีวิว (`<video controls>` หรือรูปนิ่ง), progressive load (ตารางขึ้นก่อน join ตามทีหลัง), แยก error 403/404/อื่นๆ ตาม `classifyApiError`, แถว Total พร้อม `+` เมื่อ join ไม่ครบ (`totals.ts` + `totals.check.mts`)
3. **`feat(publications)`** — Step 5 Content Preview โชว์ cover/ชื่อ/badge สถานะ/`N items · MM:SS` ของ playlist พร้อมลิงก์ `target="_blank"` ไป `/playlists/[id]`
4. **`feat(publications)`** — Step 4 Publication Summary โชว์ cover/ชื่อ playlist เหมือนกัน (ผู้ใช้ขอเพิ่มระหว่างเซสชัน หลังถามแล้วว่าจะทำให้ Step 5 เล่นได้ไหม — ตัดสินใจไม่ทำเพราะกรอบเล็กเกินไปและซ้ำกับ detail page) — ดึง logic คำนวณ cover/duration ที่ Step 5 มีอยู่แล้วออกเป็น `usePlaylistPreview` hook ใช้ร่วมกัน 2 step
5. **`fix(publications)`** — Step 4 ส่ง URL วิดีโอเข้า `next/image` ทำให้ 500 จริง (ผู้ใช้เจอจาก dev server log) เพราะ `isVideo` เดิมเขียน `!isPlaylist && (...)` ตัด playlist ออกทั้งกระบวน แก้โดยดึง kind จาก asset จริงก่อน แล้ว fallback ไปนามสกุลไฟล์ — สกัดเป็น `preview-kind.ts` (`isVideoPreview()`) พร้อมเทส 8 assertion เพราะกับดักเดียวกันนี้เคยพังมาแล้วครั้งหนึ่ง (`ae37fa6`)
6. **`fix(publications)`** — Step 5 footer เดิมอ่านจาก `createdByMeta` mock (hardcode "Kanittha W.") ผู้ใช้ชี้ให้ integrate ของจริง → fetch `fetchPublication(publicationId)` (มี id แน่นอนตอนถึง step 5 เพราะ step 1 save ไปแล้ว) โชว์ `created_by`/`created_at` จริง, ตัด "Last updated" ทิ้งตามเหตุผลข้างบน, ลบ `createdByMeta` ออกจาก `mock-data.ts`

## ที่ verify แล้ว / ยังไม่ได้ verify

**ยืนยันแล้ว (build layer, ทุก commit):** `tsc --noEmit` 0 error, `eslint src` 0 error, `next build` ผ่านและ route `/playlists/[playlistId]` ขึ้นจริง, `.check.mts` ทั้ง 19 ไฟล์ผ่าน (เพิ่มใหม่ 2 ไฟล์: `totals.check.mts`, `preview-kind.check.mts`)

**ยืนยันแล้ว (browser, ผู้ใช้ทดสอบเอง):** checklist A–G — navigate จาก `/playlists`, โครงหน้า detail, ตาราง media, เล่นพรีวิว, loading/error states, Edit/Archive, Step 5 preview — **ผ่านหมด**

**ยังไม่ได้ verify (browser):**
- checklist H (Step 4 cover) — ทำหลังรอบทดสอบ A–G ผู้ใช้ยังไม่ได้กลับไปเช็ค
- การแก้ 500 error ของ commit `a5844cd` — ผู้ใช้ paste log ที่เจอ error มา แต่ยังไม่ได้ refresh มายืนยันว่าหายจริง
- checklist I (Step 5 created-by) — เพิ่งทำเสร็จ ยังไม่ได้ทดสอบเลย

## ค้างอยู่

1. รอผู้ใช้ verify checklist H + I และการแก้ 500 error ผ่าน browser ก่อนถือว่า "เสร็จ" เต็มร้อย
2. PR เข้า `main` — ต้องเปิดเป็น **Draft** ตามกฎ verify ไม่ครบ จนกว่าข้อ 1 จะผ่าน
3. `ReviewPublishStep.tsx` (513 บรรทัด) และ `ScheduleStep.tsx` เกิน 300 บรรทัดที่ตกลงกันไว้ — เกินมาก่อนเซสชันนี้แล้ว ไม่ได้แตะเพราะนอก scope
