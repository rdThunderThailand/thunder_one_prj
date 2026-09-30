# Progress — Program redesign

Tracker for `plan-program-redesign.md`. Update this file in the same commit as the work it records.
Legend: `[ ]` todo · `[~]` in progress · `[x]` done · `[-]` dropped. Each done item names its PR / migration / verification.

Decisions: ADR 0080 (this repo), Thunder_Core ADR 0014. Mockups: `docs/program/figma-mockup/Program NN- Media Workspace.jpg` (frames 01–12).

## Status at a glance

| # | Repo | Item | Status | Branch / PR | Notes |
|---|---|---|---|---|---|
| D | both | Grilling, ADRs, plan, CONTEXT.md | [x] | `feat/program-redesign` (committed, not pushed) | 2026-09-30, two review rounds applied |
| BE-0 | Core | Poll follows newest Job | [ ] | — | first; own issue + PR; migration needs approval |
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

- [ ] Issue opened (bug is live today: Group membership change + republish, Publish Changes)
- [ ] Branch off `develop`
- [ ] Dump live `media_job_poll` from develop (`pg_get_functiondef`) — edit that, not the migration file
- [ ] Migration: newest Job per Publication first (same rule as `media_core.media_asset_on_air`), then `device_id` membership
- [ ] **STOP — approval**: list devices/Programs that would switch snapshot after apply (devices whose only matching Job is not the newest)
- [ ] Applied to develop · `prosrc` dumped back and compared
- [ ] Verified via the HTTP player jobs route (not RPC directly)
- [ ] Draft PR → `develop`

## BE-1 — List read (Thunder_Core)

- [ ] `media_publications_list` params: display status, target (channel/group), tag, created_by, search, sort, page, limit
- [ ] Returns: rows + `counts_by_status` + total; per row thumbnail, content name, delivery summary (delivered/total, offline, failed), next airing
- [ ] Display status computed per ADR 0080 table (Publishing waits only for online devices; Live uses `recurrence_matches`)
- [ ] `EXPLAIN` on the largest tenant
- [ ] Route `GET /media/publications` passes the new params
- [ ] Applied to develop (approval) · verified via HTTP · Draft PR

## FE-A — Programs list (frames 01, 02)

- [ ] API client + types for the new list params/response
- [ ] KPI cards: Total, Live, Publishing, Scheduled, Draft (no Paused, no % change)
- [ ] Filter bar: search, Status, Target, Tag, Created by, Sort; More filters **disabled**
- [ ] Table: thumbnail, name + content name + tags, badge, target, schedule, deployment/progress, last updated, created by
- [ ] Actions by status (Draft: Edit/Publish/Duplicate/Delete · Publishing/Scheduled/Live: Open/Duplicate/End · Ended: View/Duplicate) with confirm on destructive
- [ ] Pagination 10/page
- [ ] Import Program + grid toggle **disabled** ("เร็วๆ นี้"); header date picker not built
- [ ] Browser verification (ask first) vs frame 01 · Draft PR → `dev`

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
