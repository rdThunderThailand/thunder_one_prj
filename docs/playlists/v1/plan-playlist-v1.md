# แผนงาน Playlist v1

> 2026-09-02 · แนวทางออกแบบ: `./design-guideline-playlist-editor.md` · การตัดสินใจ: `docs/adr/0060-playlist-editor-single-page.md`
> เอกสารเวอร์ชันก่อนอยู่ที่ `docs/playlists/version 0/` (แผน wizard เดิม — ยกเลิกแล้วโดย ADR 0060)

## เป้าหมายเฟส 1

หน้า `/media-workspace/playlists` มีโครงเดียวกับ `/media-workspace/layouts` — list + folder rail +
editor หน้าเดียว — และ per-item playback intent เดินทางถึง payload ของ `media_job_poll` จริง

**ไม่อยู่ในเฟส 1:** Composition เป็น item ใน playlist · แท็บ Upload New ใน Add Item panel ·
`derived_usage` แทน `publication_count` ดิบ · player อ่าน per-item field จริง · มุมมอง grid/compact

## เงื่อนไขว่า "เสร็จ"

- สร้าง playlist ใหม่จาก editor หน้าเดียว → เพิ่ม item จาก panel → ตั้ง duration/transition/fit/
  background/notes ต่อ item → Save Draft → เปิดใหม่แล้วค่าอยู่ครบ
- กด "Mark as ready" จากหน้า list (action นี้ขึ้นเฉพาะแถวที่เป็น `draft`) → badge เปลี่ยนจาก
  **Draft → Inactive** ไม่ใช่ Active (ถูกต้องตาม ADR 0028 เพราะยังไม่มี publication ชี้) → แล้วสร้าง
  Publication ที่เลือก playlist นั้นได้
- activate publication แล้ว `media_job_poll` คืน field ใหม่ครบทั้ง 4 ตัวใน slot
- ย้าย playlist เข้า folder, ติด tag, กรองด้วย rail, ลงถัง, กู้คืน, ลบถาวร ได้ผ่าน UI
- ลงถัง playlist ที่มี publication `draft` **หรือ** `active` ชี้อยู่ → ถูกปฏิเสธพร้อมชื่อ publication

---

## การแบ่งงาน

สองสายเดินขนานได้ตั้งแต่ต้น สายหนึ่งอยู่ repo `Thunder_Core` อีกสายอยู่ `thunder_one_prj`

```
BE-1 items columns ─┬─ BE-2 snapshot+poll ──────────── (ปลดล็อก FE-4 ตอน integrate)
BE-3 list/upsert folder ─── BE-4 trash RPC ─── BE-5 tags+backfill
                                        └─ ปลดล็อก FE-5, FE-6

FE-1 editor shell ─┬─ FE-2 add item panel
                   ├─ FE-3 item properties ── (รอ BE-1 ตอนต่อ API จริง)
                   └─ FE-4 playback settings
FE-7 list rework ──┬─ FE-5 folder rail + trash  (รอ BE-3/BE-4)
                   └─ FE-6 tags rail            (รอ BE-5)
FE-8 preview panel  ← เดินขนานได้ตลอด ไม่ขึ้นกับใคร
```

### สาย Backend (`Thunder_Core`) — ทุกใบเป็น migration = R0 ต้องขออนุมัติก่อนยิง

| id | งาน | ขึ้นกับ | ขนาน |
|---|---|---|---|
| **BE-1** | `playlist_items` + 4 คอลัมน์ nullable (`transition_duration_seconds numeric`, `fit text` — vocabulary เดียวกับ `media_fit`, `background_color text`, `notes text`) · แก้ `media_playlist_set_items` รับ/คืน · แก้ zod ที่ `playlists/[id]/items/route.ts` | — | ได้กับ BE-3 |
| **BE-2** | `publication_snapshot_items` + 4 คอลัมน์เดียวกัน **เก็บค่าที่ resolve แล้ว ไม่ใช่ `NULL`** (`COALESCE(pi.<col>, <playlist default>)` แบบเดียวกับ `duration_seconds`) · default มาจาก `metadata.playback.transition_duration` / `.media_fit` · **transition ที่ resolve เป็น `cut` → duration `0`** (กติกาเดียวกับ `duration.ts:37`) · แก้ตัวสร้าง snapshot ทั้ง 2 ทาง (flat + zoned) ใน `media_publication_activate` · ใส่ลง slot payload ของ `media_job_poll` · อัปเดต `docs/layouts/contract-v2-zones.md` | BE-1 | — |
| **BE-3** | `media_playlists_list` คืน `folder_id` + kind ของ item + กรอง `deleted_at IS NULL` · `media_playlist_upsert` รับ `p_folder_id` · route PATCH รับ `folder_id` · **`publication_count` มีแล้ว (098) ไม่ต้องแตะ** | — | ได้กับ BE-1 |
| **BE-4** | `media_playlist_delete` → ลงถัง (`deleted_at`, `trashed_folder_id`) + **บล็อกเมื่อมี publication `draft` หรือ `active` ชี้อยู่** (คืนชื่อ publication) · RPC restore · RPC ลบถาวร (คง guard เดิมที่นับทุกสถานะ) · โหมด trash ใน list · route `POST /{id}/restore`, `DELETE /{id}/permanent` | BE-3 | — |
| **BE-5** | `media_core.playlist_tags` + RLS + RPC list/set · list คืน tags · route tags · **backfill** `metadata.info.tags` → ตาราง แล้วลบ key (แสดงจำนวนแถวที่จะแตะก่อนขออนุมัติ) | BE-3 | — |

> `CREATE OR REPLACE FUNCTION` ที่เพิ่ม parameter ต้อง `DROP FUNCTION IF EXISTS <signature เดิม>` นำหน้าเสมอ
> และ `CREATE FUNCTION` ให้ EXECUTE กับ PUBLIC — ต้อง REVOKE ตามหลังทุกครั้ง

### สาย Frontend (`thunder_one_prj`)

| id | งาน | ขึ้นกับ | ขนาน |
|---|---|---|---|
| **FE-1** | โครง editor 3 คอลัมน์ที่ `/playlists/[id]` + `/playlists/create` (ยังไม่ยิง API จนกด Save ครั้งแรก แล้ว `replaceState`) · Save Draft + `expected_revision` + `RevisionConflictCard` + `UnsavedLeaveConfirm` · undo/redo บน state · ลบ stepper ทั้งชุด | — | ได้กับ FE-7, FE-8 |
| **FE-2** | Add Item panel — ค้น/กรอง type+folder+tag, เลือกหลายอัน, "Add N Items" + ลิงก์ "Upload new media ↗" | FE-1 | ได้กับ FE-3, FE-4 |
| **FE-3** | properties pane ต่อ item — duration, transition, transition duration, fit, background color, notes · **ต้องแก้ `metadata.ts` ด้วย** (serializer/reader เป็น whitelist ทีละคีย์ — ไม่แตะ = ค่าไม่ออกจากเบราว์เซอร์) | FE-1 (ต่อ API จริงรอ BE-1) | ได้กับ FE-2, FE-4 |
| **FE-4** | timeline + playback settings ระดับ playlist — **play mode (รวม shuffle เป็นตัวเดียว), repeat, start from** map เข้า `metadata.playback` (**ผ่าน `metadata.ts` ซึ่งเป็น whitelist — คีย์ใหม่ต้องประกาศทั้ง encode และ decode**) · **ตัด "respect item duration" และ "sync to channel time"** · ระบุใน UI ว่าค่าเหล่านี้ไม่มีผลเมื่อ playlist ถูก bind เข้า Zone ของ Composition | FE-1 | ได้กับ FE-2, FE-3 |
| **FE-5** | folder rail + trash บนหน้า list — reuse `ContentFolderRail` · move / ลงถัง / กู้คืน / ลบถาวร พร้อมขั้นยืนยัน | FE-7, BE-3, BE-4 | ได้กับ FE-6 |
| **FE-6** | แท็บ Tags ใน rail (single-select, ตัดกับ folder selection) + ชิป tag ในแถว + แก้ tag ของ playlist | FE-7, BE-5 | ได้กับ FE-5 |
| **FE-7** | หน้า list — stat tile 4 ใบ, คอลัมน์ Type (Mixed), **row action "Mark as ready" (`draft → active`) ทางเดียว**, ตัดปุ่ม Upload และมุมมอง grid/compact · **ห้ามแตะ `playlistDisplayStatus()`** (ADR 0028) | — | ได้กับ FE-1, FE-8 |
| **FE-8** | preview ของ playlist — route ใหม่ + ขยาย union `source` + adapter สังเคราะห์ zone เต็มจอ 1 ตัวจาก playlist ตาม aspect ratio ที่เลือก · panel ขวา (Now Playing / Playlist Information / Preview Mode 16:9-9:16-4:3) | FE-1 | ได้กับ FE-5..7 |

### ปิดงาน

| id | งาน | ขึ้นกับ |
|---|---|---|
| **X-1** | ลบ `metadata.info.tags` ออกจาก type/โค้ดฝั่ง frontend หลัง BE-5 backfill เสร็จ | BE-5, FE-6 |
| **X-2** | verify ผ่าน browser ตามเงื่อนไข "เสร็จ" ด้านบน + SESSIONLOG | ทุกใบ |

## ลำดับ merge ที่บังคับ

**FE-7 ต้องเข้าก่อนหรือพร้อม FE-1** — ไม่ใช่แค่ "เริ่มพร้อมกันได้" · วันนี้ status ถูกตั้งที่เดียวคือ
`usePlaylistDraftSave.ts` (`resolveDraftStatus`) ในสาย wizard ที่ FE-1 ลบทิ้ง และ editor ใหม่ไม่มี
control เปลี่ยนสถานะ ⇒ ถ้า FE-1 เข้าก่อน จะไม่มี UI ไหนทำ playlist ให้พ้น draft ได้เลย และ
`fetchPlaylists()` (default `include_drafts=false`) กรอง draft ออกจาก picker → **สร้าง Publication
ใหม่ไม่ได้ทั้งระบบ** · acceptance ของ BE-2 ("activate publication แล้ว poll คืนครบ 4 ค่า") ก็ต้องมี
playlist ที่ active ก่อนเช่นกัน

**FE-8 ต้องเข้าพร้อม FE-1** — preview ของ playlist วันนี้อยู่ใน `ReviewStep.tsx` ซึ่ง FE-1 ลบ

## ความเสี่ยงที่รู้ตัวแล้ว

- **BE-2 ถ้าไม่ทำพร้อม BE-1** ข้อมูลจะหายตอน activate แบบไม่มี error — บั๊กเงียบที่หาเจอยากที่สุดในชุดนี้
- **BE-2 ทำให้ `transition_duration` ที่ค้างใน prod เริ่มมีผลจริงเป็นครั้งแรก** — ตั้งใจ (UI โชว์
  `fade (1s)` และนับรวมใน loop length มาตลอดโดยที่ player ไม่เคยได้รับ)
  **วัดบน prod 2026-09-02: เพดานคือ 17 item ใน 8 playlist** (จาก 133 item / 86 playlist ·
  มี 7 playlist ที่เก็บ `transition_duration` ไว้) — เล็กพอที่จะตรวจด้วยตาได้หลัง deploy
- **ลบถาวรเป็นทางตัน** — playlist ที่เคยมี publication (สถานะใดก็ได้) ลบถาวรไม่ได้ตลอดไป
  ต้องเป็นข้อความใน UI ไม่ใช่ปุ่มที่กดแล้ว error
- **backfill tags (BE-5)** แตะข้อมูล production ต้องโชว์รายการก่อน
- **`media_playlists_list` คืนทุกแถว** — filter/paginate ฝั่ง client เป็นการตัดสินใจที่มีเพดาน
  ต้องมี `// ponytail:` ระบุเพดานไว้ในโค้ด
