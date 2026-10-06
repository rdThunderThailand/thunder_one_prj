# Progress — Now & Next refresh + Calendar

Read this first when resuming. Plan: [`plan-now-next-calendar.md`](plan-now-next-calendar.md) · ADRs 0084 / 0085 · handoff: `/tmp/thunder-handoff-now-next-calendar/HANDOFF.md`.
Last updated: 2026-10-06.

## Where we are

**S1 FE done + browser-verified. BE-A applied to develop, Core Draft PR #165 open. BE-B applied to develop + HTTP-verified, local commit only. FE-B1 + FE-B2 code done (tsc, eslint, 2 checks clean) but NOT browser-verified yet. FE has NO PR by user choice (one PR for S1+S2 when everything is done).**

FE branch `feat/now-next-s1-fe` (off `dev`). Core not touched yet (checkout is on someone else's `codex/core-142-mutation-guards` with uncommitted edits — use a worktree off `origin/develop`).

## Tickets

| Ticket | Status | Notes |
|---|---|---|
| BE-A Core: `p_group_id`, row Channel fields, publication `content` | **applied to develop, verified** | Worktree `/Users/arty/Desktop/Thunder/project/Thunder_Core-now-next`, branch `feat/now-next-group-scope` (local commit, not pushed). `prosrc` md5 matches the file; one overload; ACL `postgres` + `service_role` only. HTTP (worktree Core :3012 → develop DB, via FE proxy): group scope returns exactly the members (idle rows with `include_idle`, none without), both params → 400, unknown Group → 404, bad uuid → 400, `content {kind,id,name}` + Channel fields present. **Not done**: prod migration (R0), push + Draft Core PR, `now-next/route` check for upcoming `content` rows (only current sampled) |
| FE-R `returnTo` in Program editor | **done** | `return-to.ts` + check; `ProgramEditMenu.tsx` extracted (302 → 268 lines). Browser (develop data): Go Back → returnTo ✓, dirty Discard → returnTo ✓, `//evil`/none/`/overview` → Programs list ✓. **Not exercised**: End program and Publish-changes success (they write to develop) |
| FE-A1 popover dependency + scope picker | **code done** | `@radix-ui/react-popover` 1.2.0, `lovable/popover.tsx` (from Lovable project e8b49026…), `channel-scope.ts` + check, `ChannelScopePicker.tsx`; tsc + eslint clean. Picker is verified only once FE-A2 mounts it. Draft Channels are hidden from the list; "All" count = active Channels |
| FE-A2 Now & Next redraw | **done** | `publications/components/now-next/` (page, KPI cards, table, timeline, cover, icons) + `now-next-view.ts` + check; demo data + `DemoPublicationDetailPage` deleted. Browser (develop): All / Group scope + URL + Back, stale Group id → All + notice, ⋮ Edit Program → editor → Go Back returns, 1440 px render. **Deliberately left out until the Calendar route exists (S2): "Open Calendar →" and ⋮ "Open in Calendar"** (they would 404). **Not compared** with the Figma frame (no frame link; board image only) |
| FE-A3 Channel deep link | **done** | `/channels?channel=<id>` opens the panel; "View Programs →" → `/now-next?channel=<id>`. Verified in browser; Overview + editor rail (other `fetchNowNext` callers) still render |
| BE-B Core: `effective_segments` + `media_calendar_get` + `GET /media/calendar` | **applied to develop, HTTP-verified** | Core worktree branch `feat/calendar-read-model` (stacked on `feat/now-next-group-scope`; local commit, **not pushed, no PR**). Migration `20261006100000_calendar_read_model`. Parity query (plan §4) on develop: empty = parity, but develop has only 1 current Channel row so this is weak evidence. HTTP: unscoped / group / channel scopes, both → 400, >31 days → 400, to≤from → 400, missing from / no offset → 400, foreign Group → 404. 1 day = 96 ms, 30 days = 377 ms (tiny tenant). First migration attempt failed atomically on `cardinality(uuid)` (fixed with `n_winners`). Priority overlap, merged loop, daily window and "part of" were exercised later with zz-cal fixtures (see the FE-B1 / FE-B2 row) |
| FE-B1 / FE-B2 | **done, browser-verified** | `src/features/media-workspace/calendar/` (api, `calendar-day` + check, `calendar-url` + check, `CalendarPage/Toolbar/Grid/QuickView`), route `/media-workspace/calendar`, nav link, links added: Now & Next "Open Calendar" (carries scope) + ⋮ "Open in Calendar" (Channel rows), Overview "View full calendar". `DatesCalendar` month helpers exported and reused; `PRIORITY_STYLES` exported from `UpNextTimeline`. Date popover = month grid + native `<input type=date>`. **Browser 2026-10-06 (develop data, 1 Channel, 3 overlapping Programs)**: render + no console errors, block click → Quick View (priority, "Also scheduled (hidden)", Next Program "Nothing else today"), next day + URL + scroll to 08:00, Back, Today, popover pick, past-day note, stale Channel id → notice + All, Now & Next ⋮ "Open in Calendar" + "Open Calendar" link, Edit Program href carries `returnTo`. **Second run (same day, with fixtures)**: Go Back from the editor lands on `/calendar?channel=…&date=…` ✓; Group scope via the picker lists both member Channels with empty lanes ✓; View Program (not Edit) for an ended Program ✓; 60 s poll fires only on today (60 s apart) ✓; block labels stay in view (sticky). **Fixtures on develop** (tenant 2222…, Channel for Screen 2 `257b33d9`, cloned from `b6cf8b2d`/`f641d235`, no snapshot/job so they appear only in the Calendar/Now & Next, not as deliverable Programs): `zz-cal-urgent-a/b` (urgent, 2026-10-20 09–11 / 10–12), `zz-cal-high` (high, 08–10:30), `zz-cal-daily-window` (urgent, daily 13–15 on the 20th), `zz-cal-ended` (urgent, ended 2026-10-04 10–11). Calendar output on 2026-10-20 matched the plan: priority cut + \"Part of 08:00–10:30\", merged loop 10–11, daily window 13–15, hidden lists. Parity query: empty, but weak (the next 3 h hold no fixtures). Delete = future R0. **Not verified**: 1440 px comparison with the Figma frame. **Known/accepted**: sidebar Calendar click while on `/calendar?date=…` keeps the date (same as Now & Next). BE-B overlap / merged loop / daily-window cases still need fixtures |

## Resume here (next session)

1. Read this file, then `plan-now-next-calendar.md` §5 (FE-B1/B2) and ADR 0085. Handoff: `/tmp/thunder-handoff-calendar-fe/HANDOFF.md`.
2. Branches: FE `feat/now-next-s1-fe` (tip `77cef85`+, nothing pushed). Core worktree `/Users/arty/Desktop/Thunder/project/Thunder_Core-now-next` on `feat/calendar-read-model` (stacked on `feat/now-next-group-scope` = PR #165).
3. **Temporary local setup that must be undone at the end:** FE `.env.local` `CORE_API_URL=http://localhost:3012` (original `:3001`, backup `/tmp/env.local.bak`); Core worktree runs `next dev --webpack -p 3012` (log `/tmp/core3012.log`; restart: `cd` into the worktree, `npx next dev --webpack -p 3012`). The FE dev server (preview `dev`, :3000) must be restarted after any `.env.local` change. Login in the Browser pane is the user's.
4. Decisions by the user: Core PR for BE-A opened early (done); **BE-A/BE-B migrations to prod wait for the release**; **FE PR only when S1+S2 are all done** (Thai or English: ask); Calendar links ("Open Calendar →", ⋮ "Open in Calendar", Overview "View full calendar →") are added in FE-B1/B2 because the route did not exist in S1.
5. Open offers: fixture-based test of BE-B (priority overlap, merged loop, daily window) needs `zz-` rows on develop (R0, list first); Figma frame link for pixel comparison; Vercel check on Core PR #165 fails only because the git author lacks Vercel project access.

## Open questions for the user

1. Core: push `feat/now-next-group-scope` + Draft PR? Apply the migration to **prod** (R0)? FE PR waits for Core on `develop`.
2. Optional: Figma frame link (for a pixel comparison of Now & Next).
3. At PR time: Thai or English.

## Log

- 2026-10-06 — Created branch, FE-R implemented: `safeReturnTo` (same-origin `/media-workspace/…` only), Go Back / Discard / End / successful publish honour `returnTo`; Delete keeps Programs list.
- 2026-10-06 — Docs committed on `feat/now-next-s1-fe`. FE-R verified in browser. Popover primitive + channel-scope added.
- 2026-10-06 — FE-A1 ChannelScopePicker written (loads channels + groups when opened, or on mount if the URL already has a scope; applies on Apply only).
- 2026-10-06 — FE-A1 committed (d28b1ff). BE-A: Core worktree created, migration + rollback + route written; tsc shows no errors in now-next files.
- 2026-10-06 — BE-A migration applied to develop; verified over HTTP. **Temporary local setup**: FE `.env.local` `CORE_API_URL` → `http://localhost:3012` (backup `/tmp/env.local.bak`, original `:3001`); Core worktree runs `next dev --webpack -p 3012` (its `node_modules` is a symlink to `../Thunder_Core/node_modules`, Turbopack rejects that). Restore before finishing.
- 2026-10-06 — FE-A2/A3 built and verified. Picker fix: disabled Groups stay selectable (ADR 0084 §6). Timeline tick row moved below the Now pill.
- 2026-10-06 — BE-B written, applied to develop (approved), verified; route + cover signing + check added in Core.
- 2026-10-06 — Handoff written to `/tmp/thunder-handoff-calendar-fe/HANDOFF.md`.
- 2026-10-06 — FE-B1/B2 written in one pass (Quick View is small), committed locally; waiting for the user's choice on browser verification.
