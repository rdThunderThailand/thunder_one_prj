# SESSIONLOG — Program release prep: polish, BE-3, FE-E, FE-C (2026-09-30, session 10)

## Done
- Handoff reviewed; `docs/program/progress-program.md` was stale (badge, FE-B PR, Core#144 row) — fixed.
- A2: all 10 functions from the 7 unreleased Core migrations exist on prod with develop's md5.
- A1: duplicate migration prefixes (two pairs, not one) renamed → Thunder_Core#145 (Draft).
- User widened scope: ship everything in v0.5.0 instead of releasing first.
- FE `feat/program-edit-polish` → thunder_one_prj#183 (Draft): frame 03 polish (breadcrumb, leave guard,
  content thumbnail, Channel initials), Draft Save bug fix (targets/schedule were dropped), FE-E Edit
  Schedule, FE-C Playlist ⇄ Layout switch.
- Core `feat/recurrence-custom-dates` → Thunder_Core#146 (Draft): ADR 0014 custom dates. Applied to
  develop and prod.

## Found
- Draft Save only wrote details — Change Target on a Draft silently vanished (bug from FE-D, now fixed).
- BE-3 first cut returned 500 for an impossible date (`to_date` throws) → `pg_input_is_valid`.
- Prod never got `20260925062707_all_day_recurrence_sentinel` although it is on Core `main`; BE-3 carries
  it (user approved). Migration audits must compare function md5, not only the release's own files.
- GET publication: `targets` = resolved devices, `publication_targets` = the saved intent.
- Auto mode blocked activating a develop fixture ("Modify Shared Resources"); user switched to manual.

## Test data left on develop
- `zz-fe-c-layout-draft` targets `Channel for Screen 1` (UI refuses an empty target list).
- Playlist `test` stores `play_mode: sequential` explicitly.
- `zz-fe-e-live` (617d5200-…) Ended.

## Next
1. Owner merges Thunder_Core#145, #146 and thunder_one_prj#183.
2. Release v0.5.0 per `docs/agents/versioning.md` (Core first; Core `main` is 0.4.2 and hotfix merge-back
   PRs #129/#131 stay untouched by user choice — expect a `package.json` conflict on the Core release PR).
3. After deploy: prod checks (C) — ask before any Publish changes on a real Program.
