# people/new-hires

New hires roster + onboarding detail panel (`/people/new-hires`) — HR Manager's "เข้าใหม่" page.
Nests under `people/` per `docs/adr/0034-feature-folders-nest-under-app.md`.

> The roster (`newHireRows`) is still mock — no Lifecycle/onboarding schema exists in Core yet
> (confirmed 2026-08-28, `docs/people/core-response-people-workspace-api.md`). **The creation flow
> is real as of 2026-08-28** — `AddEmployeeModal` calls Core's actual `POST /tenants/:id/members`.
> **But read this precisely** (Core flagged it explicitly the same day): that call really does
> create a Person/Membership, but everything this feature calls "onboarding" —
> `status`/`progress`/the 9-step checklist — is **UI-fabricated, not derived from Core's response**.
> Core's own membership `status` (`invited`/`active`/...) is unrelated account-access state, not
> this feature's Lifecycle concept; no `member_type`, `lifecycle_stage`, or checklist table exists
> in Core's schema at all yet. When real P3 (`POST /onboarding`) lands, `AddEmployeeModal`'s local
> mapping needs **replacing, not extending** — rows created by today's stopgap won't retroactively
> gain real onboarding state. See the component's own header comment for the same warning in place.

- `components/`
  - `NewHiresPage` — takes `tenantId`/`roles`/`units` as props (fetched server-side by
    `app/.../people/new-hires/page.tsx`, passed straight through to `AddEmployeeModal`). Owns
    `activeTab` (status filter), `selectedId` (which row's detail panel is open), `addedRows` (hires
    added via `AddEmployeeModal`, client-local, prepended ahead of `newHireRows`, never persisted —
    same discipline as `asset-intelligence/departments`'s `RequestsPage`), and the modal's open/close
    state. Defaults `selectedId` to `"p-1"` (แอน สุภาภรณ์), matching the reference mockup's initial
    screenshot. `NewHireDetailPanel` reads from the combined `rows` list (a prop), not the static
    `newHireRows` import, so an added hire can actually be selected into it.
  - `NewHiresHeader` — title + Export (inert) + **real** Add New Employee, opening
    `AddEmployeeModal`
  - `AddEmployeeModal` — the "เพิ่มพนักงานใหม่" flow from the "เพิ่มคน / เพิ่มพนักงานใหม่
    ต่างกันอย่างไร?" reference diagram's 5-step Onboarding sequence (personal info → position/unit →
    documents/contract → equipment/access → training/readiness → Work Ready). **Submitting calls
    Core's real `POST /tenants/:id/members`** (`people/personnel`'s `createMember`), contract
    confirmed directly with Core. Two real outcomes, both handled — see the component's own header
    comment:
    - The email already has a Thunder One account → a real membership is created immediately.
    - The email is brand new → Core sends a real invitation instead (no account exists yet). The
      row's `status` becomes `"pending"` (not `"in-progress"`), every onboarding step renders
      pending regardless of which wizard steps were filled in, and Core's real `invite_url` is
      shown with a copy button — both here and in `NewHireDetailPanel` (an amber "รอการตอบรับคำเชิญ"
      block).
    - บทบาท (Role, new step-4 field) is **required by Core** (`role_code`) — populated from the real
      `roles` prop (`GET /tenants/:id/roles`), defaulting to `operator_technician` per Core's own
      suggestion. No submit is possible without at least one real role loaded.
    - หน่วยงาน is sourced from the real `units` prop (`GET /tenants/:id/organizations`, mapped) —
      **not** mock data, since it becomes a real `default_department_id` Core validates. Degrades to
      "ไม่พบข้อมูลหน่วยงาน" (skips sending the field — it's optional server-side) rather than
      submitting a mock unit's fake id.
    - ตำแหน่งงาน/ผู้จัดการ stay cosmetic suggestions from `people/personnel`'s mock `personnelRows` —
      Core's contract has no "manager" concept for a membership at all, and `job_title` is free text
      server-side, so neither needs to be "real" for this call to be correct.
    - Every step still marks a specific, non-overlapping subset of the 9 canonical `OnboardingStep`
      labels done via `buildStepsFromDoneIndices()` for the local checklist display (unrelated to
      what's sent to Core) — see the component's own comment for the mapping. `"พร้อมเริ่มงาน"`
      (step 9) is deliberately left pending — real first-day readiness, not something an intake form
      can mark done on its own — so a successfully-created (non-invite) hire always lands at 8/9
      (89%, in-progress), never 100%. วันที่เริ่มงาน is a native `<input type="date">` —
      `src/lib/thai-date.ts`'s `formatThaiDate`/`formatDaysUntilThai` convert its Gregorian ISO
      value to this app's Buddhist-calendar label convention (Gregorian + 543).
  - `NewHiresStatTilesRow` — 5 tiles (total, starting this week, in-progress, pending, ready)
  - `NewHiresTabs` — **real**, client-side filtering by `NewHireStatus` — same pattern as
    `people/personnel`'s `PersonnelTabs`
  - `NewHiresFilterBar` — search + 4 filters (incl. a decorative date-range control) + view toggle,
    all inert, same convention as `people/personnel`'s `PersonnelFilterBar`
  - `NewHireTableControls` — decorative pagination; unlike `people/personnel` (13 pages) this only
    ever shows page 1, since all 8 mock rows already fit on one page
  - `NewHireTable` — **real row selection** — clicking any row opens it in `NewHireDetailPanel`
    (not a link; same "select, don't navigate" pattern as `people/org-structure`'s chart nodes)
  - `NewHireDetailPanel` — meta + overall-progress bar + the 9-step onboarding checklist + two inert
    action buttons. The "เสร็จสิ้น X จาก Y" line is **computed from the rendered `steps` array**,
    not stored as a separate number — see the component's own comment on why (the mockup's own
    summary text didn't match its own checklist)
- `mock-data.ts` — `newHireTabs`/`newHireStatTiles` carry the mockup's own header counts
  (8/5/2/1/0); `newHireRows`' real per-row `status` only sums to 3/3/2/0, same "mockup number vs.
  small sample" gap `people/personnel`'s mock-data.ts documents for itself. Every row's
  `steps` is a 9-item onboarding checklist — row `"p-1"`'s exact done/pending pattern (steps
  1,2,3,6,8 done) is the mockup's own verified example; every other row's is derived from its
  `progress` percentage by `buildSequentialSteps()` (first N steps done, in order) — a
  simplification, not a second verified example.

**Not built yet**: every dropdown filter, search, sort, pagination, row checkbox/actions, Export,
and the detail panel's "ดูรายละเอียดทั้งหมด"/"ดำเนินการขั้นตอนถัดไป" buttons. The roster list itself
is still mock (no Lifecycle/onboarding schema in Core) — only Add New Employee's *creation* call is
real (see `AddEmployeeModal` above).
