# people/overview

HR Manager's landing page for the new **People** App (`/people`, `config/apps.tsx`) — headcount,
onboarding, org changes, and departures at a glance. Nests under `people/` per
`docs/adr/0034-feature-folders-nest-under-app.md`.

> R&D placeholder — mock data, no backend yet, built from a set of Thai-language mockup screenshots
> (Overview + 7 other screens). All 8 are now built; only ติดต่อ HR (Contact HR — no mockup exists
> for it) is still wired inert in `config/nav/people.tsx`.

- `components/`
  - `OverviewPage` — composes everything below, same shape as `asset-intelligence/departments`'s
    `ManagerMissionControlPage`
  - `OverviewHeader` — greeting + Report/Export (inert — no export/report backend yet) +
    **real** "เพิ่มคน / เชิญคน", a `Link` to `/people/add` (`people/add-person`'s type picker,
    2026-09-01 — see that feature's README)
  - `StatTilesRow` — 5 plain metric tiles + a Workforce Health ring tile (reuses `DonutChart` with a
    score/remainder 2-segment pie rather than a bespoke ring SVG)
  - `AttentionListCard` — "งานที่ต้องให้ความสนใจ", one row per person with a status badge and due date
  - `OnboardingStatusCard` — summary counts + per-person progress bars
  - `TodayActivityCard` — today's timeline, tagged Onboarding/Change/Meeting/Training/Offboarding
  - `OrgStructureCard` — department headcount list (a summary of what `people/org-structure`'s org
    chart shows in full — see that feature's own README)
  - `PersonnelBreakdownCard` — Employee/Contractor/Partner/Guest donut, reuses `DonutChart`
  - `TenureDistributionCard` — tenure-band bar chart, introduces `components/ui/BarChart` (no bar
    chart primitive existed yet; built to match `DonutChart`/`LineTrendChart`'s Recharts-wrapper
    pattern)
  - `QuickActionsRow` — 6 shortcut buttons, all inert this sprint (no target pages yet)
- `mock-data.ts` — one static export per card. Semantic fields only (`status`, `color`, `tag`
  keys) — components own the color/icon mapping, not the data, same discipline as
  `asset-intelligence/departments`'s `ManagerAttentionItem`.

Every other `people/*` page mocked up so far is built — `people/personnel` (บุคลากร),
`people/org-structure` (โครงสร้างองค์กร), `people/new-hires` (เข้าใหม่), `people/changes`
(การเปลี่ยนแปลง), `people/departures` (ออกจากองค์กร), `people/policy` (นโยบาย), and
`people/knowledge-base` (คลังความรู้) — see those features' own READMEs. This page's "ดูทั้งหมด"
links into each of them are still inert (no drill-down target chosen yet), same convention as any
other unbuilt affordance.
