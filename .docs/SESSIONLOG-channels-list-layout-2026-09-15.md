# Channels list layout — 2026-09-15

## Changed

- Made the Channels list Card consume the remaining dashboard height, with the table as its scroll region and pagination footer fixed at the Card bottom.
- Moved Type, Status, and Lifecycle into the native `<details>` filter icon menu; Sort remains beside it.
- When a Channel is selected, placed the detail panel beside both the summary row and table; the summary cards now use only the remaining list column.
- Set the page root to `h-full` so the list Card receives the dashboard content height rather than only a minimum height.
- Added the Create Channel modal subtitle and a visual three-step progress indicator; aligned the Location label with Channel Name.
- Kept the wizard to Screen/TV/Kiosk because the current `ChannelOutputKind` contract does not support PA/Audio.

## Verification

- Passed: `git diff --check`.
- Passed: `pnpm exec eslint src/features/media-workspace/channels/components/ChannelFiltersBar.tsx src/features/media-workspace/channels/components/ChannelsListPage.tsx src/features/media-workspace/channels/components/ChannelTable.tsx`.
- Pending: browser verification at the reported Channels viewport, including filter keyboard interaction.
