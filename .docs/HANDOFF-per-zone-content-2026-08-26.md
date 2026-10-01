# Handoff — Layout per-Zone content: process, เอกสาร, และสถานะพร้อม implement

**เขียน 2026-08-26** · repos: `thunder_one_prj` + `Thunder_Core` · branch ทั้งคู่ `feat/layout`

เอกสารนี้คือจุดเข้าเดียวของงาน per-Zone content ทั้งเฟส: ชี้ว่า plan/ticket อยู่ไหน,
ตัดสินใจอะไรไปแล้วด้วยเหตุผลอะไร, ทำถึงไหน, และ **เริ่ม implement ต่อได้ทันทีจากตรงไหน**
อ่านจบไฟล์นี้ไฟล์เดียวแล้วลงมือได้ ไม่ต้องไล่ย้อน session เดิม

---

## 1. เริ่มตรงไหน (ถ้าไม่อ่านอะไรเลย อ่านหัวข้อนี้)

**frontier ตอนนี้ = ticket 02 กับ ticket 03** เริ่มขนานกันได้ทันที ทั้งคู่ blocker ปลดแล้ว

ก่อนแตะ ticket ใหม่ มีสองอย่างที่รอ **คุณ** ตัดสิน ไม่ใช่รอโค้ด:

| รอ | คืออะไร | ทำไมต้องคุณ |
|---|---|---|
| apply migration 2 ไฟล์ | `20260826090000` แล้วตามด้วย `20260826093000` | R0 — เขียนลง production ตรงๆ (`CLAUDE.md` §1) |
| commit งานที่ค้าง | ทั้งงาน URL-history และงาน per-Zone รอบนี้ | §4 — commit/push เมื่อสั่งเท่านั้น |

ticket 03 **ไม่ต้องรอ apply** ก็เขียนได้ (เขียน migration ต่อยอดจากไฟล์ที่มีอยู่)
แต่จะ verify จริงไม่ได้จนกว่า 2 ไฟล์ข้างบนจะลง production

---

## 2. เอกสารทั้งชุด — อ่านตามลำดับนี้

| ลำดับ | ไฟล์ | อ่านเพื่อ |
|---|---|---|
| 1 | `docs/adr/0044-multi-zone-layout.md` | ธรรมนูญของฟีเจอร์ · §1 §5 §8 §9 §10 §11 คือข้อที่ ticket ทุกใบอ้างถึง |
| 2 | `docs/adr/0045-publication-snapshot-materialization.md` | ตารางปลายทางตอน publish · §1 §2 §5 §10 |
| 3 | `docs/adr/0048-per-zone-content-binding.md` | **ของใหม่** — เคาะว่า binding เก็บที่ไหนก่อน publish |
| 4 | `docs/layouts/spec-per-zone-content.md` | **ของใหม่** — spec เต็ม 36 user stories + implementation/testing decisions |
| 5 | `docs/layouts/tickets/01..07-*.md` | **ของใหม่** — 7 ใบ พร้อม acceptance criteria และเส้น blocker |
| 6 | `docs/layouts/plan-layout-execution.md` | แผนเฟสก่อนหน้า (Task 1–8) — ปิดครบแล้ว ใช้เป็น prior art |
| 7 | `.docs/SESSIONLOG-layout-history-and-duplicate-name-2026-08-26.md` | บันทึกการปิด Checklist A (browser verify) |
| 8 | `.docs/HANDOFF-layout-next-phase-2026-08-26.md` | handoff รอบก่อน — ยังใช้ส่วน "กับดัก" ได้ |

ADR 0047 (`docs/adr/0047-list-url-state-history-navigation.md`) เป็นของงาน URL-history คนละเส้น
ไม่เกี่ยวกับ per-Zone แต่ commit จะไปด้วยกันเพราะค้างอยู่ใน tree เดียวกัน

---

## 3. Process ที่เดินมา — ทำไมถึงได้เอกสารชุดนี้

```
handoff รอบก่อน ชี้ว่ามี design fork ค้าง 1 ข้อ
   ↓
สำรวจโค้ดจริงก่อนถาม (ไม่เดา — CLAUDE.md §1 NO MAGIC)
   พบว่า Publication ไม่เคยมี draft table: content = Playlist โดยปริยายที่
   media_publication_set_content สร้าง · draft ของ wizard อยู่ localStorage อย่างเดียว
   → ตัวเลือก "ต่อขยาย publication_drafts" ที่ handoff เดิมเสนอไว้ ไม่มีอยู่จริง
   ↓
เสนอ 3 ทางพร้อมคำแนะนำ → คุณเคาะ: ตาราง publication_zones + Playlist ต่อ Zone
   ↓
ADR 0048 (บันทึกทั้งทางที่เลือกและทางที่ไม่เลือก)
   ↓
spec-per-zone-content.md (ครอบ B1–B4 ในฉบับเดียว — เพราะ §9 บอกว่า payload
   ปล่อยก่อน gate ไม่ได้ สี่ข้อนี้คือ vertical slice เดียวกัน)
   ↓
ซอยเป็น 7 ticket + เส้น blocker → คุณเคาะ
   ↓
ส่ง ticket 01 + 04 (frontier) ให้ executor รัน → รีวิวผลเอง → เจอ regression → แก้
```

**design fork ที่เคาะไปแล้ว ห้ามรื้อโดยไม่ทำ ADR ใหม่:**

1. binding อยู่ในตาราง `publication_zones` ไม่ใช่ jsonb ใน `metadata` และไม่ใช่ localStorage
2. content ต่อ Zone เป็น **Playlist** ไม่มีตาราง item ใหม่
3. geometry ไม่ copy ลง binding — freeze ตอน activate เท่านั้น
4. endpoint แยก `PUT /:id/zones` ไม่เติม argument เข้า `media_publication_set_content`

---

## 4. สถานะรายใบ

| # | ticket | สถานะ | หมายเหตุ |
|---|---|---|---|
| 01 | Zone bindings persist | **โค้ดเสร็จ · รอ apply** | migration + RPC + route เขียนแล้ว รีวิวแล้ว |
| 02 | Wizard step 2 Layout mode | **พร้อมเริ่ม** | blocker (01) ปลดแล้วในระดับโค้ด |
| 03 | Activation materializes Zones | **พร้อมเริ่ม** | เขียนได้เลย verify ต้องรอ apply 01 |
| 04 | Device reports capabilities | **โค้ดเสร็จ · รอ apply** | มี regression ที่แก้แล้ว ดู §6 |
| 05 | Capability gate on publish | รอ 01, 03, 04 | |
| 06 | Equal-priority overlap block | รอ 01, 03 | |
| 07 | `zones[]` payload | รอ 03, 05, 06 | ต้องอยู่ท้ายสุดตาม ADR 0044 §9 |

### Checklist A (งานค้างจาก handoff รอบก่อน) — **ปิดแล้ว**

ปิดโดยเซสชันคู่ขนานเมื่อ 2026-08-26 10:40 บันทึกที่
`.docs/SESSIONLOG-layout-history-and-duplicate-name-2026-08-26.md`:

- browser verify ผ่านครบ: Layouts A1–A11, Playlists B1–B13, Channels C1–C11, duplicate name D1–D4
- ระหว่างทางเพิ่มปุ่ม **Clear all** (เดิมไม่มีให้กด) — นี่คือที่มาของไฟล์ `*Filters*.tsx` ที่ค้างใน tree
- migration duplicate-name apply production แล้ว ตรวจ `pg_get_functiondef` + grants ครบ
- ผู้ใช้ยืนยันว่าไม่มีการเขียนข้อมูล production ระหว่างทดสอบ
- **ยังไม่ commit**

---

## 5. ของที่เสร็จรอบนี้ — ไฟล์และสิ่งที่มันทำ

### `Thunder_Core/supabase/migrations/20260826090000_publication_zone_bindings.sql` (ใหม่)

- `media_core.publications.layout_id` (nullable, FK → `layouts`)
- ตาราง `media_core.publication_zones` ตาม ADR 0048 §1 ครบ: `UNIQUE (publication_id, layout_zone_id)`,
  `layout_zone_id` cascade, `playlist_id` **RESTRICT**, `playback` CHECK รูปเดียวกับ snapshot zone,
  index 3 ตัว, RLS SELECT policy แบบเดียวกับ `publication_snapshot_zones`
- `media_publication_set_zones(p_tenant_id, p_publication_id, p_layout_id, p_zones, p_actor_id)` —
  replace ทั้งชุดใน transaction เดียว, `FOR UPDATE` lock, draft-only, filter tenant เอง ·
  ปฏิเสธ Zone นอก Layout / Playlist ข้าม tenant / binding ไม่ครบทุก Zone ·
  `p_layout_id = NULL` = สวิตช์กลับ Full screen (ล้าง binding ทั้งหมด) ·
  `position` มาจาก `layout_zones.position` ฝั่ง server ไม่รับจาก client
- `media_publication_get` เพิ่ม `layout_id` + `zones[]` เพื่อให้ wizard rehydrate ได้

### `Thunder_Core/supabase/migrations/20260826093000_media_device_capabilities.sql` (ใหม่)

- `public.assets.player_capabilities jsonb NULL` (NULL = ไม่เคยรายงาน = fail ที่ gate)
- `media_device_profile_set` เพิ่ม `p_capabilities` — **`DROP FUNCTION` signature เดิมก่อน `CREATE`**
  (เติม parameter แล้ว `CREATE OR REPLACE` จะได้ overload ซ้อน) · ไม่ส่ง capabilities มาก็ยังรับได้ ค่าเดิมไม่ถูกล้าง
- `media_heartbeat` ขยาย `profile_required` ให้ครอบ `player_capabilities IS NULL`

### route

- `Thunder_Core/.../media/publications/[id]/zones/route.ts` (ใหม่) — zod ตรวจ shape อย่างเดียว
- `Thunder_Core/.../media/player/device-profile/route.ts` (แก้) — ส่ง `capabilities` ผ่านเป็น `p_capabilities`

### เอกสาร

- `docs/adr/0048-per-zone-content-binding.md`, `docs/layouts/spec-per-zone-content.md`,
  `docs/layouts/tickets/01..07`
- แก้ ticket 04 ที่เขียน `media_core.assets` ผิด → `public.assets` (Media Device เป็นแถวใน `public.assets`)

---

## 6. Regression ที่จับได้ตอนรีวิว — อ่านก่อนเขียน migration ใบต่อไป

executor เขียน `media_heartbeat` ใหม่โดยลอก body มาจาก `096_media_device_profile.sql`
ซึ่ง**เก่าไปหนึ่งรุ่น** ตัวจริงล่าสุดอยู่ใน `20260824130000_synchronized_playback_epoch_phase.sql`

ถ้า apply ไปตามนั้น จะหายเงียบๆ:

- `sync_phase_error_ms`, `sync_loop_duration_seconds` เลิกถูกเขียน
- telemetry key `phase_error_ms`, `loop_duration_seconds` หายจาก response
- → synchronized playback (ADR 0042/0043) ตาบอดทันที โดยไม่มี error ให้เห็น

**แก้แล้ว** เอากลับครบ + แก้คอมเมนต์หัวไฟล์ให้ชี้รุ่นที่ถูก · diff เทียบรุ่นล่าสุดตอนนี้เหลือเฉพาะ
ส่วนที่ตั้งใจเพิ่ม (`profile_required` widening)

> **กฎใหม่ที่ต้องจำ:** ก่อน `CREATE OR REPLACE` ฟังก์ชันเดิมทุกครั้ง ให้หา **นิยามล่าสุด** ก่อน —
> `grep -l 'FUNCTION public.<name>' *.sql | sort | tail -1` แล้ว diff ตัวใหม่กับตัวนั้น
> ห้ามลอกจากไฟล์ที่ค้นเจอไฟล์แรก

---

## 7. หลักฐาน verification — แยกให้ชัดว่าอะไรรันจริง

### รันจริงแล้ว

| อะไร | ผล |
|---|---|
| `media_publication_get` diff เทียบรุ่นล่าสุด (`20260821065750`) | เพิ่มแค่ `layout_id` + `zones[]` + grants ไม่มี field เดิมหาย |
| `media_heartbeat` diff เทียบรุ่นล่าสุด (`20260824130000`) หลังแก้ | เหลือเฉพาะ `profile_required` widening |
| `DROP FUNCTION` ก่อน `CREATE` ที่เปลี่ยน arg | มีครบ |
| REVOKE/GRANT ทุกฟังก์ชันที่แตะ | ครบทั้ง 3 ตัว |
| `npx tsc --noEmit` (Thunder_Core) | ไม่มี error ในไฟล์ที่แตะ (ยอดรวมไม่เคยสะอาดอยู่แล้ว) |
| `npx eslint` 2 route ที่แตะ | exit 0 |
| browser verify Checklist A | ผ่านครบ (เซสชันคู่ขนาน ดู §4) |

### ❌ ยังไม่ได้ทำ — ห้ามเขียนว่า verified

- **ไม่ได้ apply migration 2 ไฟล์นี้ลง production เลย** → post-apply verification ทั้งชุดยัง pending:
  `pg_get_functiondef` diff, overload เดียว, `has_function_privilege`, advisors, scratch-tenant probe
- **ไม่เคยยิงผ่าน HTTP** — `PUT /:id/zones` และ device-profile ยังไม่เคยถูกเรียกจริง
- frontend ยังไม่มีอะไรเรียก endpoint ใหม่ (นั่นคือ ticket 02)

> เตือนซ้ำ: frontend เรียก backend ที่ **deploy อยู่** (`CORE_API_URL` → `thundercore.vercel.app`)
> แก้ route ในเครื่องแล้วเทสผ่าน UI จะไม่เห็นผลจนกว่าจะ deploy · แต่ migration ที่ apply ผ่าน MCP มีผลทันที

---

## 8. เรื่องที่ต้องให้คุณตัดสิน

1. **grant ของ `media_heartbeat` เปลี่ยน** — เดิมไม่เคยมี REVOKE/GRANT ในประวัติ migration เลย
   (ใครถือ anon key ก็เรียกได้) หลัง apply จะเหลือ `service_role` เท่านั้น
   ถูกตามกฎและควรทำ แต่เป็นการเปลี่ยน production เกินขอบเขต ticket — คุณควรรู้ก่อนกด
2. **ลำดับ apply**: `20260826090000` → `20260826093000` (อิสระต่อกัน ลำดับไหนก็ปลอดภัย)
3. **PR เอาไทยหรืออังกฤษ** (§4 ต้องถามทุกครั้ง) · verify ยังไม่ครบ → เปิดเป็น **Draft**

> **เคาะแล้ว ไม่ต้องตามต่อ:** `Thunder_Core/supabase/migrations/014_restore_auth_fkey.sql`
> (เดิมเป็นไฟล์เปล่าใน git ตอนนี้มี 36 บรรทัดเรื่อง restore FK `public.users → auth.users`)
> **ไม่ใช่ของงานนี้ เจ้าของงานตัดสินแล้วว่าไม่ต้องทำอะไร** — ห้าม stage ห้าม commit ห้าม apply
> ไปพร้อมกับงาน per-Zone และไม่ต้องเปิดประเด็นซ้ำ

---

## 9. Git state — เช็คจริง 2026-08-26

| repo | branch | vs origin | ค้างใน tree |
|---|---|---|---|
| `thunder_one_prj` | `feat/layout` | **ahead 5** (ยังไม่ push) | งาน URL-history + Clear all + เอกสาร per-Zone ทั้งชุด |
| `Thunder_Core` | `feat/layout` | sync | 2 migration ใหม่ + 2 route (+ `014` ที่ไม่เกี่ยว ดู §8 — อย่า stage) |

ยังไม่มีอะไรของงานนี้ถูก commit · **ห้ามใส่ `Co-Authored-By: Claude`** และห้ามเอ่ยถึง AI ใน commit

---

## 10. กับดักที่ต้องพกไปด้วยทุกใบ

- `CREATE OR REPLACE` ต้องลอกจาก**นิยามล่าสุด**เสมอ (§6 — กับดักใหม่ของรอบนี้)
- เติม/เปลี่ยน parameter ต้อง `DROP FUNCTION IF EXISTS <signature เดิม>` ก่อน ไม่งั้นได้ overload ซ้อน
- `CREATE FUNCTION` แจก EXECUTE ให้ PUBLIC อัตโนมัติ → ต้อง REVOKE แล้ว GRANT
  และ**เช็ค `has_function_privilege` จริงหลัง apply**
- `apply_migration` ตั้ง timestamp เอง → ชื่อไฟล์ในเครื่องไม่ตรง production history **อย่าพยายาม repair**
- tenant isolation อยู่ใน RPC ไม่ใช่ RLS
- `DISTINCT ON` ที่ไม่มี `ORDER BY` ให้ผลไม่ deterministic
- `pushState` ไม่อัปเดต `useSearchParams()` → restore ต้องอ่าน `window.location.search`
- ห้ามแตะ production Layout `413d7b1f-b1f5-4c97-b5b0-8616d537570b`
- Thunder_Core `tsc` ไม่เคยสะอาด (~127 errors เดิม) — gate ที่ไฟล์ที่แก้
- **`ERR_UNSUPPORTED_DIR_IMPORT` ใน `playlists/list-url-state.check.mts` เป็นของเดิม** พิสูจน์แล้ว
  ไม่ใช่ regression · แก้จริงบรรทัดเดียว (`../types` → `../types/index.ts`) แต่ยังไม่แก้ตาม no scope creep

---

## 11. ลำดับที่แนะนำสำหรับเซสชันถัดไป

1. คุณกด apply migration 2 ไฟล์ → ผม/เซสชันถัดไปรัน post-apply verification ให้ครบตาม §7
2. commit งานที่ค้างทั้งสอง repo (แยก commit: URL-history คนละใบกับ per-Zone) → เปิด PR เป็น Draft
3. เริ่ม ticket 02 กับ 03 ขนานกัน
4. จบทุกเซสชันที่แตะโค้ด → `.docs/SESSIONLOG-<topic>-<date>.md` ไฟล์ใหม่ ไม่ append

> §2 model: ADR/spec/ticket เขียนจบและไม่เหลือ design fork ค้างแล้ว —
> ที่เหลือเป็นงาน execute ตามแผน **Sonnet พอ** · เจอ design fork หรือ R0 ใหม่เมื่อไหร่ค่อยสลับกลับ Opus
