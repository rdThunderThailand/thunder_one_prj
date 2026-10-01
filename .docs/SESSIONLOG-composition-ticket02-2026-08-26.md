# SESSIONLOG — Composition re-model, ticket 02 (Composition entity: schema and RPCs)

**Date:** 2026-08-26 · **Branch:** `feat/layout` in both `thunder_one_prj` and `Thunder_Core`
**Handoff followed:** `/private/tmp/HANDOFF-ticket02-composition-schema-2026-08-26.md`
**thunder_one_prj: nothing committed, nothing pushed. Thunder_Core: nothing committed, nothing pushed.**

Executed ticket 02 — the server side of a Composition. No frontend work in this ticket
(`thunder_one_prj` untouched except this log); everything lives in `Thunder_Core`.

---

## What was built (`Thunder_Core`)

New migration `supabase/migrations/20260826120000_composition_schema_and_rpcs.sql`:

- `media_core.compositions` — `id, tenant_id, name, layout_id, status, revision, metadata,
  created_at, updated_at`, `UNIQUE (tenant_id, name)`, `status CHECK (draft|active|inactive)`
- `media_core.composition_zones` — `layout_zone_id NOT NULL ON DELETE RESTRICT`, `playlist_id NOT
  NULL ON DELETE RESTRICT`, `playback jsonb` under the same shape CHECK as
  `publication_snapshot_zones.playback`, `UNIQUE (composition_id, layout_zone_id)`. No `position`
  column — Zone order is `layout_zones.position`, read by join. Two supporting indexes
  (`layout_zone_id`, `playlist_id`) added for the queries this migration itself introduces.
- `media_compositions_list` / `media_composition_get` — new read RPCs (not explicitly named as
  bullets in the ticket, but required by its "Routes" and "read path" requirements).
  `media_composition_get` LEFT JOINs `layout_zones` to `composition_zones` so an unbound Zone still
  appears in the response with `playlist_id: null`.
- `media_composition_upsert` — create/update name, layout, metadata; `revision` optimistic lock;
  changing `layout_id` clears every binding in the same transaction and is refused while `active`.
- `media_composition_set_zones` — replaces the whole binding set in one transaction; rejects a Zone
  outside the Composition's Layout, a Playlist from another tenant, a Zone bound twice, and an
  invalid `playback` value; fills any missing `playback` key with the same defaults
  `media_publication_activate` already uses (`sequential` / `loop` / `first`); does not require
  completeness for `draft`; refuses to leave `active` incomplete, naming the unbound Zones.
- `media_composition_set_status` — `draft → active` requires every Zone bound (checked in the same
  transaction); `active ↔ inactive` free; `active/inactive → draft` refused (mirrors Playlist's own
  rule); no delete.
- `media_layout_upsert` — the Zone-delete step now checks `composition_zones` before deleting and
  raises `'Invalid input: zone is used by composition(s) <names>'` instead of letting the
  `ON DELETE RESTRICT` FK raise a raw, un-prefixed violation the route's error passthrough can't
  match. Same signature as ticket 01's version — `CREATE OR REPLACE`, no `DROP` needed.
- `media_playlist_upsert` — gained `p_kind character varying DEFAULT NULL`, only accepting
  `'inline'` (any other non-null value is rejected). On create, `kind='inline'` forces
  `status='active'` regardless of `p_status`. The UPDATE path widened from `kind = 'user'` to
  `kind IN ('user', 'inline')` so the same function can rename or retire ("inactive") an existing
  inline Playlist. Signature changed → old 8-arg signature `DROP FUNCTION`'d first.
- `media_playlist_delete` — gained a `count(*) FROM composition_zones WHERE playlist_id = ...`
  check, raising `'Invalid input: playlist is used by % composition(s)'`. Same signature,
  `CREATE OR REPLACE`.
- Every touched/new `SECURITY DEFINER` function: `REVOKE ALL ... FROM PUBLIC, anon, authenticated`
  then `GRANT EXECUTE ... TO service_role`.

Companion API layer, `Thunder_Core/src/app/api/core/v1/media/compositions/`:
`route.ts` (`GET|POST`), `[id]/route.ts` (`GET|PUT`), `[id]/zones/route.ts` (`PUT`),
`[id]/status/route.ts` (`PUT`), `schema.ts` (Zod shape validation, mirrors the `layouts`/
`playlists` convention — cross-row rules stay in the RPC), `schema.check.mts`
(`node schema.check.mts` run directly, passes).

## Applied and verified — `develop` (`ftfmokgphewzyxzwjitv`)

First `apply_migration` attempt was blocked by the Claude Code auto-mode classifier (same failure
mode as ticket 01, this time on `develop` rather than production). User exited auto mode; retry
succeeded.

- `pg_proc` overload count = 1 for all 8 touched/new functions
- `pg_proc.proacl` — every function `{postgres=X/postgres,service_role=X/postgres}` only, no
  `anon`/`authenticated`/PUBLIC
- `get_advisors(type: security)` re-run — zero findings mention any composition object
- Scratch-tenant SQL probe (tenant `00000000-0000-0000-0000-000000000000`), exactly the sequence
  the ticket names: created a 2-Zone Layout + 2 Playlists → created a Composition → saved
  half-bound (draft, `bound_count 1/2`) → activate fails (`zone(s) Ticker are unbound`) → bound the
  second Zone → activate succeeds → `media_composition_get` confirms `playback` defaults filled
  and the Ticker's `repeat: once` override preserved → unbind attempt while active fails → creating
  a second Layout and trying to re-point the Composition at it while active fails → deleting the
  bound Zone via `media_layout_upsert` fails, naming `ticket02-probe-composition` → deleting the
  bound Playlist via `media_playlist_delete` fails (`used by 1 composition(s)`) → set `inactive`
  succeeds. Also exercised outside the named sequence: `media_composition_get`'s read shape, and
  `media_playlist_upsert(p_kind='inline')` producing `kind='inline', status='active'`. All scratch
  rows (layouts, zones, playlists, composition) deleted afterward.

## Applied and verified — production (`sfiefevtxalqjizdkcsw`)

Applied after explicit user approval in chat. No classifier block this time.

- `pg_proc` overload count = 1 for all 8 functions
- Grants identical to `develop` — `postgres` + `service_role` only
- Data integrity: `layouts` (1 row), `layout_zones` (2 rows), `playlists` (83 rows) unchanged;
  `compositions` created empty (0 rows) — purely additive, no existing row touched
- `get_advisors(type: security)` re-run — zero findings mention any composition object

## Cleanup — stale migration files

Two never-applied, never-committed migration files implementing the superseded ADR 0048 model
(`publication_zones`, `publications.layout_id`) were deleted at the user's request, confirmed via
`git log` to have no commit history:
`supabase/migrations/20260826090000_publication_zone_bindings.sql`,
`supabase/migrations/20260826100000_activation_materializes_zones.sql`.

`supabase/migrations/20260826093000_media_device_capabilities.sql` was **kept** — it is not part of
the superseded model, it is real, not-yet-reached ticket 07/08 work (device capability reporting +
the publish-time capability gate), staged early. User chose to keep it rather than delete.

`src/app/api/core/v1/media/publications/[id]/zones/route.ts` (also staged, also likely
superseded-model leftover) was **not** touched — out of scope for this session, user did not ask
about it.

## Verification summary (CLAUDE.md §3 — layer by layer)

| Layer | Status |
|---|---|
| Backend `schema.check.mts` (Zod) | ✅ done, passes (`node schema.check.mts`) |
| Backend `tsc` on changed files | ✅ no new errors (one pre-existing repo-wide `.ts`-extension warning shared with `layouts/schema.check.mts`, not introduced here) |
| Backend `pg_get_functiondef`/overload/grants | ✅ done on develop and production |
| Backend scratch-tenant SQL probe | ✅ done on develop, full ticket-specified sequence |
| Backend applied to production | ✅ done, verified |
| HTTP (routes through the deployed API) | ❌ not tested — routes are not yet deployed (`CORE_API_URL` still points at the currently-deployed `Thunder_Core`); this ticket has no frontend caller yet either |
| Browser | N/A — no UI in this ticket |

## Next

Ticket 02 is fully done and verified at the SQL/RPC layer on both `develop` and production. Ticket
03 (Composition list/editor UI in `thunder_one_prj`) is next — it is the first ticket that gives
these RPCs an actual caller, at which point the routes above get their first real HTTP exercise
once deployed.
