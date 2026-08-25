# mission-control

The CEO / Owner's dashboard — organization-wide strategic overview (landing page at `/mission-control`). Composes `components/ui` primitives (`Card`, `Sparkline`, `ProgressBar`).

`mock-data.ts` derives its numbers from `asset-intelligence/assets`'s `getMockAssets()` and `thunder-care/work-orders`'s `getMockWorkOrders()` where possible rather than inventing separate fake data — there's no real cross-App insights backend yet (see requirement doc §4.1 CEO-01..05).

- `components/` —
  - `MissionControlPage` — the landing page, composing everything below (needs `userName` for the greeting — the route fetches it via `getSession()`)
  - `StrategicHeader` — the "Good morning, {name}" greeting + Customize button; time-of-day text is computed client-side
  - `StrategicBriefCard` — the five headline metrics (Organization Health, Key Priorities, Financial Snapshot, Engagement, Critical Risks) plus a short summary (CEO-01/CEO-02)
  - `NeedsAttentionCard` — operational status pings, not decisions (Communication campaign delays, Field Ops workload, critical assets) — a status ping, not a decision with evidence, same distinction the old `RecentAlertsCard` drew
  - `DecisionsCard` — items that need an explicit approve/reject (CEO-03); every "Review" button routes to the one real Approvals page rather than a per-item detail route — same "list page with inline Approve/Reject" pattern used everywhere else this sprint. The first item reuses `mockRecommendations` (the actual queue `ApprovalsPage` renders); the rest are narrative placeholders that route there too
  - `AskThunderOneCard` — a static preview of an AI assistant panel; no assistant backend exists, so the input is decorative
  - `TodayScheduleCard` — a static preview of the day's calendar; no calendar backend exists
  - `WorkspacesRow` — App tiles (from `config/apps`) plus a few inert "coming soon" tiles for Apps that don't exist yet
  - `ApprovalsPage` (CEO-04) — the full Approve/Reject queue, real working buttons + a lightweight "approved/rejected by you, just now" audit note, local state only
  - `InsightsPage` (CEO-05) — trends and cross-department benchmarks (reads `asset-intelligence/assets`'s `mockDepartments`, and `statCards` from this feature's own `mock-data.ts`)
  - `ReportsPage` (CEO-05) — a cross-department rollup table, no export (same as every other role's un-exportable Reports page) — distinct from `asset-intelligence/assets`'s own category-based Reports page (that's Asset Manager's operational lens, this is the CEO's organizational one)
- `mock-data.ts` — `statCards` (read by `InsightsPage`), `mockRecommendations`/`getMockRecommendations` (the real Approvals queue), `strategicBrief`, `attentionItems`, `decisionItems`, `askRecommendations`, `todaySchedule` — all derived from `asset-intelligence/assets` and `thunder-care/work-orders` where possible, no backend yet
