# Progress — Program redesign

Tracker for `plan-program-redesign.md`. Update this file in the same commit as the work it records.
Legend: `[ ]` todo · `[~]` in progress · `[x]` done · `[-]` dropped. Each done item names its PR / migration / verification.

Decisions: ADR 0080 (this repo), Thunder_Core ADR 0014. Mockups: `docs/program/figma-mockup/Program NN- Media Workspace.jpg` (frames 01–12).

## Status at a glance

| # | Repo | Item | Status | Branch / PR | Notes |
|---|---|---|---|---|---|
| D | both | Grilling, ADRs, plan, CONTEXT.md | [x] | `feat/program-redesign` (committed, not pushed) | 2026-09-30, two review rounds applied |
| BE-0 | Core | Poll follows newest Job | [x] | Thunder_Core#133 + #135 merged into `develop`; FE #179 merged into `dev` | applied develop + prod 2026-09-30; issues #132, #134 |
| BE-1 | Core | List read: filters/page/counts/thumbnail/delivery | [ ] | — | |
| FE-A | FE | Programs list page | [ ] | `feat/program-redesign` | needs BE-1 |
| BE-2 | Core | `media_publication_update_published` | [ ] | — | needs BE-0 |
| FE-B | FE | Edit page shell | [ ] | — | needs BE-2 |
| FE-C | FE | Change Playlist / Layout modals | [ ] | — | needs FE-B |
| FE-D | FE | Change Target modal | [ ] | — | needs FE-B |
| BE-3 | Core | Custom-dates recurrence | [ ] | — | ADR 0014 |
| FE-E | FE | Edit Schedule modal | [ ] | — | needs FE-B, BE-3 |

## D — Design (done)

- [x] Mockups read (12 frames) and mapped against both repos
- [x] ADR 0080 — published Programs edited in place, display status, poll prerequisite
- [x] Thunder_Core ADR 0014 — custom-dates recurrence (file untracked on Core `main`; commit it on the BE-3 branch, never with BE-0)
- [x] Plan `docs/program/plan-program-redesign.md`
- [x] CONTEXT.md:127 — list + Edit page say "Program"
- [x] Mockups downscaled to JPEG (4.1MB); PNGs git-ignored
- [x] Docs committed on `feat/program-redesign` (not pushed)

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
- [ ] **BE-0b** (own issue + PR, after BE-1, before BE-2/FE-B): move `media_now_next_get` (FE-B preview) and `media_schedule_conflicts` (edit-in-place removes devices, so stale Job rows would raise false conflicts) to the newest-Job rule. `media_screen_get` (also lacks a schedule check), `airtime_explain`, `retry_targets`: low priority, separate issue
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
- [ ] Draft PR → `dev`

## BE-2 — Update a published Program (Thunder_Core)

- [ ] RPC: lock row → check `expected_revision` → refuse stored ≠ active or effective `ended` → flip to draft → `upsert` (first, it checks revision) / `set_content` / `set_schedule` → `activate`
- [ ] Route (PATCH or POST `/publications/[id]/update-published`) + error mapping
- [ ] Applied to develop (approval) · verified via HTTP: change name, targets (removed device stops), schedule; Ended refused; stale revision refused
- [ ] Draft PR → `develop`

## FE-B — Edit page (frames 03, 04)

- [ ] Route `/media-workspace/publications/[id]/edit`
- [ ] Sections: Program Details, Content Source, Target, Schedule cards
- [ ] Right rail: status card, Playback Preview next 1 h (now-next, first channel + dropdown), Program Information (short id + copy, priority)
- [ ] Draft: Save + Publish · Scheduled/Live: Publish changes + confirm modal ("stops on N channels") · Ended: read-only
- [ ] Discard-changes dialog on Go Back / navigation
- [ ] Preview modal
- [ ] ⋮ menu: Duplicate, View published version, Delete (Draft) / End program
- [ ] Browser verification (ask first) vs frames 03/04 · Draft PR

## FE-C — Change Playlist / Layout (frames 05, 06)

- [ ] Extend `PlaylistPickerModal`: folders as categories with counts, search, sort, preview + item list
- [ ] Extend `CompositionPickerModal`: folders, grid, Layout details panel
- [ ] "Custom Layout — Create from blank" **disabled**
- [ ] Browser verification · Draft PR

## FE-D — Change Target (frame 07)

- [ ] Tabs All Channels / Channel Groups (reuse `ChannelsStep` / `GroupsStep` logic)
- [ ] Filters: type, location, status (`health`)
- [ ] Selected list + Target Summary (Channels, Locations; no screen count)
- [ ] Locations tab + map **disabled**
- [ ] Browser verification · Draft PR

## BE-3 — Custom-dates recurrence (Thunder_Core, ADR 0014)

- [ ] Re-check `recurrence` readers in the live catalog
- [ ] `recurrence_matches` `dates` branch
- [ ] `media_publication_set_schedule` validation (1–366 dates, dedupe/sort, `starts_at`/`ends_at` from first/last)
- [ ] `media_schedule_conflicts` overlap with `dates`
- [ ] `publication_playback_window` next airing from the array (no scan)
- [ ] Applied to develop (approval) · verified via HTTP · Draft PR (commit ADR 0014 here)

## FE-E — Edit Schedule (frames 08–12)

- [ ] Shared preset ⇄ recurrence helper + one `*.check.mts`
- [ ] Presets: Every day, Weekdays, Weekends, Custom days, Date range, One-time (no Recurring); highlight derived from days
- [ ] Existing monthly → disabled selected "Monthly" + summary
- [ ] Time range, all-day, timezone; preview (week/list/day) + summary
- [ ] Playback Pattern: Sequential/Shuffle edits Playlist `play_mode` with "used by N Programs"; other fields disabled; section disabled for Layout content
- [ ] Browser verification · Draft PR
- [ ] Follow-up issue: move wizard `ScheduleStep` onto the shared helper

## Log

- 2026-09-30 — Design session: grilling (Q1–Q18), ADR 0080, Core ADR 0014, plan, two external review rounds applied. Poll bug found (BE-0). No code, no DB writes.
- 2026-09-30 — BE-0 executed: poll fix + zero-device activate guard, develop + prod. FE error copy in #179. See `.docs/SESSIONLOG-be0-poll-newest-job-2026-09-30.md`.
