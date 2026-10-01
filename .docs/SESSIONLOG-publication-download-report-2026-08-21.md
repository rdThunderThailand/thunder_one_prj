# Session Log — Publication Download Report → Delivery Progress

Date: 2026-08-21

## Scope

- Extended Delivery Progress to consume `delivered` and per-file diagnostics produced by the player callback.
- Added recurrence-aware playback-window handling and adaptive polling.
- Updated the player contract and ADR 0021 without introducing a second progress model.

## Implementation

- `PublicationDetail.playback_window` models `before|open|between|ended`.
- Stage 2 completes on `delivered|playing`; stage 3 remains `playing` only.
- Expanded device rows show local filename, bytes on disk, fetched/cache reuse, verification evidence, device time, and server time.
- Polling uses 10 seconds during open settlement, 60 seconds while waiting/late, and stops on cancelled/ended/all-terminal runs; hidden tabs do not fetch.
- Added an `effective_status === "ended"` stop fallback so older API responses that predate
  `playback_window` cannot keep polling an ended publication.

## Verification

- `node src/features/communication/publications/delivery-progress.check.mts` — passed.
- `pnpm exec tsc --noEmit` — passed in `thunder_one_prj`.
- Browser local: authenticated Publication Detail loaded; terminal success showed 100% and no poll
  label; cancelled publication showed stage 2/3 split and no poll label; ended unresolved fixture
  initially exposed the missing stop fallback, then showed no poll label after the fix. No console
  errors were observed.
- Full callback diagnostics and intermediate `delivered` state remain blocked until the new migration
  is applied and signage sends a report fixture.
