# Add Contractor & Bulk Import flows: requirements for API review

> Written 2026-09-04, updated 2026-09-10 · For the Core/API team · Source:
> `src/features/people/add-person/components/AddContractorWizardPage.tsx` (the
> "เพิ่มผู้รับเหมา/ผู้ปฏิบัติงานภายนอก" flow at `/people/add/contractor`) and
> `AddBulkWizardPage.tsx` (the "เพิ่มหลายคนเข้าองค์กร (Bulk)" flow at `/people/add/bulk`)
>
> Companion doc to `add-employee-field-requirements.md` (2026-09-01, Employee flow only) — these
> two flows didn't exist yet when that doc was written. **2026-09-10 update**: this doc had drifted
> significantly out of date — `member_type` (flagged below as the top open item) had already been
> resolved by Core since 2026-08-28, several "cosmetic" fields turned out to have real backing
> columns nobody had re-checked, and Bulk (originally "100% simulated, by deliberate product
> decision") now does real CSV parsing and real per-row Core submission. Every section below was
> re-verified directly against `thunder_core_API`'s current migrations/schema, not just against this
> doc's own prior claims — real/cosmetic status is now marked per-field with the column name that
> backs it (or its absence), not as a blanket "cosmetic today" per section like the first draft did.

## Purpose

Give the API team one document that lists every field/behavior these two flows need, so each item
can be triaged the same way the Employee doc's fields were: **matches an existing field**, **needs
new work**, or **not needed, drop from UI**.

---

## Part A — Add Contractor (`/people/add/contractor`)

### What's actually required to submit successfully, today

Same three gates as the Employee flow (`add-employee-field-requirements.md`):

1. A tenant/session resolved server-side (not a form field).
2. `GET /tenants/:id/roles` returned at least one role (not a form field).
3. Every field marked **Required** below is filled and passes client-side validation (Thai
   national-ID checksum, email format, etc. — added 2026-09-04, doesn't change what Core needs).

### Currently wired to Core (updated 2026-09-10 — significantly more than when this doc was written)

**`POST /tenants/:id/members`:**

| Field (UI label) | Sent as | Required in UI? |
|---|---|---|
| อีเมล (สำหรับการเข้าสู่ระบบ) | `email` | **Yes** |
| บทบาท / สิทธิ์การเข้าถึง (Role) | `role_code` | No form control disables submit, but a missing role blocks the page entirely (same as Employee) |
| ตำแหน่งงาน | `job_title` | **Yes** |
| หน่วยงาน | `default_department_id` | No |
| วันที่เริ่มงาน | `start_date` | No |
| ประเภทการจ้างงาน | `member_type: "contractor"` | n/a — hardcoded, no picker |
| ลักษณะการจ้าง | `work_arrangement` | No |
| หมายเหตุ | `notes` | No |
| *(auto-generated — `CON-0` + 3 random digits)* | `employee_code` | n/a |

**`PUT /tenants/:id/members/:memberId/contract`** (fired right after, only when the created row is a
real membership — not a pending invite — and at least one contract field was filled in):

| Field (UI label) | Sent as |
|---|---|
| เลขที่สัญญา / PO No. | `contract_number` |
| วันที่ทำสัญญา | `contract_date` |
| มูลค่าสัญญา | `contract_value` |
| รูปแบบการชำระเงิน | `payment_format` |
| รอบการชำระเงิน | `payment_cycle` |

**Resolved, not open anymore:** the `member_type` gap this section used to flag as the "single
highest-value item" **closed 2026-08-28** (`memberships.member_type` is a real column —
`thunder_core_API/supabase/migrations/20260828100526_people_onboarding_p3.sql`) — this doc simply
hadn't been updated to say so. Contractor and Employee no longer create indistinguishable rows;
`member_type` is real and sent on every Contractor submission today.

### Everything else — collected in the UI, NOT sent to Core today

**Important distinction added 2026-09-10**: every row in the Step 1 table below now has a real
column in Core's schema (`public.users` — `20260901090000_people_add_employee_personal_fields.sql`,
same migration Employee's doc already covers). **The gap is Contractor-specific, not Core's**:
Contractor only ever calls `POST /tenants/:id/members` (see the tables above), and that endpoint's
`CreateMemberInput` doesn't carry personal fields at all — only `POST /tenants/:id/employees`
(`CreateEmployeeInput`) writes to `users`, and Contractor doesn't call it. Wiring these would mean
switching Contractor onto the same `createEmployee`-first, `createMember`-on-409 pattern
`AddEmployeeWizardPage`/`AddBulkWizardPage` already use — a frontend change, not something Core
needs to build.

#### Step 1 — ข้อมูลส่วนบุคคล (Personal Information)

| Field (UI label) | Type | Required in UI? | Real column? |
|---|---|---|---|
| คำนำหน้าชื่อ | select: นาย/นาง/นางสาว | No | `users.title_prefix` — real |
| ชื่อ / นามสกุล (ภาษาไทย) | text | **Yes** | `users.first_name`/`last_name` — real (existing columns, predate this migration) |
| ชื่อ / นามสกุล (ภาษาอังกฤษ) | text | No | `users.first_name_en`/`last_name_en` — real |
| เลขบัตรประชาชน / เลขที่หนังสือเดินทาง | text | **Yes** | `users.national_id`/`passport_no` — real. Accepts either a 13-digit Thai national ID (checksum-validated client-side) or a 6–9 char alphanumeric passport number — a union type, not a single format. Same field Employee's doc flagged for compliance/payroll priority. |
| สัญชาติ | text | No | `users.nationality` — real. free text, defaults to "ไทย" |
| เพศ | select: ชาย/หญิง/ไม่ระบุ | No | `users.gender` — real |
| เบอร์โทรศัพท์มือถือ / เบอร์โทรศัพท์สำรอง | text × 2 | No | `users.phone` — real, but only the primary phone has anywhere to go; the secondary phone (Contractor has **two**, Employee only has one) has no second column and stays cosmetic regardless |
| ที่อยู่ปัจจุบัน | textarea, max 200 chars | No | `users.address` — real |
| วันเกิด | date | No | `users.date_of_birth` — real (existing column, predates this migration) |
| ไลน์ไอดี (ถ้ามี) | text | No | No Core column at all — **genuinely cosmetic**, not just unwired. Not on the Employee flow either — contractor-specific contact channel |
| ช่องทางติดต่ออื่น (ถ้ามี) | text | No | No Core column — genuinely cosmetic. free text, e.g. "Telegram, WhatsApp" — also contractor-only |
| หมายเหตุ | textarea | No | `memberships.notes` — real (this is the Step 1/Step 2 "หมายเหตุ" merge the tables above already cover — sent today, just listed here since it's collected in this step) |
| รูปภาพผู้รับเหมา (photo upload) | — | — | No Core column — **genuinely cosmetic**, same as Employee's photo field |

#### Step 2 — ข้อมูลการจ้างงานและสัญญา (Employment & Contract) — updated 2026-09-10

Most of this table moved from "cosmetic" to "real" since this doc was written — only the rows
below still have nowhere to go. Everything not listed here (ลักษณะการจ้าง, เลขที่สัญญา, วันที่ทำสัญญา,
มูลค่าสัญญา, รูปแบบ/รอบการชำระเงิน, หมายเหตุ) is now real — see the two tables above.

| Field (UI label) | Type | Required in UI? | Notes |
|---|---|---|---|
| ผู้บังคับบัญชา (Reporting To) | select, sourced from mock roster | **Yes** | **Confirmed cosmetic, not just suspected** — checked every column on `public.memberships`/`public.users` directly (thunder_core_API's schema) and there is no `manager_id`/`reports_to`-shaped column anywhere for "who is this person's manager." (`departments.manager_id` exists, but that's a department's head, a different concept.) Still enforced required in the UI despite having no real backing at all — either this needs a new column, or the UI requirement should be reconsidered. **This is now the single highest-value open item for Contractor** (member_type's gap above is closed). |
| หน้าที่หรือรายละเอียดงาน | textarea, max 300 chars | No | |
| ทีม (Team) | text | No | Separate free-text field from the real หน่วยงาน picker — still no Core field, same as Employee's. |
| วันที่สิ้นสุด (คาดการณ์) | date | No | `memberships.end_date` **does exist** in Core's schema ("Intended membership/employment end date (HR). WARN: unused — not populated or read in code.") but isn't modeled on our `CreateMemberInput`/`CreateEmployeeInput` TypeScript types yet, so nothing here can send it today even though Core would likely accept it. A frontend gap, not a Core gap. |
| ระยะเวลาการจ้าง | select: 3/6/12 เดือน/ไม่ระบุ | No | Still no Core field — a derived/UI-only convenience. |
| หมายเหตุสัญญา | textarea, max 300 chars | No | `MemberContract`/`membership_contract` has no `notes` column — the separate หมายเหตุ field above (→ `memberships.notes`) is the only notes field that lands anywhere. |
| สถานที่ทำงานหลัก | select, 4 static options | No | `public.locations` table and `memberships.default_location_id` FK **both exist for real** (`057_column_comments.sql`), but Core's own comment flags `default_location_id` as "not referenced anywhere in src yet" — no endpoint reads or writes it — and this page has no real location-picker UI (just 4 hardcoded option labels) to map onto real location ids anyway. Real on the DB side, unusable end-to-end today. |
| พื้นที่ / ชั้น | text | No | No Core field. |
| ที่อยู่สถานที่ทำงาน | textarea, max 200 chars | No | No Core field. |

**Suggested priority, contractor-specific fields only**: ผู้บังคับบัญชา is now the clear top item —
everything else genuinely cosmetic here (ทีม, ระยะเวลาการจ้าง, หมายเหตุสัญญา, location sub-fields) reads
like "drop from UI" candidates, same caveat as Employee's doc — product call, not ours. วันที่สิ้นสุด is
a special case: cheap to wire (the column already exists) if product still wants it.

---

## Part B — Add Bulk (`/people/add/bulk`)

### Current state (updated 2026-09-10): real CSV parsing + real per-row creation, no bulk endpoint

Both halves landed together, as this doc originally asked for — but "real bulk creation" still
means **N individual `POST /tenants/:id/employees` (falling back to `/members` on a 409) calls, one
per CSV row, sequentially from the client**, not a real batch endpoint, since Core doesn't have one:

- The file picker only accepts `.csv` (not `.xlsx` — parsing a binary Excel format wasn't worth a
  new dependency for this pass). It's genuinely parsed client-side
  (`src/features/people/add-person/bulk-csv.ts`, hand-rolled RFC4180-ish parser): header-row column
  mapping or positional mapping, per-row validation (required columns present, valid/deduped email,
  Thai mobile format, optional date-of-birth/national-ID format). Invalid rows are dropped and
  listed to the user, not silently included or silently dropped.
- "ยืนยันและส่งคำเชิญ" loops the parsed rows and really calls Core, one row at a time (sequential,
  not `Promise.all` — this is our own stand-in for the rate-limiting concern in the open questions
  below, since there's no queue to hand this off to). Every row's success/failure is tracked
  client-side and shown on the confirmation screen; a failed row does **not** abort the rest of the
  batch. Successfully created/invited rows are stashed into `/people/new-hires`'s roster via the
  same `NEW_HIRE_HANDOFF_KEY` handoff Employee/Contractor use (as an array now, not a single
  object) — only real Core records go in, failed rows never get faked into it.

**This still doesn't answer the open questions below** — it's a client-side workaround, not a
substitute for a real bulk-create endpoint. A 300-row import today means 300 sequential requests
and 300 individual `member.invited` side effects with no batching Core controls, and there's still
no dry-run/preview call, so "review before confirm" only reflects our own client-side validation,
not whether Core will actually accept each row (a duplicate email that passes our checks still only
surfaces as a per-row failure after the fact). **If Core builds a real
`POST /tenants/:id/members/bulk`, this page should switch to it** rather than keep looping the
single-row endpoint.

### What Core would need to build

1. **A bulk-create endpoint** — something like `POST /tenants/:id/members/bulk` accepting an array
   of row objects, since looping N individual `POST /tenants/:id/members` calls from the client has
   no way to report partial success/failure back to the user in one place, and would fire N
   `member.invited` side effects (emails, webhooks, etc.) without any batching/rate-limit control on
   Core's side.
2. **Row-level validation with partial-success reporting** — real-world imports will have some bad
   rows (duplicate email, invalid format, etc.). The response needs to say *which* rows succeeded,
   which failed, and why per row — not just an overall success/failure for the whole batch.
3. **A decision on file parsing ownership** — does Core accept a raw file upload and parse it
   server-side, or does the frontend parse CSV/Excel client-side and send Core a plain JSON array?
   The latter avoids Core needing a file-parsing dependency at all and keeps the bulk-create
   endpoint's contract identical to a single "array of `CreateMemberInput`-shaped rows." We'd lean
   toward this unless Core has a strong reason to own parsing (e.g. very large files that shouldn't
   round-trip through the browser).

### Expected input columns (updated 2026-09-10 — now real, and all backed by real columns)

The wizard's CSV template columns, and where each one lands now that parsing + per-row
`createEmployee` submission are both real (`bulk-csv.ts` + `AddBulkWizardPage.handleConfirm`):

| Column | UI label | Required | Real column? |
|---|---|---|---|
| `first_name` | ชื่อ (ภาษาไทย) | **Yes** | `users.first_name` — real, sent as `CreateEmployeeInput.first_name` |
| `last_name` | นามสกุล (ภาษาไทย) | **Yes** | `users.last_name` — real, sent as `last_name` |
| `email` | อีเมล (สำหรับการเข้าสู่ระบบ) | **Yes** | `users.email` — real |
| `mobile` | เบอร์โทรศัพท์มือถือ | **Yes** (per template — inconsistent with Employee/Contractor's own phone field, which is optional there; flag for product to reconcile) | `users.phone` — real, sent as `phone` |
| `date_of_birth` | วันเกิด (ค.ศ.) | No | `users.date_of_birth` — real, sent as `date_of_birth` when the column parses as `YYYY-MM-DD` **or** an Excel/Sheets date-serial number (e.g. `37065`) — converted automatically as of 2026-09-14, a real export artifact hit during onboarding testing |
| `id_card` | เลขบัตรประชาชน | No | `users.national_id` — real, sent as `national_id` when it passes the same Thai-ID checksum Employee/Contractor validate client-side |

Every one of these now has a real column and is actually sent — this table used to say the
opposite (all cosmetic except `email`) back when Bulk was 100% simulated.

### Step 2's "bulk-applied" fields — same value for every row in the import (updated 2026-09-10)

Distinct from the per-row file columns above, step 2 collects fields applied to **every** person in
the batch at once (a checkbox `applyToAll`, currently always true — no per-row override UI exists):

| Field (UI label) | Real column? |
|---|---|
| หน่วยงาน | `default_department_id` — real |
| ตำแหน่งงาน | `job_title` — real |
| ประเภทการจ้างงาน | `member_type` — real (the gap this doc used to cite here is closed — see Part A) |
| ลักษณะการทำงาน | `work_arrangement` — real |
| วันที่เริ่มงาน | `start_date` — real |
| หมายเหตุ | `notes` — real |
| ทีม (Team) | No Core column — cosmetic, same as Employee/Contractor's own ทีม field |
| ผู้บังคับบัญชา (mock roster) | No Core column anywhere (confirmed — see Part A's ผู้บังคับบัญชา row) — cosmetic |
| สถานที่ทำงานหลัก | `locations`/`default_location_id` exist but unreferenced by any endpoint (see Part A) — cosmetic in practice |
| วันที่สิ้นสุด / ระยะเวลาการจ้าง / วงเงินสัญญา | No Core call at all for Bulk — unlike Contractor, Bulk never calls `updateMemberContract`, so these stay fully cosmetic today even though the `membership_contract` table they'd map to is real |

Six of ten bulk-applied fields are real today; the rest either have no Core column (ทีม,
ผู้บังคับบัญชา) or have one that nothing in this flow calls (contract fields, location).

### Open questions specific to Bulk

1. **Rate limiting / invite volume** — a single bulk submit could plausibly create 50–500+ pending
   invites at once. Does `member.invited`'s downstream email delivery need batching/throttling on
   Core's side, or is that already handled generically?
2. **Duplicate/existing-email handling** — if a row's email already has a Thunder One account (or
   an existing membership in this tenant), what should the bulk endpoint do: skip with a per-row
   error, update the existing membership, or something else? This determines whether `importMode`
   (a "new / update / mix" selector already in the UI, currently decorative) has real meaning or
   should be dropped.
3. **Dry-run / preview validation** — should there be a way to validate a file against Core (get the
   per-row pass/fail list) *before* committing the batch, so the UI can show "47 of 50 rows valid,
   review the 3 errors before confirming" rather than only finding out after submit? **Partially
   answered client-side as of 2026-09-10** — `bulk-csv.ts` does real per-row validation at parse
   time (bad email/duplicate email/invalid phone/invalid date or ID format all get caught and shown
   before step 2), so the step 2→3 review is no longer fake. What it still can't catch is anything
   only Core knows — a duplicate email against an *existing* membership, a `role_code` that turns
   out invalid, etc. — those still only surface as a per-row failure after the real submit in step 3.
   A real dry-run endpoint would close that remaining gap.

### Suggested priority (updated 2026-09-10)

Part A's blocking dependency (`member_type`) is resolved — its only remaining real gap is
ผู้บังคับบัญชา (no backing column at all). Part B (Bulk) shipped its own real parsing + per-row
submission without waiting on a bulk-create endpoint, by looping the same single-row endpoints Part
A/Employee use — so it's no longer blocked on Core either, just running less efficiently than a real
batch endpoint would allow (see "Current state" above). Suggested order now: **(1)** decide
ผู้บังคับบัญชา's fate (new column vs. drop the UI requirement) since it's a hard-required field with
zero backing on both Contractor and Bulk today, **(2)** a real `POST /tenants/:id/members/bulk` for
Bulk once there's appetite for it (not blocking, just more efficient and gives real dry-run/partial-
success reporting), **(3)** the smaller genuinely-cosmetic fields (ทีม, location sub-fields, contract
notes) — product calls, not urgent.
