# SESSIONLOG — Playlist v1 design (2026-09-02)

**ไม่แตะโค้ดเลย** — ผลผลิตคือเอกสาร 3 ชิ้น + GitHub issue 9 ใบ · branch `fix/playlist`

## โจทย์

ออกแบบ flow สร้าง playlist ใหม่ตาม Figma 4 จอ ให้ `/playlists` มีโครงคล้าย `/layouts` ·
หาว่าขาดอะไรจาก backend และ design ตรงไหนไม่สมเหตุสมผล · ให้เอกสารชี้ว่า Figma คือแนวทาง

## ผลผลิต

| ไฟล์ | คือ |
|---|---|
| `docs/playlists/v1/design-guideline-playlist-editor.md` | ตาราง "Figma บอก / เราทำ / เพราะอะไร" ราย field ทุกจอ + รูป Figma 4 ใบ |
| `docs/adr/0060-playlist-editor-single-page.md` | design fork ที่เคาะแล้ว 8 ข้อ |
| `docs/playlists/v1/plan-playlist-v1.md` | แผนงาน BE/FE + ลำดับ merge ที่บังคับ + ความเสี่ยง |
| issue #33–#41 | vertical slice 9 ใบ label `ready-for-agent` |

ย้าย `docs/playlists/version 1/` → `docs/playlists/v1/` (เอกสาร wizard เดิมอยู่ `version 0/` ยกเลิกแล้ว)

## สิ่งที่เคาะ (ย่อ)

1. **editor หน้าเดียวแทน wizard 4 สเต็ป** — ลบ stepper + draft ใน localStorage · row เกิดตอน Save ครั้งแรก
2. **ไม่มีปุ่ม Publish ในหน้า playlist** — publish = Publication เท่านั้น
3. **`draft → active` ทางเดียว** ที่แถวในหน้า list ("Mark as ready") · `active/inactive` ยัง derive ตาม **ADR 0028**
4. **Add Item = Asset เท่านั้น** — Composition เป็น item เลื่อนไปเฟส 2 (เป็น cycle + polymorphic + แก้ snapshot)
5. **ตัด Zones tab** (= Composition ที่มีหน้าอยู่แล้ว), **Lock duration**, **Respect item duration**, **Sync to channel time**, ปุ่ม Upload, มุมมอง grid/compact
6. **เพิ่ม 4 คอลัมน์ต่อ item** `transition_duration_seconds` / `fit` / `background_color` / `notes` — `NULL` = inherit, resolve ตอน materialize, ไหลถึง poll payload
7. **folder / tags / trash เข้าเฟส 1** — schema มีแล้ว ขาดแค่ชั้น RPC
8. **trash บล็อกเมื่อมี publication `draft` หรือ `active`**

## กับดักที่เจอระหว่างทาง (ค่าที่แพงที่สุดของเซสชันนี้)

- **ADR 0045 ลงแล้ว** — `media_job_poll` อ่าน snapshot อย่างเดียว ไม่แตะ `playlist_items`
  (ยืนยันบน prod: `poll_reads_playlist_items = false`) · CONTEXT.md ยังเขียนว่าเป็น known gap อยู่ — **ล้าสมัย**
  รูจริงคือ **`media_publication_activate` อ่าน `playlist_items` สดตอน materialize** และ
  `media_publication_republish` เรียก activate ซ้ำ ⇒ เซตที่แตะได้ = `{draft, active}` **พอดีเป๊ะ**
  (activate บังคับ `= 'draft'`, republish บังคับ `= 'active'`) — นี่คือเหตุผลของ trash guard
- **`playlistDisplayStatus()` ไม่ใช่บั๊ก** — เป็นการ implement ADR 0028 · `publication_count` มาตั้งแต่ migration 098
  ⇒ อย่าไป "แก้" ให้เก็บ stored active
- **หน่วยจะปนกันเงียบๆ** — `metadata.playback.transition_duration` เป็น **วินาที**
  (`duration.ts:37`, `ReviewStep.tsx:187`, `PlaylistSummary.tsx:97` render `${...}s`)
  ⇒ คอลัมน์ใหม่ต้องเป็น `transition_duration_seconds` ไม่ใช่ `_ms` ไม่งั้นได้ 500ms กับ 0.5s ปนใน snapshot เดียว
- **`metadata.playback` มี 11 คีย์ ไม่ใช่ 3** — 3 ตัวถึง player, บางตัวเป็น default ของ per-item inherit, ที่เหลือ inert
- **`metadata.ts` เป็น whitelist** ทั้ง encode และ decode — ไม่ประกาศคีย์ = ค่าไม่ออกจากเบราว์เซอร์
- **`FullPreviewPage` ไม่รองรับ playlist** — `source: "composition" | "publication"`, payload เป็น
  `CompositionPreview` (zones + aspectRatio), มี 2 route ⇒ ต้องมี route ใหม่ + adapter
- **ลบถาวรเป็นทางตัน** — `media_playlist_delete` นับ publication **ทุกสถานะ** และ FK เป็น `ON DELETE RESTRICT`

## verify

| อะไร | สถานะ |
|---|---|
| migration + source ในเครื่อง | อ่านครบ (Thunder_Core + thunder_one_prj) |
| `media_job_poll` บน prod เป็นเวอร์ชัน `20260828120000` | ✅ read-only query 2026-09-02 |
| blast radius ของคอลัมน์ transition duration | ✅ 17 item / 8 playlist (จาก 133 item / 86 playlist) |
| UI / browser | **ยังไม่ได้ทดสอบ** — ยังไม่มีโค้ดให้ทดสอบ |
| migration | **ยังไม่เขียน ยังไม่ apply** ที่ไหนทั้งนั้น |

## ต่อไป

`#34` merge ก่อนหรือพร้อม `#33` · `#39` ลงพร้อม `#33` · handoff อยู่ที่
`docs/playlists/v1/handoff-playlist-v1.md`
