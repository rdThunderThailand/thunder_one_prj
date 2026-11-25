# Plan — one module answers when a Schedule airs and ends (#461)

Issue: https://github.com/rdThunderThailand/thunder_one_prj/issues/461 (tracking #464).
Decision: [ADR 0128](../adr/0128-one-module-answers-when-a-schedule-airs-and-ends.md). Read it first, all of it.
Base: `dev` @ cf6e195f. Branch: `refactor/461-schedule-airing`. One PR into `dev`. Risk: R1 (cross-file,
reversible, frontend only, no Core change, no migration, no localStorage shape change).

Paths below are relative to `src/features/media-workspace/publications/` unless they start with `src/`,
`docs/` or `CONTEXT.md`.

## 0. Rules for the executor

- **Behaviour must not change**, except the four changes listed in ADR 0128 §9. If any other check value,
  screen text or validation message would change, stop and report it. Do not pick an answer yourself.
- Do not commit, push, open a PR or touch any database. Leave the work uncommitted for review.
- Do not edit files outside the "Files touched" list. If a step seems to need another file, stop and report.
- Checks are `*.check.mts` files with `node:assert`, run with `node <file>`. There is no test runner, on
  purpose. Do not add one.
- Code imported by a `.check.mts` imports siblings with the `.ts` suffix (`"./schedule.ts"`), as
  `schedule-describe.ts` does today. Components import without the suffix.
- Files stay ≤ 300 lines. No `any`. No commented-out code. Match the surrounding comment density and names.
- Line numbers are from `dev` @ cf6e195f. Re-check them before editing.

## 1. Steps

Do the steps in order. Run the check named in a step before starting the next one.

### Step 1 — Delete the dead code (ADR 0128 §5)

- `schedule.ts`:
  - Delete `AiringState` and `classifyPublicationAiring` (≈ lines 83-118, including the "airing state"
    section comment).
  - Delete `recurrenceAirsOn` and `withinDailyWindow` (≈ 120-137) and `formatScheduleStart` (≈ 152-170).
  - Move `ymdDay` to `schedule-airing.ts` if step 2 uses it; otherwise delete it.
- `index.ts`: delete lines 11-12 (the `classifyPublicationAiring` / `formatScheduleStart` / `AiringState`
  re-exports).
- `schedule.check.mts`: delete every `classifyPublicationAiring` and `formatScheduleStart` case, and the
  fixtures that only they use. Keep the `getDayTimelinePlacement` cases and anything that tests a function
  that still exists.
- Check:
  - `grep -rn "classifyPublicationAiring\|formatScheduleStart\|AiringState\|recurrenceAirsOn" src/` returns
    nothing.
  - `node src/features/media-workspace/publications/schedule.check.mts` passes.

### Step 2 — `END_OF_DAY` and the module (ADR 0128 §1, §3, §4)

- `schedule.ts`: add `export const END_OF_DAY = "23:59";` with a one-line comment: "a daily end that plays
  through the end of the local day in weekly, monthly and custom-dates Schedules (Core
  `recurrence_matches`); a one-off stops at its stored end (ADR 0128 §3)".
- Rename `schedule-describe.ts` → `schedule-airing.ts` with `git mv`.
  - Keep `describeSchedule`, `scheduleEdges`, `lastAiringDay`, `ScheduleSummary` and `ScheduleEdges` as they
    are. The one exception: the `"23:59"` at ≈ line 85 (`scheduleEdges`, all-day one-time) becomes
    `END_OF_DAY`.
  - Update the file comment to name the module's question: "when a stored Schedule airs, when it ends, how
    it is described".
  - Fix `lastAiringDay`'s doc comment. It now covers every shape: a one-off's last day is its end date, or
    the day before when the end is exactly 00:00, and `airsOn` relies on that. The code already does this;
    only the comment changes.
- Add an internal (not exported) helper that resolves a Schedule once:
  `{ zone, startDay, lastDay, matches(ymd) }`.
  - `zone` = `schedule.timezone || DEFAULT_TIMEZONE`.
  - `startDay` = local date of `starts_at`.
  - `lastDay` = `lastAiringDay(schedule)` (null = open-ended).
  - `matches` compares strings only:
    - `{}` (one-off): `startDay <= ymd && (lastDay === null || ymd <= lastDay)`.
    - `dates`: `recurrence.dates.includes(ymd)`.
    - `weekly` / `monthly`: inside `[startDay, lastDay]`, and the day matches (`days` includes `ymdDow(ymd)`,
      or `month_days` includes the day of month).
  - **Performance rule:** `utcToZonedParts` (which builds an `Intl.DateTimeFormat`) is called a constant
    number of times per exported call, never once per day of a loop.
- Export, all taking `PublicationSchedule`:
  - `airsOn(schedule, ymd): boolean`: resolve once, then `matches(ymd)`.
  - `upcomingDays(schedule, from, limit): string[]`.
    - For `dates`: the sorted dates `>= from`, first `limit`.
    - Otherwise: resolve once, then `for (let i = 0; i <= LOOKAHEAD_DAYS && days.length < limit; i++)`,
      with a local `const LOOKAHEAD_DAYS = 366`. That is 367 iterations, exactly as the Draft version at
      `schedule-preset.ts:280-288` (`i <= MAX_DATES`).
  - `hasAiringLeft(schedule, now: Date = new Date()): boolean`.
    - One-off: `ends_at === null || Date.parse(ends_at) > now.getTime()`.
    - Recurring: `{ date: today, time: nowTime } = utcToZonedParts(now.toISOString(), zone)`.
      `from = daily_end === END_OF_DAY || daily_end > nowTime ? today : shiftYmd(today, 1)`.
      `return upcomingDays(schedule, from > startDay ? from : startDay, 1).length > 0`. Use the resolved
      Schedule; do not resolve twice.
    - This mirrors `schedule-preset.ts:170-176`. The one intended difference (ADR 0128 §9): the 23:59 rule
      now applies to `dates` too.
  - `lastAiring(schedule): { date: string; time: string } | null`, for the schedule-ended label (ADR 0128 §6).
    - One-off: `scheduleEdges(schedule)` → `{ date: endDate, time: endTime }`, or null when `endDate` is null.
    - `dates`: the last date in sorted `dates`, with `daily_end`.
    - Weekly / monthly: null when `lastDay` is null. Otherwise scan backwards from `lastDay` with
      `shiftYmd(day, -i)` for `i = 0 … LOOKAHEAD_DAYS`, stopping at `startDay`. Return the first `day` where
      `matches(day)`, with `daily_end`, or null when none matches.
    - `time` is `daily_end` as stored, so 23:59 stays "23:59".
- `schedule-airing.ts` must not import `schedule-preset.ts` (the import goes the other way).
- Rename `schedule-describe.check.mts` → `schedule-airing.check.mts` with `git mv`. Update its import and
  the run line in its header comment.
- Check: `node src/features/media-workspace/publications/schedule-airing.check.mts` passes (old cases only,
  so far).

### Step 3 — The adapter and the Draft side (ADR 0128 §2)

- `schedule-preset.ts`:
  - Add `toStoredSchedule(draft: ScheduleDraft): PublicationSchedule | null`.
    - Return null when `draft.mode === "dates" ? draft.dates.length === 0 : !draft.startDate`. Otherwise
      return `draftToSchedule(draft)`.
    - A custom-dates draft does not use `startDate`, so a blank `startDate` there is not null.
    - Do not wrap it in `try/catch`. If you find another input that makes `draftToSchedule` throw, stop and
      report it.
  - `validateDraft` has two `hasAiringLeft(draft, today, nowTime)` calls: the one-time branch, and the
    final "no errors yet" branch. Both become `hasAiringLeft(stored, now)`, where
    `stored = toStoredSchedule(draft)` and `now = new Date(zonedToUtcIso(today, nowTime, draft.timezone))`.
    - At both calls `stored` is non-null. The one-time branch runs only with a start date. The final branch
      runs only with no errors, so a weekly or monthly draft has a start date and a custom-dates draft has
      dates.
    - Write it as `stored !== null && !hasAiringLeft(stored, now)`, so the types hold and a null never
      raises the error.
  - `validateContinuous` can reach its `hasAiringLeft` call with a blank start (the start error is set and
    the end is filled). There `toStoredSchedule` would be null. Keep the old continuous rule inline, because
    it reads only the typed end.
    - Replace the call with `` `${draft.endDate} ${draft.endTime}` <= `${today} ${nowTime}` `` (end passed →
      error).
    - This is the continuous branch of the old `hasAiringLeft` (`schedule-preset.ts:171`), moved, not new
      logic.
  - Every validation case in `schedule-preset.check.mts` must keep its expected value.
  - Delete the Draft-side `hasAiringLeft`, `airsOn` and `upcomingDays` (≈ lines 169-176, 265-288). Keep
    `MAX_DATES`, the dates-count limit.
  - 23:59 literals that become `END_OF_DAY`: ≈ line 127 (all-day detection in `scheduleToDraft`), 134 and
    137 (the `withWindow("00:00", "23:59")` read-backs), 220 (`dailyWindow`) and 302 (`windowLabel`).
    `windowLabel` keeps counting a 23:59 end as 24:00 for every mode, one-time included. That is a known
    bug from before (ADR 0128 Consequences); do not fix it here.
- `schedule-preset.check.mts`: move every `airsOn` / `upcomingDays` case (≈ lines 66, 72-80, 98, 113, 162)
  to `schedule-airing.check.mts`.
  - Rewrite each as the module call on `toStoredSchedule(<same fixture>)`, with the **same expected value**.
  - Keep the fixtures where they are, or copy the ones the moved cases need.
- Add to `schedule-airing.check.mts`:
  - The 23:59 rule, replacing the deleted `classifyPublicationAiring` 23:59 cases:
    - monthly 09:00–23:59, last day: `hasAiringLeft` at local 23:59:30 → true.
    - weekly 09:00–17:00, last day: at 17:00:30 → false.
  - A `dates` Schedule with daily end 23:59, at local 23:59:30 of its last date → true. Comment: "ADR 0128
    §9: was false before; Core plays custom dates through midnight".
  - A one-time 11:00–23:59 at local 23:59:30 → false (a one-off stops at its stored end).
  - One-offs on `airsOn` / `upcomingDays`: one-time, all-day one-time, continuous ending at 00:00 (that day
    is not an airing day), open continuous.
  - `lastAiring`:
    - Mon–Fri 09:00–17:00 with a range ending on a Sunday → that week's Friday, "17:00".
    - Weekly all-day → its last matching day, "23:59".
    - `dates` → the last date + daily end.
    - Continuous ending 5 Oct 18:00 → 5 Oct "18:00".
    - Open-ended weekly → null.
    - A weekly range with no matching day → null.
  - `toStoredSchedule` returns null for a weekly draft with a blank start and for a custom-dates draft with
    no dates. It returns a schedule for a custom-dates draft with dates and a blank `startDate`.
- Check: every `*.check.mts` under `publications/` passes:
  `for f in src/features/media-workspace/publications/*.check.mts; do node "$f" || echo "FAIL $f"; done`.

### Step 4 — `publishNow` (ADR 0128 §6)

- `hooks/usePublishDraft.ts` (`publishNow`, ≈ lines 341-364): replace the block from
  `// Weekly and monthly ranges…` through the closing `catch {}` with:
  - `const stored = toStoredSchedule(state.schedule);`
  - if `stored && !hasAiringLeft(stored)`:
    - `const end = lastAiring(stored);`
    - `const label = end ? \`${formatDmy(end.date)} ${end.time}\` : undefined;`
    - `setErrorState({ message: scheduleEndedMessage(label), cause: "schedule-ended" })`, then `return`.
  - The label keeps today's `dd/mm/yyyy HH:MM` format (no comma). `scheduleEndedMessage` in
    `src/lib/api/publish-cause.ts` is not touched.
  - No `try/catch`: `toStoredSchedule` does not throw. Keep the intent of the old `ponytail:` line as a
    one-line comment: an incomplete schedule is left to step validation and Core.
- Fix the imports:
  - Remove `hasAiringLeft`, `upcomingDays` and `nowIn` from the `../schedule-preset` import unless they are
    still used. Add `toStoredSchedule` to it.
  - Import `hasAiringLeft` and `lastAiring` from `../schedule-airing`.
  - From `../schedule`, keep only the names still used (`formatDmy`).
- Check: `npx tsc --noEmit` reports no new error in this file.

### Step 5 — The editor preview (ADR 0128 §8)

- `components/edit/schedule/SchedulePreviewPane.tsx`:
  - Compute `const stored = toStoredSchedule(draft);` once per render.
  - Replace `upcomingDays(draft, …)` (≈ lines 36, 38) with `stored ? upcomingDays(stored, …) : []`.
  - Replace `airsOn(draft, ymd)` (≈ line 105) with `stored ? airsOn(stored, ymd) : false`.
  - Import `airsOn` and `upcomingDays` from `../../../schedule-airing`. Keep `windowLabel` from
    `schedule-preset`.
  - Leave `daysLine` and the `daily` window (≈ line 37) as they are.
- With a blank start date the preview shows no airing days (ADR 0128 §9). Add no Draft-side fallback.

### Step 6 — Import paths and the Detail page (ADR 0128 §7)

- Change `"../schedule-describe"` / `"../../schedule-describe"` to `schedule-airing` in
  `components/ReviewStep.tsx`, `components/ProgramSummaryRail.tsx`, `components/ScheduleStep.tsx`,
  `components/PublishStep.tsx` and `components/edit/ProgramSummaryCards.tsx`. Change the import path only,
  nothing else.
- `components/PublicationDetailPage.tsx`, Schedule card (≈ lines 500-552):
  - Inside the existing `detail.schedule ?` branch, and only there: `const summary =
    describeSchedule(detail.schedule)` and `const edges = scheduleEdges(detail.schedule)`.
  - Starts At: `` `${formatDmy(edges.startDate)}, ${edges.startTime}` ``.
  - Ends At: `` edges.endDate ? `${formatDmy(edges.endDate)}${edges.endTime ? `, ${edges.endTime}` : ""}` : "No end date" ``
    (the expression at `ProgramSummaryRail.tsx:98`).
  - Recurrence, first line: `[summary.title, summary.hours, summary.range].filter(Boolean).join(" · ")`. This
    is the expression at `ProgramSummaryRail.tsx:106` (the wizard's "When to Play").
  - Recurrence, second line, only when `summary.days.length > 0` (weekly): the weekday labels, as built at
    `ProgramSummaryRail.tsx:99-100`. Monthly and custom dates have no second line (the title already says
    it).
  - Delete the hand-written `Monthly:` / `Dates:` / `Weekly:` / `Hours:` / `One-time` branch.
  - Remove the imports that become unused (`lastAiringDay`; `formatMonthDays` / `WEEKDAYS` if unused).
    Keep `formatDate` for `created_at` / `activated_at`.
  - JSX: one element per line, as in the rest of the file (AGENTS.md).
- Check: `npx tsc --noEmit` and `npx eslint src/features/media-workspace/publications` are clean.

### Step 7 — Final checks

- `grep -rn "schedule-describe" src/` returns nothing.
- `grep -rn '"23:59"' --include='*.ts' --include='*.tsx' src/features/media-workspace/publications | grep -v check.mts`
  shows exactly:
  - the `END_OF_DAY` definition in `schedule.ts`;
  - `components/ReviewStep.tsx` ≈ 82, the fallback end label, kept;
  - `components/edit/schedule/ScheduleConfigFields.tsx` ≈ 205 and 222, the all-day display sentinels,
    kept (ADR 0128 §3: component sentinels stay).

  Any other hit: stop and report.
- Every `*.check.mts` under `publications/` passes (loop in step 3).
- `npx tsc --noEmit` and `npx eslint src/features/media-workspace/publications` are clean.
- `npm run build` passes. Run it in the background; it is slow.

## 2. Verification at the user's layer (ask the owner before each browser run)

Run the local dev server against develop. Fixtures: develop `a2b2c262` (Weekly Mon–Fri from 2027-06-15) and
`f3f595e2` `zz-monthly-ui-19` (monthly draft).

1. Edit Schedule modal on a weekly Program: the preview list shows the same 10 days as on `dev`, and the
   week grid marks the same days. Clearing the start date empties the preview.
2. Same modal, presets Monthly, Custom days, One-time (all day, and 09:00–17:00) and Continuous (ending
   00:00): preview days unchanged from `dev`.
3. Create wizard: the Review step and the summary rail show the same text as on `dev`.
4. Create wizard, Publish step: set a One-time schedule for today ending a few minutes from now. Go to the
   Publish step and wait until the end time passes, then press Publish. The error reads "Program
   นี้สิ้นสุดเมื่อ <today dd/mm/yyyy> <end HH:MM> ซึ่งผ่านไปแล้ว …". (A past date range cannot be entered:
   the date picker and step validation refuse it.)
5. Program Detail page, for a weekly, a custom-dates, a monthly and a one-off Program:
   - Starts At and Ends At read `dd/mm/yyyy, HH:MM`, or "No end date". They are never `YYYY-MM-DD`, and
     Ends At is never the day after the last day.
   - Recurrence's first line equals the wizard's "When to Play" line for the same schedule. A weekly
     Program shows weekday names on a second line.

## 3. Files touched

New (by `git mv`):
- `src/features/media-workspace/publications/schedule-airing.ts` (from `schedule-describe.ts`)
- `src/features/media-workspace/publications/schedule-airing.check.mts` (from `schedule-describe.check.mts`)

Edited:
- `src/features/media-workspace/publications/schedule.ts`
- `src/features/media-workspace/publications/schedule.check.mts`
- `src/features/media-workspace/publications/schedule-preset.ts`
- `src/features/media-workspace/publications/schedule-preset.check.mts`
- `src/features/media-workspace/publications/index.ts`
- `src/features/media-workspace/publications/hooks/usePublishDraft.ts`
- `src/features/media-workspace/publications/components/edit/schedule/SchedulePreviewPane.tsx`
- `src/features/media-workspace/publications/components/ReviewStep.tsx` (import path only)
- `src/features/media-workspace/publications/components/ProgramSummaryRail.tsx` (import path only)
- `src/features/media-workspace/publications/components/ScheduleStep.tsx` (import path only)
- `src/features/media-workspace/publications/components/PublishStep.tsx` (import path only)
- `src/features/media-workspace/publications/components/edit/ProgramSummaryCards.tsx` (import path only)
- `src/features/media-workspace/publications/components/PublicationDetailPage.tsx` (Schedule card + imports)

Docs (written by the design session; the PR carries them):
- `docs/adr/0128-one-module-answers-when-a-schedule-airs-and-ends.md`
- `docs/media-workspace/plan-schedule-airing-461.md`
- `CONTEXT.md` (Schedule entry)

Not touched (checked):
- `PublicationEditPage.tsx`, `hooks/useLeaveGuard.ts`, `target-picker.ts`, `channels-logic.ts`,
  `useProgramEdit.ts`
- `components/edit/schedule/ScheduleConfigFields.tsx`
- `src/lib/api/publish-cause.ts`
- `calendar/**`, `overview/**`, `publication-list-display.ts`, `store/**`

## 4. Overlap

These issues run in the same batch of parallel sessions, or come after it:

- **#459 (editor lifecycle, running in parallel):** no shared file. #459 changes only the import in
  `PublicationEditPage.tsx`, which this plan does not touch. That file imports `nowIn` and
  `DEFAULT_TIMEZONE`, both unchanged here.
- **#463 (channel state, running in parallel):** no shared file. It touches `target-picker.ts` and
  `channels-logic.ts`.
- **#479 (later):** shares `components/PublicationDetailPage.tsx`. This plan edits only the Schedule card
  (≈ lines 500-552) and the import block. Merge #461 first and rebase #479 on it, or the reverse; the
  conflict is limited to the import lines. `useProgramEdit.ts` is not touched here.
- **#426 option A (already merged):** `hooks/usePublishDraft.ts` is edited only inside `publishNow` and in
  its imports.

## 5. Out of scope

- The Programs list row end date (`publication-list-display.ts:37-41`), one day late for all-day ranges.
  Fixing it needs Core to send recurrence. Follow-up; see ADR 0128 Consequences.
- `windowLabel` counting a one-time 23:59 end as 24:00. Follow-up; see ADR 0128 Consequences.
- Time-zone shortcuts (ADR 0085 §2), the Calendar's occurrence labels, and Overview's `FALLBACK_TIMEZONE`.
- Overnight daily windows (refused by validation and by Core).
