# SESSIONLOG — tickets 07 + 09 production apply (2026-08-27)

Continuation of `/private/tmp/HANDOFF-layouts-continuation2-2026-08-27.md`.
User chose "apply prod first (07 + 09)" over commit/PR. Both R0s approved in chat.

## What was applied to production (`sfiefevtxalqjizdkcsw`)

Pre-apply read-only checks confirmed both migrations were clean diffs on the live schema:
- `media_heartbeat`, `media_publication_activate`, `media_schedule_conflicts` bodies on production
  were byte-identical to the base each migration's `CREATE OR REPLACE` builds on.
- `media_device_profile_set` was the 2-arg overload only, with a stray `PUBLIC` EXECUTE grant
  (`=X/postgres`).
- `player_capabilities` column absent; 0 composition Publications.

### 1. `media_device_capabilities` (ticket 07, file `20260826093000_...`)
- migration header comments corrected first: "ticket 05" → "ticket 08" (2 spots) — the enforcement
  ticket is 08 per ADR 0054. File now differs from what develop got (comment-only).
- `ALTER TABLE public.assets ADD COLUMN player_capabilities jsonb NULL`
- `DROP FUNCTION media_device_profile_set(text, jsonb)` → `CREATE (text, jsonb, jsonb)` +
  `REVOKE ... FROM PUBLIC, anon, authenticated` + `GRANT ... service_role`
- `CREATE OR REPLACE media_heartbeat(text, jsonb)` — one-line widen:
  `profile_required := ... OR player_capabilities IS NULL`

### 2. `equal_priority_overlap_block` (ticket 09, file `20260827150000_...`)
- `CREATE OR REPLACE media_schedule_conflicts` (8-arg) — adds `blocks` field per conflict
- `CREATE OR REPLACE media_publication_activate` (uuid,uuid,uuid) — adds equal-priority overlap
  guard before snapshot creation; refuses activation when a blocking overlap exists

Both applied via Supabase MCP `apply_migration` (CLI is broken — history drift). Auto-mode did NOT
block the writes this time.

## Post-apply verification (production, read-only)
- `player_capabilities` column present
- `media_device_profile_set`: single 3-arg overload; ACL = `postgres`, `service_role` only
  (the `PUBLIC` grant is gone)
- `media_heartbeat`: single overload, ACL `postgres`/`service_role`, `player_capabilities IS NULL`
  clause present
- `media_schedule_conflicts`: single overload, `'blocks'` key in definition
- `media_publication_activate`: single overload, "equal-priority overlap with" guard in definition
- blocking path is inert on production until a composition Publication is published (0 exist)

## Docs touched
- `docs/layouts/tickets/07-device-reports-capabilities.md` — Status + checklist → prod done
- `docs/layouts/tickets/09-equal-priority-overlap-blocks.md` — Status + post-apply checklist item
- `Thunder_Core/supabase/migrations/20260826093000_media_device_capabilities.sql` — comment fix

## Not done / next
- **Nothing committed or pushed** — thunder_one_prj frontend (ticket 09) + doc changes + both
  SESSIONLOGs are still uncommitted; Thunder_Core migration 09 uncommitted, migration 07 comment-fix
  uncommitted. `src/proxy.ts` must stay unstaged (someone else's login-loop fix).
- ticket 16 (Layout ↔ target geometry fit) is now unblocked — prod schema prerequisite satisfied.
- ticket 17 readiness threshold still needs a number at grooming.
