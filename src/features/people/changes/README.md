# people/changes

Change-request roster + approve/reject detail panel (`/people/changes`) — HR Manager's
"การเปลี่ยนแปลง" page. Nests under `people/` per
`docs/adr/0034-feature-folders-nest-under-app.md`.

> R&D placeholder — mock data, no backend yet.

- `components/`
  - `ChangesPage` — owns `activeTab`, `selectedId`, and `statusOverrides` (one approve/reject
    override per change id) state; everything else below is presentational. Defaults `selectedId`
    to `"c-1"` (ณิชา รัตนกุล), matching the reference mockup's initial screenshot.
  - `ChangesHeader` — title + Export/Create-change actions, both inert
  - `ChangesStatTilesRow` — 5 tiles (total + one per status)
  - `ChangesTabs` — **real**, client-side filtering by resolved status (an approved/rejected row
    moves tabs immediately) — same pattern as `people/personnel`'s `PersonnelTabs`
  - `ChangesFilterBar` — search + type/unit/date/status filters + view toggle, all inert, same
    convention as `people/personnel`'s `PersonnelFilterBar`
  - `ChangeTableControls` — decorative pagination, single page (8 rows), same as
    `people/new-hires`'s `NewHireTableControls`
  - `ChangeTable` — **real row selection** (click opens the row in `ChangeDetailPanel`, same
    "select, don't navigate" pattern as `people/org-structure`'s chart nodes and
    `people/new-hires`'s table). Exports `statusBadge`, reused by the detail panel so both stay in
    sync on label/color.
  - `ChangeDetailPanel` — **real, working Approve/Reject** — client-local state only, not persisted
    or reflected in this page's stat tiles/tabs, same discipline as
    `asset-intelligence/departments`'s `RequestsPage`. The buttons only render while
    `resolvedStatus === "pending-approval"`; approving sets the override to `"completed"`,
    rejecting to `"cancelled"`. Its other two tabs (กระบวนการอนุมัติ/ประวัติการดำเนินการ) share the
    same "no data for this tab" placeholder used across this App wherever a mockup didn't show that
    tab's content.
- `mock-data.ts` — `changeTabs`/`changeStatTiles` carry the mockup's own header counts (8/3/3/1/1/0)
  as static labels; they do **not** update when a row is approved/rejected (same "mockup number vs.
  small sample" gap documented in `people/personnel`'s mock-data.ts). Only `"c-1"`'s row has a
  `note` and a full `before`/`after` snapshot — the mockup's own verified detail-panel example;
  every other row's panel falls back to a plain `fromValue → toValue` line — see the type's own
  comment.

**Not built yet**: every dropdown filter, search, sort, pagination, row checkbox/actions,
Export/Create Change, and the detail panel's other two tabs.
