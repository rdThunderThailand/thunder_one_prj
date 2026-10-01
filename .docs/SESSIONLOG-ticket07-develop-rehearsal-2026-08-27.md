# SESSIONLOG — ticket 07 develop rehearsal + playlist 404 commit (2026-08-27)

Continues `/private/tmp/HANDOFF-ticket06-continuation-2026-08-27.md`. Model: Sonnet.

## Done

### 1. Playlist / publication link 404 fix — committed
`thunder_one_prj@be138c7` `fix(media-workspace): prefix playlist and publication links with /media-workspace`
- 3 one-line route fixes carried in the working tree from background task `task_b8f19ddb`
  (`PlaylistSidePanel.tsx`, `PlaylistsListPage.tsx`, `PlaylistPanelTabs.tsx`) — all the same
  missing-`/media-workspace`-prefix bug. Diff was complete and coherent; committed on its own.
- `src/proxy.ts` (someone else's login-loop fix) stashed during the commit, restored after — still
  uncommitted, still not ours.

### 2. Ticket 07 (device rendering capabilities) — applied to develop
Code was already committed on `feat/layout` (`Thunder_Core@8c709e9`, migration + route). This session:

- **Applied** `20260826093000_media_device_capabilities.sql` to develop `ftfmokgphewzyxzwjitv` via
  MCP `apply_migration` (auto-mode classifier blocked the first attempt; user approved, retried OK).
- **Verified on develop:**
  - `public.assets.player_capabilities jsonb NULL` present, with the intended `COMMENT`.
  - Exactly one overload each: `media_device_profile_set(text, jsonb, jsonb)` (old 2-arg dropped),
    `media_heartbeat(text, jsonb)` unchanged.
  - `has_function_privilege`: `service_role` = true, `anon` / `authenticated` = false for both.
  - Security advisors: no finding names either function.
- **Functional probe on develop** (user ran the SQL — classifier still blocks MCP writes this
  session): seed device "ThunderOne Screen 01" (os+machine set, caps NULL) →
  `media_heartbeat` returns `profile_required: true` → `media_device_profile_set` with
  `{multi_zone_v1:true, max_video_zones:2}` echoes them back → `media_heartbeat` returns
  `profile_required: false` → a non-object caps arg raises
  `Invalid input: capabilities must be an object`. All four confirmed by the user.
  Side effect: that seed device now carries a capabilities value on develop (harmless).
- **Follow-up commits:**
  - `Thunder_Core@4a830e4` — migration header ticket ref 04→07; ADR 0009 profile field list and
    `profile_required` rule now mention `player_capabilities`.
  - `thunder_one_prj@b9eaff7`, `@6c0afce` — ticket 07 doc status + probe result.

Ticket 07 is now fully develop-verified. Only production apply + approval remain.

## NOT done / blocked

- **Ticket 07 production apply** — R0, not done. develop rehearsal is the only environment touched.
  The auto-mode classifier blocks MCP `apply_migration` / write `execute_sql` this session; the
  user ran the develop probe SQL by hand. Production apply will need the same (user runs it, or a
  scoped `autoMode.allow` rule for the prod project_id — deliberately not added).
- **Ticket 06 scenario G** — still unverified (no composition draft on develop). Unchanged from the
  ticket 06 handoff.
- **Nothing pushed.** `feat/layout` is now +9 on `thunder_one_prj`, +2 unpushed docs on `Thunder_Core`.

## Branch state at session end

- `thunder_one_prj@feat/layout` HEAD `b9eaff7` — ahead of origin by 9.
- `Thunder_Core@feat/layout` HEAD `b9eaff7`… (see repo) — `4a830e4` on top of `361c428`.
- Working tree: only `src/proxy.ts` modified (not ours).

## Next

- Get the ticket 07 functional probe run (needs the SQL-write permission, or user runs it).
- Ticket 06 G + open the PR(s) as Draft.
- Decide list-page drift indicator (spec story 29).
- Production apply for ticket 07 when approved.
