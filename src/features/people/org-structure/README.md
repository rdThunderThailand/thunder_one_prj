# people/org-structure

The org chart + master/detail panel (`/people/org-structure`) — HR Manager's "โครงสร้างองค์กร" page.
Nests under `people/` per `docs/adr/0034-feature-folders-nest-under-app.md`.

> **Real data as of 2026-08-28** — `services/organizations-api.ts` reads Core's
> `GET /tenants/:id/organizations`, contract confirmed directly with Core (see
> `docs/people/core-response-people-workspace-api.md`). Export/Add/Edit/Delete Unit and the
> non-chart view tabs are still inert/mock; see below for exactly which.

- `services/organizations-api.ts` — server-only, same shape as
  `asset-intelligence/assets/services/asset-list-api.ts` (bearer token via `get-session.ts`'s
  `getAuthToken()`, fails open to `null`). Core's response is already a full nested tree, not flat
  rows + `parentId` — no tree-building needed on this side.
- `core-mapper.ts` — `mapCoreOrgTree()` flattens Core's tree into the same
  `Record<string, OrgUnitNode>` shape `mock-data.ts` uses, so `OrgChartNode`/`OrgChartCanvas`/
  `OrgDetailPanel` don't know or care whether they're rendering mock or real data — they take
  `units`/`rootUnitId` as props either way (previously a direct `mock-data` import; now threaded
  down from `OrgStructurePage`). `headName`/`headTitle`/`positionsCount`/`fillRate` are always
  `null` for real data — Core has no backing data for any of them yet (`manager_id` exists in the
  DB but isn't in this route's select list; no positions/fill-rate concept exists at all — see the
  file's own header comment). `OrgUnitNode` itself (`mock-data.ts`) now types those four fields as
  nullable to make this honest instead of guessing 0s; components render "-" when null.
  `employeeCount` **is** real where it can be: the app route also fetches `GET
  /tenants/:id/members` and passes a `default_department_id → count` map in, which the mapper sums
  bottom-up through the tree (a division's count = its own direct members + every descendant
  unit's), same arithmetic the mock data always used.
- `components/`
  - `OrgStructurePage` — now takes `units`/`rootUnitId` as props (fetched server-side by
    `app/.../people/org-structure/page.tsx`) instead of importing mock data directly; either being
    `null` (Core fetch failed, or no session/tenant resolved) renders an explicit error message
    rather than silently falling back to mock content — same discipline as
    `asset-intelligence/assets`'s `AllAssetsPage`. Still owns `activeView` (which of the 3 top
    tabs) and `selectedId` (which chart node is open in the detail panel) state, now defaulting
    `selectedId` to the real `rootUnitId` instead of the mockup's hardcoded `"sales"`.
  - `OrgStructureHeader` — title + `OrgViewTabs` (real) + Export/Add-unit actions (inert)
  - `OrgViewTabs` — the 3-way pill switch (แผนผังองค์กร / รายชื่อหน่วยงาน / ตำแหน่งงาน). **Real** —
    only แผนผังองค์กร has content; the other two render the same "no data for this tab" placeholder
    as `asset-intelligence/assets`'s `AllocationTabs`, since no mockup exists yet for what they'd
    show. `people/personnel`'s roster table and `asset-intelligence/assets`'s `LocationTree` are
    both candidates to reuse if รายชื่อหน่วยงาน gets built later — a flat table and an expandable
    tree respectively.
  - `OrgStatTilesRow` — 5 numeric tiles + a "last changed" tile — still mock/decorative; none of
    Core's `organizations`/`members` responses back these numbers today
  - `OrgChartCanvas` — now takes `units`/`rootUnitId` as props (passed through to `OrgChartNode`).
    Decorative zoom/fullscreen controls (the tree is a fixed CSS layout, not a real pan/zoom
    canvas), and the line-style legend, both unchanged.
  - `OrgChartNode` — recursive, one call per tree level, now taking `units` as a prop instead of
    importing `mock-data` directly; **real** click-to-select (calls `onSelect(unitId)`, doesn't
    navigate). Connector lines are plain CSS, unchanged — see the component's own comment.
  - `OrgDetailPanel` — now takes `units` as a prop. Header (icon, name, head, Active badge) + 5 tabs
    (ภาพรวม real; the other 4 share the "no data for this tab" placeholder) + detail rows (head
    name/positions/fill-rate render "-" when Core hasn't supplied them — see `core-mapper.ts`
    above) + a real "หน่วยงานย่อย" sub-unit list + inert Edit/Delete actions. The close (×) button
    clears `selectedId`, showing an empty-state prompt.
- `mock-data.ts` — still the fallback shape reference and the source `people/new-hires`'s
  `AddEmployeeModal` (re-exported via `index.ts`) reads its หน่วยงาน picker options from — that
  consumer wasn't repointed at real data this round. `orgStatTiles` and the other mock export
  detail is unchanged from before real data landed — see git history if needed.

**Not built yet**: รายชื่อหน่วยงาน and ตำแหน่งงาน tab content, real pan/zoom/fullscreen on the
chart, the detail panel's ทีม/พนักงาน/ตำแหน่งงาน/ข้อมูลเพิ่มเติม tabs, Export, and a real
Add/Edit/Delete Unit (Core's `POST`/`PATCH`/`DELETE /organizations` all exist per its response doc,
just not wired to these buttons yet).
