# Review schedule card, sidebar, and timeline — 2026-09-16

## Scope

- Redesign the Step 4 `When to Play` card with complete publication schedule information.
- Make the 24-hour timeline bar reflect the configured play window.
- Increase Media Workspace sidebar label weight and normalize letter spacing.
- Reduce the Media Workspace logo by 10%.

## Changes

- The schedule card now identifies the schedule mode and separates start/end date and time, with play window, timezone, and recurring active days.
- Added `getDayTimelinePlacement` and positioned the timeline bar by minute-of-day instead of filling the entire track.
- Updated Media Workspace navigation labels from normal to medium weight and applied normal tracking.
- Reduced the existing brand scale from `0.85` to `0.765`.

## Verification

- `node src/features/media-workspace/publications/schedule.check.mts` — passed, including 16:00–19:00 placement and overnight clipping.
- `pnpm exec eslint src/features/media-workspace/publications/schedule.ts src/features/media-workspace/publications/schedule.check.mts src/features/media-workspace/publications/components/ReviewStep.tsx src/components/layout/Sidebar.tsx` — passed with 5 pre-existing `no-img-element` warnings in `Sidebar.tsx`.
- `pnpm exec tsc --noEmit` — passed.
- `git diff --check` — passed.
- Browser verification pending user choice.
