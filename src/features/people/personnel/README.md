# people/personnel

The full org roster (`/people/personnel`) — HR Manager's "บุคลากร" page, one level under People
Workspace's Overview (`people/overview`). Nests under `people/` per
`docs/adr/0034-feature-folders-nest-under-app.md`.

> **Real data as of 2026-08-28** for the roster itself — `services/members-api.ts` reads Core's
> `GET /tenants/:id/members`, contract confirmed directly with Core (see
> `docs/people/core-response-people-workspace-api.md` and `core-mapper.ts`'s own comment for what
> that means/doesn't mean).
>
> **2026-09-01**: `AddPersonModal` (the in-page "เพิ่มคน" wizard) has been retired — "เพิ่มคน"
> (`PersonnelHeader`) now links to `people/add-person`'s full-page type-picker (`/people/add`),
> matching the FigJam "People Workspace" board's redesign. `PersonnelPage` no longer owns any
> add-person state.
>
> **Redesigned 2026-09-15** to match the coordinating session's mockup — categorized the same way
> as `people/org-structure`'s redesign into "doable now from data already fetched" vs. "needs new
> Core data", then implemented everything in the first group. See below for exactly what's real vs.
> still mock/blocked.

- `services/members-api.ts` — server-only, same shape as
  `asset-intelligence/assets/services/asset-list-api.ts` (reads the session cookie's bearer token
  via `get-session.ts`'s `getAuthToken()`, passed in explicitly; fails open to `null` on any
  transport/HTTP/shape failure). **Not** the same envelope as `asset-list-api.ts` — Core's shape
  here is `{ data: { data: [...], count } }` with `page`/`limit` pagination, not `pageSize`.
  Fetches `limit: 100` in one call (Core's own endpoint already returns "all" for realistic tenant
  sizes) so tabs/filters/pagination below can all run client-side against the full roster, same
  pattern as `new-hires`/`contractors`. `?search=` is the one real server-side filter.
- `core-mapper.ts` — `mapCoreMember()` maps a Core row to this feature's `PersonnelRow`.
  - `type` is always `"employee"` (Core has no `member_type` column yet — confirmed 2026-08-28) and
    `managerName`/`managerRole` are always `null` (`manager_id` isn't in Core's org-units select
    list yet either) — still placeholders, documented in the function's own comment.
  - `tenureLabel` ("N ปี M เดือน" since `start_date`), `avatarUrl` (real `user.avatar_url` — almost
    always `null` in practice since this app has no photo-upload feature anywhere yet, but the
    field itself is real), and `probationEndDate` (real `probation_end_date`, confirmed already in
    Core's `MEMBER_SELECT` — same "frontend type hadn't caught up" gap as `member_type`/
    `start_date` before it) were all added 2026-09-15.
  - `isOnProbation(probationEndDate, now)` — exported single source of truth for "on probation"
    (compares to today rather than storing a separate boolean), used by both the table's status
    badge and the probation tab's filter.
  - `unit` resolves `default_department_id` against `org-structure`'s mapped tree, passed in from
    the app route.
- `export-csv.ts` — **real** since 2026-09-15, `exportPersonnelCsv(rows)`. Blob + temporary
  `<a download>`, no new dependency, same pattern used elsewhere in this app for CSV export.
- `components/`
  - `PersonnelPage` — takes `rows`/`totalCount`/`tenantId`/`units` as props (fetched server-side by
    `app/.../people/personnel/page.tsx`); `rows === null` renders an explicit error message rather
    than silently falling back to mock content — same discipline as `asset-intelligence/assets`'s
    `AllAssetsPage`. Owns all filter/tab/pagination/view state and does the client-side
    filtering/grouping/slicing against the one fetched roster. `?department=<unitId>` (from
    `org-structure`'s "ดูบุคลากรในหน่วยงานนี้" action) is a real exact-match filter, independent of
    the หน่วยงาน dropdown below (the two combine rather than conflict).
  - `PersonnelHeader` — title + **real Export** (`exportPersonnelCsv`) + **real "เพิ่มคน"** (`Link`
    to `/people/add`); "รายงาน" stays inert (no report concept exists). "นำเข้า (Import)" was
    dropped — not in the 2026-09-15 mockup.
  - `PersonnelStatTilesRow` — 5 tiles, **3 real as of 2026-09-15**: พนักงานทั้งหมด (Core's
    `totalCount`), ผู้ปฏิบัติงานภายนอก and เข้าใหม่ (เดือนนี้) (both computed client-side from the
    fetched roster). ออกจากองค์กร (เดือนนี้) shows an explicit "-" (no offboarding entity exists in
    Core at all — same gap as `/people/departures`) rather than a fabricated count. อัตราการคงอยู่
    stays a mock `DonutChart` ring (`personnelRetentionRate` in `mock-data.ts`), same pattern as
    `people/overview`'s Workforce Health tile — blocked on the same missing entity, deliberately
    left untouched in this redesign per the coordinating session's instruction. Neither tile shows
    a month-over-month delta (no historical snapshot mechanism exists in Core at all).
  - `PersonnelTabs` / `mock-data.ts`'s `personnelViewTabs` — **all 5 real as of 2026-09-15**:
    รายชื่อบุคลากร (the table/grid roster), พนักงานตามหน่วยงาน / พนักงานตามตำแหน่ง /
    สถานะการจ้างงาน (each a `PersonnelGroupedView` — grouped counts over the real roster; clicking a
    group jumps back to รายชื่อบุคลากร pre-filtered to it), and พนักงานทดลองงาน (the roster filtered
    to `isOnProbation`).
  - `PersonnelGroupedView` (new) — reusable `{rows, groupBy, labelFor?, onSelectGroup}` component
    backing the 3 grouped tabs above.
  - `PersonnelFilterBar` — **real** search (pushes `?search=` via `next/navigation`, committed on
    Enter/blur) + **real client-side dropdowns** for หน่วยงาน/ตำแหน่ง/ประเภทบุคลากร/
    สถานะการทำงาน (options derived from the fetched roster) + **real list/grid view toggle** +
    **real รีเซ็ต**. "ทีม" was dropped entirely — no Core column for it, same gap flagged everywhere
    else "ทีม" comes up in this app. "ตัวกรองเพิ่มเติม" stays inert (not built).
  - `PersonnelTable` / `PersonnelGridView` (grid is new) — row-number `#`, avatar (real `src`,
    falls back to initials), combined สถานะการจ้างงาน cell (probation badge + account-status dot),
    วันที่เริ่มงาน with tenure underneath, and 👁 (view) / ✏️ (edit) row actions — both real; the "⋮"
    overflow menu stays inert. Dropped the old checkbox column and ผู้จัดการ (manager) column —
    neither is in the 2026-09-15 mockup, and manager data was always `null` anyway (see
    `core-mapper.ts` above).
  - `ViewPersonnelModal` (new) — read-only detail modal (avatar, type/status/probation badges,
    รหัสพนักงาน/ตำแหน่ง/หน่วยงาน/วันที่เริ่มงาน+tenure) with a "แก้ไขข้อมูล" button handing off to
    `EditPersonnelModal`.
  - `EditPersonnelModal` — unchanged in this redesign phase; `department`/`job_title`/`start_date`
    are real (`PATCH /tenants/:id/members/:memberId`, confirmed live on Core's side — see
    `docs/people/edit-member-department-job-title-field-requirements.md`), pre-populated correctly
    whether opened from the table's ✏️ or the view modal's "แก้ไขข้อมูล".
  - `PersonnelTableControls` — **real client-side pagination** as of 2026-09-15 (page-size
    selector, prev/next with real disabled states, `{page} / {totalPages}` indicator — not
    individually clickable page-number buttons, a simplification from the mockup's own
    description). Slices the already-fetched (and filtered) roster rather than a fresh Core
    round-trip per page, since the tab/filter views above need the full roster in memory anyway —
    see the component's own comment.
- `mock-data.ts` — `personnelRetentionRate` is the one remaining mock export (see
  `PersonnelStatTilesRow` above); `personnelRows` is (re-exported via `index.ts`) also
  `people/add-person`'s source for its ตำแหน่งงาน picker options. The old `PersonnelStatTile`/
  `personnelStatTiles` and `personnelTotalCount`/`personnelPageSize`/`personnelTotalPages` exports
  were removed 2026-09-15, superseded by the real computations above.

**Not built yet / blocked on Core** (no historical snapshot or offboarding entity exists in Core at
all): month-over-month delta on the พนักงานทั้งหมด/เข้าใหม่ tiles, ออกจากองค์กร (เดือนนี้)'s real
count, อัตราการคงอยู่'s real value. "ตัวกรองเพิ่มเติม" and the "⋮" row-action menu are inert
placeholders, not Core-blocked — just not designed/built yet. Contractor/Partner/Guest intake has no
flow at all since `AddPersonModal` was retired — no FigJam mockup exists for those yet (see
`people/add-person`'s README). Reachable from `config/nav/people.tsx`'s บุคลากร item, a live link.
