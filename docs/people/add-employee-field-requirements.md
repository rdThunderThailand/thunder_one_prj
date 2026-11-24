# Add Employee flow: field inventory for API review

> Written 2026-09-01 · For the Core/API team · Source: `src/features/people/add-person/components/AddEmployeeWizardPage.tsx`
> (the "เพิ่มพนักงานใหม่" flow at `/people/add/employee`)

## Purpose

This flow's UI already collects far more than Core's `POST /tenants/:id/members` currently accepts.
Today, submitting only sends 5 fields (see "Currently wired to Core" below) — everything else is
collected and shown on the review step, but silently discarded. This doc lists **every field the UI
collects**, whether the UI itself treats it as required, and whether it's currently sent to Core, so
the API team can go through it once and mark each row **"matches an existing field"**,
**"needs a new column/table"**, or **"not needed, drop from UI."**

Background: `docs/people/core-response-people-workspace-api.md` (Core's own response to the original
requirements doc) already confirms the 5 fields below are the full extent of what
`CreateMemberInput` accepts today, and flags `member_type` as a known open gap. This doc is the
detailed follow-up for everything else the FigJam redesign added on top of that.

## What's actually required to submit successfully, today

The "ยืนยันและเพิ่มพนักงาน" button on step 3 only succeeds if:

1. **A tenant/session resolved server-side** — not a form field; if this fails the whole page shows
   "ไม่พบข้อมูล Tenant ของผู้ใช้ปัจจุบัน" and submission is blocked entirely.
2. **`GET /tenants/:id/roles` returned at least one role** — also not a form field; if empty, the
   Role dropdown is replaced with "ไม่พบบทบาทที่ใช้ได้จาก Core" and submission is blocked.
3. Every field marked **Required** in the table below is filled.

## Currently wired to Core (`POST /tenants/:id/members`)

| Field (UI label) | Sent as | Required in UI? |
|---|---|---|
| อีเมล (สำหรับการเข้าสู่ระบบ) | `email` | **Yes** |
| บทบาท / สิทธิ์การเข้าถึง (Role) | `role_code` | **Yes** |
| ตำแหน่งงาน | `job_title` | **Yes** |
| หน่วยงาน | `default_department_id` | No |
| วันที่เริ่มงาน | `start_date` | No |
| *(auto-generated, not a form field — `EMP-0` + 3 random digits)* | `employee_code` | n/a |

No action needed on these — Core's contract for them is already confirmed. Listed here only for
completeness.

## Everything else — collected in the UI, NOT sent to Core today

Every field below is filled in, shown on the review step, and then discarded on submit. For each,
please mark whether it maps to an existing Core column, needs new work, or should be dropped.

### Step 1 — ข้อมูลส่วนบุคคล (Personal Information)

| Field (UI label) | Type | Required in UI? | Notes |
|---|---|---|---|
| คำนำหน้าชื่อ (title prefix) | select: นาย/นาง/นางสาว | No | |
| ชื่อ (ภาษาไทย) | text | **Yes** | |
| นามสกุล (ภาษาไทย) | text | **Yes** | |
| ชื่อ (ภาษาอังกฤษ) | text | No | |
| นามสกุล (ภาษาอังกฤษ) | text | No | |
| เพศ | select: ชาย/หญิง/ไม่ระบุ | No | |
| เลขบัตรประชาชน (ID card no.) | text | Marked required in markup, **but not actually enforced** — the "ถัดไป" button doesn't check it. Flagging as a UI bug regardless of what Core decides. | |
| เลขหนังสือเดินทาง (ถ้ามี) | text | No | |
| สัญชาติ | text | No | free text, defaults to "ไทย" |
| เชื้อชาติ | text | No | free text, defaults to "ไทย" |
| วันเกิด | date | No | |
| เบอร์โทรศัพท์มือถือ | text | No | |
| ที่อยู่ปัจจุบัน | textarea, max 200 chars | No | |
| หมายเหตุ (under "ข้อมูลเพิ่มเติม") | textarea | No | |
| รูปภาพพนักงาน (photo upload) | — | — | **Decorative only** — not wired to any state, not a real upload. Not in scope for this review unless you want file storage discussed too. |

### Step 2 — ข้อมูลการจ้างงานและตำแหน่ง (Employment & Position)

| Field (UI label) | Type | Required in UI? | Notes |
|---|---|---|---|
| ประเภทการจ้างงาน (employment type) | select: พนักงานประจำ/ทดลองงาน/สัญญาจ้าง | No | |
| สถานะการจ้างงาน (employment status) | select: พนักงานใหม่/ทดลองงาน/ผ่านทดลองงาน | No | |
| รหัสพนักงาน (Employee ID) | read-only, client-generated | n/a | Already sent as `employee_code` — listed here only to note it's **not** a real Core-issued sequence, just `EMP-0` + random digits client-side |
| กลุ่มพนักงาน (Employee Group) | select: พนักงานประจำ/พนักงานรายวัน | No | |
| ประเภทงาน (Job Type) | select: Full-time/Part-time | No | |
| รูปแบบการทำงาน (Work Arrangement) | select: On-site/Hybrid/Remote | No | |
| วันสิ้นสุดทดลองงาน (คาดการณ์) | date | No | |
| ระยะเวลาทดลองงาน | text | No | free text, defaults to "3 เดือน" |
| ทีม (Team) | text | No | free text — note `หน่วยงาน` above it is already real (`default_department_id`); this is a separate, unrelated free-text field with no backing |
| ผู้บังคับบัญชา (Reporting To) | select, sourced from mock roster | No | **Cosmetic suggestions only** — this dropdown is populated from `people/personnel`'s mock data, not Core; Core's Membership model has no "manager" concept at all today |
| ผู้บังคับบัญชารอง (ถ้ามี) | select, same mock roster | No | same caveat as above |
| สถานที่ทำงาน (work location) | select, 4 static options | No | |
| สถานที่ทำงานย่อย / พื้นที่ | text | No | |
| ประเภทสัญญาจ้าง (contract type) | select: สัญญาไม่มีกำหนด/สัญญาจ้าง 1 ปี | No | |
| ระดับ (Grade/Level) | text | No | |
| กลุ่มเงินเดือน (Salary Band) | select, 5 static bands | No | |
| เงินเดือนเริ่มต้น (starting salary) | numeric text | No | |
| หมายเหตุ | textarea, max 200 chars | No | |

## Suggested next step

If it's easier for your team to triage by likely priority rather than reading top-to-bottom, the
fields most likely to already have (or need) a real column, roughly in order: **เลขบัตรประชาชน**
(ID card — likely needed for compliance/payroll regardless of this form), **วันเกิด**, **เพศ**,
**สัญชาติ**, then the employment-classification fields (ประเภทการจ้างงาน/กลุ่มพนักงาน/ประเภทงาน),
then contract/compensation (ประเภทสัญญาจ้าง/ระดับ/กลุ่มเงินเดือน/เงินเดือนเริ่มต้น). ทีม,
ผู้บังคับบัญชา(รอง), and the location fields feel more likely to be "drop from UI until there's a
real backing concept" candidates, but that's a product call, not ours to make unilaterally.
