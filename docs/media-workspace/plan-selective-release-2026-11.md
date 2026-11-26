# Selective release plan — Core v0.25.0 + ThunderOne v0.21.0 (2026-11)

**Goal:** ship the Media fixes, the Failed badge and Player Release Phase 2 / Rollout to production,
and keep Asset Workspace code on `develop`.

**Rules this plan follows:** Core `docs/agents/versioning.md`, Core ADR 0025 §6 (migrations are never
selective), Core ADR 0026 (code that needs a new migration ships after the owner's `db push`),
ThunderOne `docs/agents/versioning.md` (full `dev → main` promotion). Read them first.

**Every step marked R0 waits for the owner:** merge into `main`, `db push` to prod, tag push.

## Confirmed facts, do not re-derive (2026-11-16)

- Baselines: Core `main` = `v0.24.1`, ThunderOne `main` = `v0.20.2` (`dev` package.json is also `0.20.2`).
- Prod Supabase (`sfiefevtxalqjizdkcsw`) `schema_migrations`: 63 rows, which match `main`'s 63 files
  exactly. The latest is `20261113075848` (native canvas). It includes `20261112113935` (live badge).
- `develop` has **22 migration files that prod lacks**, from `20261109160314` to `20261116160808`
  (rechecked 2026-11-16 after Core#387). None is on prod. All but the last are **older than prod's latest**,
  so the push needs `--include-all` once. The 22nd (`player_update_available_poke`, ADR 0028 amendment 6)
  replaces `update_target_set`, `update_target_pause` and `update_ring_member_set`, which the earlier 21 create.
- Prod-safety checks already run (read-only, 2026-11-16):
  - Core `main` `src/` calls none of the RPCs whose signatures change (`asset_custody_*`,
    `asset_warranty_*`, `player_update_check`, `admit_player_release`).
  - New signatures add parameters with `DEFAULT` (custody `p_ttl_seconds`, warranty
    `p_warranty_type`), so named-argument callers keep working.
  - `media_core.publication_display_status(text, jsonb, boolean)` is dropped. On prod, only
    `media_publication_get` and `media_publications_list` call it, and the same migration
    (`20261113060000`) replaces both.
  - New `UNIQUE (session_id, snapshot_id)` on `inspection_results`: the prod table has 0 rows.
  - `player_releases` table and the `player-releases` bucket do not exist on prod yet, so there is no clash.
- Core code: `develop` is 334 first-parent commits ahead of `main`. Asset Workspace code from #257
  onward was never released (every release since v0.16.0 was selective).
- Core file overlap decides the groups below:
  - Checksum pilot #361 edits `player-releases/admit.ts` and `[id]/admit/route.ts`, which Phase 2
    (#341/#342) created. It cannot be left out without hand-reverting hunks.
  - Production ring #365 edits `update-check/route.ts` (#341, #355).
  - #373 and #378 both edit `media/publications/route.ts`.
- ThunderOne #387 (`refactor(ui)`: shared components + mobile shell) merged into `dev` on 2026-11-16.
  It touches 216 files, and its own body says it waits for preview/device checks. **No browser check
  has been recorded.**
- ThunderOne Asset Workspace screens are hidden on prod by `NEXT_PUBLIC_ASSET_WORKSPACE_MVP` plus
  App access (ADR 0097). The `dev` diff there is 6 files of styling from #387.

## Scope

| Group | Core PRs (code) | ThunderOne PRs | Ship? |
|---|---|---|---|
| G1 Media fixes | #364 (#359 login), #367, #368 (#240), #373 (#331), #378 (Failed badge), #380 (swagger) | #371, #375, #378, #379, #380, #381, #382, #384, #385, #386 | **Yes** |
| G2 Player Release | #340–#346, #352, #361 (checksum pilot), #365 (production ring), #372 (#330 sweep), docs #357/#360/#362/#366, #387 (ADR 0028 amendments 5+6 and its migration) | #364, #365, #366, #368, #370, #372, #389 (Update group) | **Yes** (D1 decided) |
| G3 Asset Workspace | every `asset-ws` labelled PR (#257…#386) | flag-hidden, no separate PRs | **No (code)** — the migrations ship anyway (ADR 0025) |
| UI refactor | — | #387 | **Yes, after the browser check in step F1** |

### DECISION PENDING

- **D1 — Player Release on prod: DECIDED 2026-11-16** (owner, agreed with the Player team), recorded in
  Core ADR 0028 amendments 5 and 6 (Core#387):
  - ship #361 (checksum pilot) with Phase 2; it cannot be split cleanly anyway;
  - customer devices update through `pilot`, shown in One as "Update group", with devices picked by hand;
  - `production` stays shut on prod: `PLAYER_UPDATE_PRODUCTION_RING` stays unset on Vercel Production;
  - no Core signing and no trigger for it; amendment 4 item 7's gate is removed;
  - each device gets its first checksum-only build (1.0.5+) by hand before it joins, the nine 1.0.4
    devices included (One blocks adding a 1.0.4 device);
  - Core wakes pilot devices with `player_update_available` when the group gets a version (amendment 6).
- **D2 — Asset Workspace code: DECIDED 2026-11-16, keep it out** (owner). Same as the precedent
  since v0.16.0. The schema still ships (ADR 0025).
- **D3 — `daily_end_2359` lands before ThunderOne #378: DECIDED 2026-11-17, accept** (owner). The SQL fix
  changes prod scheduling as soon as `db push` runs, and the preview fix follows in the FE release; same
  direction, no data change.

## Steps

### Core (Thunder_Core)

1. **C1 result 2026-11-17: pass** on `origin/develop` @ d05cb9d (Claude, worktree): `pnpm install --frozen-lockfile`
   exit 0; `next build` exit 0; `tsc --noEmit` exit 0 with 0 errors. `tsc` before the first build showed 12
   TS2307 errors (`*.png` imports in four `(auth)` pages) because `next-env.d.ts` did not exist yet; the
   build needs `.env` (the `NEXT_PUBLIC_SUPABASE_*` vars), not only `.env.local`. Rerun C1 on the C6 branch.
   Original step: **C1 Prep check** on `develop`: `pnpm install --frozen-lockfile && pnpm exec tsc --noEmit && pnpm exec next build`.
   `tsc` is never clean in Core, so gate on the files changed in G1+G2 only. Record exit codes.
2. **C2 Release-prep PR** `release/v0.25.0 → develop` (Draft): bump `package.json` to `0.25.0`. Owner merges.
3. **C3 Migrations PR → `main`** (Draft), from `main`: import all 22 files in order, with their
   `supabase/rollback/` and `supabase/tests/` files and the migrations README. No app code.
   List the files in the body. Title: `release v0.25.0: migrations (#23 — 22 pending files)`.
   The release number #23 must be checked against the Core table first.
4. **C4 Owner prod push (R0):** `migration list` on develop shows no Local-only rows, then
   `migration-guards.sh` with `DB_URL="$MAIN_DB_URL"` on the 22 files, then
   `db push --dry-run --include-all` (must list exactly the 22), then `db push --include-all`.
5. **C4 done 2026-11-17** (Claude, owner-approved, from a worktree on `origin/main` 97428cb with
   `--db-url "$MAIN_DB_URL"`): dry-run listed exactly the 22, push applied all 22 without error. An earlier
   owner push ran from a checkout without the files and applied nothing.
   **C5 result 2026-11-17:** `schema_migrations` 85, newest `20261116160808`. md5 of `prosrc` matches develop for
   all 73 functions the 22 files create or replace. anon/authenticated EXECUTE only on the two pre-existing
   `media_core` helpers, and anon has no USAGE on `media_core`. `player_releases`, bucket `player-releases`
   exist; `update_ring_members` and `update_targets` are empty. `media_publications_list` for thunder_qa
   (SQL layer) returns total 139 = rows in `media_core.publications`. Prod One (app.thunderone.asia, owner's
   super admin session, read-only): Programs loads (36 programs, KPIs, list), `GET /api/proxy/media/publications`
   200, no console errors; Now & Next, Calendar and Channels render without alerts.
   Original step: **C5 Postflight:** `schema_migrations` count 85 with every one of the 22 present; dump `prosrc`
   for changed functions and compare md5 with develop; check that no new function grants EXECUTE to
   `PUBLIC` (`has_function_privilege('public', oid, 'EXECUTE')` = false); smoke-call
   `media_publications_list` for thunder_qa through the deployed `main` API (the current prod FE
   must still load Programs).
6. **C6 opened 2026-11-17: Draft [Thunder_Core#390](https://github.com/rdThunderThailand/Thunder_Core/pull/390)**
   (`release/v0.25.0-code`, 22 commits). Scope changes against the table above: **#344 is Asset Workspace and
   was left out**; **#355 was added** (device token checked before body per contract v1.2 §4, drops the broken
   `server-time` route); #380 came out empty (only swagger files absent on `main`). Swagger split files and
   the asset-ws cron were kept out. C1 rerun on the branch: build, tsc (0), four `.check.mts` pass.
   Original step: **C6 Code PR → `main`** (Draft), from `main`: cherry-pick G1 + G2 merge commits
   (`git cherry-pick -m 1`, in merge order). Body lists every included **and** excluded PR (G3).
   Rerun C1 on the branch. Owner merges = deploy.
7. **C7 result 2026-11-17: pass.** #390 merged (9e2850c), Vercel deploy succeeded. On `thundercore.vercel.app`
   without credentials: `server-time` 404 (removed), `update-check`/`update-reports` 401 with a bad body
   (token checked first, #355), `player-releases`, its `sweep` and `publications` 401. Through prod One's proxy
   (owner's super admin session, GETs only): publications 200 (36), `display_status=failed` 200 (0),
   `not_ended` 200 (12), `player-releases` 200 (empty), pilot members 200 (0), pilot target 200 (none),
   all-devices 200 (234 = 171+30+22+9+2). Not done: update-check with a real device token (no prod device is
   in a ring yet; the unauthenticated 401 and the empty group stand in).
   Original step: **C7 Prod check** on `thundercore.vercel.app`: `GET /api/core/v1/media/publications` (thunder_qa),
   player-releases list, update-check with a device not in any ring returns no offer.
8. **C8 done 2026-11-17:** tag `v0.25.0` (annotated `cfb5c6d`) pushed on `9e2850c` after the owner's yes.
   Draft [Thunder_Core#391](https://github.com/rdThunderThailand/Thunder_Core/pull/391) adds the #23 row (the
   table still lacks #21 for 0.22.0/0.23.0). Draft [Thunder_Core#392](https://github.com/rdThunderThailand/Thunder_Core/pull/392)
   back-merges `main`; its tree equals `develop` (only `vercel.json` conflicted, develop's kept). Both wait for the owner.
   Original step: **C8 Tag (R0):** `git tag -a v0.25.0 <C6 merge commit> -m "release v0.25.0 (#23)"`, then push it
   after the owner says yes. Add a row to the Core versioning table. Back-merge `main → develop`.

### ThunderOne (thunder_one_prj), after C7

1. **F1 result 2026-11-17 (Claude, read-only):** deployed dev is behind Vercel login, so `origin/dev` @ 1225b146
   was run locally against Core develop. 22 routes (Media, Player Releases incl. Update group/Rollout, People,
   Thunder Care) render with their heading and data, no alerts, no console errors. Mobile 375px: sidebar hidden,
   menu button opens a 288px drawer with 11 links, no horizontal scroll. Not checked: Program create submit,
   Channels disable dialog (the menu item could not be clicked by automation; nothing changed), Compositions
   overlap error, Assets Move to Trash, admit/rename/delete, login error copy (would sign the owner out).
   Original checklist:
   **F1 Browser check on deployed dev** for #387 (the owner chooses the method, per CLAUDE.md §3):
   - Media: Programs list, Failed badge/KPI, Program create (draft needs content), schedule fields,
     Channels disable confirm, Compositions overlap error, Assets Move to Trash.
   - Player Releases: list/filter/menu, admit, rename/delete, Rollout page.
   - Mobile width: shell without the 224px sidebar.
   - People, Thunder Care, Auth (login error copy) smoke.
2. **F2 Prep:** run the three commands on `dev` (exit 0). PR `release/v0.21.0 → dev` bumps
   `package.json` to `0.21.0`. Owner merges.
3. **F3 Release PR `dev → main`** (Draft) `release v0.21.0: promote dev → main (#24 — Failed badge,
   Player Release Phase 2, UI refactor)`. Changes by module, one bullet per PR since v0.20.2, and
   "merge = deploy to production immediately". Owner merges.
4. **F4 Prod check** on app.thunderone.asia in thunder_qa (read-only flows + one draft Program).
5. **F5 Tag (R0)** `v0.21.0` on the merge commit. Add the missing `v0.20.2` row and the `v0.21.0`
   row to the versioning table. Back-merge if `main` gained commits.

## Known gaps after this release

- Asset Workspace code still only on develop. Its schema is on prod with no UI.
- Update group on prod is empty until devices get 1.0.5+ by hand; only then add them (D1).
- Core versioning table numbering (#21/#23) must be checked before writing the row.
