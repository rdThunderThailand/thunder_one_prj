# Review schedule time — 2026-09-16

## Scope

Fix Step 4 Review surfaces so a configured publication end time is shown instead of a recurring daily-window fallback.

## Root cause

`ReviewStep` formatted every non-recurring schedule using `daily_start` and `daily_end`; `ProgramSummaryRail` separately hard-coded Publish Now as `Every day · 00:00–23:59`. Those fields do not represent one-time expiry.

## Change

- Added `formatReviewTimeRange` in `schedule.ts`: recurring schedules use the daily window, and one-time schedules use `end_time` when an end date exists.
- Used it in the Review time card and timeline bar.
- Made the Review Summary show `Publish now – <end date>, <end time>` for a Publish Now schedule with an expiry.
- Added regression assertions for Publish Now, range, and recurring schedules.

## Verification

- `node src/features/media-workspace/publications/schedule.check.mts` — passed.
- `pnpm exec eslint src/features/media-workspace/publications/schedule.ts src/features/media-workspace/publications/schedule.check.mts src/features/media-workspace/publications/components/ReviewStep.tsx src/features/media-workspace/publications/components/ProgramSummaryRail.tsx` — passed.
- `pnpm exec tsc --noEmit` — passed.
- `git diff --check` — passed.
- Browser verification was not run in this session.
