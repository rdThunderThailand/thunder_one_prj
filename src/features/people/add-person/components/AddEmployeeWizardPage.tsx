"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { buttonClasses, Button } from "@/components/ui/Button";
import { WizardSteps } from "@/components/ui/WizardSteps";
import { CheckCircleIcon, ChevronRightIcon, ImageIcon, InfoIcon } from "@/components/ui/icons";
import { ApiError } from "@/lib/api/api-error";
import { formatDaysUntilThai, formatThaiDate } from "@/lib/thai-date";
import {
  checkEmailTaken,
  createEmployee,
  createMember,
  isPendingInvite,
  personnelRows,
  type CoreEmployeeResult,
  type CoreInviteResult,
  type CoreMemberRow,
  type CoreRole,
} from "@/features/people/personnel";
import type { OrgUnitNode } from "@/features/people/org-structure";
// Deep import (bypassing people/new-hires's index.ts) so this file doesn't
// pull in NewHiresPage — which itself imports this feature's handoff.ts —
// and create a barrel-file import cycle between add-person and new-hires.
import { buildStepsFromDoneIndices, type NewHireRow } from "@/features/people/new-hires/mock-data";
import { NEW_HIRE_HANDOFF_KEY } from "../handoff";
import { employeeStep0Schema, employeeStep1Schema, pickDefaultRoleCode, zodErrorsToFieldMap } from "../schemas";
import { clearFieldError, ErrorText, fieldClasses, inputClasses, labelClasses } from "../form-field";

const POSITION_OPTIONS = Array.from(new Set(personnelRows.map((row) => row.position))).sort((a, b) =>
  a.localeCompare(b)
);

const WORK_LOCATION_OPTIONS = ["สำนักงานใหญ่ (Bangkok Office)", "สาขาเชียงใหม่", "สาขาขอนแก่น", "ทำงานทางไกล (Remote)"];

// Real columns on `memberships` since the 2026-09-01 employment-fields
// migration (see members-api.ts's CreateMemberInput) — maps this page's
// English option labels onto Core's closed enums.
const JOB_TYPE_BY_LABEL: Record<string, "full_time" | "part_time"> = {
  "Full-time": "full_time",
  "Part-time": "part_time",
};
const WORK_ARRANGEMENT_BY_LABEL: Record<string, "on_site" | "hybrid" | "remote"> = {
  "On-site": "on_site",
  Hybrid: "hybrid",
  Remote: "remote",
};
const GENDER_BY_LABEL: Record<string, "male" | "female" | "unspecified"> = {
  ชาย: "male",
  หญิง: "female",
  ไม่ระบุ: "unspecified",
};

// 2026-09-01: Core's response (docs/api/add-employee-integration-guide.md,
// per the artifact the user forwarded) confirmed the design guideline's
// suggestion — the old ประเภทการจ้างงาน/สถานะการจ้างงาน/กลุ่มพนักงาน (3
// overlapping dropdowns) collapse into Core's real `member_type` concept.
// "สถานะการจ้างงาน" (พนักงานใหม่/ทดลองงาน/ผ่านทดลองงาน) has no column at
// all — a real gap, not just consolidated — so it's dropped rather than
// merged in. Still cosmetic here (not sent to Core): the new
// `POST /tenants/:id/employees` endpoint that would accept `member_type`
// isn't deployed yet (status banner in that doc — not merged to Core's
// main branch), so this is a UI-only restructuring for now.
const EMPLOYMENT_TYPE_OPTIONS = ["พนักงานประจำ (Permanent)", "ทดลองงาน (Probation)", "พนักงานรายวัน (Daily)", "สัญญาจ้าง (Contract)"];
const SALARY_BAND_OPTIONS = [
  "Band D (18,000 - 25,000)",
  "Band E (25,000 - 35,000)",
  "Band F (35,000 - 45,000)",
  "Band G (45,000 - 60,000)",
  "Band H (60,000 - 90,000)",
];

/** Same "Division / Team" convention as people/personnel's core-mapper.ts —
 *  a top-level unit's own name, everything below it prefixed with its
 *  parent's. */
function unitLabel(unitId: string, units: Record<string, OrgUnitNode>): string {
  const unit = units[unitId];
  if (!unit) return "-";
  const parent = unit.parentId ? units[unit.parentId] : null;
  return parent && parent.parentId ? `${parent.name} / ${unit.name}` : unit.name;
}

const WIZARD_STEP_LABELS = ["ข้อมูลส่วนบุคคล", "ข้อมูลการจ้างงานและตำแหน่ง", "ตรวจสอบและเพิ่ม"];

// Every field this wizard collects that Core's CreateMemberInput does NOT
// accept (docs/people/core-response-people-workspace-api.md — only
// email/role_code/employee_code/job_title/default_department_id/start_date
// exist server-side today) is cosmetic: kept in local state for the review
// step and the optimistic pending-invite name display, never sent to Core.
// Once real fields exist for gender/DOB/nationality/etc., this local state
// needs mapping onto them, not silently trusting today's UI already "worked".

// Marks which of the 9 canonical OnboardingStep labels (people/new-hires's
// STEP_LABELS) get done once step 2 (employment & position) is submitted —
// everything except index 8 ("พร้อมเริ่มงาน", the real first-day readiness
// check, not something an intake form can mark done on its own). Always the
// same set — submission only ever happens from the review step — so unlike
// the old AddEmployeeModal this doesn't need to vary by which step you were
// on; see that component's history for why it was ever indexed by step.
const DONE_INDICES_ON_SUBMIT = [0, 1, 2, 3, 4, 5, 6, 7];

// Fields with no backing at all in Core's schema (docs/people/add-employee-flow-design-guideline.md's
// "group E" — decided 2026-09-01: label instead of remove, so HR doesn't
// mistake them for saved data, but keep them since Product hasn't signed
// off on cutting them yet).
const referenceOnlyNote = (
  <span className="text-[11px] font-normal text-zinc-400">ข้อมูลอ้างอิง ยังไม่บันทึกในระบบ</span>
);

// Visual counterpart to each field's `required` attribute — closes the gap
// Core's integration doc flagged (a field marked required in markup with no
// visible indicator and no enforcement). Only on fields that are both marked
// `required` AND covered by employeeStep0Schema/employeeStep1Schema (../schemas.ts).
const requiredMark = <span className="text-red-500">*</span>;

function Breadcrumb() {
  return (
    <nav className="flex items-center gap-1.5 text-xs text-zinc-400">
      <Link href="/people" className="hover:text-zinc-600 dark:hover:text-zinc-300">
        ภาพรวม
      </Link>
      <ChevronRightIcon className="h-3 w-3" />
      <Link href="/people/add" className="hover:text-zinc-600 dark:hover:text-zinc-300">
        เพิ่มคน
      </Link>
      <ChevronRightIcon className="h-3 w-3" />
      <span className="text-zinc-600 dark:text-zinc-300">เพิ่มพนักงานใหม่</span>
    </nav>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 text-sm">
      <span className="text-zinc-400">{label}</span>
      <span className="truncate text-right font-medium text-zinc-900 dark:text-zinc-50">{value || "-"}</span>
    </div>
  );
}

interface AddEmployeeWizardPageProps {
  /** `null` when session/tenant resolution failed server-side — submission
   *  is disabled with an explanation rather than guessing a tenant. */
  tenantId: string | null;
  /** `GET /tenants/:id/roles` result — `null`/`[]` disables submission the
   *  same way, since Core requires a `role_code` this app has no other way
   *  to get valid values for (confirmed 2026-08-28, §8 Q8,
   *  docs/people/core-response-people-workspace-api.md). */
  roles: CoreRole[] | null;
  /** Real org units (`people/org-structure`'s mapped Core tree) — `null`/`{}`
   *  degrades หน่วยงาน to "unavailable, will be created without one" rather
   *  than silently sending a mock unit's fake id as a real
   *  `default_department_id`. */
  units: Record<string, OrgUnitNode> | null;
}

// "เพิ่มพนักงานใหม่" — full-page 3-step successor to the old
// AddEmployeeModal (people/new-hires), reached via people/add's type picker
// or directly from New Hires'/Personnel's headers.
//
// Real Core integration (docs/api/add-employee-integration-guide.md):
// submitting tries `POST /tenants/:id/employees` first (people/personnel's
// createEmployee) — the direct-account-creation endpoint that actually
// writes `users` + `memberships` in one call, so Step 1's personal-info
// fields land somewhere real instead of being discarded. Confirmed live
// 2026-09-05 (code merged via PR #44 to `origin/develop`, backing
// migrations applied to the real ThunderCore Supabase project — a
// Core-side session's first read said this was still unpushed/unreleased;
// that was wrong, corrected the same day). On a 409 (`email` already has an
// account) it falls back to the older `POST /tenants/:id/members`
// (createMember) — that path can't write personal-info fields since the
// account, and its name, already exist.
//
// Real fields sent on the `/employees` path: email, role_code,
// employee_code, member_type, job_type, work_arrangement,
// probation_end_date, notes (two "หมายเหตุ" boxes joined, since Core has
// one column), job_title (ตำแหน่งงาน), start_date (วันที่เริ่มงาน),
// default_department_id (หน่วยงาน), first/last name (TH + EN), title
// prefix, เลขบัตรประชาชน/เลขหนังสือเดินทาง, เพศ, สัญชาติ, เชื้อชาติ, วันเกิด,
// เบอร์โทรศัพท์, ที่อยู่. On the `/members` fallback path, only the first
// group (everything up through default_department_id) is sent — the
// personal-info fields have no endpoint that accepts them once the account
// already exists.
//
// Still cosmetic either way: title-prefix-as-separate-from-name display
// choices aside, ทีม, ผู้บังคับบัญชา(รอง), สถานที่ทำงาน (still a static
// list, not a real `default_location_id` lookup — this app has no
// locations API yet), ระยะเวลาทดลองงาน (superseded by the real
// probation_end_date above but kept as a free-text label), photo upload,
// and every compensation field (ระดับ/กลุ่มเงินเดือน/เงินเดือนเริ่มต้น/
// ประเภทสัญญาจ้าง — a deliberately separate super_admin-only flow, not
// this wizard's job) — kept in local state for the review step only,
// never sent to Core. See thunder_core_API's docs/api/*-triage-response.md
// for why each one specifically.
export function AddEmployeeWizardPage({ tenantId, roles, units }: AddEmployeeWizardPageProps) {
  const [stepIndex, setStepIndex] = useState(0);

  // Step 1 — personal info. Only `email` is real (see REAL_FIELDS); the rest
  // stays local, used for the review step and the optimistic pending-invite
  // display, never sent to Core.
  const [titlePrefix, setTitlePrefix] = useState("นาย");
  const [firstNameTh, setFirstNameTh] = useState("");
  const [lastNameTh, setLastNameTh] = useState("");
  const [firstNameEn, setFirstNameEn] = useState("");
  const [lastNameEn, setLastNameEn] = useState("");
  const [gender, setGender] = useState("ชาย");
  const [idCardNumber, setIdCardNumber] = useState("");
  const [passportNumber, setPassportNumber] = useState("");
  const [nationality, setNationality] = useState("ไทย");
  const [ethnicity, setEthnicity] = useState("ไทย");
  const [birthDate, setBirthDate] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [additionalNote, setAdditionalNote] = useState("");

  // Step 2 — employment & position. position/unitId/startDate/roleCode are
  // real (see REAL_FIELDS); the rest stays local/cosmetic.
  // Was `useState(randomEmployeeCode)` — a fake code generated client-side
  // and sent to Core as if real (fixed 2026-09-15, UAT PP03-013). Someone
  // with no real employee ID (e.g. bulk-imported from an Excel sheet with a
  // blank column) now stays blank — sent as `undefined`, not a made-up
  // string — rather than getting a fabricated "EMP-0740" no one assigned.
  const [employeeCode, setEmployeeCode] = useState("");
  const [employmentType, setEmploymentType] = useState(EMPLOYMENT_TYPE_OPTIONS[0]);
  const [jobType, setJobType] = useState("Full-time");
  const [workArrangement, setWorkArrangement] = useState("On-site");
  const [position, setPosition] = useState("");
  const [unitId, setUnitId] = useState("");
  const [team, setTeam] = useState("");
  const [workLocation, setWorkLocation] = useState(WORK_LOCATION_OPTIONS[0]);
  const [subLocation, setSubLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [probationEndDate, setProbationEndDate] = useState("");
  const [probationDuration, setProbationDuration] = useState("3 เดือน");
  const [contractType, setContractType] = useState("สัญญาไม่มีกำหนด (Indefinite)");
  const [grade, setGrade] = useState("");
  const [salaryBand, setSalaryBand] = useState(SALARY_BAND_OPTIONS[3]);
  const [startingSalary, setStartingSalary] = useState("");
  const [notes, setNotes] = useState("");
  const [roleCode, setRoleCode] = useState(() => pickDefaultRoleCode(roles));

  const [createdRow, setCreatedRow] = useState<NewHireRow | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Real since 2026-09-15 (UAT PP02-009) — see handleNext below.
  const [checkingEmail, setCheckingEmail] = useState(false);

  const fullName = `${firstNameTh} ${lastNameTh}`.trim();
  const unitOptions = Object.values(units ?? {}).sort((a, b) => a.name.localeCompare(b.name));

  // 2026-09-01: closes the bug Core's integration doc flagged — เลขบัตรประชาชน
  // was marked `required` in the markup but never actually enforced here.
  // วันที่เริ่มงาน also promoted to required: the new POST /employees
  // contract requires start_date (still optional on the currently-deployed
  // /members, but tightening the UI now avoids a second round of user
  // confusion once the new endpoint ships).
  function validateStep(index: 0 | 1): boolean {
    const schema = index === 0 ? employeeStep0Schema : employeeStep1Schema;
    const data =
      index === 0
        ? { firstNameTh, lastNameTh, idCardNumber, email, phone }
        : { position, roleCode, startDate };
    const result = schema.safeParse(data);
    if (!result.success) {
      setErrors(zodErrorsToFieldMap(result.error));
      toast.error("กรุณาตรวจสอบข้อมูลที่กรอกให้ครบถ้วนและถูกต้อง");
      return false;
    }
    setErrors({});
    return true;
  }

  // UAT PP02-009: the "already a member" error only used to surface from
  // Core's 409 at the very last (`handleSubmit`) step, well after the user
  // had already filled in steps 2/3. Checking here — on "ถัดไป" out of step
  // 0, the minimum bar UAT asked for — catches it right after the email is
  // typed instead. Fails open (lets the user proceed) on a network/API
  // error rather than blocking the whole wizard on this one check; the
  // final `handleSubmit` 409 is still there as the real backstop.
  async function handleNext() {
    if (!validateStep(stepIndex === 0 ? 0 : 1)) return;
    if (stepIndex === 0 && tenantId) {
      setCheckingEmail(true);
      try {
        const taken = await checkEmailTaken(tenantId, email);
        if (taken) {
          setErrors((prev) => ({ ...prev, email: "อีเมลนี้เป็นสมาชิกขององค์กรอยู่แล้ว" }));
          toast.error("อีเมลนี้เป็นสมาชิกขององค์กรอยู่แล้ว");
          return;
        }
      } catch {
        // fail open — see comment above
      } finally {
        setCheckingEmail(false);
      }
    }
    setStepIndex((i) => Math.min(i + 1, 2));
  }

  function resetForNext() {
    setStepIndex(0);
    setTitlePrefix("นาย");
    setFirstNameTh("");
    setLastNameTh("");
    setFirstNameEn("");
    setLastNameEn("");
    setGender("ชาย");
    setIdCardNumber("");
    setPassportNumber("");
    setBirthDate("");
    setEmail("");
    setPhone("");
    setAddress("");
    setAdditionalNote("");
    setEmploymentType(EMPLOYMENT_TYPE_OPTIONS[0]);
    setEmployeeCode("");
    setPosition("");
    setUnitId("");
    setTeam("");
    setSubLocation("");
    setStartDate("");
    setProbationEndDate("");
    setGrade("");
    setStartingSalary("");
    setNotes("");
    setRoleCode(pickDefaultRoleCode(roles));
    setCreatedRow(null);
    setSubmitError(null);
    setErrors({});
  }

  async function handleSubmit() {
    // Belt-and-suspenders re-check — the wizard already validates each step
    // before advancing, but a user can navigate back via WizardSteps/EditLink
    // and leave a field invalid, so re-validate both steps right before the
    // real Core call and jump back to whichever step still has errors.
    if (!validateStep(0)) {
      setStepIndex(0);
      toast.error("กรุณาตรวจสอบข้อมูลส่วนบุคคลให้ครบถ้วนและถูกต้อง");
      return;
    }
    if (!validateStep(1)) {
      setStepIndex(1);
      toast.error("กรุณาตรวจสอบข้อมูลการจ้างงานให้ครบถ้วนและถูกต้อง");
      return;
    }
    if (!tenantId) {
      setSubmitError("ไม่พบข้อมูล Tenant ของผู้ใช้ปัจจุบัน กรุณาโหลดหน้านี้ใหม่แล้วลองอีกครั้ง");
      toast.error("ไม่พบข้อมูล Tenant ของผู้ใช้ปัจจุบัน กรุณาโหลดหน้านี้ใหม่แล้วลองอีกครั้ง");
      return;
    }
    if (!roleCode) {
      setSubmitError("ไม่พบบทบาท (Role) ที่ใช้ได้ในองค์กรนี้ ไม่สามารถสร้างพนักงานใหม่ได้ในขณะนี้");
      toast.error("ไม่พบบทบาท (Role) ที่ใช้ได้ในองค์กรนี้ ไม่สามารถสร้างพนักงานใหม่ได้ในขณะนี้");
      return;
    }

    setSubmitError(null);
    setSubmitting(true);
    try {
      const combinedNotes = [additionalNote.trim(), notes.trim()].filter(Boolean).join("\n\n");
      const sharedFields = {
        email: email.trim(),
        role_code: roleCode,
        employee_code: employeeCode.trim() || undefined,
        default_department_id: unitId || undefined,
        member_type: "employee" as const,
        job_type: JOB_TYPE_BY_LABEL[jobType],
        work_arrangement: WORK_ARRANGEMENT_BY_LABEL[workArrangement],
        probation_end_date: probationEndDate || undefined,
        notes: combinedNotes || undefined,
      };

      let result: CoreEmployeeResult | CoreMemberRow | CoreInviteResult;
      try {
        // Primary path: creates `users` + `memberships` in one call, so
        // Step 1's personal-info fields actually land somewhere — see this
        // component's header comment for why `/members` alone can't do
        // this. Guide's own recommendation: always try this first, only
        // fall back on 409.
        result = await createEmployee(tenantId, {
          ...sharedFields,
          first_name: firstNameTh.trim(),
          last_name: lastNameTh.trim(),
          job_title: position.trim(),
          start_date: startDate,
          title_prefix: titlePrefix || undefined,
          first_name_en: firstNameEn.trim() || undefined,
          last_name_en: lastNameEn.trim() || undefined,
          gender: GENDER_BY_LABEL[gender],
          national_id: idCardNumber.replace(/\D/g, "") || undefined,
          passport_no: passportNumber.trim() || undefined,
          nationality: nationality.trim() || undefined,
          ethnicity: ethnicity.trim() || undefined,
          date_of_birth: birthDate || undefined,
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
        });
      } catch (err) {
        if (!(err instanceof ApiError) || err.status !== 409) throw err;
        // `email` already has an account — `/employees` refuses to touch an
        // existing `users` row (its whole point is creating one). Fall back
        // to the older endpoint, which just attaches a membership; the
        // personal-info fields above have nowhere to go on this path since
        // the account (and its name) already exists.
        result = await createMember(tenantId, {
          ...sharedFields,
          job_title: position.trim() || undefined,
          start_date: startDate || undefined,
        });
      }

      const pending = isPendingInvite(result);
      const steps = buildStepsFromDoneIndices(pending ? [] : DONE_INDICES_ON_SUBMIT);
      const doneCount = steps.filter((s) => s.done).length;

      // Narrowing `result` (now a 3-way union across CoreEmployeeResult/
      // CoreMemberRow/CoreInviteResult) via a plain `pending` boolean stops
      // working once a third member joins the union — call the type guard
      // directly in each branch instead of reusing the boolean.
      // `status`/`steps`/`progress` below are invented client-side, not read
      // from `result` — see this component's header comment. Only
      // `id`/`name`/`employeeCode` (and `inviteUrl`) actually come from
      // Core's response.
      const identity = isPendingInvite(result)
        ? {
            id: result.invitation_id,
            name: email.trim(),
            employeeCode: employeeCode.trim() || "-",
            inviteUrl: result.invite_url,
          }
        : {
            id: result.id,
            name: result.user.full_name,
            employeeCode: result.employee_code || employeeCode.trim() || "-",
            inviteUrl: undefined as string | undefined,
          };
      const row: NewHireRow = {
        id: identity.id,
        name: identity.name,
        employeeCode: identity.employeeCode,
        position: position.trim() || "-",
        unit: unitId ? unitLabel(unitId, units ?? {}) : "-",
        startDateLabel: startDate ? formatThaiDate(startDate) : "-",
        daysLeftLabel: startDate ? formatDaysUntilThai(startDate) : "-",
        progress: Math.round((doneCount / steps.length) * 100),
        status: pending ? "pre-boarding" : "ready-to-work",
        // Reporting-to field removed from the UI (mock roster names, no real
        // Core column to back it — see docs/people/add-contractor-and-bulk-
        // field-requirements.md's ผู้บังคับบัญชา entry).
        managerName: null,
        managerRole: null,
        steps,
        inviteUrl: identity.inviteUrl,
      };
      setCreatedRow(row);
      toast.success(pending ? `ส่งคำเชิญไปที่ ${email.trim()} แล้ว` : `เพิ่ม ${row.name} เป็นพนักงานใหม่แล้ว`);
      try {
        sessionStorage.setItem(NEW_HIRE_HANDOFF_KEY, JSON.stringify(row));
      } catch {
        // sessionStorage unavailable (private mode, etc.) — the created row
        // just won't show up pre-prepended on /people/new-hires; not fatal.
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "ไม่สามารถสร้างพนักงานใหม่ได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง";
      setSubmitError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-3">
          <Breadcrumb />
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">เพิ่มพนักงานใหม่ (Employee)</h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">กรอกข้อมูลเพื่อเพิ่มพนักงานเข้าสู่องค์กร</p>
          </div>
        </div>
        <Link href="/people/add" className={buttonClasses("secondary")}>
          ยกเลิก
        </Link>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <WizardSteps steps={WIZARD_STEP_LABELS} currentIndex={stepIndex} />
      </div>

      {stepIndex === 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm lg:col-span-2 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">1. ข้อมูลส่วนบุคคล (Personal Information)</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <label className={labelClasses}>
                คำนำหน้าชื่อ
                <select value={titlePrefix} onChange={(e) => setTitlePrefix(e.target.value)} className={inputClasses}>
                  <option>นาย</option>
                  <option>นาง</option>
                  <option>นางสาว</option>
                </select>
              </label>
              <label className={labelClasses}>
                <span>ชื่อ (ภาษาไทย) {requiredMark}</span>
                <input
                  required
                  value={firstNameTh}
                  onChange={(e) => {
                    setFirstNameTh(e.target.value);
                    clearFieldError(setErrors, "firstNameTh");
                  }}
                  className={fieldClasses(!!errors.firstNameTh)}
                />
                <ErrorText message={errors.firstNameTh} />
              </label>
              <label className={labelClasses}>
                <span>นามสกุล (ภาษาไทย) {requiredMark}</span>
                <input
                  required
                  value={lastNameTh}
                  onChange={(e) => {
                    setLastNameTh(e.target.value);
                    clearFieldError(setErrors, "lastNameTh");
                  }}
                  className={fieldClasses(!!errors.lastNameTh)}
                />
                <ErrorText message={errors.lastNameTh} />
              </label>
              <label className={labelClasses}>
                ชื่อ (ภาษาอังกฤษ)
                <input value={firstNameEn} onChange={(e) => setFirstNameEn(e.target.value)} className={inputClasses} />
              </label>
              <label className={labelClasses}>
                นามสกุล (ภาษาอังกฤษ)
                <input value={lastNameEn} onChange={(e) => setLastNameEn(e.target.value)} className={inputClasses} />
              </label>
              <label className={labelClasses}>
                เพศ
                <select value={gender} onChange={(e) => setGender(e.target.value)} className={inputClasses}>
                  <option>ชาย</option>
                  <option>หญิง</option>
                  <option>ไม่ระบุ</option>
                </select>
              </label>
              <label className={labelClasses}>
                <span>เลขบัตรประชาชน</span>
                <input
                  value={idCardNumber}
                  onChange={(e) => {
                    setIdCardNumber(e.target.value);
                    clearFieldError(setErrors, "idCardNumber");
                  }}
                  className={fieldClasses(!!errors.idCardNumber)}
                />
                <ErrorText message={errors.idCardNumber} />
              </label>
              <label className={labelClasses}>
                เลขหนังสือเดินทาง (ถ้ามี)
                <input value={passportNumber} onChange={(e) => setPassportNumber(e.target.value)} className={inputClasses} />
              </label>
              <label className={labelClasses}>
                สัญชาติ
                <input value={nationality} onChange={(e) => setNationality(e.target.value)} className={inputClasses} />
              </label>
              <label className={labelClasses}>
                เชื้อชาติ
                <input value={ethnicity} onChange={(e) => setEthnicity(e.target.value)} className={inputClasses} />
              </label>
              <label className={labelClasses}>
                วันเกิด
                <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className={inputClasses} />
              </label>
              <label className={labelClasses}>
                <span>อีเมล (สำหรับการเข้าสู่ระบบ) {requiredMark}</span>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearFieldError(setErrors, "email");
                  }}
                  className={fieldClasses(!!errors.email)}
                />
                <ErrorText message={errors.email} />
              </label>
              <label className={labelClasses}>
                เบอร์โทรศัพท์มือถือ
                <input
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    clearFieldError(setErrors, "phone");
                  }}
                  className={fieldClasses(!!errors.phone)}
                />
                <ErrorText message={errors.phone} />
              </label>
            </div>
            <label className={labelClasses}>
              ที่อยู่ปัจจุบัน
              <textarea
                rows={2}
                maxLength={200}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={inputClasses}
              />
            </label>
            <details className="rounded-lg border border-zinc-100 p-3 dark:border-zinc-800">
              <summary className="cursor-pointer text-xs font-medium text-zinc-500 dark:text-zinc-400">
                ข้อมูลเพิ่มเติม (ถ้ามี)
              </summary>
              <label className={`${labelClasses} mt-2`}>
                หมายเหตุ
                <textarea
                  rows={2}
                  // Sent joined with step 2's own "หมายเหตุ" (maxLength=200
                  // there) into Core's single ≤2000-char `notes` column —
                  // 1798 = 2000 − 200 − len("\n\n"), so the combined string
                  // can never exceed Core's limit and fail only at submit.
                  maxLength={1798}
                  value={additionalNote}
                  onChange={(e) => setAdditionalNote(e.target.value)}
                  className={inputClasses}
                />
              </label>
            </details>
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">รูปภาพพนักงาน (ถ้ามี)</h3>
              <div
                title="ยังไม่เปิดใช้งาน"
                className="flex cursor-not-allowed flex-col items-center gap-2 rounded-xl border border-dashed border-zinc-200 py-6 text-center dark:border-zinc-700"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
                  <ImageIcon className="h-5 w-5" />
                </span>
                <span className="text-xs font-medium text-indigo-500">อัปโหลดรูปภาพ</span>
                <span className="text-[11px] text-zinc-400">รองรับไฟล์ JPG, PNG (ขนาดไม่เกิน 2MB)</span>
              </div>
            </div>
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5 text-xs text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300">
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                <InfoIcon className="h-4 w-4" />
                คำแนะนำ
              </h3>
              <ul className="list-inside list-disc space-y-1">
                <li>กรอกข้อมูลที่มีเครื่องหมาย * ให้ครบถ้วน</li>
                <li>ข้อมูลจะถูกใช้ในการสร้างบัญชีผู้ใช้และเริ่มกระบวนการ Onboarding</li>
                <li>คุณสามารถบันทึกชั่วคราว และกลับมาแก้ไขภายหลังได้</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {stepIndex === 1 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="flex flex-col gap-5 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm lg:col-span-2 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">2. ข้อมูลการจ้างงานและตำแหน่ง</h2>

            <div>
              <p className="mb-2 text-xs font-semibold text-zinc-400">ข้อมูลการจ้างงาน</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className={labelClasses}>
                  ประเภทการจ้างงาน
                  <select value={employmentType} onChange={(e) => setEmploymentType(e.target.value)} className={inputClasses}>
                    {EMPLOYMENT_TYPE_OPTIONS.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>
                <label className={labelClasses}>
                  รหัสพนักงาน (Employee ID)
                  <input
                    value={employeeCode}
                    onChange={(e) => setEmployeeCode(e.target.value)}
                    placeholder="เช่น EMP-0001"
                    className={inputClasses}
                  />
                  <span className="text-[11px] font-normal text-zinc-400">เว้นว่างได้หากยังไม่มีรหัสพนักงาน</span>
                </label>
                <label className={labelClasses}>
                  ประเภทงาน (Job Type)
                  <select value={jobType} onChange={(e) => setJobType(e.target.value)} className={inputClasses}>
                    <option>Full-time</option>
                    <option>Part-time</option>
                  </select>
                </label>
                <label className={labelClasses}>
                  รูปแบบการทำงาน (Work Arrangement)
                  <select value={workArrangement} onChange={(e) => setWorkArrangement(e.target.value)} className={inputClasses}>
                    <option>On-site</option>
                    <option>Hybrid</option>
                    <option>Remote</option>
                  </select>
                </label>
                <label className={labelClasses}>
                  <span>วันที่เริ่มงาน {requiredMark}</span>
                  <input
                    required
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      clearFieldError(setErrors, "startDate");
                    }}
                    className={fieldClasses(!!errors.startDate)}
                  />
                  {startDate && (
                    <span className="text-[11px] font-normal text-zinc-400">
                      {formatThaiDate(startDate)} ({formatDaysUntilThai(startDate)})
                    </span>
                  )}
                  <ErrorText message={errors.startDate} />
                </label>
                <label className={labelClasses}>
                  วันสิ้นสุดทดลองงาน (คาดการณ์)
                  <input
                    type="date"
                    value={probationEndDate}
                    onChange={(e) => setProbationEndDate(e.target.value)}
                    className={inputClasses}
                  />
                </label>
                <label className={labelClasses}>
                  ระยะเวลาทดลองงาน
                  <input value={probationDuration} onChange={(e) => setProbationDuration(e.target.value)} className={inputClasses} />
                </label>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold text-zinc-400">ตำแหน่งและโครงสร้างองค์กร</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className={labelClasses}>
                  <span>ตำแหน่งงาน {requiredMark}</span>
                  <input
                    required
                    list="position-options"
                    value={position}
                    onChange={(e) => {
                      setPosition(e.target.value);
                      clearFieldError(setErrors, "position");
                    }}
                    placeholder="พิมพ์เพื่อค้นหา หรือระบุตำแหน่งใหม่"
                    className={fieldClasses(!!errors.position)}
                  />
                  <datalist id="position-options">
                    {POSITION_OPTIONS.map((option) => (
                      <option key={option} value={option} />
                    ))}
                  </datalist>
                  <ErrorText message={errors.position} />
                </label>
                <label className={labelClasses}>
                  หน่วยงาน
                  {unitOptions.length > 0 ? (
                    <select value={unitId} onChange={(e) => setUnitId(e.target.value)} className={inputClasses}>
                      <option value="">ไม่ระบุ</option>
                      {unitOptions.map((unit) => (
                        <option key={unit.id} value={unit.id}>
                          {unitLabel(unit.id, units ?? {})}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span
                      title="ไม่สามารถโหลดรายชื่อหน่วยงานจาก Core ได้ในขณะนี้ — จะสร้างพนักงานใหม่โดยไม่ระบุหน่วยงาน"
                      className="flex cursor-not-allowed items-center rounded-lg border border-dashed border-zinc-200 px-3 py-2 text-sm text-zinc-400 dark:border-zinc-700"
                    >
                      ไม่พบข้อมูลหน่วยงาน
                    </span>
                  )}
                </label>
                <label className={labelClasses}>
                  ทีม (Team)
                  <input value={team} onChange={(e) => setTeam(e.target.value)} className={inputClasses} />
                  {referenceOnlyNote}
                </label>
                <label className={labelClasses}>
                  <span>บทบาท / สิทธิ์การเข้าถึง (Role) {requiredMark}</span>
                  {roles && roles.length > 0 ? (
                    <select required value={roleCode} onChange={(e) => setRoleCode(e.target.value)} className={inputClasses}>
                      {!roleCode && (
                        <option value="" disabled>
                          -- เลือกบทบาท --
                        </option>
                      )}
                      {roles.map((role) => (
                        <option key={role.id} value={role.code}>
                          {role.name} ({role.code})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="rounded-lg border border-dashed border-red-200 px-3 py-2 text-sm text-red-500 dark:border-red-500/30">
                      ไม่พบบทบาทที่ใช้ได้จาก Core
                    </span>
                  )}
                </label>
                {/* ผู้บังคับบัญชา (Reporting To / รอง) removed — was backed by
                    a mock personnel roster, not real tenant members, and
                    Core has no manager_id/reports_to column to wire it to
                    anyway (see docs/people/add-contractor-and-bulk-field-
                    requirements.md). Showing it invited HR to pick a fake
                    "real" manager. */}
                <label className={labelClasses}>
                  สถานที่ทำงาน
                  <select value={workLocation} onChange={(e) => setWorkLocation(e.target.value)} className={inputClasses}>
                    {WORK_LOCATION_OPTIONS.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>
                <label className={labelClasses}>
                  สถานที่ทำงานย่อย / พื้นที่
                  <input value={subLocation} onChange={(e) => setSubLocation(e.target.value)} className={inputClasses} />
                  {referenceOnlyNote}
                </label>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold text-zinc-400">ข้อมูลการจ้างงานเพิ่มเติม</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <label className={labelClasses}>
                  ประเภทสัญญาจ้าง
                  <select value={contractType} onChange={(e) => setContractType(e.target.value)} className={inputClasses}>
                    <option>สัญญาไม่มีกำหนด (Indefinite)</option>
                    <option>สัญญาจ้าง 1 ปี</option>
                  </select>
                </label>
                <label className={labelClasses}>
                  ระดับ (Grade/Level)
                  <input value={grade} onChange={(e) => setGrade(e.target.value)} className={inputClasses} />
                </label>
                <label className={labelClasses}>
                  กลุ่มเงินเดือน (Salary Band)
                  <select value={salaryBand} onChange={(e) => setSalaryBand(e.target.value)} className={inputClasses}>
                    {SALARY_BAND_OPTIONS.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>
                <label className={labelClasses}>
                  เงินเดือนเริ่มต้น
                  <input
                    inputMode="numeric"
                    value={startingSalary}
                    onChange={(e) => setStartingSalary(e.target.value)}
                    placeholder="บาท/เดือน"
                    className={inputClasses}
                  />
                </label>
              </div>
              <label className={`${labelClasses} mt-3`}>
                หมายเหตุ
                <textarea rows={2} maxLength={200} value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClasses} />
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">สรุปข้อมูลที่กรอก</h3>
              <p className="mb-2 text-xs font-medium text-zinc-400">ข้อมูลส่วนบุคคล</p>
              <SummaryRow label="ชื่อ-นามสกุล" value={`${titlePrefix} ${fullName}`} />
              <SummaryRow label="เลขบัตรประชาชน" value={idCardNumber} />
              <SummaryRow label="อีเมล" value={email} />
              <p className="mt-3 mb-2 text-xs font-medium text-zinc-400">การจ้างงานและตำแหน่ง</p>
              <SummaryRow label="ประเภทการจ้างงาน" value={employmentType} />
              <SummaryRow label="ตำแหน่ง" value={position} />
              <SummaryRow label="หน่วยงาน / ทีม" value={[unitId ? unitLabel(unitId, units ?? {}) : "", team].filter(Boolean).join(" / ")} />
              <SummaryRow label="วันที่เริ่มงาน" value={startDate ? formatThaiDate(startDate) : ""} />
            </div>
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5 text-xs text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300">
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                <InfoIcon className="h-4 w-4" />
                คำแนะนำ
              </h3>
              <ul className="list-inside list-disc space-y-1">
                <li>ตำแหน่งงานที่เลือกต้องมีอัตรากำลังว่าง</li>
                <li>วันที่เริ่มงานจะเป็นตัวกำหนดการเริ่ม Onboarding</li>
                <li>หากไม่พบตำแหน่งที่ต้องการ ติดต่อ HR Admin</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {stepIndex === 2 && !createdRow && (
        <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">3. ตรวจสอบและเพิ่ม</h2>
          <p className="text-xs text-zinc-400">ตรวจสอบข้อมูลก่อนเพิ่มพนักงานใหม่เข้าสู่องค์กร</p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/50">
              <p className="mb-1 text-xs font-semibold text-zinc-400">ข้อมูลส่วนบุคคล</p>
              <SummaryRow label="ชื่อ-นามสกุล" value={`${titlePrefix} ${fullName}`} />
              <SummaryRow label="ชื่อ (อังกฤษ)" value={`${firstNameEn} ${lastNameEn}`.trim()} />
              <SummaryRow label="เลขบัตรประชาชน" value={idCardNumber} />
              <SummaryRow label="สัญชาติ" value={nationality} />
              <SummaryRow label="วันเกิด" value={birthDate ? formatThaiDate(birthDate) : ""} />
              <SummaryRow label="อีเมล" value={email} />
              <SummaryRow label="เบอร์โทรศัพท์" value={phone} />
            </div>
            <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/50">
              <p className="mb-1 text-xs font-semibold text-zinc-400">การจ้างงานและตำแหน่ง</p>
              <SummaryRow label="รหัสพนักงาน" value={employeeCode} />
              <SummaryRow label="ประเภทการจ้างงาน" value={employmentType} />
              <SummaryRow label="ตำแหน่งงาน" value={position} />
              <SummaryRow label="หน่วยงาน / ทีม" value={[unitId ? unitLabel(unitId, units ?? {}) : "", team].filter(Boolean).join(" / ")} />
              <SummaryRow label="สถานที่ทำงาน" value={workLocation} />
              <SummaryRow label="วันที่เริ่มงาน" value={startDate ? formatThaiDate(startDate) : ""} />
              <SummaryRow label="บทบาท (Role)" value={roles?.find((r) => r.code === roleCode)?.name ?? roleCode} />
            </div>
          </div>

          {submitError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-500/10 dark:text-red-400">{submitError}</p>
          )}
        </div>
      )}

      {stepIndex === 2 && createdRow && (
        <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col items-center gap-2 py-2 text-center">
            <CheckCircleIcon className="h-9 w-9 text-emerald-500" />
            {createdRow.inviteUrl ? (
              <>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">ส่งคำเชิญไปที่ {createdRow.name} แล้ว</p>
                <p className="max-w-sm text-xs text-zinc-400">
                  อีเมลนี้ยังไม่มีบัญชี Thunder One — รอการตอบรับคำเชิญก่อนจึงจะเริ่มกระบวนการ Onboarding ได้
                </p>
              </>
            ) : (
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{createdRow.name} พร้อมเริ่มกระบวนการ Onboarding</p>
            )}
            <p className="text-xs text-zinc-400">
              {createdRow.employeeCode} · {createdRow.position} · {employmentType}
            </p>
          </div>

          {createdRow.inviteUrl && (
            <div className="mx-auto flex w-full max-w-md items-center gap-2 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
              <input
                readOnly
                value={createdRow.inviteUrl}
                onFocus={(e) => e.currentTarget.select()}
                className="w-full truncate bg-transparent text-xs text-zinc-600 outline-none dark:text-zinc-300"
              />
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(createdRow.inviteUrl ?? "")}
                className="shrink-0 rounded-md bg-white px-2.5 py-1 text-xs font-medium text-indigo-600 shadow-sm dark:bg-zinc-900 dark:text-indigo-400"
              >
                คัดลอกลิงก์
              </button>
            </div>
          )}

          <div className="mx-auto w-full max-w-md rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
            <div className="mb-2 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
              <span>ความคืบหน้า</span>
              <span>{createdRow.progress}%</span>
            </div>
            <ul className="flex flex-col gap-1">
              {createdRow.steps.map((step) => (
                <li key={step.label} className="flex items-center justify-between text-xs">
                  <span className="text-zinc-600 dark:text-zinc-300">{step.label}</span>
                  {step.done ? (
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">เสร็จสิ้น</span>
                  ) : (
                    <span className="font-medium text-amber-600 dark:text-amber-400">{step.pendingLabel}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="mx-auto flex items-center gap-2">
            <Button variant="secondary" onClick={resetForNext}>
              เพิ่มพนักงานคนถัดไป
            </Button>
            <Link href="/people/new-hires" className={buttonClasses("primary")}>
              ไปที่หน้าเข้าใหม่
            </Link>
          </div>
        </div>
      )}

      {!createdRow && (
        <div className="flex justify-end gap-2">
          {stepIndex > 0 && (
            <Button variant="secondary" onClick={() => setStepIndex((i) => Math.max(i - 1, 0))} disabled={submitting}>
              ย้อนกลับ
            </Button>
          )}
          {stepIndex < 2 ? (
            <Button variant="primary" onClick={handleNext} disabled={checkingEmail}>
              {checkingEmail ? "กำลังตรวจสอบ..." : "ถัดไป"}
            </Button>
          ) : (
            <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "กำลังบันทึก..." : "ยืนยันและเพิ่มพนักงาน"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
