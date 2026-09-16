# people/departures

Departures roster + offboarding detail panel (`/people/departures`) — HR Manager's
"ออกจากองค์กร" page. Nests under `people/` per
`docs/adr/0034-feature-folders-nest-under-app.md`.

> R&D placeholder — mock data, no backend yet.

- `components/`
  - `DeparturesPage` — owns `activeTab` (status filter) and `selectedId` (which row's detail panel
    is open) state; everything else below is presentational. Defaults `selectedId` to `"d-1"`
    (สมชาย วงศ์ดี), matching the reference mockup's initial screenshot.
  - `DeparturesHeader` — title + Export/Start-offboarding actions, both inert
  - `DeparturesStatTilesRow` — 5 tiles (total + one per status)
  - `DeparturesTabs` — **real**, client-side filtering by `DepartureStatus` — same pattern as
    `people/personnel`'s `PersonnelTabs`
  - `DeparturesFilterBar` — search + 4 dropdown filters + view toggle, all inert, same convention as
    `people/personnel`'s `PersonnelFilterBar`
  - `DepartureTableControls` — decorative pagination, single page (7 rows), same as
    `people/new-hires`'s `NewHireTableControls`
  - `DepartureTable` — **real row selection** (click opens the row in `DepartureDetailPanel`, same
    pattern as `people/new-hires`'s table). A cancelled row (`"d-7"`) shows "-" instead of an exit
    date/progress bar, matching the mockup. Exports `departureStatusBadge`, reused by the detail
    panel so both stay in sync.
  - `DepartureDetailPanel` — meta + overall-progress bar + the 10-step offboarding checklist +
    two inert action buttons. Steps are **3-state** (`done`/`current`/`pending`, not just 2 like
    `people/new-hires`'s onboarding checklist) — `StepMarker` renders a green check, a hollow blue
    ring, or a hollow gray ring respectively. The "เสร็จสิ้น X จาก 10" line is **computed from the
    rendered `steps` array**, same fix as `people/new-hires`'s `NewHireDetailPanel` (this mockup's
    own summary text, 6/10, didn't match its own checklist either — 3 done + 1 current here).
- `mock-data.ts` — `departureTabs`/`departureStatTiles` carry the mockup's own header counts
  (7/4/2/1/0); real per-row `status` only sums to 4/2 across in-progress/due-soon (with 1
  completed, 0 cancelled matching exactly), same "mockup number vs. small sample" gap
  `people/personnel`'s mock-data.ts documents for itself. Row `"d-1"`'s exact 3-done-then-current
  step sequence with real completion dates is the mockup's own verified example; every other row's
  is derived from its `progress` percentage by `buildSequentialSteps()` (first N steps done, next
  one current, rest pending) — a simplification, not a second verified example, and it skips
  per-step dates entirely rather than inventing them.

**Not built yet**: every dropdown filter, search, sort, pagination, row checkbox/actions,
Export/Start Offboarding, and the detail panel's other three tabs (ขั้นตอน/รายละเอียด/เอกสาร) and
its two action buttons.
