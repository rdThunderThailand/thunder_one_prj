# SESSIONLOG — ADR 0045 implementation, Phases 0–4 (2026-08-25)

## ทำอะไรไปบ้าง

ตาม `.docs/HANDOFF-implement-adr-0045-2026-08-25.md` (design ปิดแล้ว, เป็น execution brief) ทำ
Phase 0–4 ของ `docs/publications/plan-snapshot-materialization.md` ครบ:

- **Phase 0 (discovery, read-only):** ยืนยัน 5 function body ที่ plan อ้างตรงกับ production ทุกตัวเป๊ะ
  (byte-for-byte ผ่าน `pg_get_functiondef`) ไม่มี drift. Refresh ตัวเลข production:
  98 `publish_jobs`, 0 ไม่มี target/playlist/item, 12 `file_version_no IS NULL`, 0 `file_versions` rows,
  0 Schedule ซ้ำ, 0 Publication ที่มีหลาย Job, 5 Job ไม่มี Schedule (อยู่ใน cancelled ทั้งหมด),
  ยืนยันว่า `media_publication_activate` เปิด PUBLIC จริงใน prod วันนี้.
- **Phase 1:** เขียน migration เดียว (`Thunder_Core/supabase/migrations/20260825080838_publication_snapshot_materialization.sql`, **ยังไม่ apply**) — 3 ตารางใหม่ (snapshots/zones/items), audit+`UNIQUE(schedules.publication_id)`, backfill ทุก Job เป็น `legacy_backfill` snapshot, `CREATE OR REPLACE` ทั้ง 5 function พร้อม grant กลับ `service_role` เท่านั้น.
- **Phase 2:** แยก schema playback route → `schema.ts` + `schema.check.mts` ใหม่ (5 case ตาม acceptance criteria) ใน Thunder_Core.
- **Phase 3:** อัปเดต `swagger-core-v1.json`, `docs/api/api-overview.md`, `docs/media/media-core-mapping.md`, `docs/media/media-core-schema.dbml`, และ `docs/hidden/SESSION_HANDOFF.md` (Thunder_Core) ให้ตรงกับดีไซน์ใหม่.
- **Phase 4:** รัน local/static checks ทั้งหมด — ผ่านหมด, รายละเอียดด้านล่าง.

## Verify แล้ว (layer ไหนบ้าง)

- **SQL layer (production, read-only เท่านั้น):** ยืนยัน function bodies + ACL + preflight counts ผ่าน Supabase MCP `execute_sql`. **ไม่ได้ apply migration ที่ไหนเลย.**
- **Local/static:** `node schema.check.mts` ผ่าน · ESLint 3 ไฟล์ที่แก้ clean · `jq empty` swagger ผ่าน · `git diff --check` clean · `tsc --noEmit` = 130 errors เทียบ baseline 129 (วัดจริงด้วย `git stash` แล้วรันเทียบ) — delta ตัวเดียวคือ `TS5097` บน `schema.check.mts` ใหม่ ซึ่งเป็น pattern เดิมที่ `player/jobs/[id]/publication/schema.check.mts` มีอยู่แล้ว ไม่ใช่ error ชนิดใหม่.

## ยังไม่ได้ทดสอบ

- **DB behavior matrix ทั้งหมด** (backfill ถูกต้อง, RPC ทำงานตามที่เขียน, hostile cross-tenant PoP fixture, republish `[A,B]→[A]` staleness) — ไม่มี non-production Supabase instance ให้รัน (`.env` ทุกตัวชี้ prod, ไม่มี local stack ตามที่บันทึกไว้ก่อนหน้านี้).
- **HTTP/browser ทุกอัน** — Phase 6 (deploy + HTTP verify) ยังไม่เริ่ม.
- Migration apply (Phase 5), deploy (Phase 6) เป็น R0 แยกทุกขั้น ต้องขออนุมัติเป็นรายครั้งพร้อมโชว์ตัวเลข/ผลกระทบจริง ณ ตอนนั้น — ยังไม่ทำ.

## Design call ที่ไม่ได้เขียนไว้ใน ADR ชัดเจน (ต้อง flag)

`playback_logs.publication_snapshot_id`/`snapshot_zone_id` composite FK ใช้ `ON DELETE SET NULL`
(ไม่ใช่ `RESTRICT`/`CASCADE`) — เหตุผล: ถ้าลบ Publication (ซึ่ง cascade ไปที่ snapshot อยู่แล้ว) ไม่อยาก
ให้บล็อกการลบ Publication เดิม หรือทำลาย proof-of-play history ที่มีอยู่ 12,117 แถว. ADR 0045 §10 พูดถึง
FK ของ `publication_snapshot_items`/`publication_snapshots` เท่านั้น ไม่ได้พูดถึงคู่นี้ตรงๆ — ตัดสินใจเอง
ตามหลักการเดียวกัน (ปกป้อง broadcast history) แต่ยังไม่ได้ยืนยันกับ ADR โดยตรง ควรทบทวนก่อน apply จริง.

## เจอเพิ่ม (ไม่เกี่ยวกับ ADR 0045 — แค่ flag)

6 ตารางใน `media_core` (`brands`, `campaigns`, `tags`, `publication_tags`, `channel_types`,
`channel_device_reservations`) เปิด RLS ไม่ครบ, เปิดให้ `anon`/`authenticated` เข้าได้เต็มที่ — เจอตอน
`list_tables` verbose. ไม่ได้แก้ ไม่ใช่ scope งานนี้.

## ต่อไป

Phase 5 (production preflight + apply migration, R0) — ต้องขออนุมัติพร้อมตัวเลข/แถวที่จะเปลี่ยนจริง ณ
ตอนขอ, refresh counts ใหม่อีกรอบก่อนยิง เพราะเวลาผ่านมาแล้วตั้งแต่ discovery ตอน 1:41p.
