# 14 — `layouts.kind` and the Template/private-geometry split

**Decided by:** `docs/adr/0052-merged-layout-authoring.md` §4, §3, §8

**What to build:** a Layout (contract: `compositions`) can own private geometry instead of pointing at
a named Template. `layouts` gains `kind`, and three additive RPCs join it: one flips the kind, one
forks shared geometry into a private copy, one duplicates a Composition. The list endpoint learns to
filter on `kind`. This is **the whole backend half** of the
merged authoring flow — ticket 15 stays UI-only because everything it needs lands here.

**Blocked by:** none — additive, independent of 04 and 05

**Status:** shipped and fully verified · 2026-08-28. Migrations applied and contract/rollback-probe
verified on `develop` (2026-08-27). **Production apply was found already done** on this pass —
`20260828074601_layout_kind_template_split` was already live on `sfiefevtxalqjizdkcsw` before this
session (applied by a prior, undocumented session or directly by the user); this pass is the first
to actually verify it. Post-apply checks on production: `media_layout_upsert` still exactly one
overload with its original signature; all three new functions (`media_layout_set_kind`,
`media_composition_fork_layout`, `media_composition_duplicate`) present, `service_role`-only
(confirmed `anon`/`authenticated` denied); bodies diff clean against develop and the migration file
modulo whitespace only (verified by normalizing both to collapse whitespace before compare — no
logic drift); security advisors show 169 pre-existing findings, none naming any ticket-14 function.

**Scratch-tenant SQL probes — all 20 cases passed** on `develop` (two real tenants, `Thunder
Enterprise Master` and `AIS`): default kind, refuse-flip-when-used (2 compositions), unused-flip
succeeds and renames, cross-tenant `set_kind` refused, invalid kind refused, fork preserves the
untouched sibling composition and zone count, fork of an `active` composition succeeds and stays
`active`, cross-tenant fork refused, stale `expected_revision` refused, second composition on an
already-used inline layout refused, flip-still-used-template refused, duplicate-of-template shares
`layout_id`, duplicate-of-inline forks a new `layout_id` with the source untouched, cross-tenant
duplicate refused, name-collision duplicate raises `Already exists:`. All test rows deleted
afterward — no data left on `develop`.

**Authenticated UI verification** — real Chrome, logged in, `/media-workspace/layouts` (which
mounts `CompositionsListPage`, confirmed by reading `layouts/page.tsx`). Clicked "Duplicate" on a
composition pointing at a shared template Layout: `POST .../compositions/{id}/duplicate` returned
`201`, the list gained a `(Copy)` row, and its `layout_id` matched the source's — exactly the
template-sharing behaviour ADR 0052 §8 specifies. Test row deleted afterward.

**The migration is additive and changes no function signature — R1, not R0.** Keep it that way: if a
change here starts requiring `DROP FUNCTION`, stop and re-read ADR 0052 §4 before continuing.

- [x] `media_core.layouts` gains
      `kind varchar NOT NULL DEFAULT 'template' CHECK (kind IN ('inline','template'))`.
      The default is what makes every existing row and every existing call site correct with no edit
- [x] `COMMENT ON COLUMN` explains the pair, pointing at `playlists.kind` as the same pattern for
      content (ADR 0049 §3, §13)
- [x] New RPC `media_layout_set_kind(p_tenant_id uuid, p_layout_id uuid, p_kind varchar)` —
      validates `p_kind`, enforces tenant ownership inside the function, raises
      `Invalid input:` / `not found:` prefixed errors only
- [x] `media_layout_set_kind` **renames** the row to `comp:<p_layout_id>` when flipping to `'inline'`,
      in the same transaction — the name cannot be set at creation because `media_layout_upsert` needs
      it before the id exists (ADR 0052 §4)
- [x] `media_layout_set_kind` **refuses `template → inline` when the Layout is used by any
      Composition**, with the row locked `FOR UPDATE` before the count so a Composition cannot be
      created against it in the gap. `inline → template` is always allowed (ADR 0052 §4)
- [x] `REVOKE ALL ... FROM PUBLIC, anon, authenticated` then `GRANT EXECUTE ... TO service_role` on the
      new function, verified with `has_function_privilege` after apply — `CREATE FUNCTION` grants
      `EXECUTE` to `PUBLIC` by default
- [x] **`media_layout_upsert` is not touched.** Its ten-argument signature stays exactly as ticket 01
      left it
- [x] New RPC `media_composition_fork_layout(p_tenant_id uuid, p_composition_id uuid,
      p_expected_revision integer)` (ADR 0052 §8). One transaction: copy the Composition's `layouts`
      row with `kind = 'inline'` named `comp:<new_layout_uuid>`, copy its `layout_zones`, repoint this
      Composition's `composition_zones.layout_zone_id` at the copies **by `position`**, set
      `layout_id`, bump `revision`. Returns `layout_id` and `revision`
- [x] **Fork is allowed while the Composition is `active`** — it is the one exception to ADR 0049 §10,
      because it changes no geometry and drops no binding. Same REVOKE/GRANT treatment as above
- [x] `media_composition_upsert` gains one guard: a Composition may not be pointed at a `layouts` row
      with `kind = 'inline'` that another Composition already uses (ADR 0052 §8). **Body-only change —
      `CREATE OR REPLACE` on the identical 7-argument signature, no `DROP FUNCTION`.** Verify
      afterwards that it still has exactly one overload
- [x] That guard takes the **same `SELECT ... FOR UPDATE` on the `layouts` row** that
      `media_layout_set_kind` takes, before it reads `kind` and counts usage — otherwise the two write
      paths lock in opposite orders and an upsert can insert on a `kind` it read before a concurrent
      flip. It already does `PERFORM 1 FROM media_core.layouts` for the tenant check
      (`20260826120000_composition_schema_and_rpcs.sql:212`); that read becomes the lock
- [x] New RPC `media_composition_duplicate(p_tenant_id uuid, p_source_composition_id uuid,
      p_name varchar, p_created_by uuid)` (ADR 0052 §8). Source Layout `template` → the copy points at
      the same Template; `inline` → the copy gets a fork of that geometry. **`composition_zones` are
      copied either way.** One transaction, same REVOKE/GRANT treatment
- [x] Frontend `duplicateComposition` becomes one call to that RPC, replacing today's read + upsert.
      Delete the "bindings are not copied" note at
      [compositions-api.ts:56](../../../src/features/media-workspace/compositions/services/compositions-api.ts:56)
      — ADR 0052 §8 supersedes it. This is the only frontend change in this ticket
- [x] `media_layouts_list` (or its route) accepts a `kind` filter and **defaults to
      `kind = 'template'`**, so the existing Templates list and the Template rail keep showing only
      named Templates once implicit rows start appearing
- [x] The Layout detail payload returns `kind`
- [x] A usage count is exposed for ADR 0052 §3's interruption:
      `SELECT count(*) FROM media_core.compositions WHERE layout_id = $1`. Put it on the Layout detail
      payload rather than adding an endpoint
- [x] `Thunder_Core` route + zod schema for `PATCH .../layouts/[id]/kind`, and the `kind` filter on the
      list route
- [x] Frontend `layouts-api.ts` gains `setLayoutKind` and passes the `kind` filter; the `LayoutListItem`
      / detail types gain `kind` and the usage count
- [x] Post-apply verification: column present with the right default and CHECK; **`media_layout_upsert`
      still has exactly one overload and its old signature is unchanged**; `pg_get_functiondef` of the
      new function diffed against the migration file; grants confirmed; advisors show no new finding
- [x] Scratch-tenant SQL probe: existing rows read back `kind = 'template'`; flip one to `'inline'` and
      confirm it drops out of the default list; a cross-tenant `media_layout_set_kind` is refused; an
      invalid `p_kind` is refused
- [x] Scratch-tenant SQL probe for the fork: two Compositions on one Template, fork one, confirm the
      other still points at the Template and its bindings are untouched, the forked one has the same
      Zone count and the **same bindings by `position`**, and its new Layout is `kind = 'inline'`;
      fork an `active` Composition and confirm it succeeds and stays complete; a cross-tenant fork is
      refused; a stale `p_expected_revision` is refused; pointing a second Composition at an `inline`
      Layout is refused; **flipping a Template used by one or more Compositions to `'inline'` is
      refused**, and flipping an unused one succeeds and renames it
- [x] Scratch-tenant SQL probe for duplicate: duplicating a Composition on a shared Template yields a
      second Composition on the **same** `layout_id` with the same bindings; duplicating one on inline
      geometry yields a **different** `layout_id` whose Zones carry the same bindings by `position`,
      and the source is untouched; a cross-tenant duplicate is refused; a duplicate name collision
      raises `Already exists:`
- [x] Rehearse on `develop` first, then stop and ask before production, naming the real rows affected
