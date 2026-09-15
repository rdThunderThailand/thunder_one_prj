# people/new-hires

New hires Kanban board (`/people/new-hires`) — HR Manager's "เข้าใหม่ / Onboarding" page. Nests
under `people/` per `docs/adr/0034-feature-folders-nest-under-app.md`.

> **Real since 2026-09-15** — the Kanban roster reads `GET /tenants/:id/members?include=onboarding`
> (proposed in `docs/people/new-hires-onboarding-roster-field-requirements.md`, extending the
> existing members-list endpoint rather than adding a new Lifecycle/stage column Core never built).
> `mock-data.ts`'s `newHireRows` is unused now but kept as a shape reference (same discipline as
> `people/org-structure`'s `mock-data.ts` after its own real-data wiring) — `NewHireFunnelRow`'s
> header counts and `NewHireSidebar` are still mock, out of this round's scope.
>
> **2026-09-01**: redesigned from a table + status-tabs + click-to-select detail panel into a
> 4-stage Kanban board (**Pre-boarding → Onboarding → Ready to Work → Active**), per the FigJam
> "People Workspace" board. `NewHireStatus` was renamed from
> `"in-progress" | "pending" | "not-started" | "completed"` to
> `"pre-boarding" | "onboarding" | "ready-to-work" | "active"` — confirmed via grep this type is
> only consumed inside this feature and the two `people/add-person` wizards (updated alongside).
> The real "add employee" creation flow still lives outside this feature — see
> `people/add-person`'s own README.

- `services/onboarding-api.ts` / `core-mapper.ts` — real, added 2026-09-15. `getOnboardingRoster()`
  fetches the roster (server-only, `coreGet`, fails open to `null`); `mapOnboardingRoster()` derives
  the Kanban's 4-stage `NewHireStatus` from `onboarding.done`/`total` + the existing membership
  `status` (no stage column exists on Core's side — see the doc referenced above for the exact
  mapping and why). `steps` on each mapped row is always `[]` — the roster-list endpoint
  intentionally doesn't return full per-step detail, and nothing in the current Kanban renders it
  anyway (only `people/add-person`'s wizards build real `steps` arrays, for the handoff).
- `components/`
  - `NewHiresPage` — takes `rows: NewHireRow[] | null` (fetched server-side by
    `app/.../people/new-hires/page.tsx`); `null` renders an explicit error message rather than
    silently falling back to mock content, same discipline as org-structure/personnel. `addedRows`
    is real, client-local state (prepended ahead of the fetched rows, never persisted). A one-time
    `useState` lazy initializer (`readHandoff()`) reads a just-created hire that `people/add-person`'s
    `AddEmployeeWizardPage`/`AddContractorWizardPage` stashed in `sessionStorage`
    (`NEW_HIRE_HANDOFF_KEY`, imported via `people/add-person/handoff.ts` directly rather than that
    feature's `index.ts`, to avoid a barrel-file import cycle between the two features) before its
    "ไปที่หน้าเข้าใหม่" link brought HR back here — the row shows up in its Kanban column
    immediately, ahead of the next real fetch picking it up too.
  - `NewHiresHeader` — retitled "เข้าใหม่ / Onboarding"; คู่มือการใช้งาน/ส่งออก stay inert,
    **real** "เพิ่มพนักงานใหม่" links to `/people/add/employee`.
  - `NewHireFunnelRow` — the 4-stage funnel header strip (Pre-boarding/Onboarding/Ready to
    Work/Active counts + subtitle + inert "ดูรายละเอียด"). Counts are `mock-data.ts`'s
    `newHireFunnelStats` — the mockup's own static header numbers, **not** derived from
    `newHireRows` (12 rows here vs. 32+6+3+18=59 in the header) — same "mockup number vs. small
    sample" gap this feature's mock data already carried before this redesign.
  - `NewHiresFilterBar` — unchanged, still fully decorative (search + 4 filters), just re-placed
    above the Kanban board instead of a table.
  - `NewHireKanbanBoard` — the 4 columns, each showing up to 4 person cards (name, position, and
    either `${progress}%` for the Onboarding column or `startDateLabel` for the others) + an inert
    "ดูเพิ่ม N คน" link when a column has more rows than shown. Cards are **static** — this
    redesign has no per-row detail view (the old `NewHireDetailPanel` is gone; the sidebar is now a
    fixed dashboard, not a click-to-select panel).
  - `NewHireSidebar` — the 3 static right-column cards: สรุปภาพรวม (`newHireSummaryStats`),
    งานที่ต้องดำเนินการ (`newHireActionItems`), เอกสารและแหล่งข้อมูล (`newHireResources`, all inert
    links). All figures are static mock data, same discipline as the funnel row.
- `mock-data.ts` — `newHireRows`'s original 8 rows keep their existing `progress`/`steps` (incl.
  row `"p-1"`'s mockup-verified 1/2/3/6/8 checklist example) and were only reassigned a new
  `status` by that existing progress (0 → pre-boarding, 1–88 → onboarding). 4 new rows
  (`"p-9"`–`"p-12"`) were added for the "ready-to-work" and "active" stages, which had no existing
  example. `buildStepsFromDoneIndices()` is used by both `people/add-person` wizards
  (deep-imported from `./mock-data`, not this feature's `index.ts` — see that file's own comment)
  to build a freshly-created hire's checklist.

**Not built yet**: every dropdown filter/search on `NewHiresFilterBar`, "ดูรายละเอียด"/"ดูเพิ่ม N
คน" links, คู่มือการใช้งาน/ส่งออก, and any per-hire detail view (none exists in this redesign).
`NewHireFunnelRow`'s header counts and `NewHireSidebar`'s summary cards are still mock, independent
of the now-real roster (see this feature's own components above for the exact split).
