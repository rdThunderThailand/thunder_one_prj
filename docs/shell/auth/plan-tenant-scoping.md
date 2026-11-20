# Plan — tenant scoping from login (ADR 0007)

Decision and rationale live in `docs/adr/0007-tenant-scoping-from-login.md`. This file tracks what
is left to do. Read the ADR first; do not re-argue the design here.

## ข้อเท็จจริงที่ยืนยันแล้ว — อย่า re-derive

Every line below was read off prod on 2026-08-06. Re-querying is fine; re-deciding is not.

- Tenant is resolved from the app key in `requireMediaApp()`
  (`Thunder_Core/src/lib/core/media.ts:11-27`), which reads `applications.tenant_id` and passes
  `p_tenant_id` into every media RPC. The user's identity is not consulted anywhere.
- Media tables live in schema **`media_core`**, not `public`.
- Eleven `media_core` tables carry `tenant_id`; four join tables do not and inherit through
  their parent: `publication_targets`, `publication_tags`, `channel_devices`, `publish_job_targets`.
- **`channel_devices.device_id` points into `public.assets`, not `public.devices`.** These are two
  separate, unrelated tables. `public.devices` (1 row) is a red herring for this feature — the
  Channels wizard step calls `GET /media/screens` → `media_screens_list()` → `public.assets` joined
  to `public.device_credentials`, filtered by `tenant_id`. `public.assets` is a 499+ row
  platform-wide CMMS table shared by every product, not media-specific. See
  `[[verify-rpc-source-table-before-tenant-migration]]` — this was discovered *after* Phase 0 broke
  screen selection in prod, by tracing the actual RPC instead of assuming `public.devices` was
  complete.
- App `Thunder One` = `11110000-0000-4000-8000-000000000002`, bound to tenant
  `ThunderOne` = `11110000-0000-4000-8000-000000000001`.
- Destination tenant `Thunder Enterprise Master` = `22222222-2222-2222-2222-222222222222`.
- **Zero** users hold a `memberships` row for `ThunderOne`. All 20 memberships are in
  `Thunder Enterprise Master` (14) and `Executive Demo Tenant` (6).
- `users.default_tenant_id` is `NULL` for every user sampled — unusable as a resolution source.
- The single row in `public.devices` belongs to `Thunder Enterprise Master`, while the
  `media_core.channels` row targeting it belongs to `ThunderOne`.
- `public.tenant_applications` is a working many-to-many app↔tenant map (`CityZen` has two rows).
  `Thunder One` has **no** row in it.
- `Thunder Enterprise Master` currently holds **0 rows in all eleven** `media_core` tenant tables,
  so the migration cannot collide with existing data.
- The BFF already forwards `x-api-key` + `Authorization: Bearer <to_at>`, and
  `getOptionalActorId()` (`media.ts:57-90`) already verifies the token server-side. No new plumbing
  is needed to identify the caller.
- **Deploy trap:** `Thunder_Core`'s default branch is `develop`, and `thundercore.vercel.app` serves
  `develop`. Pushing `feat/thunderOne` does not deploy. Check with `git branch -r --contains <sha>`.
- **`tsc` trap:** `Thunder_Core` has ~127 pre-existing `tsc` errors. Never gate on a repo-wide `tsc`
  there — only on the files changed.

## Phase 0 — data consolidation (applied 2026-08-06)

**Status: applied, in two migrations.** Migration `075` moved the eleven `media_core` tables plus
`applications.tenant_id`/`tenant_applications` as planned below. It broke screen selection in the
publish wizard (see the `channel_devices` → `public.assets` fact above) because the two real screens
(`ThunderOne Screen 01/02`, `public.assets` ids `...0011`/`...0012`) were not part of the planned
change set — they were only discovered after the break, by tracing the actual RPC. Migration `076`
(`consolidate_thunderone_screen_assets.sql`) moved those two rows to close the gap. Verified no other
`asset_*`/`file_links` rows reference those two ids, so the blast radius stayed at 2 rows. Browser
re-verified 2026-08-06: Channels step shows both real screens, publications list (30) and media
assets (8) unchanged. **Phase 0 done.**

Re-point every `media_core` row from `ThunderOne` to `Thunder Enterprise Master`, and register the
application against the destination tenant.

Exact change set (row counts verified 2026-08-06):

| table (`media_core`) | rows moved | rows already in destination |
|---|---:|---:|
| `playback_logs` | 413 | 0 |
| `playlist_items` | 30 | 0 |
| `publications` | 30 | 0 |
| `publish_jobs` | 26 | 0 |
| `playlists` | 25 | 0 |
| `schedules` | 25 | 0 |
| `media_assets` | 8 | 0 |
| `tags` | 5 | 0 |
| `brands` | 1 | 0 |
| `campaigns` | 1 | 0 |
| `channels` | 1 | 0 |
| **total** | **565** | **0** |

Plus, in `public`:
- insert one `tenant_applications` row: (`Thunder Enterprise Master`, `Thunder One`).
- **re-point `applications.tenant_id` for `Thunder One` to the destination tenant, in the same
  transaction.** Resolved: `media/player/jobs` authenticates with `requireDeviceToken` and calls
  `media_job_poll(p_device_token)`, so the player path never reads `applications.tenant_id` and is
  unaffected. The reason to move it is sequencing — until Phase 1 ships, `requireMediaApp` is still
  what the user-facing routes use, so leaving it on `ThunderOne` would point the app at a tenant
  with zero rows and empty the UI between the two phases. Moving it makes Phase 0 a no-op on screen
  and Phase 1 a hardening step rather than a repair.

Steps:
1. Take a backup / snapshot before touching anything. Do not skip; this is not reversible by re-run.
2. Apply as a single migration via Supabase MCP `apply_migration` — one transaction, all eleven
   tables, so a partial move is impossible.
3. Keep the migration file in `Thunder_Core` identical to what was applied, then dump the schema and
   diff it against the file.
4. Re-run the row-count query afterwards: `ThunderOne` must be 0 everywhere, destination must match
   the table above.

## Phase 1 — tenant resolution in Thunder_Core

Add a resolver alongside `requireMediaApp` rather than replacing it; the two have different callers.

- New helper (working name `requireMediaTenant`) that: verifies the Bearer token → user id; reads
  the app's permitted tenants from `tenant_applications`; reads the user's `memberships`;
  intersects. One match → use it. Several → `users.default_tenant_id` if it is in the set, else an
  explicit error. None → `Permission denied`.
- Switch the **user-facing** media routes to it: `publications` (+ `[id]`, `content`, `schedule`,
  `activate`, `cancel`, `conflicts`, `airtime-explain`), `videos` (+ `[id]`, `upload-url`,
  `preview-urls`, `approve`), `playlists`, `screens`, `channels`, `campaigns`, `tags`, `publish`,
  `publish-single`.
- **Leave `media/player/*` on `requireMediaApp`** — device token, no user, per ADR 0007 §3.
- `tenant_id` must never be read from a request header or body. If a route needs it, it comes from
  the resolver.

## Phase 2 — verify and deploy

1. Browser verification per ADR 0007 "Verification required" — all three items, including the
   device still receiving publish jobs.
2. Merge `feat/thunderOne` → `develop` (this is what actually deploys). Ask before merging; it also
   carries the two unshipped commits `97ed5ea` (`expected_revision`) and `2c79675` (real actor).

## Not in scope

- Tenant switcher UI — cannot occur until the app serves more than one tenant (ADR 0007 §2).
- Permission gates / role vocabulary — still open from ADR 0006.
- `getUserRole`'s `ROLE_PRIORITY` gap — adjacent but untouched; the resolver reads `memberships`
  directly and does not call it.
