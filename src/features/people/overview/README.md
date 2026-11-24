# people/overview

HR Manager's landing page for the new **People** App (`/people`, `config/apps.tsx`) — headcount,
onboarding, org changes, and departures at a glance. Nests under `people/` per
`docs/adr/0034-feature-folders-nest-under-app.md`.

> Built from a set of Thai-language mockup screenshots (Overview + 7 other screens). All 8 are now
> built; only ติดต่อ HR (Contact HR — no mockup exists for it) is still wired inert in
> `config/nav/people.tsx`.
>
> **Real since 2026-09-15** for most of this page: `StatTilesRow`/`OnboardingStatusCard`/
> `OrgStructureCard`/`PersonnelBreakdownCard`/`TenureDistributionCard`/`TodayActivityCard` all read
> from the same real roster/org-tree/audit-log fetches (`../core-mapper.ts`'s
> `computeOverviewStats`, `services/dashboard-api.ts`'s `getRecentLogs`). **2026-09-16**: a mock-data
> audit found `StatTilesRow` still showing 2 fabricated tiles (การเปลี่ยนแปลง/ออกจากองค์กร, hardcoded
> "3"/"2") and a synthetic Workforce Health score (92%) as if real, plus a whole card
> (`AttentionListCard`) of fabricated people. All three were removed rather than fixed to show mock
> more honestly — see below for exactly what's left real vs. genuinely blocked.

- `components/`
  - `OverviewPage` — composes everything below, same shape as `asset-intelligence/departments`'s
    `ManagerMissionControlPage`
  - `OverviewHeader` — greeting + Report/Export (inert — no export/report backend yet) +
    **real** "เพิ่มคน / เชิญคน", a `Link` to `/people/add` (`people/add-person`'s type picker,
    2026-09-01 — see that feature's README)
  - `StatTilesRow` — **real**, 3 tiles (จำนวนบุคลากรทั้งหมด/เข้าใหม่ (เดือนนี้)/กำลัง Onboarding). The
    2 tiles this row used to show for การเปลี่ยนแปลง/ออกจากองค์กร (hardcoded numbers) and the
    Workforce Health ring (a synthetic composite score) were removed 2026-09-16 — no
    change-request/offboarding entity exists in Core to back the former (proposed separately as new
    Core entities, see `people/changes`/`people/departures`), and Workforce Health had no real
    formula design behind it at all, not just missing data. No tile shows a fabricated
    month-over-month delta either — that needs a historical snapshot mechanism Core doesn't have yet
    (also proposed separately).
  - `OnboardingStatusCard` — real, summary counts + per-person progress bars
  - `TodayActivityCard` — **real since 2026-09-15**: `services/dashboard-api.ts`'s `getRecentLogs()`
    reads Core's `GET /tenants/:id/dashboard` (`recentLogs`, from `audit_events` — a generic
    tenant-wide system audit trail, also used by asset/device features), filtered to today by
    `app/.../people/page.tsx`. The old mock's Onboarding/Change/Meeting/Training/Offboarding tag
    taxonomy didn't carry over — Core has no such concept, so each row now shows a plain
    action/description pair instead of a fabricated color category.
  - `OrgStructureCard` — real, department headcount list (a summary of what `people/org-structure`'s
    org chart shows in full — see that feature's own README)
  - `PersonnelBreakdownCard` — real, Employee/Contractor/Partner/Guest donut, reuses `DonutChart`
  - `TenureDistributionCard` — real, tenure-band bar chart, introduces `components/ui/BarChart` (no
    bar chart primitive existed yet; built to match `DonutChart`/`LineTrendChart`'s Recharts-wrapper
    pattern)
  - `QuickActionsRow` — 6 shortcut buttons, all inert this sprint (no target pages yet)
  - `AttentionListCard` ("งานที่ต้องให้ความสนใจ") — **removed 2026-09-16**. Every row was fabricated
    person data (names, descriptions, due dates) with no real "attention items"/cross-App task
    concept in Core to back any of it.
- `mock-data.ts` — one static export per still-mock card. Semantic fields only (`status`, `color`,
  `tag` keys) — components own the color/icon mapping, not the data, same discipline as
  `asset-intelligence/departments`'s `ManagerAttentionItem`.

Every other `people/*` page mocked up so far is built — `people/personnel` (บุคลากร),
`people/org-structure` (โครงสร้างองค์กร), `people/new-hires` (เข้าใหม่), `people/changes`
(การเปลี่ยนแปลง), `people/departures` (ออกจากองค์กร), `people/policy` (นโยบาย), and
`people/knowledge-base` (คลังความรู้) — see those features' own READMEs (the latter 4 are still
fully mock, no Core entity exists for any of them). This page's "ดูทั้งหมด" links into each of them
are still inert (no drill-down target chosen yet), same convention as any other unbuilt affordance.
