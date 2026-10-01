# Overview lower grid — 2026-09-16

## Changed

- Set all three lower Overview columns to the Schedule card's minimum height.
- Made Channels by Type and Activity Feed fill their respective remaining column heights, aligning the lower card edges.
- Reassigned the middle column's remaining height to Channel Health, leaving Channels by Type content-sized.
- Enlarged the Channel Health donut and metrics, and vertically centred the health block within its expanded Card.

## Verification

- Passed: `git diff --check`.
- Passed: `pnpm exec eslint src/features/media-workspace/overview/components/LowerOverview.tsx`.
- Pending: browser verification at the reported desktop viewport.
