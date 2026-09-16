# 01 — Layout Zone identity is stable, geometry gains precision

**Spec:** `docs/layouts/spec-composition-content.md` ·
**Decided by:** `docs/adr/0049-composition-layout-with-content.md` §2, §9 ·
`docs/adr/0050-wide-layouts-across-monitors.md` §1, §2, §4

**What to build:** a Layout Zone keeps its identity when the Layout is edited, and its geometry can be
expressed to three decimal places all the way from the editor to the player. Nothing references a Zone
yet — this ticket makes it *safe* to reference one, and it is the prerequisite for every other ticket
in this series. `role` is dropped in the same migration because it touches the same two tables.

**Blocked by:** None — start here.

**Status:** backend shipped — migration applied to **production** as
`20260826085445 zone_identity_and_precision` (`20260826083007` on `develop`; the timestamps differ
because `apply_migration` mints its own, as the plan's known-unknowns record). Verified at the SQL
layer only.

**Two things are still open, checked 2026-08-26:** the migration file
`supabase/migrations/20260826110000_zone_identity_and_precision.sql` is **untracked in `Thunder_Core`
git** — production is running schema that no commit records — and the frontend `geometry.ts`
precision changes are uncommitted in `feat/layout`. Nothing here was verified through HTTP or the
browser.

**Everything below is one migration set. Rehearse on `develop` (`ftfmokgphewzyxzwjitv`) before
production (`sfiefevtxalqjizdkcsw`); every apply to production is R0 and needs approval, including the
additive parts.**

- [ ] `media_layout_upsert` is a diff, not a delete-and-reinsert: a Zone with a known `id` is updated
      in place, one with no `id` is inserted, and a known `id` absent from the payload is deleted
- [ ] The editor round-trips each Zone's `id` and sends it back, so an edit that only renames a Zone
      leaves every `layout_zones.id` unchanged — verified by reading the ids before and after
- [ ] `UNIQUE (layout_id, position)` is dropped and recreated `DEFERRABLE INITIALLY DEFERRED`; swapping
      two Zones' positions in one call succeeds
- [ ] `layout_zones.role` and `publication_snapshot_zones.role` are dropped, along with the enum in the
      frontend and `templates.ts`'s third `zone(...)` argument (99 snapshot rows are rewritten — R0)
- [ ] `layout_zones` **and** `publication_snapshot_zones` geometry columns are both `numeric(6,3)` —
      they are different types today, and the snapshot one is what the player reads
- [ ] `media_layout_upsert`'s four `ROUND(…, 1)` become `ROUND(…, 3)`, **and the rounding moves ahead
      of the overlap and bounds checks** — today they read `p_zones` raw, so `33.3335` passes a check
      that the later rounding invalidates
- [ ] The overlap check runs against the post-diff Zone set, not the payload alone
- [ ] `layouts` gains `reference_resolution varchar NULL CHECK (~ '^[0-9]{3,5}x[0-9]{3,5}$')`;
      `media_layout_upsert` accepts and returns it; existing rows stay NULL and behave as before
- [ ] `geometry.ts`: `toTenths` → `toThousandths` (`Math.round(value * 1000)`), `roundPercent` divides
      by 1000, the hardcoded `1000` bound in `validateZones` becomes `100000`. `rectsOverlap` and the
      bounds test both go through it — leaving it makes 33.333 and 33.334 compare equal
- [ ] `parseAspectRatio`'s `/^(\d{1,2}):(\d{1,2})$/` widens; an unparseable value is a validation error,
      not a silent `[16, 9]`
- [ ] `ZoneProperties.tsx`'s `step={0.1}` and its `roundPercent` call move to three decimals
- [ ] `geometry.check.mts` is updated — it asserts `roundPercent(33.34) === 33.3` today and **will
      break loudly**, which is correct — and gains the `parseAspectRatio` error cases
- [ ] `contract-v2-zones.md` and `CONTEXT.md` already state three decimals and no `role`; confirm the
      code now matches them rather than the other way round
- [ ] Post-apply verification: `pg_get_functiondef` diffed against the migration file, exactly one
      overload of each touched function, grants are `service_role` + `postgres` only (no `anon`,
      `authenticated` or `PUBLIC`) confirmed with `has_function_privilege` — `CREATE FUNCTION` grants
      `EXECUTE` to `PUBLIC`, so `REVOKE` explicitly — advisors show no new finding
- [ ] Scratch-tenant SQL probe: create a 3-Zone Layout at 33.333/33.333/33.334, rename one Zone, read
      the ids back unchanged, reorder two Zones, and confirm the stored values are three decimals.
      Production Layout `413d7b1f-b1f5-4c97-b5b0-8616d537570b` untouched
- [ ] Verified in the browser: the Layout editor accepts and keeps 33.333
