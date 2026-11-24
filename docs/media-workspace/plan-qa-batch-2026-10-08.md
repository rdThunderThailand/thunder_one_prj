# Plan — QA batch 2026-10-08 (FE only)

Branch `fix/qa-batch-2026-10-08` from `dev`. 21 QA items; decisions grilled 2026-10-08 (owner: "as recommended").
Out of this branch (Core work): item 3 → #261, item 13 → #262. Schedule rule → ADR 0090.

Duplicate check: no open duplicates. Item 1 amends closed #222 (deliberate, not a regression). Item 4 sits next to open #228 (same button, different bug). Item 2 relates to ADR 0079 / Thunder_Core#123.

Rules for every step: Media Workspace tokens + `src/components/ui/lovable/` primitives only (ADR 0075/0076); no new dependency; files ≤ 300 lines.

## A. Schedule (items 1, 5, 6, 20) — ADR 0090

| # | Change | Where |
|---|---|---|
| 6 | Live/Publishing Program: schedule card + modal lock everything but end date/time. Scheduled: all editable. | `publications/components/PublicationEditPage.tsx:65`, `components/edit/EditScheduleModal.tsx`, `components/edit/schedule/ScheduleConfigFields.tsx` |
| 1 | `min = today` on every editable start; `validateDraft` rejects a past start for Draft/Scheduled; Live end ≥ now. Update `schedule-preset.check.mts`. | `schedule-preset.ts:166-197`, `ScheduleConfigFields.tsx:37,154,217` |
| 5 | "Set end date" checkbox on every preset whose end is optional (Every day, Weekdays, Weekends, Monthly, Continuous). Off = no end (default). | `ScheduleConfigFields.tsx:164,229-241` |
| 20 | Date inputs → button showing `dd/mm/yyyy` that opens the existing `DatesCalendar` / `DateRangeCalendar` (past days already disabled). One display formatter `formatDmy` (`schedule.ts`, `dd/mm/yyyy`, zero-padded) on every Program schedule surface: list Schedule column + Next airing, `describeSchedule`, Review/Publish steps, Summary rail, Schedule preview pane, `formatScheduleStart` fallback, Programs "Last updated". Time stays native `type="time"`. **Done.** Not touched (not schedules): created/updated timestamps in picker modals and other feature tables. | `DatePickerField.tsx` (new), `schedule-field-parts.tsx` (split out of `ScheduleConfigFields`) |

Found while verifying A (fixed, R1): a Popover inside a Dialog opened behind it and ignored clicks. Two causes — lovable `popover`/`select`/`dropdown-menu` used `z-50` under the Dialog's `z-modal` (70), now `z-popover` (80); and two copies of `@radix-ui/react-dismissable-layer` (Dialog/Select 1.1.19, Popover 1.1.20) gave the Popover its own layer context, so the Dialog's `pointer-events: none` applied to it. `pnpm update` of react-dialog 1.2.0 / react-select 2.3.8 / alert-dialog / dropdown-menu (within existing `^` ranges) leaves one copy.

Draft-shape note: if 5 or 20 changes the persisted `ScheduleDraft`, bump the draft key (currently `v14`).

## B. Programs list (items 7, 8)

- **7** Sort labels: "Start date: newest first", (no "oldest first" here: `media_publications_list` accepts only `updated_desc|name_asc|starts_desc|created_desc` — `20261006130000_layout_program_cover.sql:160` — so it needs a Core migration; out of this FE-only branch), "Last updated: newest first", "Created: newest first", "Name: A → Z". Comparator untouched — the reported order is correct descending. `PublicationsFilterBar.tsx:41-46`, `types/index.ts:102`.
- **8** Row primary action → icon button with tooltip + `aria-label`: Draft `FilePenLine` "แก้ไข Draft"; Live/Scheduled/Publishing `CalendarCog` "แก้ไข Program"; Ended `Eye` "ดู Program". `PublicationRowActions.tsx:61-66`, `publication-list-display.ts:18-31`.

## C. Layout editor and creation (items 4, 9, 14, 15, 16, 21)

- **9** `MenuItem` enabled text is `text-muted-foreground` = same grey as disabled → enabled `text-foreground`. `compositions/components/CompositionEditorHeader.tsx:36`.
- **4** "Publish to channel" disabled unless the Layout is **Active**, reason e.g. "Activate Layout ก่อนเผยแพร่ — ยังไม่ผูก Content 2 Zone". Every entry: editor header (`CompositionEditorHeader.tsx:126`) and Layouts list row menu.
- **14** Remove the top "Fit to screen" next to Delete Zone; keep the bottom one.
- **15** New Layout modal: clicking "From template" opens the Template Picker at once (no Next). `layouts/components/create-layout-start-step.tsx`.
- **16** Template Picker: Template Details panel scrolls on its own so the whole detail is reachable. `layouts/components/LayoutTemplatePicker.tsx`.
- **21** **Done (data, no code).** No UI path skips `SaveAsTemplateDialog`. The "random" names were Aurora-import rows: `kind = 'template'` named `comp:<uuid v5>` (not their own id). Renamed by owner approval 2026-10-08, 1 row each: develop `f5274da2…` → `4 Zones 7680x1080`; prod `1e7623c1…` → `Full Screen 1920x1080` (still used by "LED TEST #7202" + copy). Prod now has 0 `comp:%` templates. Follow-up: the Aurora import should name templates (or create them `inline`).
- **9 / 4 / 14 / 15 / 16** done; 4 gates on `status === "draft"` (the wizard picker's rule, which also allows Inactive), not on Active only.

## D. Channels (item 2)

- Single-screen wizard: picking a Player that reports `resolution` fills `screenResolution`; still editable (ADR 0079 warning on override). Unknown → manual, default `1920x1080`. `channels/create-wizard-state.ts`, `components/create-wizard/Step2Setup.tsx`.
- Error + success modal: **systematic-debugging repro first** — read-only query of "Thunder Demo Kiosk Test 01" geometry on develop, then the UI on localhost. Success shows only after `createChannelV2` resolves (`CreateChannelModal.tsx:129-132`), so the cause is elsewhere (edit page? deployed backend?). Fix only after root cause.

## E. Library-wide UI sweep (items 10, 11, 12, 17, 18, 19)

- **10** Row "…" menus clipped by list overflow: every list page (Media Library, Playlists, Layouts, Programs, Channels, Channel Groups) — render the menu in a portal / use the Lovable dropdown primitive.
- **11** UI copy "Restore" → "Recover" everywhere (glossary updated). Identifiers/RPCs unchanged.
- **19** "Delete forever" → "Permanent delete" everywhere.
- **12** Create/upload from inside a Folder defaults to that Folder; All / Uncategorized / Trash → Uncategorized. Media upload, New Playlist, New Layout.
- **17** Required-field asterisk red (`text-danger`) everywhere — via one shared marker if a primitive exists.
- **18** Program wizard Review "Where to Play" Screens / Channels / Groups tabs overflow at 100% zoom → wrap or shrink.

## Verify (ask before every browser verify point — CLAUDE.md §3)

Per section: `node *.check.mts` for touched logic (`schedule-preset`, `create-wizard-state`), `tsc` on changed files, lint, then UI at localhost. Sort `starts_asc` and anything hitting Core must be checked against the deployed backend (`/api/proxy/__config`).
