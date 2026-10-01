# Edit Channel content actions — 2026-09-16

- Added the Figma-style content information card below Groups in the Edit Channel rail.
- `Go to Programs` links to the existing Media Workspace publications route; `Go to Calendar` is intentionally disabled because the calendar route is not available.
- Static verification: `pnpm exec eslint src/features/media-workspace/channels/components/EditChannelSidebar.tsx`, `pnpm exec tsc --noEmit`, and `git diff --check` pass. Browser verification is pending.
