# SESSIONLOG — Playlist Active/Inactive derived from publication references (2026-08-19)

Branch `feat/playlistOverview` · repos: `Thunder_Core` (migration) + `thunder_one_prj` (frontend)
แผน: `/Users/arty/.claude-thunder/plans/noble-pondering-stallman.md` · ADR: `docs/adr/0028-*`

## สิ่งที่ทำ

**กติกาใหม่:** Active = playlist ถูกอ้างถึงใน publication อย่างน้อย 1 อัน (publication จะ draft/active/
cancelled ก็นับ) · Inactive = ไม่ใช่ draft และไม่มีใครอ้าง · Draft = เหมือนเดิม

เหตุผล: `media_core.playlists.status` DB default `'active'` และไม่มี write path ไหนเขียน `'inactive'`
เลย (มีแต่ปุ่ม Archive มือ) → StatCard "Inactive" กับตัวเลือก Inactive ใน filter นับไม่ได้เกิน 0

### Phase A — Thunder_Core (apply แล้ว)
`supabase/migrations/098_playlists_publication_count.sql` — `CREATE OR REPLACE` เพิ่ม key
`publication_count` (`count(*)` บน `media_core.publications`) ให้ `media_playlists_list` และ
`media_playlist_get` · argument list ไม่เปลี่ยน → replace จริง ไม่เกิด overload · ไม่มี DDL ไม่แตะข้อมูล

### Phase B — thunder_one_prj
- `types/domain.ts` — `publication_count?: number` ใน `PlaylistListItem` + `PlaylistDetail`
- `status-display.ts` — ฟังก์ชันใหม่ `playlistDisplayStatus()` **จุดแปลงกติกาจุดเดียว**
  (draft → draft · count undefined → stored status · count > 0 → active · ไม่งั้น inactive)
- `list-filtering.ts` — `filterPlaylists`, `summarize`, และ `sortValue` case `"status"` ใช้ derived
- call sites ของ `statusBadge` 4 จุด: `PlaylistsTable`, `PlaylistSidePanel`, `PlaylistProperties`,
  `ReviewPublishStep` (feature publications)
- `PlaylistDetailPage.tsx` — ลบปุ่ม **Archive / Activate**, `handleStatusChange`, state `statusBusy`
  และ import `Button` / `upsertPlaylist` ที่ค้าง · **ไม่ลบ** `upsertPlaylist` เองเพราะ
  `usePlaylistDraftSave` ยังใช้อยู่
- `index.ts` — export `playlistDisplayStatus` เพิ่ม
- `docs/adr/0028-playlist-status-derived-from-publication-references.md`
- check: `status-display.check.mts` (5 เคสใหม่) · `list-filtering.check.mts` (fixture เติม
  `publication_count`, เพิ่ม assert ว่า derived ทับ stored ทั้งใน `summarize`, filter และ sort)

### สิ่งที่ไม่ทำ
ไม่ migrate `status` เก่า · ไม่แตะ `resolveDraftStatus` / write path · ไม่แก้ `usePlaylistPublications`

## Verification

| ชั้น | ผล |
|---|---|
| `prosrc` ของ 2 ฟังก์ชันหลัง apply | ✅ md5 ตรงกับไฟล์ 098 ทั้งคู่ (`3091e3c7…` / `9a2e555e…`) · ยังมี signature เดียว |
| `media_playlists_list(tenant, true)` | ✅ 8 แถว มี `publication_count` ครบ · 0 mismatch เทียบกับ count จริง |
| `node status-display.check.mts` | ✅ ผ่าน |
| `node list-filtering.check.mts` | ✅ ผ่าน |
| `pnpm exec tsc --noEmit` | ✅ ไม่มี error |
| `pnpm lint` | ✅ ไม่มี error |
| **HTTP / Browser** | ❌ **ยังไม่ verify** — ทำ checklist ไว้ให้ข้างล่าง |

> ทั้งสอง route ใน Thunder_Core (`playlists/route.ts`, `playlists/[id]/route.ts`) ส่ง jsonb ผ่านทั้ง
> ก้อนโดยไม่ whitelist field → **ไม่ต้อง deploy Thunder_Core** backend ที่ deploy อยู่คืน
> `publication_count` ทันทีที่ migration ลง

### Checklist ให้ทดสอบเอง (ยังไม่ได้รัน)

รัน `pnpm dev` แล้วเปิดหน้าต่อไปนี้ ข้อมูล prod ตอนนี้มี 8 playlist:

| ข้อ | ทำ | ผลที่คาดหวัง |
|---|---|---|
| 1 | เปิด `/playlists` ดู StatCards | Total **8** · Active **4** · Inactive **2** · Draft **2** (รวม = Total) — ก่อนแก้จะได้ Active 6 / Inactive 0 |
| 2 | ดู badge ในตาราง | `Boss test`, `test` (×2), `test2` → **Active** · `test pic`, `test transition` → **Inactive** · `test draft`, `tests` → **Draft** |
| 3 | status filter เลือก **Inactive** | เหลือ 2 แถว: `test pic`, `test transition` |
| 4 | กดหัวคอลัมน์ **Status** เรียง asc | Active ขึ้นก่อน → Inactive → Draft ตรงกับ badge ที่เห็น (ไม่ใช่ค่า stored) |
| 5 | คลิกแถว `test pic` เปิด side panel | badge = **Inactive** ตรงกับตาราง |
| 6 | กด Delete บน `test pic` | ลบได้จริง (ไม่มี publication อ้าง) — **ถ้าไม่อยากลบข้อมูลจริง ข้ามข้อนี้ได้** |
| 7 | กด Delete บน `Boss test` | โดน guard ขึ้นข้อความ "ลบไม่ได้ — playlist นี้ถูกใช้อยู่ใน 23 publication…" |
| 8 | เปิด `/playlists/<id ของ test pic>` | badge = **Inactive** และ **ไม่มีปุ่ม Archive / Activate** แล้ว เหลือแค่ Edit Playlist |
| 9 | เปิด publication wizard ไป Step 5 (Review) ที่เลือก playlist | badge ของ playlist ตรงกับหน้า list |

## หมายเหตุ

- งาน Phase B delegate ให้ `agy` (`claude-sonnet-4-6`, delegate-in-place) — มันตายกลาง step 6
  ด้วย `Error: timeout waiting for response` ทำ step 1-5 ครบ ส่วน check files + ADR เขียนต่อเอง
- แก้ที่ agy ทิ้งไว้: `ReviewPublishStep.tsx` ใช้ non-null assertion `badge!.color` → เปลี่ยน guard
  เป็น `{playlist && badge && (` แทน
- แผนต้นฉบับสั่งลบ service function `upsertPlaylist` ทิ้ง — ไม่ทำ เพราะยังไม่ใช่ dead code
- แผนต้นฉบับเขียนเลข ADR เป็น 0027 ซึ่งถูกใช้ไปแล้ว → ใช้ 0028
- ยังไม่ commit / ยังไม่เปิด PR
