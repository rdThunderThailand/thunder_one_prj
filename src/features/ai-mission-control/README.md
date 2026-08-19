# ai-mission-control

The CEO / Owner's dashboard for Asset Intelligence — organization-wide asset risk and value overview (landing page at `/asset-intelligence/mission-control`). Composes `components/ui` primitives (`Card`, `Sparkline`, `ProgressBar`), same pattern as `features/overview`'s dashboard.

`mock-data.ts` derives its numbers from `ai-assets`'s `getMockAssets()`/`mockDepartments` rather than inventing separate fake data — there's no real insights/recommendation backend yet (see requirement doc §4.1 CEO-01..05).

- `components/` —
  - `MissionControlPage` — the landing page, composing the four below
  - `StatCardsRow` — the four top-line KPI tiles (CEO-01)
  - `RequiresAttentionCard` — recommendations with evidence (CEO-03); "Review recommendation" links to the full Approvals page rather than a per-item detail route, same "list page with inline Approve/Reject" pattern used everywhere else this sprint
  - `AssetOutlookCard` — warranty exposure / critical risk / maintenance cost trend / major incidents (CEO-02) — text matches the requirement doc's mockup exactly
  - `RecentAlertsCard` — the plain asset+severity+time feed (distinct from `RequiresAttentionCard` — a status ping, not a decision with evidence); this is what Sprint 1 originally mislabeled "Requires Your Attention", corrected 2026-08-19
  - `ApprovalsPage` (CEO-04) — the full Approve/Reject queue, real working buttons + a lightweight "approved/rejected by you, just now" audit note, local state only
  - `InsightsPage` (CEO-05) — trends and cross-department benchmarks (reads `ai-assets`'s `mockDepartments`)
  - `ReportsPage` (CEO-05) — a cross-department rollup table, no export (same as every other role's un-exportable Reports page) — distinct from `ai-assets`'s own category-based Reports page (that's Asset Manager's operational lens, this is the CEO's organizational one)
- `mock-data.ts` — `statCards`, `recentAlerts`, `mockRecommendations`, `assetOutlook` — all derived from `ai-assets` where possible, no backend yet
