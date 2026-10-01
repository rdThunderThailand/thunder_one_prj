# SESSIONLOG — ticket 05 production apply — 2026-08-27

## Scope

Apply `Thunder_Core/supabase/migrations/20260827090000_activation_materializes_zones.sql` to
production (`sfiefevtxalqjizdkcsw`), after the develop rehearsal in
`SESSIONLOG-ticket05-develop-2026-08-27.md` passed every checklist item including the republish case
added on request. User approved the prod apply explicitly this session.

## What was applied

Same content as committed to `Thunder_Core@c3384e6`, unmodified:

1. Three nullable columns: `publication_snapshots.composition_revision`,
   `publication_snapshots.layout_updated_at`, `publication_snapshot_zones.playlist_revision`.
2. `media_publication_activate` — `CREATE OR REPLACE`, signature unchanged (3 args), composition
   branch added, flat branch untouched. See the develop SESSIONLOG for the full behavior description.

## Post-apply verification (production, `sfiefevtxalqjizdkcsw`)

- `pg_get_functiondef` of the live function — identical to the migration file.
- `count(*) from pg_proc where proname='media_publication_activate'` → 1 (no second overload).
- `has_function_privilege`: `service_role` → true, `anon`/`authenticated` → false.
- `media_core.publications` row count unchanged; `publication_snapshots.composition_revision` is
  `NULL` on every row (0 populated) — expected, since production has 2 Compositions but no
  composition-type Publication has ever been activated yet (ticket 04's SESSIONLOG). Confirms the
  schema addition is a true no-op on existing data.

No new scratch-tenant probe was run against production itself — the same logic was already proven
against real develop data (2-zone activate, flat activate, all four refusal paths, republish) in the
develop session. `get_advisors` was not re-run against production this session; it was clean on
develop for this change.

## Git

`Thunder_Core` — committed this session (`c3384e6`, branch `feat/layout`), **not pushed** (not asked).
`thunder_one_prj` — nothing to commit for ticket 05; it is backend-only work (screens don't receive
the new snapshot shape until ticket 10). `src/proxy.ts` remains modified in the working tree,
unrelated to this ticket (a login-loop fix belonging to someone else — flagged, not touched).

## Ticket 05 — closed

All 9 checklist items in `docs/layouts/tickets/05-activation-materializes-zones.md` verified, on
develop then reproduced live on production via the identical migration. Next: ticket 06 (drift
indicator), blocked-by 05 which is now done.
