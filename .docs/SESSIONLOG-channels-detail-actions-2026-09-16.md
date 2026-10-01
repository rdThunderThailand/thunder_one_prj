# Channels detail actions — 2026-09-16

## Changed

- Removed the detail-panel overflow action menu.
- Kept Open Live View and Edit Channel labels on one line in the narrow sidebar.

## Verification

- Passed: `git diff --check`.
- Passed: `pnpm exec eslint src/features/media-workspace/channels/components/ChannelDetailPanel.tsx`.
- Pending: browser verification at the reported sidebar width.
