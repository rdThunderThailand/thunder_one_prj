# overview

The Media Workspace Overview dashboard (landing page at `/media-workspace`) — a page-specific composition of widgets pulled from across `channels`, `publications` and Now & Next.

`OverviewDashboard` fetches Channels (`fetchChannels`) and active Publications (`fetchPublications("active")`) once on a shared poll and passes them down; `ProgramStatusCards` fetches `fetchNowNext` itself. The Program cards and the today's-schedule panel are folds of those responses, kept as pure logic in `now-next-programs.ts` (`docs/adr/0065-media-workspace-asks-for-what-it-draws.md`) and `todays-schedule.ts`, each with a `.check.mts`.

`mock-data.ts` still holds R&D placeholder data, but only `quickActions` is read by a widget (`QuickActionsCard`); the other exports (`recentAlerts`, `channelTypes`, `channelStatusRows`, `topPerformingChannels`) are not used by any component.

- `components/` — page-specific widgets composed by `OverviewDashboard`: `StatCardsRow`, `ProgramStatusCards`, `RecentAlertsCard`, and `LowerOverview` (today's schedule, activity, `QuickActionsCard`). `AIAssistantCard` exists but is not mounted by the dashboard.
- `now-next-programs.ts`, `todays-schedule.ts` — the pure folds described above
- `mock-data.ts` — placeholder data (see above)
