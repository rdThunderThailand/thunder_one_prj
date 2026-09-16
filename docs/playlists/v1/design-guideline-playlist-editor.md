# แนวทางออกแบบ (Design Guideline): Playlist v1

> เขียนเมื่อ 2026-09-02 · สำหรับทีม Product / Design / Frontend / Core ใช้ตัดสินใจร่วมกัน
> การตัดสินใจที่ย้อนยาก อยู่ใน `docs/adr/0060-playlist-editor-single-page.md`
> แผนลงมือและการแบ่งเฟส อยู่ใน `docs/playlists/v1/plan-playlist-v1.md`

## เอกสารนี้คืออะไร

**Figma 4 จอในโฟลเดอร์นี้คือ "แนวทาง" ของหน้า Playlist ทั้งหมด** — โครงหน้า ลำดับการทำงาน
ตำแหน่งของแต่ละส่วน และคำเรียกที่ใช้กับผู้ใช้ ให้ยึดตามนี้

- ![Playlist overview](./Figma%20-%20Playlist%20overview.png) — `Figma - Playlist overview.png` — หน้า list
- ![Playlist Editor](./Figma%20-%20Playlist%20Editor.png) — `Figma - Playlist Editor.png` — หน้า editor
- ![Add Item Panel](./Figma%20-%20Playlist%20Editor%20with%20Add%20Item%20Panel.png) — `Figma - Playlist Editor with Add Item Panel.png` — panel เพิ่ม item
- ![Playlist Preview](./Figma%20-%20Playlist%20Preview.png) — `Figma - Playlist Preview.png` — หน้า preview

**สิ่งที่ Figma ไม่ชนะ:** field หรือปุ่มที่ขัดกับโมเดลของระบบ (`CONTEXT.md` + `docs/adr/`) หรือที่
backend ไม่มีทางรองรับในเฟสนี้ — กรณีแบบนั้นตัดออกหรือแปลงความหมาย และ**ต้องมีบรรทัดอธิบายใน
ตารางด้านล่าง** ห้ามตัดเงียบๆ

Figma ยังวาดเมนูซ้ายที่มีของซึ่งระบบยังไม่มี (Programs, Now & Next, Calendar, Groups, Locations,
Reports, Analytics) — ถือเป็นภาพอนาคตของ nav ไม่ใช่ขอบเขตงานรอบนี้

---

## หลักการตัดสินใจ (ใช้กับทุกช่องใน Figma)

ถามทีละช่อง 3 ข้อ:

1. **มันขัดกับหน้าที่ของ Playlist หรือเปล่า?** Playlist = ลำดับของ Asset พร้อม duration/transition
   **ไม่มีอำนาจตัดสินว่าออกที่ไหนเมื่อไหร่** (นั่นคือ Publication) และ**ไม่มีเรขาคณิตของจอ**
   (นั่นคือ Layout/Composition)
2. **ข้อมูลเดินทางถึงจอจริงได้ไหม?** field ต่อ item ต้องผ่าน 5 ชั้น —
   `playlist_items` → RPC/route → `publication_snapshot_items` → `media_job_poll` → player
   ถ้าไปไม่ถึงชั้น 4 คือของที่เก็บแล้วไม่มีใครอ่าน
3. **ถ้าโชว์ตอนนี้ ผู้ใช้จะเข้าใจผิดว่า "ทำได้แล้ว" ไหม?** ถ้าใช่ ให้ไม่โชว์ ดีกว่าโชว์แบบ disabled

---

## ตาราง: Figma บอกอะไร / เราทำอะไร / เพราะอะไร

### หน้า list (`/media-workspace/playlists`)

| Figma | ตัดสิน | เหตุผล |
|---|---|---|
| Folder rail + Trash | **ทำ** | schema มีแล้ว (`playlists.folder_id`, `deleted_at`, `trashed_folder_id` — migration `20260829040259`) ขาดแค่ชั้น RPC · `ContentFolderRail` ฝั่ง frontend reuse ได้ |
| แท็บ Tags ข้าง Folders | **ทำ** | สร้าง `media_core.playlist_tags` ชี้ `media_core.tags` ตัวเดิม ตามแพตเทิร์น `publication_tags` / `media_asset_tags` |
| เลือก Folder และ Tag พร้อมกัน | **เลือกได้ทีละอย่าง** | Figma วาดเป็นแท็บ = mutually exclusive · rail ที่มีอยู่เป็น single-select · URL เก็บ `?folder=` **หรือ** `?tag=` |
| stat tile 6 ใบ | **เหลือ 4** — Total / **Draft** / Active / Inactive | "Scheduled" ไม่ใช่สถานะของ Playlist (ดูแถวถัดไป) · "Total Items" ซ้ำกับคอลัมน์ Items ในตาราง · **ต้องมี Draft** เพราะ editor ใหม่ผลิต draft เป็นทางหลัก และ `summarize()` (`list-filtering.ts`) นับครบ 3 ถังอยู่แล้ว |
| status `Scheduled` | **ตัด** — เหลือ `draft / active / inactive` ตาม **ADR 0028** | Scheduled เป็นสถานะของ Publication ที่ derive จาก Schedule (ADR 0004) · ส่วน `active/inactive` ของ playlist **derive จาก `publication_count`** อยู่แล้ว (migration 098 ส่งมาแล้ว, `playlistDisplayStatus()` เป็นที่เดียวที่แปลง) — **ไม่ต้องมีงาน backend และห้ามไปลบ derived override** |
| badge "ใช้อยู่ใน N publication" | **ตัด** | ซ้ำกับคอลัมน์ Status ที่ derive มาจากตัวเลขเดียวกัน |
| row action สลับสถานะ | **มีทางเดียว: "Mark as ready" (`draft → active`)** | `draft` เป็น transition เดียวที่เขียนลง column ได้จริงตาม ADR 0028 · ถ้าไม่มี action นี้ playlist ที่สร้างจาก editor จะเข้า Publication picker ไม่ได้เลย (`fetchPlaylists` default `include_drafts=false`) |
| ปุ่ม Upload บน header | **ตัด** | อัปโหลดไฟล์เป็นงานของ Media Library · ปุ่มนี้ทำให้ playlist ดูเหมือนที่เก็บไฟล์ |
| ปุ่ม Create Folder | **ทำ** | มาพร้อม rail |
| สลับมุมมอง list / grid / compact | **เหลือ list** | 2 มุมมองที่ต้องดูแลเพิ่มโดยยังไม่มีคนขอ · เลื่อนไปเฟส 2 |
| คอลัมน์ Type = Video / Image / **Mixed** | **ทำ** | ต้องให้ `media_playlists_list` คืน kind ของ item ที่มี (ปัจจุบันไม่คืน) |
| Storage Usage ใน rail | **ตัด** | เป็นตัวเลขของ Media Library ไม่ใช่ของ Playlist |
| search / filter / sort / pagination | **ทำฝั่ง client** | playlist เป็นหลักร้อย และ list โหลดทั้งหมดอยู่แล้ววันนี้ · โค้ด `list-filtering.ts` / `list-url-state.ts` ใช้ต่อได้ · ต้องมี `// ponytail:` ระบุเพดานแถวที่ต้องย้ายไป server |

### หน้า editor (`/media-workspace/playlists/[id]`)

| Figma | ตัดสิน | เหตุผล |
|---|---|---|
| editor หน้าเดียว 3 คอลัมน์ | **ทำ — แทนที่ wizard 4 สเต็ปทั้งหมด** | ตรงกับ `/layouts` และ `/compositions` ที่ไม่มี wizard · `PlaylistStepper` / `BasicInfoStep` / `ContentStep` / `SettingsStep` / `ReviewStep` / `step-validation.ts` ถูกลบ |
| ปุ่ม **Publish** | **ตัดออกจาก editor ในเฟสนี้** | publish = สร้าง Publication (content + Channel + Schedule) ซึ่ง Playlist ไม่มีอำนาจ · เอาไว้ค่อยกลับมาเป็นทางลัดไป `/publications/create?playlist=<id>` |
| ปุ่ม Save Draft | **ทำ — เป็นปุ่มบันทึกเดียวในหน้านี้** | |
| สลับ draft ↔ active | **ไม่มีใน editor** — มีแค่ "Mark as ready" ที่แถวในหน้า list และเป็นทางเดียว | `active/inactive` derive จาก `publication_count` ตาม ADR 0028 ไม่ใช่ค่าที่คนกดสลับได้ · `draft → active` คือ transition เดียวที่เขียนลง column ได้จริง |
| "Updated 2 min ago" + undo/redo | **manual save** — ข้อความนี้คือเวลาที่ **บันทึกล่าสุด**, undo/redo ทำงานบน state ในหน้า | autosave จะยิง PATCH ถี่จนชน `expected_revision` กับตัวเอง · ออกจากหน้าโดยมีของยังไม่เซฟ → `UnsavedLeaveConfirm` ที่มีอยู่ |
| แท็บ **Zones BETA** | **ตัด** | คือ Composition ซึ่งมีหน้าของตัวเองแล้ว · แทนด้วยเมนู "…" → "Use in a Composition" |
| item เป็น **Layout: Weather & Time** | **ตัด — Add Item เลือกได้เฉพาะ Asset** | ทำให้เกิดวงจร (Composition → Zone → Playlist → Composition ตัวเดิม) ต้องมี cycle check ใน DB, ต้องเปลี่ยน `playlist_items` เป็น polymorphic และต้องนิยามว่า Composition ที่กินเวลา 30 วิ หมายถึงอะไรตอน materialize · เป็น design fork ที่ยังไม่เคาะ → เฟสถัดไป |
| Duration ต่อ item | **มีอยู่แล้ว** (`duration_seconds`, `NULL` = ใช้ค่าของ asset) | |
| Transition ต่อ item | **มีอยู่แล้ว — คงไว้แค่ `cut` / `fade`** | เพิ่ม transition ใหม่ไม่ใช่แค่ enum: player ต้อง implement effect จริง ไม่งั้นได้ dropdown ที่เลือกแล้วจอ cut |
| **Transition Duration** ต่อ item | **ทำ — คอลัมน์ `transition_duration_seconds` (หน่วยวินาที)** | สืบทอดจาก `metadata.playback.transition_duration` ซึ่งเป็นวินาที และอยู่ข้าง `duration_seconds` ในตารางเดียวกัน — คอลัมน์หน่วย ms จะทำให้หน่วยแตกกันในตารางเดียว · `cut` resolve เป็น `0` ตอน materialize ตามกติกาเดียวกับ `duration.ts` |
| **Fit** ต่อ item | **ทำ — คอลัมน์ `fit`** | สืบทอดจาก `metadata.playback.media_fit` และใช้ vocabulary เดียวกัน `fit \| fill \| stretch` ไม่สร้างคีย์ใหม่ |
| **Background Color** ต่อ item | **ทำ — คอลัมน์จริง** | |
| **Notes** ต่อ item | **ทำ — คอลัมน์จริง** | ข้อความของคน ไม่ใช่คำสั่ง playback |
| **Lock duration** ต่อ item | **ตัด** | ไม่มีความหมายจนกว่าจะมี Composition ที่บังคับความยาว Zone |
| ค่า default ระดับ playlist (Fit / Transition Duration ฯลฯ) | **คงอยู่ใน `metadata.playback` เหมือนเดิม** — `NULL` ที่ item = สืบทอดจาก playlist | ยกขึ้นเป็นคอลัมน์ต้อง migrate metadata ของ playlist ทั้งหมดบน prod โดยไม่จำเป็น · กติกา `NULL = inherit` ตรงกับ `duration_seconds` ที่ทำแบบนี้อยู่แล้ว |
| "Use as default for new programs" | **ตัด** | Programs ยังไม่เป็นฟีเจอร์ที่มีอยู่ |

### Playback Settings ระดับ playlist — ราย field

`media_publication_activate` อ่าน `playlists.metadata.playback` **เฉพาะ flat path** ส่วน zoned path
เอา playback มาจาก `composition_zones.playback` ⇒ **ค่าทั้งหมดในหมวดนี้ไม่มีผลเมื่อ playlist ถูก bind
เข้า Zone ของ Composition** · UI ต้องบอกเรื่องนี้ตรงจุดที่ควบคุมอยู่ ไม่ใช่ปล่อยให้เข้าใจว่าใช้ได้ทุกที่

`media_job_poll` สร้าง slot `playback` จาก 3 คีย์ตายตัว และ `media_playlist_upsert` (099) validate
แค่ 3 คีย์นี้ — คีย์ที่สี่เขียนลง metadata ได้แต่ไม่มีใครอ่าน

| Figma | ตัดสิน | เหตุผล |
|---|---|---|
| Play Mode (Sequential/Shuffle) | **ทำ** → `metadata.playback.play_mode` | ถึง player แล้ว (ADR 0031) |
| Shuffle toggle | **รวมเป็นตัวเดียวกับ Play Mode** | Figma มีทั้ง dropdown "Sequential" และ toggle "Shuffle" ซึ่งเป็นแกนเดียวกัน · backend มีค่าเดียว `play_mode ∈ (sequential, shuffle)` — สองคอนโทรลจะขัดกันเองทันทีที่ตั้งสวนกัน |
| Repeat (Repeat All / Once) | **ทำ** → `metadata.playback.repeat` | ถึง player แล้ว |
| **Start From** (ไม่มีใน Figma) | **เพิ่มเข้าไป** → `metadata.playback.start_from` (`first` / `resume`) | เป็น 1 ใน 3 คีย์ที่ถึง player จริง แต่ Figma ไม่ได้วาด — ถ้าไม่ใส่ ผู้ใช้จะไม่มีทางตั้งค่าที่ระบบส่งออกอยู่แล้ว |
| **Respect item duration** | **ตัด** | ไม่มีคีย์รองรับ เขียนลง metadata ได้แต่ไม่มีใครอ่าน — ถ้าจะทำต้องเปิดงาน backend (คีย์ใหม่ + validate 099 + slot payload) ซึ่งไม่อยู่ในเฟสนี้ |
| **Sync to channel time** | **ตัด** | เป็น `channels.sync_enabled` (migration `20260824130000`) = อำนาจของ Channel ซึ่ง ADR 0060 §3 บอกเองว่า Playlist ไม่มี · ตั้งจากหน้า Channel |
| Transition + Transition Duration ระดับ playlist | **ทำ** → `metadata.playback` เป็น default ให้ item ที่เป็น `NULL` | |

### Add Item panel

| Figma | ตัดสิน | เหตุผล |
|---|---|---|
| แท็บ **Media** — ค้น/กรอง type, folder, tag แล้วติ๊กหลายอันพร้อมกัน → "Add N Items" | **ทำ** | |
| แท็บ **Upload New** | **ตัด — แทนด้วยลิงก์ "Upload new media ↗" เปิด `/assets/upload` แท็บใหม่** | upload queue (MU-03) เป็นหน้าเต็มที่ใหญ่เกิน panel 380px และใช้เวลาเป็นนาที ระหว่างนั้น editor ต้องไม่ถูกล็อก · เฟส 2 ค่อยฝังของย่อ |

### หน้า Preview

| Figma | ตัดสิน | เหตุผล |
|---|---|---|
| หน้า preview เต็มจอ + timeline ล่าง | **ต่อยอด `FullPreviewPage`** — ไม่ใช่แค่ "เติม panel" | `preview-clock` / `preview-geometry` เป็นส่วนที่ยากและถูกทดสอบแล้ว เขียนใหม่ = ได้ตัวจับเวลาที่สองที่เพี้ยนคนละแบบ · **แต่ playlist ยังไม่ใช่ source ที่รองรับ**: `source: "composition" \| "publication"` เท่านั้น, route มีแค่ `/preview/composition/[id]` กับ `/preview/publication/[id]`, และ payload เป็น `CompositionPreview` (zones + aspectRatio) ⇒ ต้องมี **route ใหม่ + adapter ที่สังเคราะห์ zone เต็มจอ 1 ตัวจาก playlist + ขยาย union ของ `source`/handoff** |
| ทางเข้า preview ของ playlist วันนี้ | **ต้องย้ายมาพร้อมกัน** | อยู่ใน `ReviewStep.tsx` ผ่าน `PlaybackPreviewModal` ซึ่งเป็นไฟล์ที่ถูกลบพร้อม wizard — ถ้า editor ใหม่เข้าก่อน preview ของ playlist จะหายไปเลย |
| panel ขวา: Now Playing + Playlist Information | **เติมเข้าไปใหม่** | |
| **Preview Mode 16:9 / 9:16 / 4:3** | **ทำ** | Playlist ไม่มี geometry ของตัวเอง ผู้ใช้จึงต้องเลือกกรอบเอง — ส่งเข้า `PreviewStage` เป็น `geometryOptions` สังเคราะห์ 3 ตัว ไม่ใช่ input ของ adapter: zone เป็น `0/0/100/100` ทุก ratio (ADR 0061 §1, §5) |
| ปุ่ม Publish | **ไม่ต้องตัด — ไม่มีอยู่จริง** | `src/features/media-workspace/preview/` ไม่มีปุ่ม Publish · แค่อย่าเพิ่มเข้าไปใหม่ตาม Figma |

---

## สิ่งที่ backend ต้องเพิ่ม (สรุป)

schema ของ folder/trash **มีอยู่แล้ว** ที่ขาดคือชั้น RPC/route:

1. `media_playlists_list` — คืน `folder_id`, `tags`, kind ของ item · กรอง `deleted_at IS NULL` · รับโหมด trash
   **`publication_count` มีอยู่แล้ว** (migration 098) ไม่ต้องเพิ่ม
2. `media_playlist_upsert` — รับ `p_folder_id`
3. `media_playlist_delete` — เปลี่ยนจาก hard delete เป็น **ลงถัง** (`deleted_at`, `trashed_folder_id`) + RPC restore + RPC ลบถาวร
   **ลงถังถูกบล็อกถ้ามี Publication สถานะ `draft` หรือ `active` ชี้อยู่** พร้อมบอกชื่อ
   เหตุผล: `media_job_poll` อ่าน snapshot อย่างเดียวอยู่แล้ว (ADR 0045 apply แล้ว) แต่
   **`media_publication_activate` อ่าน `playlist_items` สดตอน materialize** และ
   `media_publication_republish` เรียก activate ซ้ำ ⇒ ช่องอันตรายคือ publication **draft**
   ที่ยังไม่ materialize ไม่ใช่ตัวที่กำลังฉาย · ถ้าบล็อกแค่ `active` playlist ที่อยู่ในถังจะขึ้นจอ
   ในวันที่ใครกด activate draft นั้น โดยไม่มี error ที่ไหนเลย
   **ลบถาวร** คง guard เดิมที่นับ publication **ทุกสถานะ** ⇒ playlist ที่เคย publish จะกู้คืนได้
   แต่ลบถาวรไม่ได้ตลอดไป — UI ต้อง**บอกข้อจำกัดนี้** ไม่ใช่โชว์ปุ่มที่กดแล้ว error เสมอ
4. `media_core.playlist_tags` + RPC list/set + backfill `metadata.info.tags` เดิมเข้าตารางแล้วลบ key ทิ้ง
5. `playlist_items` + 4 คอลัมน์ (`transition_duration_seconds`, `fit`, `background_color`, `notes`)
   ทั้งหมด nullable = สืบทอดจาก playlist — และต้องไหลต่อไปถึง `publication_snapshot_items`
   กับ payload ของ `media_job_poll` ด้วย **ไม่งั้นข้อมูลจะหายเงียบตอน activate**
   `publication_snapshot_items` เก็บ**ค่าที่ resolve แล้ว ไม่ใช่ `NULL`** — แบบเดียวกับ
   `COALESCE(pi.duration_seconds, ma.duration_seconds)` ที่ทำอยู่ เพราะ payload ของ poll
   ไม่มี default ระดับ playlist ให้ player fallback
   ส่วนฝั่ง player (Windows/Android) อ่านเมื่อไหร่เป็นงานคนละ repo — อัปเดต
   `docs/layouts/contract-v2-zones.md` ให้ แล้วไม่บล็อกงานนี้
