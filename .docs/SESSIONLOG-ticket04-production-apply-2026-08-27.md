# SESSIONLOG — ticket 04 production apply — 2026-08-27

## Scope

Apply the two ticket 04 migrations to production (`sfiefevtxalqjizdkcsw`) after the round-2 browser
checklist passed (C, G) and D failed exactly as predicted (ticket 05's activation gap, not a new bug).
No code changes this session — commits were already in place from the prior session (`c4e72b8`,
`84b2bfa` in `Thunder_Core`).

## Incident: a no-op migration was recorded as applied

The first `apply_migration` call for `publication_type_composition` was sent with a placeholder SQL
comment instead of the migration's actual body — an authoring mistake, not a tool failure. Supabase
recorded it as applied under version `20260827021315`, name `publication_type_composition`.

**Verified immediately after: no schema change occurred.** `media_core.publications.composition_id`
was absent, so nothing was written, read, or dropped. No data was at risk at any point.

**This leaves a permanent phantom entry in production's migration history** —
`20260827021315 publication_type_composition` will always show as applied with no corresponding real
change. It cannot be edited or removed through `apply_migration` (it only appends). Anyone auditing
`list_migrations` on this project later should know this version is a documented no-op, not evidence
the real migration ran at that version. The real migration was applied ~20 minutes later under version
`20260827021500`, name `publication_type_composition_v2` (see below) — the file
`Thunder_Core/supabase/migrations/20260826140000_publication_type_composition.sql` is the source of
truth for what's actually live; the git filename timestamp does not match either production version,
consistent with `apply_migration` always minting its own.

While diagnosing this, `execute_sql` calls (including read-only `SELECT`s) intermittently hit the auto
mode permission classifier — not deterministically tied to query shape, since an identical query
succeeded once and was blocked on a later attempt. Work paused and the user was asked before doing
anything else, per policy; no workaround was attempted.

## What was actually applied, in order

1. **`publication_type_composition_v2`** — the real content of
   `20260826140000_publication_type_composition.sql`, unmodified from what was committed in
   `Thunder_Core@c4e72b8`. Adds `publications.composition_id`, widens the `publication_type` CHECK to
   include `composition`, drops the 17-argument `media_publication_upsert` by exact signature and
   recreates it at 18 arguments with the draft-allows-null-composition guard, leaves
   `media_publication_set_content` / `media_publication_duplicate` bodies as committed (signatures
   unchanged), and re-applies the REVOKE/GRANT lockdown to `service_role` only.
2. **`publication_composition_in_reads`** — the content of
   `20260826150000_publication_composition_in_reads.sql`. `CREATE OR REPLACE` on
   `media_publication_get` and `media_publications_list`, both signature-unchanged, to surface
   `composition_id` / the joined `composition` object.

## Post-apply verification (production, `sfiefevtxalqjizdkcsw`)

- `media_core.publications.composition_id` column present.
- `media_publication_upsert` has exactly one overload (`overload_count = 1`).
- `has_function_privilege('anon', ...)` → `false`; `has_function_privilege('service_role', ...)` →
  `true`, for the 18-argument signature.
- `pg_get_functiondef` of the live `media_publication_upsert` contains `p_composition_id`.
- `pg_get_functiondef` of `media_publication_get` and `media_publications_list` both reference
  `composition_id`.
- `media_core.publications` row count unchanged at 121 before and after both applies — no rows
  touched, matching the expectation that a nullable column addition is a no-op on existing rows.

No advisor check and no cross-tenant/duplicate SQL probe was re-run against production specifically
(the equivalent probes were run on `develop` in the prior session, and the browser checklist round 2
exercised create/publish/duplicate against develop's applied copy of the same functions). If that
matters for an audit, re-run `get_advisors` against `sfiefevtxalqjizdkcsw` — it was not done here.

## Outstanding, unchanged from before this session

- Ticket 05 (`media_publication_activate` has no `composition_id` branch) is what makes D fail — still
  not started.
- `docs/layouts/tickets/03-composition-list-and-editor.md` / `05-activation-materializes-zones.md`
  carry the two follow-up notes recorded in the prior session (unbound-Zone naming, activation gap) —
  unchanged, no new findings this session.
- `src/proxy.ts` in `thunder_one_prj` remains modified and uncommitted, unrelated to this work —
  untouched again this session.

## Not done

- Nothing was committed or pushed this session (nothing needed to be — the migration files matched
  what was already committed).
- Ticket 04 is not marked done in its ticket file; that update was not requested this session.
