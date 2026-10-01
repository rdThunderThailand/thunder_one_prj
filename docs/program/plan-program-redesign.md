# Plan — Program redesign (list, Edit page, pickers, schedule)

Status: accepted (2026-09-30, review round 1 applied). Source: `docs/program/figma-mockup/` (12 frames). Decisions: ADR 0080 (this repo), Thunder_Core ADR 0014.
"Program" is the UI word; code, API and schema keep **Publication** (CONTEXT.md).

## 0. Fixed rules for every sub-project

- UI built from `src/components/ui/lovable/` primitives and `globals.css` tokens (ADR 0075/0076). Figma frames are the visual reference; there is no Lovable project for this.
- **Not built yet → rendered disabled** with a "เร็วๆ นี้" tooltip. **Numbers we cannot compute → hidden**, never faked.
- Routes stay under `/media-workspace/publications`: list `/manage`, Edit `/[id]/edit` (new), View `/[id]` (Ended and read-only), Create stays the ADR 0072 wizard.
- Each BE/FE pair ships as its own Draft PR — FE base `dev`, BE base `develop`. Migrations are applied only after explicit approval (R0).

## 1. Sub-projects and order

| # | Repo | Scope | Depends on |
|---|---|---|---|
| **BE-0** | Core | Poll fix (ADR 0080 "Prerequisite"): `media_job_poll` picks the newest Job per Publication, then checks the device is in it. Own issue + PR — the bug is live today for Group membership changes and Publish Changes. | — |
| **BE-1** | Core | Extend `media_publications_list`: server filters (display status per ADR 0080 table, channel/group target, tag, created_by, search), sort, page/limit, `counts_by_status`, thumbnail (first content item / Layout preview), delivery summary (`stage3Done/total`, offline, failed), next airing, content name. | — |
| **FE-A** | FE | Programs list (mockup 01/02): 5 KPI cards, filter bar, table, status-aware actions menu, pagination 10/page. | BE-1 |
| **BE-2** | Core | `media_publication_update_published` — lock + `expected_revision`, refuse Ended, flip to draft, reuse `upsert`/`set_content`/`set_schedule`, then `activate` (ADR 0080 §2-4). Delete needs no BE work. | BE-0 |
| **FE-B** | FE | Edit page shell (mockup 03/04): Program Details, Content Source card, Target card, Schedule card, right rail (status, Playback Preview next 1 h, Program Information), Go Back/Discard, Preview modal, Publish/Publish changes confirm, ⋮ menu (Duplicate, View published, Delete/End). | BE-2 |
| **FE-C** | FE | Change Playlist / Change Layout modals (mockup 05/06), extending `PlaylistPickerModal` / `CompositionPickerModal`. | FE-B |
| **FE-D** | FE | Change Target modal (mockup 07), reusing `ChannelsStep` / `GroupsStep` logic. | FE-B |
| **BE-3** | Core | Custom-dates recurrence (Core ADR 0014): `recurrence_matches`, `set_schedule`, `media_schedule_conflicts`, `publication_playback_window` (array lookup, no scan). | — |
| **FE-E** | FE | Edit Schedule modal (mockup 08-12) + shared preset ⇄ recurrence helper (with one `*.check.mts`). | FE-B, BE-3 |

Start: **BE-0** (own branch off `develop`), then **BE-1 → FE-A** on `feat/program-redesign`; later sub-projects branch separately.

### BE-1 list contract (settled 2026-09-30)

Badge rules: ADR 0080 "Display status" (precise rules). Everything below is additive — the three current callers (`PublicationsListPage`, `PlaylistPanelTabs`, `OverviewDashboard` with `status=active`) keep working unchanged.

**RPC** `media_publications_list` — migration `DROP FUNCTION IF EXISTS public.media_publications_list(uuid, varchar)` first (adding parameters otherwise leaves an ambiguous overload), then `CREATE`, then `REVOKE ... FROM PUBLIC` and `GRANT EXECUTE ... TO service_role` (today only `service_role` and `postgres` hold it). Edit from `pg_get_functiondef`, not an old migration file.

| Param | Meaning |
|---|---|
| `p_tenant_id`, `p_status` | unchanged (stored status; Overview uses it) |
| `p_display_status` | `draft` / `publishing` / `scheduled` / `live` / `ended` |
| `p_channel_id` | direct Channel target **or** a member of a targeted Group (same union as `target_summary.channels`) |
| `p_group_id` | direct Group target |
| `p_tag_id` | one tag |
| `p_created_by` | user uuid |
| `p_search` | trimmed, blank = none; `ILIKE` on Program name **or** content name |
| `p_sort` | `updated_desc` (default) / `name_asc` / `starts_desc` (`NULLS LAST` — Drafts may have no start) / `created_desc`; every sort ends with `, pub.id` so offset pages never repeat or skip tied rows; anything else raises `Invalid input: sort …` (→ 400) |
| `p_page`, `p_limit` | offset paging; `p_limit` NULL returns every row |

Query shape: one statement — CTE `base` applies every filter except display status and computes the badge once per row; `counts_by_status` = `count(*) FILTER (...)` over `base` (ignores only `p_display_status`; `p_status` and every other filter still apply); the page = `base` + display-status filter + sort + `LIMIT/OFFSET`.

**Response** keeps `publications` and every existing row field, and adds:
- top level: `total` (after all filters), `counts_by_status { draft, publishing, scheduled, live, ended }` (ignores only `p_display_status`)
- per row: `display_status`, `content_name`, `thumbnail_bucket_name` / `thumbnail_storage_key` (same expression as `now_next_candidates`), `next_airing_at` (`playback_window.next_opens_at`), `delivery { total, stage3_done, offline, failed }` from the **newest Job only** (`stage3_done` = `playing`, offline = `media_core.channel_device_health(last_heartbeat_at) = 'offline'`; `null` when no Job)

**Route** `GET /media/publications`: `zod` for the new query params; signs thumbnails with `now-next/cover-urls.ts`, moved to `src/lib` so both routes share it; the storage key never reaches the browser.

Rejected: cursor paging (the mockup needs numbered pages and `total`; badge order shifts with the clock anyway); no server paging; counts in a second RPC (two badge computations that can disagree); redefining `status` as display status (forces a lock-step FE/BE deploy); returning raw storage keys to the FE.

Before merge: `EXPLAIN ANALYZE` (read-only) on the largest prod tenant. Largest tenant: 34 Publications on prod, 124 on develop.

Known, not fixed here: the existing schedule `LATERAL` picks `ORDER BY s.created_at DESC LIMIT 1` with no tie-breaker.

## 2. Per-screen decisions

### Programs list (FE-A)
- Badges: Draft / Publishing / Scheduled / Live / Ended, rules in the ADR 0080 "Display status" table (Live = airing right now; Scheduled also covers between airings with "Next airing …"). KPI: Total, Live, Publishing, Scheduled, Draft. **Paused card removed**; **% change hidden**.
- Row subtitle = content name (Playlist/Layout); no category field exists. Created-by role shown only if it joins cleanly, otherwise hidden.
- Actions by status: Draft → Edit, Publish, Duplicate, Delete · Publishing/Scheduled/Live → Open (Edit page), Duplicate, End program · Ended → View, Duplicate.
- **Disabled**: Import Program, grid view toggle, More filters. **Not built**: header date picker (belongs to the shell, not this page).

### Edit page (FE-B)
- Draft: Save + Publish. Scheduled/Live: **Publish changes** only (ADR 0080).
- Program ID = first 8 chars of the UUID + copy button (no `PRG-` column).
- Playback Preview (Next 1 Hour) = `now-next?horizon_minutes=60` for the first target Channel, with a Channel dropdown.
- Priority editable in the rail; goes through the same save/publish path.

### Change Playlist / Layout (FE-C)
- "Category" = Folders (ADR 0046) with counts. **Disabled**: "Custom Layout — Create from blank".

### Change Target (FE-D)
- Tabs All Channels / Channel Groups working; filters Type / Location / Status (`health`).
- **Disabled**: Locations tab, map. **Hidden**: screen counts (one Player per Channel, ADR 0074). Target Summary shows Channels + Locations.

### Edit Schedule (FE-E)
- Presets: Every day, Weekdays, Weekends, Custom days, Date range, One-time. **Recurring removed.**
- Day chips always editable; the highlighted preset is derived from the chosen days (all 7 = Every day, Mon–Fri = Weekdays, Sat–Sun = Weekends, anything else = no highlight).
- Existing monthly schedules open with a disabled, selected **Monthly** preset and its summary; picking another preset overwrites it.
- Playback Pattern: Sequential/Shuffle edit the bound Playlist's `play_mode` with a "used by N Programs" warning; other fields disabled; whole section disabled for Layout content (ADR 0080 §6).
- Wizard `ScheduleStep` is untouched in this plan; follow-up issue to move it onto the shared helper. **Superseded by ADR 0082** (one model, 8 presets incl. Monthly and Continuous, no locked state) — `plan-schedule-shared-model.md`.

## 3. CONTEXT.md

Terminology line updated: the Program list page and Edit page say Program. (Done with this plan.)

## 4. Verification per sub-project

- BE: apply to `develop` only after approval, dump `prosrc` back, call through the HTTP route (not RPC directly).
- FE: browser check at the user's choice (§3 of the working agreement) against the matching mockup frame; unverified → PR stays Draft.

## 5. Open risks

- **Publishing badge mixes delivery into lifecycle** — accepted as display-only; offline devices are not waited for (ADR 0080).
- Badge filters depend on the clock (Live ⇄ Scheduled between airings); counts can shift between two page loads.
- **Live ignores priority**: a Live Program suppressed by a higher-priority overlap (ADR 0068) is not on screen but still shows Live. Revisit with Now & Next's effective-output rule if operators trip over it.
- BE-1 list read grows (thumbnail + delivery per row); needs `EXPLAIN` on the largest tenant before merge.
- Editing a Playlist's `play_mode` from a Program leaves other Programs on that Playlist with unpublished changes until their own Publish Changes (ADR 0078).
