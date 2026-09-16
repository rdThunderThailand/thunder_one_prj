# mission-control

The homepage — default landing content for CEO/Executive/company_admin/tenant/system roles (`/mission-control`, routed there via `resolveShellVariant`). Manager/Employee get separate variants from `asset-intelligence/departments`, untouched by this folder.

> **Redesigned 2026-09-16** to match the coordinating session's new homepage mockup, replacing the previous CEO-strategic-brief layout entirely. `mock-data.ts`'s `strategicBrief`/`attentionItems`/`decisionItems`/`askRecommendations`/`todaySchedule`/`nextUpEvents` and their components (`StrategicBriefCard`, `DecisionsCard`, `AskThunderOneCard`, `TodayScheduleCard`, the old `NeedsAttentionCard`, `StrategicHeader`) were all removed — none of that layout exists in the new design. `statCards`/`mockRecommendations` (read by `InsightsPage`/`ApprovalsPage`, both untouched) stay as-is.

- `components/` —
  - `MissionControlPage` — composes everything below; takes `userName` (greeting), `stats` (real, see `core-mapper.ts`), `recentLogs` (real, see `services/dashboard-api.ts`) as props from the route.
  - `HomeHeader` — greeting hero band. No skyline-photo asset exists in this app, so it's a gradient card rather than a literal image.
  - `BriefTeaserCard` — a static "ThunderOne Brief" teaser; no AI/insights backend exists, same honest-preview treatment the old `AskThunderOneCard` used.
  - `HomeStatTilesRow` — top 4 stat tiles. Only "บุคลากรเข้าใหม่" is real (`stats.newHiresThisMonth`); the other 3 (`topStatsMock`) stay mock — no "needs attention" asset status exists on a real Core asset, and neither Thunder Care nor Media Workspace has a real Core integration in this app for a request-approval or online-display count.
  - `WorkspaceCardsRow` — 3 bigger People/Asset/Media cards (real links to each App's `basePath`) plus "ดูทั้งหมด →" to the full `/work-space` launcher. Replaces this page's use of the old compact `WorkspacesRow` tile grid (that component was deleted — confirmed unused anywhere else first).
  - `OrgOverviewRow` — บุคลากรทั้งหมด/สินทรัพย์ทั้งหมด real (`stats`); จอแสดงผล/คำขอที่เปิดอยู่ mock (`orgOverviewMock`), same gap as above.
  - `ActivityFeedCard` — real, `GET /tenants/:id/dashboard`'s tenant-wide `recentLogs` (generic `audit_events`, not curated). `null` (fetch failed) and `[]` (loaded, genuinely empty) render distinct states.
  - `TasksCard` — "งานที่ต้องดำเนินการ", mock (`actionItems`) — no real cross-App task/approval-aggregation backend exists. Same idea the old `NeedsAttentionCard` had, restyled to the new dot+time-ago list.
  - `NewsCard` — "ข่าวสารและอัปเดต", static mock — no announcements/CMS backend exists anywhere in this app.
  - `HomeBanner` — the bottom dismissible banner; a real, working dismiss persisted to `localStorage` (not just decorative).
  - `ApprovalsPage` (CEO-04), `InsightsPage` (CEO-05), `ReportsPage` (CEO-05) — unrelated sub-routes (`/mission-control/{approvals,insights,reports}`), not touched by the 2026-09-16 redesign.
- `core-mapper.ts` — `computeHomeStats(memberRows, memberCount, totalAssets, now)`, the homepage's only real-data computation (People headcount/new-hires + Asset total). Not exported via `index.ts` (that barrel only exposes page components) — the app route imports it directly, same convention `people/overview`'s own `core-mapper.ts` uses.
- `services/dashboard-api.ts` — `getRecentLogs`, a second independent copy of `people/overview`'s own function calling the same tenant-wide `GET /tenants/:id/dashboard` endpoint — each feature owns its own `services/*-api.ts` rather than importing another feature's internal service file.
- `mock-data.ts` — `statCards`/`mockRecommendations` (unrelated, read by Insights/Approvals) plus the homepage's own mock exports (`briefTeaser`, `topStatsMock`, `orgOverviewMock`, `actionItems`, `newsItems`), each documented with exactly why it isn't real yet.
