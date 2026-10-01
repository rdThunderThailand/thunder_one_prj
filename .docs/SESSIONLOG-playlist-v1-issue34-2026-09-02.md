# SESSIONLOG — Playlist v1, issue #34 (2026-09-02)

## ขอบเขต

[GitHub #34](https://github.com/rdThunderThailand/thunder_one_prj/issues/34) — Playlists list:
summary tiles, Type column, Mark as ready. ทำตาม handoff
`docs/playlists/v1/handoff-playlist-v1.md`, design guideline
`docs/playlists/v1/design-guideline-playlist-editor.md`, ADR `docs/adr/0060-playlist-editor-single-page.md` (§3, §6).

โมเดล: ตรวจแล้วไม่มี design fork ค้าง (ADR 0060 เคาะครบ) → ใช้ Sonnet ทำงานนี้ (Opus ประเมินขอบเขต/โมเดลไว้ต้นเซสชัน).

## สิ่งที่ทำ

### Backend (Thunder_Core) — migration R0

`supabase/migrations/20260902160000_playlists_list_item_kinds.sql` — `CREATE OR REPLACE FUNCTION
public.media_playlists_list` เพิ่ม field `item_kinds` (distinct `media_assets.kind` ต่อ playlist,
`'video' | 'image'`) ไม่แตะ schema/argument list เดิม (เหมือน migration 098 — replace ไม่ overload,
ไม่ต้อง REVOKE เพราะ signature ไม่เปลี่ยน)

- Applied **dev** (`ftfmokgphewzyxzwjitv`) — dump `pg_get_functiondef` เทียบไฟล์ตรงกัน
- Applied **prod** (`sfiefevtxalqjizdkcsw`) — dump เทียบไฟล์ตรงกัน
- ไม่มี data migration, ไม่แตะแถวใดๆ

### Frontend (thunder_one_prj)

| ไฟล์ | เปลี่ยนอะไร |
|---|---|
| `src/types/domain.ts` | เพิ่ม `PlaylistListItem.item_kinds?: ("video"\|"image")[]` |
| `list-filtering.ts` | เพิ่ม `CONTENT_TYPES`, `ContentType`, `playlistContentType()` (derive Video/Image/Mixed/null จาก `item_kinds`) — **ไม่แตะ** `playlistType()` เดิม (standard/dynamic) เพราะยังใช้อยู่ในโค้ด wizard ที่ #33 จะลบ; สลับ `filterPlaylists`/`sortValue` "type" ให้ใช้ฟังก์ชันใหม่ |
| `list-url-state.ts` | filter `type` เปลี่ยนจาก `PLAYLIST_TYPES` เป็น `CONTENT_TYPES` |
| `PlaylistsFilters.tsx` | dropdown "All Types" เปลี่ยนเป็น Video/Image/Mixed |
| `PlaylistsTable.tsx` | Type column ใช้ `playlistContentType()`; เพิ่ม `RowAction "mark-ready"` ในเมนู "..." — โชว์เฉพาะแถว `status === "draft"`, อยู่บนสุด |
| `PlaylistsListPage.tsx` | reorder stat tiles → Total/Draft/Active/Inactive; `handleAction` เพิ่มเคส `mark-ready` เรียก `upsertPlaylist({status:"active"})` (endpoint เดิม ไม่มีของใหม่); เพิ่ม `// ponytail:` เพดาน client-side filtering ~1,000 rows |

Upload button, grid/compact toggle, สถานะ Scheduled — เช็คแล้วไม่มีอยู่ในโค้ดหน้า list อยู่แล้ว
(มีแค่ในไฟล์ wizard เดิมที่ #33 จะลบ) ไม่ต้องแก้อะไรเพิ่ม

ไฟล์ `.check.mts` ที่แก้ให้ตรงกับ type ใหม่: `list-filtering.check.mts`, `list-url-state.check.mts`,
`list-empty-state.check.mts` (literal `"standard"`/`"dynamic"` → `"video"` ในจุดที่ทดสอบ filter type)

## Verify

- `tsc --noEmit -p .` ผ่าน (0 errors)
- `eslint` ผ่านทุกไฟล์ที่แก้
- `npm run build` ผ่าน
- `node <file>.check.mts` ผ่านทั้ง 3 ไฟล์ — หมายเหตุ: รันตรงไม่ได้เพราะ `metadata.ts` import `"./types"`
  แบบ dir-import ที่ node ESM รันตรงไม่รองรับ (**ปัญหาเดิมของ repo ไม่เกี่ยวกับงานนี้** — ยืนยันด้วย
  `git stash` แล้วรันบน baseline ก็ error เหมือนกัน) แก้ import ชั่วคราวเพื่อรันเทส แล้ว `git checkout`
  คืนก่อน commit
- Browser: **ผู้ใช้เทสเองผ่าน checklist** `docs/playlists/v1/verify-34-playlists-list-browser-checklist.md`
  ทุกข้อ PASS — stat tiles, Type column (Video/Image/Mixed/—), filter, Mark as ready
  (Draft→Inactive ถูกต้องตาม ADR 0028), playlist ที่ mark ready แล้วเลือกได้ในหน้า Create Publication,
  search/sort/pagination

## ข้อสังเกต (ไม่ใช่บั๊กของงานนี้ ไม่ได้แก้)

- `PlaylistsListPage.tsx` เกิน 300 บรรทัดอยู่แล้วก่อนงานนี้ (313 บรรทัด) งานนี้เพิ่มสุทธิ 9 บรรทัด
  (เป็น 322) — ไม่ทำ extraction เพิ่มเพราะนอกขอบเขต #34 ทิ้งไว้เป็นของที่ #33 (ซึ่งจะรื้อไฟล์นี้เป็น editor
  แยกอยู่แล้ว) ควรพิจารณาตอนนั้น
- `metadata.ts`'s `import ... from "./types"` (ไม่มี extension) ทำให้ `.check.mts` ในโฟลเดอร์นี้รันตรงด้วย
  `node` ไม่ได้เลยทั้งโฟลเดอร์ — pre-existing, คนละเรื่องกับ #34 แต่ block การรันเทสแบบ CLAUDE.md §3
  สั่งไว้ (`node <file>.check.mts`) — ถ้ามีเวลาควรแก้เป็น `from "./types/index.ts"`

## ที่ยังไม่ทำ (ไม่อยู่ใน scope #34)

FE-1/#33 (editor หน้าเดียว), FE-8/#39 (preview), และใบอื่นๆ ตาม `docs/playlists/v1/plan-playlist-v1.md`
