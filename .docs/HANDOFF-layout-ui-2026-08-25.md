# Handoff — Layout UI (ADR 0044), Tasks 1–5 done, Tasks 6–8 remain

**Date:** 2026-08-25. **Put here, not in a scratchpad, on purpose** — the previous ADR 0045
handoff lived in a session scratchpad and the session after it had to note the file "may no
longer exist on disk". `.docs/` is gitignored but persistent.

## Read these first, in this order

1. **`docs/layouts/plan-layout-execution.md`** — the executable plan. Checkboxes reflect real
   state: Tasks 1–5 are ticked, Tasks 6–8 are not. It carries the full task breakdown, the
   global constraints, and real code for everything already written. **Do not re-derive the
   design from the ADR; the plan already did that.**
2. `docs/adr/0044-multi-zone-layout.md` — why the decisions are what they are. Consult when
   the plan says "because ADR 0044 §N".
3. `docs/layouts/plan-layout-ui.md` — the three FigJam mockups measured against the ADR. This
   is what tells you which drawn control is deliberately absent. All its open questions were
   closed 2026-08-25.
4. `docs/layouts/contract-v2-zones.md` — the wire shape. Not built in this plan, but it is
   why geometry is percent-with-one-decimal and why `role` is a four-value enum.

## What exists now (verified, do not rewrite)

**Thunder_Core** — all new files, nothing committed:

- `supabase/migrations/20260825094420_layouts.sql` — `media_core.layouts` +
  `media_core.layout_zones`, RLS read policies, and four RPCs (`media_layouts_list`,
  `media_layout_get`, `media_layout_upsert`, `media_layout_set_status`) each with its own
  `REVOKE`/`GRANT` pair. **APPLIED to production 2026-08-25** (recorded as
  `20260825095404`) — see "Migration is applied" below.
- `src/app/api/core/v1/media/layouts/schema.ts` + `schema.check.mts` — zod shapes.
  Check passes: `node src/app/api/core/v1/media/layouts/schema.check.mts` → `layouts schema.check.mts OK`.
- `src/app/api/core/v1/media/layouts/route.ts` — `GET` list, `POST` create.
- `src/app/api/core/v1/media/layouts/[id]/route.ts` — `GET` one, `PATCH` (full save *or*
  status-only archive/restore, branched on whether the body has a `zones` key).

**thunder_one_prj** — all new files, nothing committed:

- `src/features/communication/layouts/types/index.ts`
- `src/features/communication/layouts/geometry.ts` + `.check.mts` — `validateZones`,
  `rectsOverlap`, `clampRect`, `roundPercent`, `parseAspectRatio`. Check passes.
- `src/features/communication/layouts/templates.ts` + `.check.mts` — the seven ADR §7
  templates plus `BLANK_ZONES`. Check passes.
- `src/features/communication/layouts/components/LayoutWireframe.tsx` — the inline-SVG
  wireframe used by the list, the template rail, and later the wizard canvas.

Run all three frontend checks with `node <path>`; each prints `all assertions passed`.

## Decisions made during execution that the plan did not pre-specify

These are already in the code. Do not re-litigate them, but know they exist:

- **Geometry is compared in tenths, not floats.** `toTenths()` turns every percentage into an
  integer before any comparison, so a 33.3 / 33.3 / 33.4 three-way split lands on exactly 100
  instead of a float a hair over it that would fail the bounds check. There is an assertion
  covering exactly this.
- **`clampRect` guarantees a valid rectangle.** The editor clamps during a drag and blocks
  only the save. A check asserts that anything `clampRect` returns passes `validateZones`.
- **The wireframe uses `preserveAspectRatio="none"` plus a CSS `aspect-ratio`,** so the Zone
  percentages are the SVG coordinates directly and there is no ratio arithmetic to get wrong.
- **`PATCH /media/layouts/{id}` carries both save and archive.** A body without `zones` can
  only be a status change, because the upsert schema requires at least one Zone. There is no
  `DELETE` — the lifecycle has no hard delete.
- **`media_layout_upsert` takes an unused `p_idempotency_key`.** It exists so dedupe can be
  added later without changing the argument list, which would create an overload rather than
  replace (the `CREATE OR REPLACE` trap in `CLAUDE.md` §6).
- **3-Column is 34/33/33, not three equal thirds** — equal thirds leave a visible sliver of
  background at one decimal place.

## What is left

**Task 2 Step 5 — the only unfinished part of an otherwise-done task.** The four
Thunder_Core doc/spec files were never updated for the new endpoints:
`docs/media/media-core-schema.dbml`, `docs/media/media-core-mapping.md`,
`docs/api/api-overview.md`, `public/swagger-core-v1.json` (re-run `jq empty` on the swagger
after editing). Small, do it first.

**Task 6 — Screen 1, the Layouts list.** `list-filtering.ts`, `list-url-state.ts`,
`status-display.ts` (each with a check), `services/layouts-api.ts`, three components, the
route file, and one nav entry. The plan names the exact playlists files to mirror for each.

**Task 7 — Screen 2, the Layout editor.** Template rail, drag-resize canvas, zone properties,
settings step, two route files.

**Task 8 — verification and docs.** Includes the browser checklist. **Ask before browser
testing** (`CLAUDE.md` §3) — that question is asked at every verify point, not once a session.

## Migration is applied — the backend is live and verified

The user approved the R0 on 2026-08-25 and the migration was applied to production
(`sfiefevtxalqjizdkcsw`) via the Supabase MCP `apply_migration` tool — not the Supabase CLI,
which is broken in this repo (`thunder-core-migration-cli-drift` memory). It is recorded as
migration `20260825095404`; `media_core` went from 20 to 22 tables.

Verified after apply:

- Four functions, **exactly one identity each** (no overload ambiguity), all
  `SECURITY DEFINER`, all with ACL `postgres | service_role` only — no `PUBLIC`, `anon` or
  `authenticated`. The `REVOKE` pairs did their job; note that
  `anon_security_definer_function_executable` is a live advisor category with 33 existing
  hits, and none of them is a `media_layout*` function.
- Both tables: RLS enabled, one read policy each, nine columns each, table comment present.
- Six validation paths exercised against the live RPC — zero zones, five zones, overlap,
  three-digit hex, `media_layout_get` on a missing id — all rejected with the right message,
  and **zero rows written**.
- **The 50/50 touching-edge case is not read as an overlap.** It got past validation to a
  foreign-key error on a fake tenant, which proves it reached the INSERT. This is the single
  most important geometry behaviour and it is correct.
- Happy path exercised end to end inside a `DO` block that ends in `RAISE EXCEPTION`, so the
  block unwinds itself: upsert, get, list, `set_status`, wholesale zone replacement,
  cross-tenant isolation, and the `ON DELETE CASCADE` from layout to zones — all correct,
  nothing committed, no `DELETE` needed (which would have been its own R0).
- `get_advisors(security)`: 22 ERROR / 102 WARN / 57 INFO, and the string `layout` appears
  **zero times** across all of them. `playlists` appears 8 times in the same output, which is
  the control that makes the zero meaningful.

**Both tables are empty (`layouts: 0`, `zones: 0`).** Screens 1 and 2 can now be built and
verified against real data.

## Repo state

Both repos are on branch `feat/layout`, both pushed to `origin` with upstream tracking set.
Everything listed under "What exists now" is **uncommitted and untracked**. The last commits
are `449496b` (thunder_one_prj) and `babe2e9` (Thunder_Core), both from the ADR 0045 work
that closed earlier the same day.

`tsc` note: the new `schema.check.mts` produces one `TS5097`, which is the same error every
other `.check.mts` in Thunder_Core produces (`channels`, `player/jobs/[id]/publication`,
`player/playback` all have it). It is the repo's own convention for files run directly by
node, not a new class of error. thunder_one_prj type-checks clean on all new files.
