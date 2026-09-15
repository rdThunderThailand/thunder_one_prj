# people/contractors

The standalone contractor roster (`/people/contractors`) — HR Manager's "ผู้ปฏิบัติงานภายนอก
(Contractor)" page. Nests under `people/` per `docs/adr/0034-feature-folders-nest-under-app.md`.
Built 2026-09-01 from the FigJam "People Workspace" board — a brand-new page and nav item, distinct
from `people/add-person`'s Contractor **intake wizard** (`/people/add/contractor`) — this page is
the roster/management view of contractors already in the org, not the flow that creates one.

> **Real since 2026-09-15.** `member_type` turned out to already be real on Core's side (the note
> here claiming otherwise, like `people/personnel`'s own equivalent note, was stale — confirmed by
> reading `MEMBER_SELECT` in `thunder_core_API` directly), so the roster now reuses the same
> `GET /tenants/:id/members` `people/personnel` already calls, filtered to
> `member_type === "contractor"` — no new Core endpoint needed. Contract-specific fields (company,
> internal coordinator, contract start/end dates) are still genuinely unbacked — no such columns
> exist anywhere in Core's schema (not even in the separate `membership_contract` table, which only
> has `contract_number`/`contract_date`/`contract_value`/`payment_format`/`payment_cycle`, and only
> per-member, not at list level) — see `mock-data.ts` and `core-mapper.ts` for exactly what's real
> vs. still "-".

- `core-mapper.ts` — real, added 2026-09-15. `mapCoreContractors()` filters `GET /tenants/:id/
  members` rows to `member_type === "contractor"` and maps into `ContractorRow`, leaving
  `company`/`coordinatorName`/`coordinatorRole`/`contractEndLabel` `null` (rendered "-") since
  nothing backs them. `status` is **derived, not exact** — `ContractorStatus` was designed around
  contract-lifecycle dates Core doesn't expose at list level, so real account status
  (active/invited/suspended/removed/archived) is relabeled onto the closest-fitting existing tab
  (active→active, invited→pending-approval, suspended/removed/archived→expired) rather than
  inventing a new tab. "expiring-soon" will never populate from real data — see the function's own
  comment for the full reasoning.
- `mock-data.ts` — `contractorRows` unused now, kept as a shape reference (same discipline as
  other people/* features after their own real-data wiring); `contractorStatTiles`/`contractorTabs`
  carry the mockup's own header numbers (48 total, etc.) — still **not** derived from real rows,
  same "mockup number vs. small sample" gap every other people/* mock-data.ts documents for itself.
- `components/`
  - `ContractorsPage` — takes `rows: ContractorRow[] | null` (fetched server-side by
    `app/.../people/contractors/page.tsx`); `null` renders an explicit error message rather than
    silently falling back to mock content, same discipline as org-structure/personnel/new-hires.
    Table + tabs + stat-tiles shape borrowed from `people/personnel`'s `PersonnelPage`, but with a
    **right-side filter panel** (`ContractorFilterPanel`) instead of a per-row detail view —
    matches the mockup's own 4th screen, unlike `people/positions`' Org Structure-style
    master/detail.
  - `ContractorsHeader` — breadcrumb (หน้าหลัก › ผู้ปฏิบัติงานภายนอก, matching the mockup's own) +
    **real** "+ เพิ่มผู้ปฏิบัติงานภายนอก", a `Link` to `/people/add/contractor`
    (`people/add-person`'s already-built wizard).
  - `ContractorStatTilesRow` — **real**, 5 tiles computed from the fetched roster (not the old static
    mock numbers 48/32/6/10/11). "ใกล้หมดสัญญา" will always read 0 — `core-mapper.ts`'s
    `deriveStatus()` never returns "expiring-soon" since Core has no contract-end-date at list level
    to derive it from (same gap the intro above documents).
  - `ContractorTabs` — real client-side filtering of the fetched rows by (derived) `ContractorStatus`,
    same pattern as `people/personnel`'s `PersonnelTabs`. Tab counts are real too, computed from the
    fetched rows.
  - `ContractorTable` — the roster table (person, company, role/unit, internal coordinator,
    contract dates, status badge, inert view/more actions) — unchanged markup, now rendering "-"
    for the fields `core-mapper.ts` leaves `null`.
  - `ContractorFilterPanel` — search + 4 dropdowns + 2 date filters + decorative ค้นหา/ล้างตัวกรอง
    buttons, all inert, same "renders inert" convention as every other unbuilt filter in this app.

**Not built yet**: every filter/search on `ContractorFilterPanel`, sort, pagination, row actions,
and any real link between a contractor created via `people/add-person`'s wizard and this roster
(that wizard's real Core row instead hands off into `people/new-hires`' Kanban board — this page
stays fully mock, deliberately not wired to that handoff, since prepending a fabricated
`ContractorRow` here would misrepresent contract-specific fields Core doesn't actually have).
