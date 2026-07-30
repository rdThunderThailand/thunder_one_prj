# overview

The Overview dashboard (landing page at `/`) — a page-specific composition of widgets pulled from across `assets`, `channels`, `playlists`, and future `publications`/`monitoring` features.

`mock-data.ts` holds R&D placeholder data. There's no backend yet, so nothing here fetches real data — replace with real service calls once the underlying features exist.

Some widgets (Campaigns, Alerts, Top Performing Channels view-counts, AI Media Assistant) reflect the full product mockup, which spans Phase 2–5 of the roadmap, not just the Phase 1 MVP scope — see `CONTEXT.md` and `docs/adr/` at the repo root for the phasing decisions. They're built here as UI only.

- `components/` — page-specific widgets (StatCardsRow, RecentAlertsCard, ChannelDistributionCard, ChannelStatusCard, TopPerformingChannelsCard, NowNextPublicationsCard, QuickActionsCard, AIAssistantCard) composed by `OverviewDashboard`
- `mock-data.ts` — placeholder data, no backend yet
