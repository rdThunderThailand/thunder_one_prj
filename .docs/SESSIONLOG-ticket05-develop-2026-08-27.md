# SESSIONLOG — ticket 05, developed and verified on develop — 2026-08-27

## Scope

Ticket 05 (`docs/layouts/tickets/05-activation-materializes-zones.md`): give
`media_publication_activate` a composition branch. Before this, a `composition`-type Publication
always had `playlist_id = NULL` (ADR 0049 §12) and always failed at the flat-path check
`'Invalid input: publication has no playlist — add content before activating'`, regardless of
whether a Composition was picked — the exact gap the browser checklist's item D predicted at the end
of ticket 04.

**Not done this session, on purpose: production apply.** User held it explicitly — finish everything
and test more on develop first. Everything below is against develop (`ftfmokgphewzyxzwjitv`) only.

## What changed

`Thunder_Core/supabase/migrations/20260827090000_activation_materializes_zones.sql`:

1. Three nullable drift columns (ADR 0049 §11): `publication_snapshots.composition_revision`,
   `publication_snapshots.layout_updated_at`, `publication_snapshot_zones.playlist_revision`.
2. `media_publication_activate` rewritten — **signature unchanged** (`p_tenant_id, p_publication_id,
   p_actor_id`), so `CREATE OR REPLACE` was safe, no `DROP` needed:
   - `publication_type = 'composition' AND composition_id IS NULL` refused with
     `'Invalid input: publication has no layout — add one before activating'`, before the
     zone-materializing path.
   - Composition branch: locks the Composition, refuses cross-tenant (`not found:`), refuses
     non-`active` status, refuses incomplete binding (names the unbound Zones, same phrasing as
     `media_composition_set_status`). Then one `publication_snapshot_zones` row per
     `composition_zones` row (geometry from `layout_zones`, `source_layout_zone_id` for tracing),
     each Zone's own Playlist expanded into `publication_snapshot_items` under it, `playback` carried
     per Zone, `composition_revision` / `layout_updated_at` / per-Zone `playlist_revision` recorded.
   - Flat branch (no Composition): **byte-identical logic to before** — same single implicit
     full-screen Zone, same values; the three new columns simply stay `NULL`.

## Verification (develop, `ftfmokgphewzyxzwjitv`)

Post-apply, per the ticket's own checklist item:

- `pg_get_functiondef` of the live function, diffed against the migration file — identical.
- `count(*) from pg_proc where proname='media_publication_activate'` → 1 (no second overload).
- `has_function_privilege`: `service_role` → true, `anon`/`authenticated` → false.
- `get_advisors(security)` — no new finding tied to `media_publication_activate` or
  `publication_snapshot*`; the one WARN present (`media_publications_list` executable by
  `anon`/`authenticated`) is the pre-existing, separately-tracked item ticket 04 already documented.

Scratch-tenant SQL probe, against real develop data left over from ticket 04 browser testing
(Composition `af896984-b213-49a0-9218-2a3ae58ee667`, 2 Zones both bound; draft composition
Publication `7b6cb708-bceb-4a0d-b266-a5e10e1f821e`, channel target already set):

- **2-zone composition activate**: succeeded. Snapshot got 2 zones / 6 items (3 per zone, matching
  the bound Playlist's item count). Zone geometry (`x/y/width/height`) matched `layout_zones` exactly,
  `source_layout_zone_id` traced correctly. `composition_revision` (2) and `layout_updated_at`
  recorded matched the live Composition/Layout at query time. `playlist_revision` (10) per Zone
  matched the live Playlist ("Boss test", bound to both Zones in this test data).
- **Flat activate** (`75e080f2-c7e8-4a89-901d-9aefbb9b0aeb`, playlist Publication, 2 items): snapshot
  came out with exactly the pre-migration shape — 1 zone, `x=0 y=0 width=100 height=100`, and all
  three new columns `NULL`.
- **Refusals**, each via a throwaway scratch Composition/Publication pair (inserted, probed, deleted
  after — no scratch rows left in develop):
  - re-activating an already-active Publication → `'Already active: publication is not a draft'`
  - Composition belonging to another tenant → `'not found: composition not found for this tenant'`
  - Composition status `draft` (not `active`) → `'Invalid input: composition is not active — activate
    it before publishing'`
  - Composition missing a binding → `'Invalid input: cannot activate an incomplete composition —
    zone(s) Main, Side are unbound'`
- **Republish**: forced `7b6cb708-...` back to `draft` (direct `UPDATE`, simulating a future
  un-publish path — no such RPC exists yet) and activated again. New `publish_jobs` row
  (`f1eab3e9-...`) pointing at a new snapshot (`bccf0569-...`, 2 zones, fresh copy); the original job
  (`1c7ea3ea-...`) and its original snapshot (`fdcb930f-...`, still 2 zones) were untouched — same
  `id`, same `status`, same `snapshot_id`. Publication kept its own id throughout.

## Not done this session

- **Production apply** — held explicitly by the user (`"ยังไม่เอาลง Prod ทำให้เสร็จทั้งหมดก่อน และเทสบน
  dev ต่อ"`). The migration file is ready
  (`Thunder_Core/supabase/migrations/20260827090000_activation_materializes_zones.sql`); applying it
  to `sfiefevtxalqjizdkcsw` is the next R0 action and needs its own explicit approval.
- No browser/UI verification — ticket 05 is backend-only; screens don't receive the new snapshot
  shape until ticket 10.
- `Thunder_Core` git commit — the new migration file is currently uncommitted in the working tree.

## Auto-mode classifier note

Both `apply_migration` (develop) and one `execute_sql` (the scratch-data `INSERT`s) were blocked by
the auto-mode permission classifier on first attempt. Per the standing lesson from ticket 04's
incident, work stopped and the user was asked before retrying rather than working around it; the user
approved and the retries succeeded immediately.
