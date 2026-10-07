# Plan — Release Now & Next refresh + Calendar to prod

Status: **EXECUTED 2026-10-07** — migrations A→D applied, Core #169 + FE #234 merged, both tagged `v0.8.0`. Option B (selective Core release) was chosen by the owner; plan travels with the FE release-prep PR. Nothing below has been run on prod. Every step marked R0 waits for an explicit yes.
Core release branch `release/v0.8.0` (off `main`, local until approved): `af45b8b`, `ca1a0e2`, `c4dce80`, `92a0258` = 13 files, +2362, exactly BE-A/B/C/D + `/media/calendar` route; migrations and rollbacks byte-identical to `develop`. The BE-A cherry-pick conflicted only on a rollback file of `newest_job_readers_rest` (not on `main`) — dropped. BE-A's rollback pre-image md5 for `media_now_next_get` is `23acd948…` = prod today. tsc shows no error in the calendar / now-next files; `cover-urls.check.mts` passes.
Context: [`progress-now-next-calendar.md`](progress-now-next-calendar.md), ADR 0084 / 0085, [`../agents/versioning.md`](../agents/versioning.md).

## 1. State on 2026-10-07

| Item | State |
|---|---|
| FE #232 | merged into `dev` |
| Core #165 (BE-A), #166 + #168 (BE-B/C/D) | merged into `develop` |
| Migrations BE-A/B/C/D | applied on develop DB only. **Prod (`sfiefevtxalqjizdkcsw`) has none of the new objects** (read-only check 2026-10-07: no `effective_segments`, `media_calendar_get`, `media_core.publication_cover`; `media_now_next_get` still the 5-arg overload) |
| Prod pre-images for BE-D | `media_publications_list` md5 `cae7d0fe…` (= migration file from BE-1), `now_next_candidates` md5 `c594188e…` — re-check immediately before applying |
| FE `dev` ahead of `main` | 24 commits, all Now & Next / Calendar work or docs; `package.json` 0.7.0; `pnpm-lock.yaml` +242 lines (`@radix-ui/react-popover`) |
| Core `develop` ahead of `main` | 38 commits and **8 migrations**, only 4 are ours (see §2) |
| Preview of FE `dev` | points at Core `api.thunder.co.th` (looks like prod: real data, no `zz-` fixtures) → returns 404 on `/media/calendar`; FE shows "Could not load the Calendar" without crashing |

## 2. Design fork — what Core ships (owner decides)

`develop → main` on Core would also carry work that is not ours:

| Migration on `develop` not on `main` | Prod today | Owner of the work |
|---|---|---|
| `20261006060719_membership_role_replace` (role edits bound to memberships, Core #162) | function absent on prod → **unapplied** | other chat |
| `20261006090000_users_preferred_language_bcp47` (**rewrites `public.users.preferred_language`** data, sets default, Core #167) | no constraint on prod → **unapplied** | other chat |
| `20261001090000_newest_job_readers_rest`, `20261001053839_partner_submission_keep_user_email` | `retry_targets` and `submit_partner_application` md5 = file → applied; `airtime_explain` md5 on prod differs from this file (probably superseded, not checked) | earlier work |
| our four (`…090000_now_next_group_scope`, `…100000_calendar_read_model`, `…120000_calendar_overridden_spans`, `…130000_layout_program_cover`) | unapplied | this program |

- **Option A — promote all of `develop`**: simplest git-wise, but ships #162 and #167 with their migrations (one is a data rewrite) without their owners' acceptance. Needs those two applied and verified too.
- **Option B — selective Core release (recommended)**: like `v0.7.0` ("prepare selective core"): branch `release/v0.8.0` off `main`, cherry-pick `6d1b139`, `8ca2774`, `c287b28`, `aa83ae2` plus the four migrations and rollbacks. Ships exactly what was verified; #162/#167 keep their own schedule. Cost: one more PR and a manual cherry-pick check.

## 3. Sequence (assuming Option B; Option A differs only in step 2's contents)

R0 steps need approval, showing the exact SQL/commands first.

1. **Pre-flight (read-only, agent):** re-dump prod `md5(prosrc)` for `media_publications_list`, `now_next_candidates`, `media_now_next_get`; confirm one overload each; confirm FE `dev`: `pnpm install --frozen-lockfile && pnpm exec tsc --noEmit && pnpm exec next build` all exit 0.
2. **Core release PR:** `release/v0.8.0` → `main`, Draft, owner chooses language and merges. **Do not merge yet**: merging deploys Core code (`/media/calendar`) that calls functions prod does not have; that route would 500 until step 3, but nothing else calls it, so the safe order is step 3 first.
3. **R0 — prod migrations, one at a time, in order BE-A → B → C → D** via Supabase MCP `apply_migration` (CLI history is broken). After each: dump `prosrc` md5 and compare with the file; check one overload, ACL `postgres` + `service_role` only (BE-A drops the 5-arg `media_now_next_get` first — confirm the old overload is gone and the `service_role` grant exists on the new one). Rollbacks are in `supabase/rollback/`; BE-D is CREATE OR REPLACE over live bodies, so its rollback restores them.
4. **Merge Core release PR (owner)**, wait for Core deploy, tag Core `v0.8.0` (R0: show the command).
5. **FE:** release-prep PR → `dev` (`package.json` 0.8.0 — MINOR, new features), then `dev → main` release PR `release v0.8.0: promote dev → main (#11 — Now & Next refresh + Calendar)`, Draft; owner merges = deploy. Then tag `v0.8.0` (R0) and add the row to `versioning.md`'s table.
6. **Verify on prod at the user's layer** (ask run / checklist / skip first): Now & Next with Channel + Group scope; Calendar today and a day with Programs; Quick View; Edit Program `returnTo`; read-only. Prod has no `zz-cal-*` fixtures, so overlap / overridden-lane cases are only seen if real Programs overlap — say so in the PR.
7. **Cleanup:** develop `zz-cal-*` fixtures (R0, list first), SESSIONLOG, update progress doc, issue for video poster (#230 stays).

## 4. Risks

- **Order**: FE before Core+migrations → Calendar shows "Could not load" on prod (no crash). Core code before migrations → `/media/calendar` 500 and `media_now_next_get` with `p_group_id` fails. Hence migrations → Core → FE.
- **BE-A overload trap**: handled by `DROP FUNCTION IF EXISTS` of the 5-arg signature; verify after apply.
- **BE-D rewrites two live reader functions** (`media_publications_list`, `now_next_candidates`) used by Programs list and Now & Next on prod — the pre-image md5 check in step 1 and 3 is what makes this safe; if prod drifted, stop.
- **Vercel**: Core PRs show a failing Vercel check because the git author is not in the Vercel team; deploy may need a manual trigger (history: "chore: trigger Vercel deploy (merge commit author blocked)").
- **Not verified so far on any deployed environment**: Calendar against a deployed Core with the new routes.
