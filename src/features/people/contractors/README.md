# people/contractors

The standalone contractor roster (`/people/contractors`) — HR Manager's "ผู้ปฏิบัติงานภายนอก
(Contractor)" page. Nests under `people/` per `docs/adr/0034-feature-folders-nest-under-app.md`.
Built 2026-09-01 from the FigJam "People Workspace" board — a brand-new page and nav item, distinct
from `people/add-person`'s Contractor **intake wizard** (`/people/add/contractor`) — this page is
the roster/management view of contractors already in the org, not the flow that creates one.

> **Fully mock, no Core integration.** Core has neither `member_type` (so real Core rows can't be
> reliably filtered to "contractor" — same limitation `people/personnel`'s `core-mapper.ts` already
> documents for its own type badge, confirmed 2026-08-28,
> `docs/people/core-response-people-workspace-api.md`) nor any of this page's contract-specific
> fields (contracting company, internal coordinator, contract start/end dates) at all. If Core ever
> ships `member_type` + contract fields, this feature needs re-pointing at real data, not extending
> its current mock shape.

- `mock-data.ts` — `contractorRows` (8 rows matching the mockup); `contractorStatTiles`/
  `contractorTabs` carry the mockup's own header numbers (48 total, etc.) — **not** derived from
  `contractorRows`, same "mockup number vs. small sample" gap every other people/* mock-data.ts
  documents for itself.
- `components/`
  - `ContractorsPage` — table + tabs + stat-tiles shape borrowed from `people/personnel`'s
    `PersonnelPage`, but with a **right-side filter panel** (`ContractorFilterPanel`) instead of a
    per-row detail view — matches the mockup's own 4th screen, unlike `people/positions`' Org
    Structure-style master/detail.
  - `ContractorsHeader` — breadcrumb (หน้าหลัก › ผู้ปฏิบัติงานภายนอก, matching the mockup's own) +
    **real** "+ เพิ่มผู้ปฏิบัติงานภายนอก", a `Link` to `/people/add/contractor`
    (`people/add-person`'s already-built wizard).
  - `ContractorStatTilesRow` — 5 plain tiles, all mock.
  - `ContractorTabs` — real client-side filtering by `ContractorStatus`, same pattern as
    `people/personnel`'s `PersonnelTabs`.
  - `ContractorTable` — the roster table (person, company, role/unit, internal coordinator,
    contract dates, status badge, inert view/more actions).
  - `ContractorFilterPanel` — search + 4 dropdowns + 2 date filters + decorative ค้นหา/ล้างตัวกรอง
    buttons, all inert, same "renders inert" convention as every other unbuilt filter in this app.

**Not built yet**: every filter/search on `ContractorFilterPanel`, sort, pagination, row actions,
and any real link between a contractor created via `people/add-person`'s wizard and this roster
(that wizard's real Core row instead hands off into `people/new-hires`' Kanban board — this page
stays fully mock, deliberately not wired to that handoff, since prepending a fabricated
`ContractorRow` here would misrepresent contract-specific fields Core doesn't actually have).
