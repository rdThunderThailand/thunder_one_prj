# SESSIONLOG — v0.5.0 released to prod (2026-10-01, session 10 cont.)

## Done
- Merged by the owner: Core #145 (migration prefixes), #146 (BE-3 custom dates), FE #183 (Edit Schedule, FE-C switch,
  frame 03 polish, Draft Save fix).
- Core release: release-prep #147 (0.4.0 → 0.5.0) → release PR #148 `develop → main` (conflict on `package.json` only;
  owner resolved on GitHub, option 1 — no merge-back of hotfixes #129/#131) → Vercel deploy `success`;
  `POST …/update-published` 404 → 401 after deploy, `GET …/publications` 401, unknown route 404.
- FE release: release-prep #184 → release PR #185 `dev → main` → Vercel `Production c866890`.
- Tags (annotated, approved): Core `v0.5.0` → `889a72e` (#4), FE `v0.5.0` → `c866890` (#5).
- Release table rows: Core#149, FE#186 (Draft docs PRs).
- Pre-release extras: prod poll smoke (32 devices ok, 4 tenants now-next ok), screenshot comparison with frames 03/08-11
  (found and fixed two Edit Schedule bugs), Content Source card shows picture/size/tags.

## Prod check (read-only, https://app.thunderone.asia, user logged in, nothing written)
- Programs list is `/media-workspace/publications/manage` (`/publications` is Now & Next).
- List: Total 34, Live 5, Draft 10 (matches the SQL counts; Ended 19). HTTP `display_status` filter returns
  `counts_by_status` + paging.
- Edit page of an Ended Program (`boe_55`): badge Ended, breadcrumb, "Last updated 2026-09-23 15:10" (not a dash),
  content picture, "3 items | Total 00:01:48", schedule card; all `/api/proxy/*` 200, console clean.
- NOT done: Publish changes on a real Program, Edit Schedule modal on prod, a Live/Scheduled/Draft Edit page on prod,
  a real player playing a `dates` schedule.

## Found, not fixed
- On an Ended Program the Change Playlist / Use a Layout / Change Target / Edit Schedule buttons stay enabled
  (only the details card and the rail honour `isEnded`). Nothing can be saved there (no Save/Publish), so it only
  misleads; fix = disable them with `isEnded`. Needs a patch release (v0.5.1) or goes into the next minor.

## Left over
- Draft PRs: Core#149, FE#186 (release-table rows) — owner merges.
- Test data on develop: `zz-fe-c-layout-draft` targets Channel for Screen 1; Playlist `test` stores `play_mode: sequential`;
  `zz-fe-e-live` Ended.
- Core hotfix merge-back PRs #129/#131 still open by choice; the next Core release will conflict on `package.json` again.
- Rotate the JWT / x-api-key printed in earlier sessions; claude-mem needs an API key (nothing remembered since 2026-09-06).
