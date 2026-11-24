# people/add-person

The consolidated "add a person to the organization" flow (`/people/add`, `/people/add/employee`) —
built 2026-09-01 from the "Figjam - People Workspace" board's redesign, which moved this from two
in-page modals to full, routed pages (the mockup's own breadcrumb: ภาพรวม › เพิ่มคน ›
เพิ่มพนักงานใหม่). Nests under `people/` per `docs/adr/0034-feature-folders-nest-under-app.md`.

Replaces:
- `people/personnel`'s old `AddPersonModal` ("เพิ่มคน" — type picker; Employee bailed out to
  New Hires with a notice).
- `people/new-hires`'s old `AddEmployeeModal` ("เพิ่มพนักงานใหม่" — 5-step modal wizard, the one
  real Core integration point).

Both are deleted. Every entry point that used to open one of those modals (`PersonnelHeader`'s
"เพิ่มบุคลากร", `NewHiresHeader`'s "เพิ่มพนักงานใหม่", `OverviewHeader`'s "เพิ่มคน / เชิญคน" —
previously fully inert) now links here instead.

## What's real vs. cosmetic

`services/members-api.ts`'s `createMember` (`people/personnel`) still calls Core's actual
`POST /tenants/:id/members` on submit — contract unchanged, confirmed 2026-08-28
(`docs/people/core-response-people-workspace-api.md`). That endpoint's `CreateMemberInput` only
accepts **`email`, `role_code`, `employee_code`, `job_title`, `default_department_id`,
`start_date`** — nothing else exists as a column in Core's schema today. Every other field this
flow's much richer intake form collects (Thai/English split names, ID card/passport number,
nationality, ethnicity, gender, birth date, phone, address, employment type/status/group, job type,
work arrangement, team, secondary manager, work location, probation dates, contract type, grade,
salary band, starting salary, notes) is **cosmetic** — kept in local state for the review step and
the optimistic pending-invite name display, never sent to Core. When Core adds columns for any of
these (Member Type is flagged as a known future gap in the doc above), this local state needs
**mapping onto them, not silently trusting today's UI already "worked."**

- `components/AddPersonTypePage.tsx` (`/people/add`) — the "เพิ่มคนเข้าองค์กร" type picker: three
  cards (Employee/Contractor/Bulk), a comparison table, and a "การดำเนินการที่เกี่ยวข้อง" row. The
  **Employee** (→ `/people/add/employee`), **Contractor** (→ `/people/add/contractor`),
  **Bulk** (→ `/people/add/bulk`), and **ดูโครงสร้างองค์กร** (→ `/people/org-structure`) links are
  live — the other three related actions render inert (`title="ยังไม่เปิดใช้งาน"`,
  cursor-not-allowed), same "renders inert, not built yet" convention as every other unbuilt
  affordance in this app (e.g. `QuickActionsRow`), since no FigJam mockup exists for those yet.
- `components/AddEmployeeWizardPage.tsx` (`/people/add/employee`) — the 3-step "เพิ่มพนักงานใหม่"
  wizard (`WizardSteps`): **ข้อมูลส่วนบุคคล** → **ข้อมูลการจ้างงานและตำแหน่ง** → **ตรวจสอบและเพิ่ม**.
  Takes `tenantId`/`roles`/`units` as props (fetched server-side by
  `app/.../people/add/employee/page.tsx`, same pattern the old `AddEmployeeModal`'s route used).
  Submitting on the review step calls `createMember` and renders the same pending-invite-vs-created
  success states the old modal did (checklist, invite-link copy box). On success, the created
  `NewHireRow` is stashed in `sessionStorage` (`NEW_HIRE_HANDOFF_KEY`, `./handoff.ts`) so
  `people/new-hires`'s `NewHiresPage` can prepend it once the "ไปที่หน้าเข้าใหม่" link brings HR back
  there — client-local only, never persisted, same discipline every other people/* feature's
  `addedRows` state already has.
  - The 9-step onboarding checklist mapping is simpler than the old modal's: since this page only
    ever submits from one fixed step (the review step), `DONE_INDICES_ON_SUBMIT` is a constant
    (indices 0–7, everything except "พร้อมเริ่มงาน") rather than the old modal's
    step-index-dependent slice — same eventual 8/9 (89%, in-progress) result on success.
  - บทบาท (Role → `role_code`) lives in step 2 here (the mockup's own screens don't show it as a
    separate field) — still required by Core, still sourced from the real `roles` prop, still
    defaulting to `operator_technician`.
- `components/AddContractorWizardPage.tsx` (`/people/add/contractor`) — the Contractor sibling of
  the wizard above, built 2026-09-01 once its own FigJam screens were provided (until then the
  Contractor card was inert). Same 3-step shape (**ข้อมูลส่วนบุคคล** → **ข้อมูลการจ้างงานและสัญญา**
  → **ตรวจสอบและเพิ่ม**) and the exact same real fields (email/role_code/employee_code/job_title/
  default_department_id/start_date via the same `createMember` call) — Core's schema has no
  `member_type` distinction at all yet (§8 Q1, still open), so a Contractor is the same kind of row
  as an Employee server-side today; only the `CON-` employee-code prefix (a client-side convention,
  matching `people/personnel`'s mock rows) and this page's own copy/fields distinguish them. Its
  richer contract-specific fields (contract number/value/payment terms, work address, etc.) are all
  cosmetic, same discipline as Employee's. Unlike Employee, this flow's own mockup copy is explicit
  that onboarding hasn't started yet ("บันทึกสำเร็จแล้ว สามารถเริ่มกระบวนการ Onboarding ได้จากเมนู
  'เข้าใหม่'"), so a created contractor's `NewHireRow` always starts at 0/9,
  `status: "not-started"` ("Pre-boarding") — not Employee's 8/9 "in-progress". Uses the same
  `NEW_HIRE_HANDOFF_KEY` sessionStorage handoff to `people/new-hires` on success.
- `components/AddBulkWizardPage.tsx` (`/people/add/bulk`) — the Bulk sibling, built 2026-09-01 once
  its own FigJam screens were provided, made real 2026-09-10 (both halves landed together, per the
  original "either both or neither" call below). Takes `tenantId`/`roles`/`units` as props, same
  shape as `AddEmployeeWizardPage`. Concretely:
  - The file picker (step 1) accepts real `.csv` only — no `.xlsx` support (a binary Excel parser
    wasn't worth a new dependency for this pass; selecting one is rejected with a message asking
    for CSV). `../bulk-csv.ts`'s `parseBulkCsvText` does real RFC4180 parsing: header-row column
    mapping when "ข้ามแถวแรก" is checked, positional mapping when it's not, per-row validation
    (required columns, email format/dedup, Thai mobile format, optional date/national-ID format).
    Invalid rows are dropped and listed, not silently included.
  - "ยืนยันและส่งคำเชิญ" (step 3, `handleConfirm`) really does call Core — once per valid row,
    sequentially (not `Promise.all`, both to avoid bursting a real invite-email send per row and to
    keep a meaningful "i / N" progress counter). No bulk-create endpoint exists
    (`docs/people/add-contractor-and-bulk-field-requirements.md`'s "What Core would need to build"),
    so each row calls `createEmployee` first, falling back to `createMember` on a 409 — the same
    fallback `AddEmployeeWizardPage.handleSubmit` uses. Since Core has no batch response to relay,
    this function builds its own per-row success/failure list and shows it on the confirmation
    screen, rather than reporting one overall pass/fail for the whole batch.
  - Uses `NEW_HIRE_HANDOFF_KEY` same as Employee/Contractor, but stashes an **array** of created
    rows (one create call per CSV row) instead of a single object — `NewHiresPage.readHandoff()`
    accepts either shape under the same key. Only successfully created/invited rows go in; failed
    rows stay in the confirmation screen's own list, never faked into the roster.
  - Of step 2's bulk-applied fields, หน่วยงาน/ตำแหน่งงาน/ประเภทการจ้างงาน/ลักษณะการทำงาน/
    วันที่เริ่มงาน/หมายเหตุ map onto real columns (`default_department_id`/`job_title`/`member_type`/
    `work_arrangement`/`start_date`/`notes`); the contract-specific fields (ทีม, สัญญา, วงเงิน,
    ระยะเวลา, ผู้บังคับบัญชา, สถานที่ทำงาน) stay cosmetic — same "not in Core's schema" story as
    `AddContractorWizardPage`'s own step 2.
- `handoff.ts` — just the `NEW_HIRE_HANDOFF_KEY` constant, deliberately **not** re-exported from
  `index.ts`. Both this feature and `people/new-hires` import it from this standalone file directly
  — importing it via either feature's barrel (`index.ts`) would pull in that feature's page
  component too (`AddEmployeeWizardPage` needs `people/new-hires/mock-data`'s
  `buildStepsFromDoneIndices`/`NewHireRow`; `NewHiresPage` needs this key), creating a real
  barrel-file import cycle between the two features. See the comment at each import site.

**Not built yet**: `.xlsx` support on `AddBulkWizardPage` (CSV only for now — see above), a real
bulk-create endpoint on Core (bulk still loops N single-row calls client-side, with the rate-limit
and dry-run caveats `docs/people/add-contractor-and-bulk-field-requirements.md` raises), the other
three "related actions" on the type picker, any Core schema change to make the cosmetic fields
above real (including `member_type`, which would let Contractor stop reusing Employee's exact same
Core call).

## 2026-09-14 fixes (found QA-testing against a real tenant, "Thunder Enterprise")

- **Role default could silently land on an admin role.** All three wizards' `roleCode` initializer
  used to be `roles?.find(r => r.code === "operator_technician")?.code ?? roles?.[0]?.code ?? ""`
  — for a tenant whose `GET /tenants/:id/roles` doesn't include `operator_technician` at all (only
  `super_admin`/`company_admin`, observed on "Thunder Enterprise"), the `roles?.[0]?.code` fallback
  picked whatever role Core happened to list first, with zero privilege-awareness. Replaced with
  `pickDefaultRoleCode()` (`../schemas.ts`): still prefers `operator_technician`, but returns `""`
  (forcing an explicit, visible choice — Employee/Contractor's Role `<select>` shows a disabled
  "-- เลือกบทบาท --" placeholder; Bulk has no role picker at all, so it now blocks submission via
  its existing "ไม่พบบทบาท" toast) instead of ever auto-picking an unrelated role.
- **ผู้บังคับบัญชา (Reporting To / รอง) removed from all three wizards.** Was sourced from
  `personnelRows` (`people/personnel/mock-data.ts`) — a static mock roster, not this tenant's real
  members — so the dropdown showed names like "Jane Smith — Marketing Manager" that don't exist in
  the org. Already cosmetic (no real `manager_id`/`reports_to` column anywhere, see Part A's
  ผู้บังคับบัญชา entry in `docs/people/add-contractor-and-bulk-field-requirements.md`), but showing a
  dropdown of fake names for a real field HR might assume is being saved was actively misleading —
  hidden until there's a real member-backed picker and a Core column to send it to.
  `contractorStep1Schema`/`bulkStep1Schema` no longer require `managerName`.
- **เลขบัตรประชาชน (Employee) / เลขบัตรประชาชน-เลขที่หนังสือเดินทาง (Contractor) no longer required.**
  A real batch of hires can have some people without their ID document ready at intake time. Format
  is still validated (Thai checksum / passport pattern) when something is typed in, same as Bulk's
  CSV `id_card` column already worked.
- **Bulk's `date_of_birth` column now also accepts an Excel/Sheets date-serial number** (e.g.
  `37065`), not just `YYYY-MM-DD` — hit for real during onboarding testing (a spreadsheet's date
  formatting doesn't always survive a CSV export, so the raw day-count serial lands in the file
  instead). `bulk-csv.ts`'s `excelSerialToIsoDate()` converts it; previously the entire row was
  rejected outright for this.
