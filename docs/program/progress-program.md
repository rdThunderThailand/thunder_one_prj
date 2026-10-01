# Progress — Program redesign

Tracker for `plan-program-redesign.md`. Update this file in the same commit as the work it records.
Legend: `[ ]` todo · `[~]` in progress · `[x]` done · `[-]` dropped. Each done item names its PR / migration / verification.

Decisions: ADR 0080 (this repo), Thunder_Core ADR 0014. Mockups: `docs/program/figma-mockup/Program NN- Media Workspace.jpg` (frames 01–12).

## Status at a glance

| # | Repo | Item | Status | Branch / PR | Notes |
|---|---|---|---|---|---|
| D | both | Grilling, ADRs, plan, CONTEXT.md | [x] | `feat/program-redesign`, docs reached `dev` | 2026-09-30, two review rounds applied |
| BE-0 | Core | Poll follows newest Job | [x] | Thunder_Core#133 + #135 merged into `develop`; FE #179 merged into `dev` | applied develop + prod 2026-09-30; issues #132, #134 |
| BE-0b | Core | now-next + schedule conflicts follow newest Job | [x] | Thunder_Core#139 merged into `develop` | applied develop + prod 2026-09-30; issue #137, follow-up #138 |
| BE-1 | Core | List read: filters/page/counts/thumbnail/delivery | [x] | Thunder_Core#136 merged into `develop` | applied develop + prod 2026-09-30; route not on Core `main` yet |
| FE-A | FE | Programs list page | [x] | thunder_one_prj#180 merged into `dev` | not on `main` yet |
| BE-2b | Core | `media_publication_get` returns `display_status` + `updated_at` | [x] | Thunder_Core#144 merged into `develop` | applied develop + prod 2026-09-30, `prosrc` md5 `bb14cd42…` on both; prod checked by SQL only |
| BE-2 | Core | `media_publication_update_published` | [x] | Thunder_Core#143 merged into `develop` (`bb9fde3`) | applied develop + prod 2026-09-30; HTTP verified on develop only; route not yet deployed to prod |
| FE-B | FE | Edit page shell | [x] | #182 | BE-2 done; browser-verified on develop (see FE-B section) |
| FE-C | FE | Change Playlist / Layout modals | [x] | #182 | Category = Folders added; type switching not built (no entry point in mockups 05/06) |
| FE-D | FE | Change Target modal | [x] | #182 | needs FE-B |
| BE-3 | Core | Custom-dates recurrence | [x] | Thunder_Core#146 (Draft) | applied develop + prod 2026-09-30; brought the missed all-day fix to prod |
| FE-E | FE | Edit Schedule modal | [x] | `feat/program-edit-polish` | browser-verified on develop incl. a Live Program |
| FE-B2 | FE | Frame 03 polish + Draft save fix + FE-C type switch | [x] | `feat/program-edit-polish` | breadcrumb, leave guard, content thumbnail, Channel initials; Draft Save now writes targets + schedule |

## D — Design (done)

- [x] Mockups read (12 frames) and mapped against both repos
- [x] ADR 0080 — published Programs edited in place, display status, poll prerequisite
- [x] Thunder_Core ADR 0014 — custom-dates recurrence (file untracked on Core `main`; commit it on the BE-3 branch, never with BE-0)
- [x] Plan `docs/program/plan-program-redesign.md`
- [x] CONTEXT.md:127 — list + Edit page say "Program"
- [x] Mockups downscaled to JPEG (4.1MB); PNGs git-ignored
- [x] Docs committed on `feat/program-redesign` and merged into `dev`

## BE-0 — Poll follows the newest Job (Thunder_Core)

- [x] Issue opened — Thunder_Core#132 (bug is live today: Group membership change + republish, Publish Changes)
- [x] Branch off `develop` — `fix/poll-newest-job`
- [x] Dump live `media_job_poll` from develop (`pg_get_functiondef`) — edit that, not the migration file
- [x] Migration `20260930100000_job_poll_newest_job_first.sql` (uncommitted): newest Job per Publication first (same rule as `media_core.media_asset_on_air`), then `device_id` membership
- [x] **STOP — approval**: devices whose only matching Job is not the newest — develop 0 rows, prod 0 rows (2026-09-30)
- [x] Applied to develop 2026-09-30 · `prosrc` md5 matches the file, single function, ACL unchanged
- [x] Verified via HTTP `POST /media/player/jobs` on local Core :3001 (develop DB), test device on `zz-ux-66-guard-test`: baseline 1 slot → newest Job without the device → 0 slots → test Job deleted → 1 slot. Not tested: deployed develop backend
- [x] Draft PR → `develop` — Thunder_Core#133 (+ rollback file `supabase/rollback/`)
- [x] Companion guard, Thunder_Core#134 → PR #135 (merged): `activate` refuses Targets that resolve to 0 devices (ADR 0080). Verified HTTP (`/activate` 400, `/republish` 400, status stays active, Job count unchanged) and UI (wizard message + Publish Changes dialog) on develop; FE messages in thunder_one_prj#179 (merged into `dev`, not yet on `main`)
- [x] Applied to prod 2026-09-30, guard (#135) first then poll (#133): `prosrc` md5 matches the files (`3e562f00…` activate, `042084e5…` poll), one function each, ACL unchanged. Not exercised on prod with a real device poll. Rollback files in Thunder_Core `supabase/rollback/` (never run)
- [ ] Layout (composition) Publish Changes through the UI not tested — same RPC and `REASONS` as Playlist
- [x] Prod smoke test 2026-09-30 (read-only, SQL, no tokens printed): `media_job_poll` called for all 21 non-revoked devices — 21 ok, 0 errors, 8 with content, 2 zoned + 19 flat payloads
- [x] **BE-0b** (Thunder_Core#137 → PR #139 merged into `develop`, migration `20260930140000_newest_job_readers.sql` + rollback): `media_schedule_conflicts` and `media_now_next_get` (current + per-device `playback_state`) pick the newest Job per Publication first; `now_next_candidates` already did. Impact before apply: 0 stale (device, Program) pairs on develop and prod. Applied develop + prod 2026-09-30: `prosrc` md5 matches the file (`4e64532b…` conflicts, `cf267d58…` now-next), one function each, ACL unchanged. Verified on develop with fixture `zz-be0b-newest-job-test` (BE-2 flow simulated: draft flip → drop a channel → activate): SQL — conflicts drops the removed device, control device still listed; player swap inside a rolled-back transaction gives `not_confirmed` (old rule `playing`/`stale`). HTTP through the FE proxy → Core :3001 — conflicts `[]` / listed, now-next 200. Fixture deleted (14 rows). Prod: read-only now-next smoke on all 3 tenants with channels. Not tested: deployed backend, the swap case over HTTP
- [ ] `media_screen_get` (also lacks a schedule check), `airtime_explain`, `retry_targets`: low priority, Thunder_Core#138
- Found in BE-0b, for BE-2: `activate` runs **no** overlap check — conflicts are advisory via `POST /publications/conflicts` (FE calls it first); `media_publication_upsert` is a full replace (name, playlist, targets, schedule on every call)
- [ ] BE-1 must count delivery/offline/failed from the **newest Job only** (`media_publication_get` already does; `media_publications_list` has no delivery yet, so nothing to migrate)

## BE-1 — List read (Thunder_Core)

- [x] Contract settled 2026-09-30 — plan §1 "BE-1 list contract", ADR 0080 precise rules (window-gated Publishing)
- [x] Helper `media_core.publication_display_status(...)` per ADR 0080 (develop, 2026-09-30)
- [x] `media_publications_list` params and response per the plan contract (delivery = `stage3_done`/total, offline, failed from the newest Job) — develop, `prosrc` md5 `cae7d0fe…` matches the migration file
- [x] `EXPLAIN` on the largest develop tenant (124 rows): 48 ms · prod largest is 34 rows, re-run after the prod apply
- [x] Route `GET /media/publications` passes the new params; thumbnails signed server-side (`src/lib/core/media-cover-urls.ts`, shared with now-next)
- [x] Applied to develop · verified via HTTP on :3001 (filters, paging, counts, 400s, signed thumbnails) and, inside a rolled-back transaction, Scheduled / Publishing / Composition cases · Thunder_Core PR #136 merged into `develop`
- [ ] Not verified: through the FE proxy (FE-A covers it) · Composition on a real tenant row
- [x] Applied to prod 2026-09-30 (approved): `prosrc` md5 matches develop and the file, one overload, service_role only · read-only checks on the largest prod tenant (34 rows): no-param call returns all 34, `total`/`counts_by_status` (live 5, draft 10, ended 19) add up, paging works · `EXPLAIN` 18 ms · route merged to `develop` via Core PR #136 (2026-09-30), not yet on prod `main`

## FE-A — Programs list (frames 01, 02)

- [x] API client + types (`fetchPublicationsPage`, `PublicationsPage`; old `fetchPublications` untouched)
- [x] KPI cards: Total, Live, Publishing, Scheduled, Draft (no Paused, no % change)
- [x] Filter bar: search (300 ms debounce), Status, Target (Channel/Group), Tag, Sort; More filters **disabled**. **Created by hidden** — API supports `created_by` but no readable user list for this role; follow-up if wanted
- [x] Table: thumbnail (placeholder for Layouts), name + content name + tags, badge, target, schedule range (+ "Next airing" for Scheduled), deployment/progress, updated, created by. Row shows no daily time range / all-day: the list payload has no recurrence, so it is not invented
- [x] Actions by status with confirm (AlertDialog) on Delete / End · Open/View link to the existing detail page until FE-B · **Draft has no Duplicate** (plan §2 listed one, but `media_publication_duplicate` returns 400 for a draft; found in browser 2026-09-30)
- [x] Pagination 10/page
- [x] Import Program + grid toggle disabled ("เร็วๆ นี้")
- [x] `tsc` + `eslint` clean; `*.check.mts` for query builder and display/actions mapping
- [x] Browser-verified 2026-09-30 (localhost:3000 → Core :3001, develop DB, 124-row tenant): load, Status/Tag/Channel/search filters, paging, empty state, Delete confirm dialog opened and cancelled, Duplicate on an Ended row created a Draft copy, then Delete via the confirm dialog removed it (total back to 124). Compared with frame 01 at 1440 px: table overflowed (Actions off-screen) → fixed, now fits. Remaining deltas vs frame: no avatar/role under Created by, no Paused card / % change (by design). End verified 2026-09-30 on the develop fixture `zz-ux-66-guard-test` (user-approved; it is now **Ended**, cannot be restarted; Live KPI 1→0). **Not verified:** Publishing + Scheduled badges on real rows (none exist on develop), Composition row placeholder, Target = Group with results
- [x] PR → `dev` — thunder_one_prj#180, merged 2026-09-30 (`5f7821d`)

## BE-2 — Update a published Program (Thunder_Core)

- [x] RPC: lock row → check `expected_revision` → refuse stored ≠ active or effective `ended` → flip to draft → `upsert` (first, it checks revision) / `set_content` / `set_schedule` → `activate`
- [x] Route `POST /publications/[id]/update-published` + error mapping
- [x] Applied to develop and prod 2026-09-30 · verified via HTTP on develop: rename, schedule, playlist ↔ image, Ended/Draft/stale revision refused, part-tagged errors. **Not verified:** "removed device stops receiving" (tenant had one Channel) and any call on prod
- [x] PR → `develop` — Thunder_Core#143 (opened Draft, merged 2026-09-30)
- [ ] Not verified: "removed device stops receiving" (test tenant had one Channel); any call on prod

## FE-B — Edit page (frames 03, 04)

Merged into `dev` via #182. Model + hook + cards in `publications/program-edit.ts`, `hooks/useProgramEdit.ts`, `components/PublicationEditPage.tsx`, `components/edit/`.

- [x] Route `/media-workspace/publications/[id]/edit`; list Open/View link to it
- [x] Sections: Program Details (editable), Content Source / Target / Schedule (summaries; Change buttons disabled until FE-C/D/E)
- [x] Right rail: status card, Playback Preview (now-next 60 min, Channel dropdown), Program Information (short id + copy, priority)
- [x] Draft: Save + Publish (details only; content/targets/schedule still set in the wizard) · Scheduled/Live: Publish changes + confirm modal (conflicts, removed targets, content note) · Ended: read-only
- [x] Discard-changes dialog on Go Back (+ `beforeunload`); **sidebar/link navigation is not intercepted**
- [x] ⋮ menu: Duplicate, View published version, Delete (Draft) / End program
- [x] Preview modal — header Preview loads the Playlist / Layout stage on first click and reuses `PlaybackPreviewModal` (opened on an Ended Playlist Program: 77 s timeline, media rendered). Its chrome still says "Preview Layout" for a Playlist; **Layout Program not tried**
- [x] Badge reads `display_status` and "Last updated" reads `updated_at`, both from `media_publication_get` (Core#144). Not verified: Publishing / Scheduled badge through the new RPC
- [x] `tsc` + `eslint` clean; `program-edit.check.mts` passes
- [x] Browser-verified 2026-09-30 (localhost:3000 → Core :3001, develop DB): Ended page read-only; Draft page renders, edit → dirty, Go Back → Discard dialog, Stay keeps edits. Live fixture `zz-fe-b-test` (tenant ThunderOne, playlist `test`, `M2 Smoke Channel` + `Channel for Screen 2`, created and activated through the API with approval): page shows Live, rename → confirm modal → Publish → `update-published` 200, name/revision changed on the server, Publish changes disabled again; a second publish without reload (returned revision reused) worked; ⋮ menu for Live = Duplicate / View Published Version / End program; End → confirm → redirected to the list, status `cancelled`. Second round, same day: Draft **Save** (rev bumped, targets + schedule kept) and **Publish** (→ active, lands on the detail page); **stale revision** (another `update-published` in between → page banner + Reload link, modal closes, edits kept); ⋮ **Duplicate** → new Draft edit page; **Delete** on that Draft (confirm, then 404). **Not verified:** removed-target warning and "removed device stops receiving" (Change Target is FE-D), Publishing badge, Layout Program, comparison with frames 03/04 at 1440 px. Test rows `zz-fe-b-test round2` and `zz-fe-b-draft by-other2` are left Ended on develop (cleanup = R0)
- [x] Frame 03 comparison 2026-09-30 (**structural only** — the Browser pane would not paint, so no screenshot; measured DOM at 1440 px on a Live fixture `zz-fe-b-visual`, since Ended): main column 828 + rail 320 as in the frame. Fixed: "Playing on N channels" under Live, week shown Mon → Sun, destructive red on Discard / End / Delete. **Remaining deltas vs frame 03:** no 1920×1080 preview thumbnail + "Open Preview" beside Program Details; Content Source shows the bound source only, not the Playlist / Layout radio pair (FE-C); no Channel thumbnails in Target; no breadcrumb or subtitle; Publish is a plain button, not a split button; Program ID is 8 chars (by design)
- [x] PR → `dev` — thunder_one_prj#182, merged 2026-09-30

## FE-C — Change Playlist / Layout (frames 05, 06)

- [x] `PlaylistPickerModal` / `CompositionPickerModal` reused (search, sort, preview + item list already existed); added Category = Folders with subtree-inclusive counts + Uncategorized (`picker-folder.ts`, `PickerFolderSection`); the create wizard gets it too, same pickers
- [x] Change button fetches the picked Playlist / Layout and replaces `content` via `edit.patch`; name shown before saving; Preview is keyed by content id
- [x] "Custom Layout — Create from blank" **disabled** (not built)
- [x] Browser-verified 2026-09-30 (develop DB): Category counts and filtering with real folders (`zz-fe-c-folder`), Playlist change ⇄ back returns Save to disabled, Layout picker re-select leaves the page clean
- [x] Type switching Playlist ⇄ Layout (user, 2026-09-30): frame 03's Playlist | Layout radio pair is the entry point; the other card offers its picker and picking switches the type. Video / image Programs show their items and may switch to either. Verified: Draft Playlist → Layout → Save → back (server type and ids swap); Live fixture Playlist → Layout → Publish changes (`composition`, new Job, same device)
- [ ] Not verified: switching to a *different* Layout (develop has one), comparison with frames 05/06
- [x] PR: rode on #182 (merged)

## FE-D — Change Target (frame 07)

- [x] Tabs All Channels / Channel Groups (own local state; the wizard's `ChannelsStep` / `GroupsStep` are bound to the draft store, so only their data calls and Group rules were reused)
- [x] Filters: type, location, status (`health`), search
- [x] Selected list + Target Summary (Channels, Locations; no screen count). A Group's members count toward both
- [x] Locations tab + map **disabled**
- [x] Browser-verified 2026-09-30 (localhost:3000 → Core :3001, develop DB): filters + counts, Group pick, Apply → card "2 Channels · 1 Group", Save enabled. On a Live fixture `zz-fe-d-live` (`M2 Smoke Channel` + `Channel for Screen 2`, created and activated through the API with approval): removing a Channel → confirm modal says "Will stop playing on 1 channel: M2 Smoke Channel" → Publish → server shows one `publication_target` and the latest Job has one device (`ThunderOne Screen 02`). Then End (`cancelled`)
- [ ] Not verified: Location facet with more than one Location, Group removal on a Live Program, comparison with frame 07 (no screenshot taken); `device`-type legacy targets pass through Apply untouched (check only)
- [x] PR: rode on #182 (merged)

## FE-B2 — Frame 03 polish + Draft save fix

- [x] Breadcrumb `Programs › name › Edit`; Discard dialog now also catches in-app links (sidebar, breadcrumb) via `useLeaveGuard` (capture-phase click on same-origin anchors)
- [x] Content thumbnail beside Program Details: Playlist cover (same rule as the Playlists page) or the Layout's zone plan with its resolution (Layouts have no cover); "Open Preview" reuses `ProgramPreviewButton`
- [x] Target card: Channel initials, max 6 + "+N" — Channels have no image field anywhere (checked develop catalog), user chose initials 2026-09-30
- [-] Split Publish button: no second action exists — kept a single button (user, 2026-09-30) · subtitle under the title: no source field in the mockup, skipped
- [x] **Bug found and fixed**: Draft Save sent details only, so Change Target / Edit Schedule on a Draft were silently dropped. `saveDraft` now sends `targets` and `PUT /schedule` when they changed (verified: `publication_targets` and schedule on the server after Save)
- [x] Browser-verified 2026-09-30 (localhost:3000 → Core :3001, develop): leave guard (sidebar → dialog, Stay keeps edits, breadcrumb → Discard navigates), thumbnails via DOM at 1440 px (no screenshot: pane hidden). **Not verified:** pixel comparison with frame 03

## BE-3 — Custom-dates recurrence (Thunder_Core, ADR 0014)

Branch `feat/recurrence-custom-dates` in worktree `../Thunder_Core-be3` (uncommitted), migration `20260930180000_recurrence_custom_dates.sql` + rollback.

- [x] Re-checked `recurrence` readers in the live catalog: only `recurrence_matches`, `publication_playback_window`, `media_publication_set_schedule`, `media_schedule_conflicts` branch on the shape; `media_job_poll` reads only `daily_start` and never sends recurrence to the Player; routes pass `recurrence` through loosely (no Core route change)
- [x] New helper `media_core.recurrence_airs_on(rec, date)` shared by `recurrence_matches` and `media_schedule_conflicts`
- [x] `set_schedule`: 1–366 real dates (`pg_input_is_valid`), dedupe/sort, `starts_at`/`ends_at` computed from the first/last window
- [x] `media_schedule_conflicts`: dates × weekly / monthly / dates overlap
- [x] `publication_playback_window`: next airing from the array (no scan)
- [x] Applied to develop 2026-09-30 (approved), plus a follow-up `set_schedule` fix (invalid date gave 500). `prosrc` md5 matches the file for all 5 functions, one overload each, ACL unchanged. Regression: 768 real-schedule results + 1008 synthetic weekly/monthly/one-off results identical before/after. SQL: far-apart dates find the next airing, window edges, all-day, timezone. HTTP `PUT /schedule` on :3001: sort/dedupe, computed range, invalid date / `days` mixed in / empty / 367 dates → 400, weekly unchanged. Conflicts: 8 cases in a rolled-back block. **Not verified:** prod (not applied), conflicts over HTTP (no active Program on develop), `update-published` with `dates` on a Live Program
- [x] **Prod gap found before applying:** prod `recurrence_matches` / `publication_playback_window` predated `20260925062707_all_day_recurrence_sentinel` (on Core `main`, never applied to the prod DB). User approved applying BE-3 anyway, which carries that fix (prod had 1 all-day schedule, a Draft)
- [x] Applied to prod 2026-09-30: md5 of all 5 functions = file = develop, one overload, ACL unchanged; regression fingerprint of 300 non-all-day real results + synthetic set identical; all-day last minute now airs; far-apart dates find the next airing. Not run: device poll smoke on prod
- [x] Conflicts + `update-published` over HTTP on a Live fixture `zz-fe-e-live` (develop; created after the user switched the session to manual approval): dates overlap listed, other device 0; Every day → Custom days → Publish changes → Scheduled with next airing 3 Nov 06:00; then Playlist → Layout → Publish changes; 3 Jobs, same device; fixture Ended (`cancelled`)
- [x] Draft PR — Thunder_Core#146 (ADR 0014 committed with it)

## FE-E — Edit Schedule (frames 08–12)

- [x] `schedule-preset.ts` (preset ⇄ stored shape, validation, upcoming days) + `schedule-preset.check.mts`; `recurrenceAirsOn` shared in `schedule.ts`
- [x] Presets Every day / Weekdays / Weekends / Custom days / Date range / One-time; highlight derived (7 days + end date = Date range, no end = Every day — user 2026-09-30); day chips + optional Start/End date row for weekly (user chose to add it)
- [x] Monthly and open-ended one-offs open as a locked, selected row ("Monthly" / "Continuous"); picking a preset replaces them
- [x] Time range, all-day, timezone; preview List + Week grid; summary
- [x] Playback Pattern: Sequential / Shuffle writes the bound Playlist's `play_mode` on Apply (`setPlaylistPlayMode`, revision-checked) with "used by N active or scheduled Programs" (`affected-programs`); Repeat single item disabled; section disabled for Layout content
- [x] Browser-verified 2026-09-30 on develop: locked Continuous row, Weekdays (chips, list, week grid), Custom days (toggle on/off, sorted) → Apply → Save → server has `freq: dates` and the computed range; reopen keeps Custom days; errors for time, empty dates, end before start; One-time; Cancel leaves the page clean; Playlist `test` play_mode shuffle → sequential via the modal (Playlist revision 3 → 5, other metadata untouched). Live Program verified on `zz-fe-e-live` (see BE-3). **Not verified:** comparison with frames 08–12 by screenshot
- [ ] Follow-up issue: move wizard `ScheduleStep` onto the shared helper

## Log

- 2026-09-30 — Design session: grilling (Q1–Q18), ADR 0080, Core ADR 0014, plan, two external review rounds applied. Poll bug found (BE-0). No code, no DB writes.
- 2026-09-30 — BE-0 executed: poll fix + zero-device activate guard, develop + prod. FE error copy in #179. See `.docs/SESSIONLOG-be0-poll-newest-job-2026-09-30.md`.
- 2026-09-30 — BE-0b, BE-1, BE-2, FE-A/B/C/D shipped to `dev` / `develop` (FE #180, #182; Core #136, #139, #143, #144). Pre-release check: all 10 functions of the 7 unreleased Core migrations exist on prod with the same `prosrc` md5 as develop. Next: release v0.5.0. See `.docs/SESSIONLOG-program-fe-c-2026-09-30.md`, `-fe-d-`.
- 2026-09-30 — Frame 03 polish, Draft save fix, BE-3 on develop, FE-E. Test leftovers on develop: Draft `zz-fe-c-layout-draft` now targets `Channel for Screen 1` (schedule restored); Playlist `test` stores `play_mode: sequential` explicitly; `zz-fe-e-live` Ended.
