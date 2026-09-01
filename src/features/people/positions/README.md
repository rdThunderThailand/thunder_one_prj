# people/positions

The org's position roster + master/detail panel (`/people/positions`) — HR Manager's "ตำแหน่งงาน"
page. Nests under `people/` per `docs/adr/0034-feature-folders-nest-under-app.md`. Built
2026-09-01 from the FigJam "People Workspace" board — a brand-new page and nav item, not a redesign
of anything that existed before.

> **Fully mock, no Core integration at all.** `docs/people/requirements-people-workspace-api.md`
> confirms `position` is just a free-text string on a Membership — no standalone position entity
> exists in Core's schema, same reason `people/org-structure`'s `positionsCount`/`fillRate` are
> already documented as unavailable from Core. If Core ever ships a real positions/headcount entity,
> this feature needs re-pointing at it, not extending its current mock shape.

- `mock-data.ts` — `positionRows` (8 rows matching the mockup, Sales Manager/POS-001 …
  Accountant/FIN-001); `positionStatTiles`/`positionFillRate`/`positionLevelBars` carry the
  mockup's own header numbers (128 total, 90.6% fill rate, 23/38/22 by level) — **not** derived
  from `positionRows`, same "mockup number vs. small sample" gap every other people/* mock-data.ts
  documents for itself; `positionTabs`.
- `components/`
  - `PositionsPage` — same master/detail shape as `people/org-structure`'s `OrgStructurePage`:
    tabs filter `positionRows` by status client-side, a `PositionTable` (`lg:col-span-3`) selects
    into a `PositionDetailPanel` (`lg:col-span-2`).
  - `PositionsHeader` — title + Report/Export/"เพิ่มตำแหน่งงาน", all inert (no backend, no create
    flow).
  - `PositionStatTilesRow` — 3 plain tiles + a fill-rate donut (reusing `DonutChart`'s
    score/remainder pattern like `people/overview`'s Workforce Health tile) + a small
    level-breakdown `BarChart` (reusing the same primitive `people/overview/TenureDistributionCard`
    introduced).
  - `PositionTabs` — real client-side filtering by `PositionStatus`, same pattern as
    `people/personnel`'s `PersonnelTabs`.
  - `PositionFilterBar` — search + 3 dropdowns, all inert, same convention as
    `people/personnel`'s `PersonnelFilterBar`.
  - `PositionTable` — real row selection (click opens `PositionDetailPanel`, same "select, don't
    navigate" pattern as `people/org-structure`'s chart nodes / `people/new-hires`' old table).
  - `PositionDetailPanel` — same `Card`/`DetailRow` (`dt`/`dd`) shape as
    `people/org-structure`'s `OrgDetailPanel`: position info, headcount/fill-rate progress bar,
    current holder, inert action buttons.

**Not built yet**: every dropdown filter/search, sort, pagination, row actions, Report/Export,
"เพิ่มตำแหน่งงาน" (no create-position flow — Core has nothing to create), and every detail-panel
action button.
