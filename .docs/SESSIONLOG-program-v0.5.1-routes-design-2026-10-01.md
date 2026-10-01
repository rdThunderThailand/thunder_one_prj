# SESSIONLOG — v0.5.1 routes + Ended fix + Program design-system pass (2026-10-01)

## Branches (nothing pushed)
- `fix/ended-program-edit-buttons` (from `dev` 0dffee7), 2 commits:
  - `0a28aba` fix(program): disable content, target and schedule changes on an Ended Program
  - `6696447` feat(program): move Programs and Now & Next to their own routes (ADR 0081, 308 redirects)
- `feat/program-design-system` (from the above), **uncommitted**, 11 files: Programs list + Edit page restyled to the Media Workspace system.

## Decisions (user)
- Routes: `/media-workspace/program[/create|/[id]|/[id]/edit]`, `/media-workspace/now-next`; 308 redirects from `/publications/**`; feature folder/API/types keep "publication". ADR 0081.
- Owner chose **one PR, v0.5.1 (PATCH)** for the Ended fix + route move, even though the route move is a URL-contract change (versioning.md would call it MINOR). Restyle = separate PR.
- When Figma and the design system disagree, the design system wins; Figma keeps content/fields/order.

## Restyle — what changed (reference: Layouts / Playlists lists)
- `PageHeader titleInTopbar` on list + Edit (ADR 0075 §4); actions `size="sm"`.
- KPI cards → `LibrarySummary` (icons + tone + detail); skeleton while loading.
- List card → `LibraryShell` ("All Programs", count meta); search → `LibrarySearch`; select triggers 10px.
- Table: 9px uppercase headers, 10–11px cells, rounded-full 9px status badges, row hover.
- Edit: cards `rounded-xl p-4 shadow-panel`, 14px bold titles, 10px hints, body 12px; status badge moved into `ProgramBreadcrumb`. Modals already used system Dialog/Button — unchanged.

## Verification
- tsc clean (after `rm -rf .next/types`), eslint 0 errors, `editor-routes.check.mts` + all `publications/*.check.mts` pass.
- HTTP: 5 redirect cases 308 with query preserved; new routes 307→login when signed out.
- Browser (dev server against **prod API** — `.env.local` `CORE_API_URL=https://api.thunder.co.th`; read-only, nothing saved): nav highlight, list links, Now & Next links, Ended Edit page 4 buttons disabled, Live Edit page enabled; restyled list + Edit screenshots; Change Target modal opened and cancelled; 375px no horizontal scroll.
- Not tested: any write flow (prod), Edit Schedule / Publish Changes modals visually, Draft Edit page.

## Open
- `LIST_HREF` / breadcrumb "Programs" / detail back links / Channel "View Programs →" point at Now & Next (pre-existing; ADR 0081 Consequences). Breadcrumb label "Programs" → Now & Next is now more visible.
- `PublicationEditPage.tsx` is 301 lines (was 302 before).
- `.env.local` points at prod — switch back to `http://localhost:3001` for develop work.

## Update — release v0.5.1 shipped (later same day)
- Everything in one PR (owner's call): **#187** (Ended fix + routes/ADR 0081 + design-system pass + Group-target rail fix + skeletons + `package.json` 0.5.1) merged into `dev` 2026-10-01 05:00 UTC, with #186 (record v0.5.0). Version bumped inside #187, not in a separate release-prep PR.
- Extra work after the first log: Edit page icons + frame-03 Target/Schedule layout (`57fcbb8`), rail now counts/previews Channels reached via a Group (`f61ddf6`; root cause: only direct `channel` targets were counted), design-system skeletons for list, Edit, Playback Preview (`de28519`), Edit/Open/View buttons fixed to `w-14`.
- Release PR **#188** `dev → main` merged 05:05 UTC → `main` `12a7a3b`. Before opening: install/tsc/next build exit 0, 88 `*.check.mts` pass, no conflict with main.
- **Prod checked read-only after deploy** (`app.thunderone.asia`): 5 redirects 308 with `?q=` kept; list KPIs 34/5/10, buttons 56px, links `/program/...`; Now & Next; Ended Edit page buttons disabled; Live Edit page (Group target) "Playing on 2 channels" + preview; Edit Schedule modal opened/cancelled, no dirty state; no console errors.
- **Tag `v0.5.1`** (annotated) pushed on `12a7a3b` after owner's yes.
- Docs PR for the release-table row: branch `docs/record-v0.5.1` (`2320e44`).

## Still not verified on prod
- Publish changes on a real Program; Weekly / custom-dates / monthly Schedule card rendering (no such data on prod); a real player airing `freq: "dates"`; whether an unchanged-content Job restarts the loop (ADR 0080).
- `.env.local` still points at prod (`CORE_API_URL=https://api.thunder.co.th`) — switch back to `http://localhost:3001` for develop work. Local checkout is on `docs/record-v0.5.1`.

## Carried-over open items (from the v0.5.0 handoff)
- Links meaning "Programs list" still go to Now & Next (decision pending, ADR 0081 Consequences).
- Wizard `ScheduleStep` migration to `schedule-preset.ts`; Core follow-ups #138 and `activate` overlap check; claude-mem broken (org disabled subscription access); rotate the JWT/x-api-key printed in earlier transcripts; optional R0 cleanup of develop test rows.
