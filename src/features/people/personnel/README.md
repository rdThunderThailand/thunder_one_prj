# people/personnel

The full org roster (`/people/personnel`) — HR Manager's "บุคลากร" page, one level under People
Workspace's Overview (`people/overview`). Nests under `people/` per
`docs/adr/0034-feature-folders-nest-under-app.md`.

> **Real data as of 2026-08-28** for the roster itself — `services/members-api.ts` reads Core's
> `GET /tenants/:id/members`, contract confirmed directly with Core (see
> `docs/people/core-response-people-workspace-api.md` and `core-mapper.ts`'s own comment for what
> that means/doesn't mean). Everything else — stat tiles, tabs' meaning, every dropdown filter — is
> still mock/decorative; see below for exactly which.
>
> **2026-09-01**: `AddPersonModal` (the in-page "เพิ่มคน" wizard) has been retired — "เพิ่มบุคลากร"
> (`PersonnelHeader`) now links to `people/add-person`'s full-page type-picker
> (`/people/add`), matching the FigJam "People Workspace" board's redesign. See that feature's own
> README. `PersonnelPage` no longer owns any add-person state. Same redesign also replaced the
> stat-tiles row and tabs — see below.

- `services/members-api.ts` — server-only, same shape as
  `asset-intelligence/assets/services/asset-list-api.ts` (reads the session cookie's bearer token
  via `get-session.ts`'s `getAuthToken()`, passed in explicitly; fails open to `null` on any
  transport/HTTP/shape failure). **Not** the same envelope as `asset-list-api.ts` — Core's shape
  here is `{ data: { data: [...], count } }` with `page`/`limit` pagination (default 8, max 100),
  not `pageSize`. Only `?search=` is a real filter today.
- `core-mapper.ts` — `mapCoreMember()` maps a Core row to this feature's `PersonnelRow` (the same
  shape `PersonnelTable` already rendered for mock data, so no component changes were needed to
  wire real data in). Two fields are placeholders, not real data, and documented as such in the
  function's own comment: `type` is always `"employee"` (Core has no `member_type` column yet —
  confirmed 2026-08-28), and `managerName`/`managerRole` are always `null` (`manager_id` isn't in
  Core's org-units select list yet either). `unit` resolves `default_department_id` against
  `org-structure`'s mapped tree, passed in from the app route.
- `components/`
  - `PersonnelPage` — takes `rows`/`totalCount` as props (fetched server-side by
    `app/.../people/personnel/page.tsx`) instead of importing mock data directly; `rows === null`
    (Core fetch failed, or no session/tenant resolved) renders an explicit error message rather
    than silently falling back to mock content — same discipline as
    `asset-intelligence/assets`'s `AllAssetsPage`. `activeTab` now selects a **view** (see
    `PersonnelTabs` below), not a type filter — the roster table itself is never filtered by
    `PersonnelType` anymore (every real row's `type` defaults to `"employee"` anyway, see
    `core-mapper.ts` above).
  - `PersonnelHeader` — title + Export/Import (inert) + **real** "เพิ่มบุคลากร", a `Link` to
    `/people/add` (`people/add-person`'s type picker)
  - `PersonnelStatTilesRow` — 5 tiles: **พนักงานทั้งหมด is real** (takes Core's `totalCount` as a
    prop instead of a mock string); ผู้ปฏิบัติงานภายนอก/เข้าใหม่ (เดือนนี้)/ออกจากองค์กร (เดือนนี้)
    stay mock (no Core aggregate endpoint for any of them); อัตราการคงอยู่ is a `DonutChart` ring,
    same pattern as `people/overview`'s Workforce Health tile — also mock.
  - `PersonnelTabs` — 5 **view** tabs (รายชื่อบุคลากร/พนักงานตามหน่วยงาน/พนักงานตามตำแหน่ง/
    สถานะการจ้างงาน/พนักงานทดลองงาน), replacing the old type-filter tabs. Only "รายชื่อบุคลากร"
    (the default) has any mockup content — it's today's real table; the other 4 render the same
    "ยังไม่มีข้อมูลสำหรับแท็บนี้" placeholder `people/org-structure`'s `OrgStructurePage` already
    uses for its own unbuilt view tabs, same convention.
  - `PersonnelFilterBar` — **real** search (pushes `?search=` via `next/navigation`, committed on
    Enter/blur so it isn't a request per keystroke) + 5 dropdown filters that stay decorative (Core
    has no server-side filter for status/department/team/type/work-status yet — flag if/when
    needed, per Core's own offer)
  - `PersonnelTableControls` — `shownCount`/`totalCount` are real (Core's `count`); page-turning
    itself is still decorative — Core's list is fetched one page of up to 100 at a time server-side,
    not wired to these buttons
  - `PersonnelTable` — the roster table (person, employee code, position, unit, type badge, status
    dot, start date, manager, actions) — unchanged, since `core-mapper.ts` maps into the exact shape
    it already rendered
- `mock-data.ts` — `personnelViewTabs`/`personnelStatTiles`/`personnelRetentionRate` carry the
  mockup's own numbers for the 4 mock tiles above; `personnelRows` is (re-exported via `index.ts`)
  also `people/add-person`'s source for its ตำแหน่งงาน/ผู้บังคับบัญชา picker options.

**Not built yet**: every dropdown filter except search, sort, real pagination, row actions
(view/edit/more), Export/Import. Contractor/Partner/Guest intake has no flow at all since
`AddPersonModal` was retired — no FigJam mockup exists for those yet (see `people/add-person`'s
README). Reachable from `config/nav/people.tsx`'s บุคลากร item, a live link.
