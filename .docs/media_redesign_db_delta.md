# DB delta — Publication redesign (rev 2)

ส่วนต่างที่ **Repo A (Thunder_Core)** ต้องทำ ให้รองรับ mockup "Create Publication" ทั้ง 5 หน้า
อ้างอิง: [CONTEXT.md](../CONTEXT.md) · ADR [0001](adr/0001-single-content-as-implicit-playlist.md) [0002](adr/0002-publication-precedence-and-schedule-window.md) [0003](adr/0003-actor-identity-for-media-writes.md) [0004](adr/0004-loop-playback-model.md) [0005](adr/0005-pin-asset-version-at-publish.md)

สถานะ prod ตอนเช็ค 2026-07-23: migration 048–052 deploy แล้ว · ด้านล่างคือ **ส่วนต่าง** จากนั้น
ยังไม่ได้เขียน migration หรือแตะ RPC ใด ๆ — เอกสารล้วน

---

## ตาราง

| ตาราง | เปลี่ยนอะไร |
| --- | --- |
| `media_core.publications` | + `name varchar NOT NULL` · + `description text` · + `campaign_id uuid` FK **NOT NULL** (mockup รอบ 2 บังคับ) · + `publication_type` (`image\|video\|playlist\|html\|dynamic`) · + `priority` · + `language` · + `metadata jsonb DEFAULT '{}'` (tags ฯลฯ) · + `activated_at` · + `updated_at` · แก้ status check → `draft \| active \| expired \| cancelled` |
| `media_core.playlists` | + `kind` (`single \| user`) — ADR 0001 |
| `media_core.playlist_items` | + `file_version_no int` — ปักเวอร์ชันตอน activate (ADR 0005) |
| `media_core.media_assets` | + `kind` (`video \| image`) · + `approval_status` (`draft\|pending\|approved\|rejected`) + `approved_by` + `approved_at` · + `language` · บังคับ `duration_seconds NOT NULL` เมื่อ `kind='image'` |
| `media_core.channels` | + `channel_type` (`dooh\|in_store\|website\|social\|email\|mobile_app`) · + `location_id` FK → `public.locations` (มีอยู่แล้ว 492 asset ผูก site/gps) · + `estimated_daily_impressions int` (Estimated Reach — กรอกมือ) |
| `media_core.brands` | **ใหม่** — `id, tenant_id, name, logo_file_id?, status, created_at, updated_at` |
| `media_core.campaigns` | **ใหม่** — `id, tenant_id, brand_id FK, name, status, starts_at, ends_at, created_at, updated_at` |
| `public.file_versions` | **มีอยู่แล้ว 0 แถว — เริ่มใช้จริง** flow อัปโหลดต้องเขียนแถวใหม่แทนการทับ `storage_key` |
| `storage.buckets` (`media`) | + mime รูปเข้า allowlist — ตอนนี้ `video/mp4, video/webm, video/quicktime, video/x-matroska` เท่านั้น อัปรูปโดน 415 |

## RPC

| RPC | เปลี่ยนอะไร |
| --- | --- |
| `media_publication_upsert` | **ใหม่** — สร้าง/แก้ draft (campaign, name, description, type, priority, language, tags, targets, schedule) ยังไม่สร้าง job |
| `media_publication_activate` | **ใหม่** — draft → active, เซ็ต `activated_at`, ปัก `file_version_no`, สร้าง job + targets |
| `media_publish_single` | **ใหม่** — ห่อการสร้าง playlist `kind='single'` แล้วเรียก upsert+activate |
| `media_publication_conflicts` | **ใหม่ (read)** — รายจอ: มี publication อื่นแชร์ loop กี่ชิ้น ความถี่ที่ได้จริงเหลือเท่าไร + จอที่ offline/warning ณ ช่วงเวลานั้น (ป้อน Step 3 และ Conflicts & Warnings ใน Step 5) |
| `media_asset_approve` | **ใหม่** — set `approval_status` + `approved_by` + `approved_at` |
| `media_job_poll` | เปลี่ยนจาก inbox (`WHERE pjt.status='pending'`) เป็น **state**: คืนสถานะปัจจุบันทุกครั้ง idempotent ไม่ขึ้นกับว่า ack ไปหรือยัง · + กรองหน้าต่างเวลา `now() >= starts_at AND (ends_at IS NULL OR now() < ends_at)` · payload เปลี่ยนจาก `jobs[].items[]` เป็น **timeline**: `slots[]` (แต่ละ slot มี `start_offset_seconds`, `duration_seconds`, `publication_id`, `media_asset_id`, `file{}`) + `loop_duration_seconds` ระดับบน (ADR 0004) · + คืน `kind` ต่อ slot · + ใช้ storage_key ของ `file_version_no` ที่ปักไว้ |
| `media_screens_list` / `media_screen_get` | + สถานะ 3 ระดับ (`online < 2 นาที` / `warning 2–5` / `offline > 5`) แทน `is_online` boolean |
| `media_publish` | คงไว้เป็น shortcut — เรียก upsert+activate ข้างใน |
| ทุกตัวที่เขียนข้อมูล | + `p_actor_id uuid` → เติม `created_by` / `published_by` (ADR 0003) |

## กระทบ player contract (ต้องคุยกับคนทำ firmware)

1. **`kind` ต่อ slot** — จอเลือกเองว่า render วิดีโอหรือรูป และรูปค้างตาม `duration_seconds`
2. **payload เปลี่ยนจาก "job เดียว" เป็น "timeline"** — `slots[]` + `loop_duration_seconds` แทน `jobs[].items[]` เดิม และ `ack` เปลี่ยนความหมายจาก "เริ่มเล่น publication นี้" เป็นแค่ observability (จอได้รับ/โหลด/เล่น timeline เวอร์ชันไหนแล้ว) ไม่ใช่กลไก drain คิว — ADR 0004

## ⚠️ Mark ไว้ ยังไม่เคาะ

| เรื่อง | สถานะ |
| --- | --- |
| นิยาม **Warning** (2–5 นาที) | เอาตามที่แนะนำไปก่อน ยังไม่เคาะ |
| **จุดเริ่มรอบ loop ไม่ผูกนาฬิกากลาง** | Phase 1 จอนับเองจากตอนรับ timeline → จอสองเครื่องเล่นไม่ตรงกัน · รับได้ตอนนี้ แต่ถ้าจะขาย slot ตามเวลาจริงหรือให้จอเรียงกันเล่นพร้อมกัน ต้องเพิ่ม anchor เวลาจาก server (ดู `player_contract_timeline.md`) |
| **Filler content** | ยังไม่มีในระบบ — จำเป็นตอนไป Phase 2 (C) เพื่อให้ loop ยาวพอที่จะกระจาย `start_offset_seconds` ตามความถี่ที่ขายจริง (เช่น "ทุก 30 นาที") |
| **Slot allocator จริง** (Phase 2 / C) | ยังไม่ทำ — Phase 1 generate slot ต่อกันรวดตามลำดับ publication ที่ in-window ไม่ได้กระจายตามความถี่ที่ขาย |
| **Publish Order / delay ระหว่าง channel** | ไม่ทำในเวอร์ชันนี้ — วิธีที่คิดไว้คือ `publish_job_targets.available_at` + poll กรอง `available_at <= now()` |
| `version_no` เป็น integer แต่ mockup เขียน `v1.1` | ตกลงว่าไม่แก้ชนิดคอลัมน์ — UI ต้องเลือกวิธี label เอง |
| Estimated Reach | ตกลงเป็นตัวเลขกรอกมือต่อ channel — ยังไม่มีที่มาของตัวเลขจริง |
| นโยบายลบเวอร์ชันเก่า / orphan sweep | ยังไม่มีทั้งคู่ (orphan sweep ค้างมาตั้งแต่ A4) |

## ยังไม่แตะใน Phase 1

Grid / Custom Layout · HTML/Web · Dynamic Data · `schedules.recurrence` แบบเต็ม · role-based permission ใน `media_core` · screenshots และ Device Preview รายเครื่อง · publish ไปช่องทางที่ไม่มีจอ (social / website / email / mobile app) · Format & Template / Text & Caption / CTA / Localization · My Assets / Favorites / Recently Used · AI Assistant และ Asset Recommendations
