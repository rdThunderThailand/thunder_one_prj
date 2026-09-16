# intelligence

Shell-level "Risk, insight, and recommendation rollups across every App" dashboard (landing page at `/intelligence`) — named after the Asset Intelligence requirement doc's "Intelligence Layer", promoted to shell-level (docs/adr/0033-thunder-one-shell-launcher-not-dropdown.md). No real cross-App insights backend exists yet.

`mock-data.ts` derives what it can from `thunder-care/work-orders`'s `getMockWorkOrders()`, the same convention `mission-control/mock-data.ts` uses, so the numbers agree across routes (e.g. the same overdue-work-order count backs both this page's "Field Operations workload high" insight and Mission Control's).

- `components/` —
  - `IntelligencePage` — the landing page, composing everything below
  - `IntelligenceHeader` — title + Customize button
  - `MetricsRow` — the six headline metric cards (Organization Health, Strategic Progress, Financial Snapshot, Engagement, Customer Sentiment, Operational Status), each a sparkline or a progress bar
  - `KeyInsightsCard` — a tinted, full-width "AI" strip with three short insight cards
  - `StrategicObjectivesCard` — four OKR-style rows with a status pill and a progress bar each
  - `PerformanceTrendCard` — a multi-series line chart (`components/ui/LineTrendChart`) plus three summary stats
  - `RiskRadarCard` — a two-series radar chart (`components/ui/RiskRadarChart`, current vs. last month) plus a high/medium risk count
  - `DepartmentOverviewRow` — four department tiles, each with a value and a sparkline
  - `AskThunderOneRail` — a static preview of an AI assistant panel; no assistant backend exists, so the input and suggestion chips are decorative
  - `DataSourcesCard` — a static list of connected systems
- `mock-data.ts` — `headlineMetrics`, `keyInsights`, `objectives`, `performanceTrend`, `riskRadar`, `departmentOverview`, `askSuggestions`, `dataSources` — all placeholder beyond the two derived counts noted above
