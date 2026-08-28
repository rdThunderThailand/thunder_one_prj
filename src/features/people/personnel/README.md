# people/personnel

The full org roster (`/people/personnel`) — HR Manager's "บุคลากร" page, one level under People
Workspace's Overview (`people/overview`). Nests under `people/` per
`docs/adr/0034-feature-folders-nest-under-app.md`.

> **Real data as of 2026-08-28** for the roster itself — `services/members-api.ts` reads Core's
> `GET /tenants/:id/members`, contract confirmed directly with Core (see
> `docs/people/core-response-people-workspace-api.md` and `core-mapper.ts`'s own comment for what
> that means/doesn't mean). Everything else — stat tiles, tabs' meaning, every dropdown filter,
> `AddPersonModal`'s actual submit — is still mock/decorative; see below for exactly which.

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
  - `PersonnelPage` — now takes `rows`/`totalCount` as props (fetched server-side by
    `app/.../people/personnel/page.tsx`) instead of importing mock data directly; `rows === null`
    (Core fetch failed, or no session/tenant resolved) renders an explicit error message rather
    than silently falling back to mock content — same discipline as
    `asset-intelligence/assets`'s `AllAssetsPage`. Still owns `addedRows` (people added via
    `AddPersonModal`, client-local, prepended ahead of the fetched rows, never persisted — same
    discipline as `asset-intelligence/departments`'s `RequestsPage`) and the modal's open/close
    state; filters the combined list by `PersonnelTab["id"]` before handing it to `PersonnelTable`.
    Since every real row's `type` defaults to `"employee"` (see `core-mapper.ts` above), only the
    ทั้งหมด/พนักงาน tabs show real rows today — พนักงานผู้รับเหมา/พันธมิตร/แขก only ever show
    client-locally-added ones, until Core ships `member_type`.
  - `PersonnelHeader` — title + Export/Import (inert) + **real** Add Personnel, opening
    `AddPersonModal`
  - `AddPersonModal` — the "เพิ่มคน" flow from the "เพิ่มคน / เพิ่มพนักงานใหม่ ต่างกันอย่างไร?"
    reference diagram: pick a `PersonnelType`, fill identity + type-specific access fields, confirm.
    Picking **Employee** doesn't continue this wizard — it shows a notice ("พนักงานควรเพิ่มผ่านหน้า
    'เข้าใหม่'", per the diagram's own guidance) with a link to `/people/new-hires`'s
    `AddEmployeeModal` instead. **Still writes to client-local state only, not Core's real
    `POST /tenants/:id/members`** — that endpoint requires a `role_code` (e.g.
    `"operator_technician"`) this app has no picker for and no way to know valid values for yet;
    wiring it is blocked on that, not on effort. Flagged to Core as a follow-up, not yet asked.
  - `PersonnelStatTilesRow` — 6 tiles (total + one per `PersonnelType`) — still mock/decorative;
    Core has no aggregate-by-type endpoint since `member_type` doesn't exist server-side
  - `PersonnelTabs` — client-side filtering by `PersonnelType` on whatever `rows` it's given (real
    + locally-added) — the filtering logic itself is real, but see `PersonnelPage`'s note above on
    why non-Employee tabs are effectively empty against real data today
  - `PersonnelFilterBar` — **real** search (pushes `?search=` via `next/navigation`, committed on
    Enter/blur so it isn't a request per keystroke) + 5 dropdown filters that stay decorative (Core
    has no server-side filter for status/department/team/type/work-status yet — flag if/when
    needed, per Core's own offer)
  - `PersonnelTableControls` — `shownCount`/`totalCount` are now real (Core's `count`); page-turning
    itself is still decorative — Core's list is fetched one page of up to 100 at a time server-side,
    not wired to these buttons
  - `PersonnelTable` — the roster table (person, employee code, position, unit, type badge, status
    dot, start date, manager, actions) — unchanged, since `core-mapper.ts` maps into the exact shape
    it already rendered
- `mock-data.ts` — still the source for `AddPersonModal`'s locally-created rows' shape,
  `personnelTabs`/`personnelStatTiles`'s org-wide totals (128/112/9/4/3/6), and (re-exported via
  `index.ts`) `AddEmployeeModal`'s (`people/new-hires`) ตำแหน่งงาน/ผู้จัดการ picker options — none of
  those three consumers were repointed at real data this round.

**Not built yet**: every dropdown filter except search, sort, real pagination, row actions
(view/edit/more), Export/Import, and `AddPersonModal`'s real submit (blocked on `role_code`, see
above). Reachable from `config/nav/people.tsx`'s บุคลากร item, a live link.
