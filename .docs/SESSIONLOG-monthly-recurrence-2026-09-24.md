# SESSIONLOG — monthly recurrence (frontend) (2026-09-24)

Contract: Thunder_Core ADR 0012 (`docs/adr/0012-monthly-recurrence-on-publication-schedules.md`).
Branch `feat/monthly-recurrence` from `origin/dev`, not committed. Backend log:
`Thunder_Core/.docs/SESSIONLOG-monthly-recurrence-2026-09-24.md`.

## What changed (read + preserve monthly, no editor)

- `types/index.ts` — `Recurrence` gains `{freq:"monthly", month_days, daily_start, daily_end}`;
  `SCHEDULE_TYPES` gains `"monthly"` (no Play Mode card); `ScheduleForm.month_days`.
- `schedule.ts` — `scheduleToForm` maps monthly → `monthly` (was `range`, i.e. "plays every day"
  after save); payload builder sends it back; validation; `isScheduleActiveOn` (calendar skips a
  missing day); `classifyPublicationAiring`; new `isRepeating`, `formatMonthDays`.
- `draft-mapping.ts` — monthly highlights the Recurring card; clicking any card replaces monthly.
- `ScheduleStep.tsx` — read-only "Monthly · Day 19 · 08:00 – 22:00" box, start/end still editable.
- `ReviewStep.tsx`, `ProgramSummaryRail.tsx` — days/daily rows for monthly.
- `PublicationDetailPage.tsx` — no longer calls `recurrence.days.join` on monthly (threw).
- `store/usePublicationDraftStore.ts` — persisted key v11 → v12 (form shape changed).
- `schedule.check.mts` — monthly: timezone boundary, end-exclusive, resume round-trip, weekly
  round-trip unchanged, calendar month-end skip, Feb 29 leap/non-leap.

`schedule.ts` is now 436 lines (was 395, already over the 300 limit) — not split, out of scope.

## Verification

| Layer | Result |
|---|---|
| checks | all 21 `publications/*.check.mts` pass |
| tsc / eslint | clean (`.next/dev/types` cleared first) |
| Browser (localhost:3000 → Core :3001 → develop, user signed in) | draft `zz-monthly-ui-19` created by API as monthly [19]: detail page shows "Monthly: Day 19 / Hours 08:00–22:00" (no crash); wizard Program step shows the read-only Monthly box with Recurring card highlighted; rail shows Days "Day 19", Daily 08:00–22:00; Review: "Schedule is valid" ✓, conflicts call OK; after the wizard saved (revision 4) `GET` still returns `{"freq":"monthly","month_days":[19],...}`; no console errors. |
| Not verified | Overview "Now & Next" card with a live monthly publication (covered by the check only); switching a monthly draft to another Play Mode in the browser. |

## Noticed, not fixed

- Resuming a playlist draft said "ยังไม่ได้เลือก Playlist" although the draft has one.
