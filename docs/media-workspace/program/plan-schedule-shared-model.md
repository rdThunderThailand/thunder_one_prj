# Plan — one schedule model for the Create wizard and the Edit page

Status: accepted (2026-10-01). Decision: ADR 0082. Issue: #194. Base branch `dev`, **two Draft PRs**: PR 1 = steps 1–3 (Edit page), PR 2 = steps 4–8 (wizard), branched after PR 1.
Paths are relative to `src/features/media-workspace/publications/`.

## 0. Rules

- No Core change; the four stored shapes (`weekly`, `dates`, `monthly`, `{}`) already exist.
- `ScheduleDraft` (`schedule-preset.ts`) is the only schedule model when done. Nothing named `ScheduleForm` survives.
- Draft key bumps to `thunderone.publications.create-draft.v14` in the same commit that changes the stored shape.
- Checks stay `*.check.mts` run with `node` (no test runner on purpose).

## 1. Steps

| # | Step | Files | Check |
|---|---|---|---|
| 1 | `describeSchedule(schedule, tz)` → `{ title, hours, range, days }`, range with an **inclusive** last day (all-day `ends_at` at 00:00 → minus one day; `dates` → last date). Edit `ScheduleCard` uses it; `PublicationDetailPage` "Ends At" shows the inclusive last day. Fixes "15 Jun – 23 Jun". | `schedule.ts` (or `schedule-describe.ts` if `schedule.ts` passes 300 lines), `components/edit/ProgramSummaryCards.tsx`, `components/PublicationDetailPage.tsx` | dates, weekly-with-end, all-day one-time, open-ended |
| 2 | `ScheduleDraft` gains `mode: "monthly"` (`monthDays`) and `mode: "continuous"` (`startTime`, `endTime`, open end allowed). `scheduleToDraft` / `draftToSchedule` / `validateDraft` / `airsOn` / `presetOf` / `applyPreset` handle both. Remove `locked` and its branches. Read-back rule for a stored one-off `{}` (ADR 0082 §4): within one day, or exactly 00:00 → next 00:00 = One-time; anything else = Continuous. | `schedule-preset.ts`, `types/index.ts` | round-trip: monthly `[1,15,31]`; continuous 3 Oct 10:00 → 5 Oct 18:00; continuous no end; same-day continuous 14:00–18:00 reads back as One-time; old `locked` inputs now round-trip |
| 3 | `ScheduleConfigFields`: Monthly fields (1–31 grid, 29–31 hint) and Continuous fields (date + time start, optional date + time end, no daily window). `EditScheduleModal` lists 8 presets; drop the locked row and hint. `SchedulePreviewPane` previews both. If Continuous wants `DateTimeInputs` / `TimezoneSelect` from `components/schedule-fields.tsx`, move that piece under `components/edit/schedule/` in this step (the rest of that file dies in step 8). | `components/edit/schedule/ScheduleConfigFields.tsx` (split out `MonthDaysGrid` if it passes 300 lines), `components/edit/EditScheduleModal.tsx`, `components/edit/schedule/SchedulePreviewPane.tsx` | browser |
| 4 | Store: `scheduleForm: ScheduleForm` → `schedule: ScheduleDraft`; default = Every day, today, no end, all day (ADR 0082 §5); key → `v14`. | `store/usePublicationDraftStore.ts` | — |
| 5 | Wizard step 3 renders the preset list + `ScheduleConfigFields` + `SchedulePreviewPane` (no `PlaybackPatternField`). | `components/ScheduleStep.tsx` | browser |
| 6 | Move every caller off the form model: conflicts + save use `draftToSchedule`; validity uses `validateDraft`; server resume uses `scheduleToDraft`. The conflict-check effect key (today built field by field, `daysStr = scheduleForm.days.join(",")` at `usePublishDraft.ts:139`) becomes `JSON.stringify(draftToSchedule(draft))`, so `monthDays`, `dates` and Continuous times re-trigger it. | `hooks/usePublishDraft.ts` (:139-206, :277-280), `publish-eligibility.ts:93`, `step-validation.ts:70`, `detail-mapping.ts:52`, `components/CreatePublicationPage.tsx:118`, `resume-prompt.ts:7` (comment) | `publish-eligibility.check.mts`, `detail-mapping.check.mts`, `resume-prompt.check.mts`, `next-transition.check.mts`, `basic-info-limits.check.mts` updated and passing |
| 7 | Wizard `ReviewStep` and `ProgramSummaryRail` read `describeSchedule(draftToSchedule(draft))`. | `components/ReviewStep.tsx`, `components/ProgramSummaryRail.tsx` | browser |
| 8 | Delete the form side: `ScheduleForm`, `SCHEDULE_TYPES`, `scheduleFormToPayload`, `scheduleToForm`, `validateScheduleForm`, `isScheduleFormValid`, `makeDefaultScheduleForm`, `buildCalendarMonth`, Play Mode card maps in `draft-mapping.ts`, the whole `components/schedule-fields.tsx` (7 exports, only `ScheduleStep` imported it), and `components/MiniCalendar.tsx` (no importer today). Trim `schedule.check.mts` to what remains. | `schedule.ts`, `schedule.check.mts`, `draft-mapping.ts`, `types/index.ts`, `components/schedule-fields.tsx`, `components/MiniCalendar.tsx` | `grep -rE "ScheduleForm\|scheduleFormToPayload\|scheduleToForm\|buildCalendarMonth"` returns nothing; `tsc`, `lint`, every `*.check.mts` |

Order: 1 → 2 → 3 = **PR 1** (Edit page complete and shippable on its own: last-day fix, Monthly, Continuous, no locked state) → 4–8 = **PR 2** (wizard). Steps 4–8 land together; the app does not compile half-way through them.

## 2. Verification (ask before each browser run)

- Edit page: each of the 8 presets applies and re-opens on itself (except a same-day Continuous, which re-opens as One-time by design); a monthly Program and a multi-day one-off open on Monthly / Continuous instead of a locked row; Schedule card and Detail "Ends At" show the inclusive last day. Fixtures: develop `a2b2c262` (weekly) and `f3f595e2` `zz-monthly-ui-19` (monthly draft).
- Wizard: new Program defaults to Every day; each preset publishes and the stored `recurrence` matches the table in ADR 0082; resume a `dates` draft via `/create?id=` keeps its dates; conflicts warning still appears; a v13 draft in localStorage is ignored without a crash.
- Review step / rail summaries match the Edit card for the same schedule.

## 3. Out of scope

- "Last day of month" for Monthly (needs Core).
- Playback Pattern in the wizard (ADR 0082 §6).
- Figma frame 3 parity.
