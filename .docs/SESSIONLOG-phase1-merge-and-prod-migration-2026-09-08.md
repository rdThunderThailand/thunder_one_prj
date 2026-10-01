# SESSIONLOG — Phase 1 merged, migrations applied to prod (2026-09-08)

Repos: `thunder_one_prj`, `Thunder_Core` · Prod project `sfiefevtxalqjizdkcsw`

## 1. Merge

User merged all three open PRs directly:

| repo | PR | base | merged |
|---|---|---|---|
| thunder_one_prj | [#60](https://github.com/rdThunderThailand/thunder_one_prj/pull/60) | `dev` | 2026-09-07 13:54 UTC |
| Thunder_Core | [#50](https://github.com/rdThunderThailand/Thunder_Core/pull/50) | `develop` | 2026-09-07 13:55 UTC |
| Thunder_Core | [#51](https://github.com/rdThunderThailand/Thunder_Core/pull/51) (`hotfix/poll-payload-ms`) | `develop` | 2026-09-07 13:55 UTC — unrelated to Phase 1, merged alongside |

Confirmed `origin/dev` carries the tip commit (`04fe724`, the Modal fix) — nothing from #60 was
dropped by the merge. No PRs remain open in either repo.

## 2. Prod gap found and closed

Merging a PR deploys code, not database state. Checked prod (`sfiefevtxalqjizdkcsw`) before assuming
anything: `media_composition_set_tags` and `media_core.composition_tags` did not exist, and
`media_compositions_library_list` was still the pre-Phase-1 14-argument signature. Frontend and
backend code were live on prod calling a database that did not have this phase's objects yet — the
same tags-404 shape that the local `:3001` server produced earlier in the week, this time for real.

Applied the four Phase 1 migrations to prod, in order, via Supabase MCP `apply_migration` (the CLI
stays broken — see prior memory):

1. `20260906090000_layouts_last_used_at` — body-only `CREATE OR REPLACE`, `media_layouts_list(uuid)`
   keeps its signature and grants.
2. `20260906091500_composition_tags` — new table `media_core.composition_tags` (RLS on, no policies,
   no client grants — same shape as `playlist_tags`), new RPC `media_composition_set_tags`, and a
   body-only `media_compositions_library_list` update (still 14 args at this step).
3. `20260906120000_composition_tag_filter_and_facet` — adds `p_tag_id`, so `DROP FUNCTION` ran first
   against the old 14-arg signature before `CREATE FUNCTION`, per the standing gotcha that
   `CREATE OR REPLACE` would otherwise leave an ambiguous overload. `REVOKE ALL … GRANT service_role`
   re-applied after, since DROP+CREATE re-opens `PUBLIC` by default.
4. `20260906133000_composition_get_folder_and_tags` — body-only, `media_composition_get(uuid, uuid)`
   unchanged, no re-grant needed.

## 3. Verification (§6 — dump schema back and diff against the files)

- `media_compositions_library_list` → confirmed **15 args**, `p_tag_id uuid` present.
- `media_composition_set_tags(uuid, uuid, text[])` and `media_composition_get(uuid, uuid)` both exist
  with the expected signatures.
- `media_core.composition_tags` exists. Table grants: only `postgres` (owner) — no `PUBLIC`, `anon`,
  or `authenticated` leaked through.
- Function grants on `media_compositions_library_list` and `media_composition_set_tags`: only
  `postgres` + `service_role` — the REVOKE/GRANT pair after step 3's DROP+CREATE worked as intended.
- `get_advisors` (security): `composition_tags` surfaces the same `rls_enabled_no_policy` INFO its
  sibling tables (`playlist_tags`, `media_asset_tags`, etc.) already carry by design — RLS on with no
  policy is the intended "Core is the only read/write boundary" shape, not a new gap. No higher-severity
  finding touches any object from this phase.

## 4. Net effect

Phase 1 (Create Layout flow — tickets 21–29, thunder_one_prj issues #51–#59) is now fully deployed:
frontend on `dev`, backend on `develop`, and prod's database has every RPC/table/facet the deployed
code calls. Composition tags persist end-to-end on production, not just on the develop branch DB used
for browser verification this week.

## 5. Left open

- No PRs open in either repo.
- `Thunder_Core` local checkout is still on `feat/layoutV2` (from earlier this week, kept so `:3001`
  serves the route that was being verified) — `develop` now has everything that branch had plus the
  poll-payload-ms hotfix, so switching back to `develop` for future local work loses nothing from this
  phase.
- C2 (Layout/Zone toggle defaults to Zone) still wants a design sign-off; not a bug, not blocking.
- No new `zz-*` test data was created this session — nothing to clean up.
