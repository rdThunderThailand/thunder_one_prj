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
  its own FigJam screens were provided. **Deliberately fully mock/demo, by explicit product
  decision** (asked the user directly, given this is the first people/* intake flow capable of
  creating many records from one click, and this repo has no CSV/Excel parsing dependency) — see
  the component's own header comment for the full reasoning. Concretely:
  - The file picker (step 1, drag-and-drop or click) is real and shows the chosen filename, but
    never reads the file's contents — selecting **any** file just populates `BULK_MOCK_PEOPLE`, a
    fixed list matching the mockup's own 8 example rows.
  - "ยืนยันและส่งคำเชิญ" (step 3) never calls Core — it only flips to a local success panel.
  - Unlike Employee/Contractor, nothing here uses `NEW_HIRE_HANDOFF_KEY` — stashing fabricated rows
    into `people/new-hires`'s roster would misrepresent them as real Core records the way a genuine
    Employee/Contractor creation's handoff does.
  - Every field in step 2 (bulk-applied employment details: หน่วยงาน, ตำแหน่งงาน, contract terms,
    work location, etc.) is cosmetic — there's no `createMember` call anywhere in this file to send
    them to.
  - If real bulk creation is wanted later, file parsing and real per-row Core submission need
    building **together** — parsing a real file into rows that still don't get created would be a
    worse, more confusing half-measure than today's fully-simulated version.
- `handoff.ts` — just the `NEW_HIRE_HANDOFF_KEY` constant, deliberately **not** re-exported from
  `index.ts`. Both this feature and `people/new-hires` import it from this standalone file directly
  — importing it via either feature's barrel (`index.ts`) would pull in that feature's page
  component too (`AddEmployeeWizardPage` needs `people/new-hires/mock-data`'s
  `buildStepsFromDoneIndices`/`NewHireRow`; `NewHiresPage` needs this key), creating a real
  barrel-file import cycle between the two features. See the comment at each import site.

**Not built yet**: real file parsing + real bulk Core submission for `AddBulkWizardPage` (currently
fully mock, by design — see above), the other three "related actions" on the type picker, any Core
schema change to make the cosmetic fields above real (including `member_type`, which would let
Contractor stop reusing Employee's exact same Core call).
