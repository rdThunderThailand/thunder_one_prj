# SESSIONLOG — Delivery Progress settle anchor — 2026-10-20

Branch: `fix/delivery-settle-anchor` (from `origin/dev` @ c0cbe2a). Not committed.

## Problem

Found while testing ADR 0018 on prod: a Program published to testwindow 1 showed "Publish Failed"
(0% — 0 of 1) right after publishing while its only target was still queued; the device played
seconds later.

Root cause: `summarizeDelivery` anchored the 10-minute settle window on
`playback_window.opened_at` whenever the window is open. Core computes `opened_at` as today's
daily start (`GREATEST(local_date + daily_start, starts_at)`), so a Program published more than
10 minutes after its daily start fell straight to `stage3Done === 0 → "Publish Failed"`.

## Fix

`src/features/media-workspace/publications/delivery-progress.ts`: settle anchor = later of
`opened_at` (open window only) and `activated_at`; if either is null, the other one is used
(previous behaviour).

## Verification

- `node src/features/media-workspace/publications/delivery-progress.check.mts` — new case
  (window opened 13 h ago, activated 1 min ago, one pending/queued target → "Publishing") failed
  before the fix (`actual: 'Publish Failed'`), all checks pass after.
- `tsc --noEmit -p .` whole repo: 0 errors. eslint on both files: clean.
- Browser / prod UI: skipped by user choice — unverified (any PR must open as Draft).

## Notes

- Worktree had no `node_modules`; symlinked to the main checkout's (gitignored) to run tsc/eslint.
