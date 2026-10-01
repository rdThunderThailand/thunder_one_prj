# SESSIONLOG — Composition re-model, ticket 01 (Zone identity + precision)

**Date:** 2026-08-26 · **Branch:** `feat/layout` in both `thunder_one_prj` and `Thunder_Core`
**Handoff followed:** `/private/tmp/HANDOFF-composition-execute-2026-08-26.md`
**Nothing committed, nothing pushed.**

Executed ticket 01 of `docs/layouts/plan-composition.md` — the load-bearing first ticket: Layout
Zones keep a stable id across an edit, geometry gains a decimal place, `role` is dropped.

---

## What was built

### Frontend (`thunder_one_prj`)

- `layouts/types/index.ts` — `ZoneRole`/`ZONE_ROLES` removed, `LayoutZone.role` dropped,
  `LayoutListItem.reference_resolution?` added
- `layouts/geometry.ts` — `toTenths` → `toThousandths` (×1000), `roundPercent` divides by 1000,
  `validateZones`'s hardcoded `1000` bound → `100000`, `parseAspectRatio` widens to 1–5 digits per
  side and returns `null` (not a silent `[16, 9]`) on an unparseable value
- `layouts/templates.ts`, `TemplateRail.tsx`, `LayoutEditorPage.tsx` — `role` argument dropped from
  every template Zone and `BLANK_ZONES`
- `LayoutWireframe.tsx`, `LayoutCanvas.tsx` — Zone fill switched from a role→colour map to a
  position-index colour cycle (`ZONE_FILL[index % ZONE_FILL.length]`); `parseAspectRatio` call sites
  updated for the `null` return (`?? [16, 9]` as a render-only fallback, not silent acceptance)
- `ZoneProperties.tsx` — Role `<select>` removed, numeric inputs `step={0.001}`
- `layouts-api.ts` — `ZonePayload` drops `role`, gains optional `id` (round-tripped so the RPC can
  diff instead of delete-and-reinsert); `duplicateLayout` omits `id` on purpose (a duplicate needs
  fresh Zone ids)
- `ContentStep.tsx` (publications, superseded ADR 0048 model, ticket 03 rewrites it) — two `role`
  label references removed, nothing else touched; this was the one file dropping `role` broke
  outside the layouts feature

Verified: `tsc --noEmit` clean repo-wide, `eslint` clean on every changed file,
`geometry.check.mts` and `templates.check.mts` both pass (`node <file>.check.mts`).

### Backend (`Thunder_Core`)

New migration `supabase/migrations/20260826110000_zone_identity_and_precision.sql`:

- `layouts.reference_resolution varchar NULL CHECK (~ '^[0-9]{3,5}x[0-9]{3,5}$')`
- `layout_zones` — `role` dropped, `x/y/width/height` widened `numeric(4,1)` → `numeric(6,3)`,
  `UNIQUE (layout_id, position)` dropped and recreated `DEFERRABLE INITIALLY DEFERRED`
- `publication_snapshot_zones` — `role` dropped, geometry widened `numeric(5,2)` → `numeric(6,3)`
  (this is the type the player actually reads — the one column that caps the feature)
- `media_layout_upsert` — signature gained `p_reference_resolution`, so the old 9-arg signature was
  `DROP FUNCTION`'d first. Rewritten from delete-and-reinsert to a diff: known `id` → `UPDATE`, no
  `id` → `INSERT`, known `id` missing from the payload → `DELETE`. Rounding to 3 decimals now
  happens **before** the overlap/bounds checks (previously the checks ran on raw `p_zones` and
  rounding happened only at the `INSERT`, so a value could pass a check the later rounding then
  invalidated)
- `media_layouts_list`, `media_layout_get` — `role` dropped from the zones payload,
  `reference_resolution` added (same signatures, `CREATE OR REPLACE`)
- `media_publication_activate` — the implicit full-screen snapshot Zone it writes no longer sets
  `role` (same signature, `CREATE OR REPLACE`) — this was the one already-applied function that
  would have broken the moment `publication_snapshot_zones.role` was dropped
- Every touched `SECURITY DEFINER` function: `REVOKE ALL ... FROM PUBLIC, anon, authenticated` then
  `GRANT EXECUTE ... TO service_role`, reasserted explicitly per migration

Companion frontend-of-backend changes in `Thunder_Core/src/app/api/core/v1/media/layouts/`:
`schema.ts` (zoneSchema drops `role`, gains optional `id: z.string().uuid()`;
`aspect_ratio` regex widens to 1–5 digits per side; new `reference_resolution` field),
`schema.check.mts` updated to match, both `route.ts` files pass `p_reference_resolution` through.

## Applied and verified — `develop` (`ftfmokgphewzyxzwjitv`)

Migration applied via MCP `apply_migration`, then:

- `pg_proc` overload count = 1 for all four touched functions
- `has_function_privilege` — `service_role` ✓, `postgres` ✓, `anon` ✗, `authenticated` ✗
- `information_schema.columns` — `role` gone from both tables, `x/y/width/height` are
  `numeric(6,3)`, `layouts.reference_resolution` present
- Scratch probe: created a 3-Zone Layout at 33.333 / 33.333 / 33.334 (`layout_id
  c15eb4ad-3aad-41f9-a7ef-8c48027d83f4`, name `ZZZ_ticket01_probe`) → read Zone ids back → renamed
  one Zone **and** swapped the position of the other two in the same `media_layout_upsert` call
  (proves the deferrable constraint) → re-read: all three ids unchanged, rename applied, positions
  actually swapped, geometry still exactly 3 decimals → sent back only 2 of the 3 zones → the
  omitted one was deleted (delete-by-omission) → scratch Layout deleted, probe cleaned up
- Production-mirror Layout `413d7b1f-b1f5-4c97-b5b0-8616d537570b` confirmed untouched
  (`updated_at` unchanged) throughout
- `get_advisors(type: security)` — no finding against any of the four touched functions (all
  findings are pre-existing, on unrelated tables/functions in this shared multi-domain database)

## Applied and verified — production (`sfiefevtxalqjizdkcsw`)

First attempt was blocked by the Claude Code auto-mode classifier despite the user's explicit
chat approval ("Blocked by classifier") — confirmed nothing partially applied at that point
(`media_layout_upsert` overload count was still 1 with the **old** signature, no
`reference_resolution` column). After the user exited auto mode and asked to retry, the same
`apply_migration` call succeeded.

Post-apply verification, same checks as `develop`:

- `pg_proc` overload count = 1 for all four touched functions
- `role` column gone from `layout_zones` and `publication_snapshot_zones`; `x/y/width/height` are
  `numeric(6,3)` on both; `layouts.reference_resolution` present
- `has_function_privilege` on `media_layout_upsert` — `service_role` ✓, `postgres` ✓, `anon` ✗,
  `authenticated` ✗
- Real production Layout `413d7b1f-b1f5-4c97-b5b0-8616d537570b` (2 zones) unchanged —
  `updated_at` still the pre-migration timestamp, data carried through the column-type ALTERs
  without being touched by anyone
- `get_advisors(type: security)` — no finding against any of the four touched functions

## NOT done — browser verification

Ticket 01's last checkbox ("Verified in the browser: the Layout editor accepts and keeps 33.333")
was explicitly skipped this session at the user's direction, to be picked up later. **Unverified
layer.** Nothing in this session claims browser-level proof.

## Verification summary (CLAUDE.md §3 — layer by layer)

| Layer | Status |
|---|---|
| Frontend `tsc`/`eslint`/`*.check.mts` | ✅ done, all pass |
| Backend `pg_get_functiondef`/overload/grants | ✅ done on develop |
| Backend scratch-tenant SQL probe | ✅ done on develop |
| Backend applied to production | ✅ done, verified (retried after classifier block on first attempt) |
| Browser (Layout editor UI) | ❌ explicitly skipped this session |

## Next

Ticket 01 is fully done except browser verification. Ticket 02 (Composition schema and RPCs) is
next in `plan-composition.md`'s order — no longer blocked, since `layout_zones` on production now
carries the schema ticket 02's `composition_zones.layout_zone_id` FK depends on. Handoff written to
`/private/tmp/HANDOFF-ticket02-composition-schema-2026-08-26.md` for the next session (its
"confirm ticket 01 is on production" precondition is now satisfied — worth a one-line update there
too, or just note it when that session starts).
