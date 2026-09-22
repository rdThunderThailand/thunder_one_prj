"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { buttonClasses, Button } from "@/components/ui/Button";
import { WizardSteps } from "@/components/ui/WizardSteps";
import { ChevronRightIcon } from "@/components/ui/icons";
import { ApiError, classifyApiError } from "@/lib/api/api-error";
import { formatDaysUntilThai, formatThaiDate } from "@/lib/thai-date";
import {
  checkEmailTaken,
  createEmployee,
  createMember,
  isPendingInvite,
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
import { clearFieldError } from "../form-field";
import { EMPLOYMENT_TYPE_OPTIONS, SALARY_BAND_OPTIONS, WORK_LOCATION_OPTIONS, unitLabel } from "../wizard-shared";
import { AddEmployeeStep1Personal } from "./AddEmployeeStep1Personal";
import { AddEmployeeStep2Employment } from "./AddEmployeeStep2Employment";
import { AddEmployeeStepReview } from "./AddEmployeeStepReview";
import { AddEmployeeStepSuccess } from "./AddEmployeeStepSuccess";

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
  /** Real distinct `job_title` values from the current roster (`people/
   *  personnel`'s `derivePositionOptions`) — backs the ตำแหน่งงาน field's
   *  `<datalist>` autocomplete. `[]` just means no suggestions; the field
   *  itself is free text, so this never blocks submission. */
  positionOptions: string[];
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
//
// Step JSX was split into AddEmployeeStep1Personal/AddEmployeeStep2Employment/
// AddEmployeeStepReview/AddEmployeeStepSuccess 2026-09-17 (readability
// audit) — pure presentational extraction, every state/handler below is
// unchanged from before the split and still lives only here.
export function AddEmployeeWizardPage({ tenantId, roles, units, positionOptions }: AddEmployeeWizardPageProps) {
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
  // Real since 2026-09-16 — memberships.position_code/level_role, round-trip
  // confirmed against thunder_core_API (commit 489c3b1).
  const [positionCode, setPositionCode] = useState("");
  const [levelRole, setLevelRole] = useState("");
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

  function handleFirstNameThChange(value: string) {
    setFirstNameTh(value);
    clearFieldError(setErrors, "firstNameTh");
  }
  function handleLastNameThChange(value: string) {
    setLastNameTh(value);
    clearFieldError(setErrors, "lastNameTh");
  }
  function handleIdCardNumberChange(value: string) {
    setIdCardNumber(value);
    clearFieldError(setErrors, "idCardNumber");
  }
  function handleEmailChange(value: string) {
    setEmail(value);
    clearFieldError(setErrors, "email");
  }
  function handlePhoneChange(value: string) {
    setPhone(value);
    clearFieldError(setErrors, "phone");
  }
  function handleStartDateChange(value: string) {
    setStartDate(value);
    clearFieldError(setErrors, "startDate");
  }
  function handlePositionChange(value: string) {
    setPosition(value);
    clearFieldError(setErrors, "position");
  }

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
    setPositionCode("");
    setLevelRole("");
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
        position_code: positionCode.trim() || undefined,
        level_role: levelRole.trim() || undefined,
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
          // Also captured explicitly (real since 2026-09-16, commit
          // f15d612) — this form's "ชื่อ (ภาษาไทย)" is already required Thai
          // script, so it doubles as both the primary and the explicit
          // Thai-name field. Keeps the Thai name recoverable even if
          // first_name/last_name are ever overwritten with something else
          // downstream (the exact failure mode a 2026-09 bulk import hit).
          first_name_th: firstNameTh.trim(),
          last_name_th: lastNameTh.trim(),
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
      // classifyApiError() (2026-09-17, RBAC audit follow-up) turns a raw 403
      // ("Forbidden"/whatever Core's own wording is) into a real Thai
      // permission message instead of showing Core's text verbatim — matters
      // more now that GET /organizations|members|dashboard dropped from
      // requireTenantAdmin to requireTenantMember, so non-admin roles reach
      // this submit step (and its still-admin-gated POST) far more often.
      const message = classifyApiError(err, "ไม่สามารถสร้างพนักงานใหม่ได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง").message;
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
        <AddEmployeeStep1Personal
          titlePrefix={titlePrefix}
          onTitlePrefixChange={setTitlePrefix}
          firstNameTh={firstNameTh}
          onFirstNameThChange={handleFirstNameThChange}
          lastNameTh={lastNameTh}
          onLastNameThChange={handleLastNameThChange}
          firstNameEn={firstNameEn}
          onFirstNameEnChange={setFirstNameEn}
          lastNameEn={lastNameEn}
          onLastNameEnChange={setLastNameEn}
          gender={gender}
          onGenderChange={setGender}
          idCardNumber={idCardNumber}
          onIdCardNumberChange={handleIdCardNumberChange}
          passportNumber={passportNumber}
          onPassportNumberChange={setPassportNumber}
          nationality={nationality}
          onNationalityChange={setNationality}
          ethnicity={ethnicity}
          onEthnicityChange={setEthnicity}
          birthDate={birthDate}
          onBirthDateChange={setBirthDate}
          email={email}
          onEmailChange={handleEmailChange}
          phone={phone}
          onPhoneChange={handlePhoneChange}
          address={address}
          onAddressChange={setAddress}
          additionalNote={additionalNote}
          onAdditionalNoteChange={setAdditionalNote}
          errors={errors}
        />
      )}

      {stepIndex === 1 && (
        <AddEmployeeStep2Employment
          employmentType={employmentType}
          onEmploymentTypeChange={setEmploymentType}
          employeeCode={employeeCode}
          onEmployeeCodeChange={setEmployeeCode}
          positionCode={positionCode}
          onPositionCodeChange={setPositionCode}
          levelRole={levelRole}
          onLevelRoleChange={setLevelRole}
          jobType={jobType}
          onJobTypeChange={setJobType}
          workArrangement={workArrangement}
          onWorkArrangementChange={setWorkArrangement}
          startDate={startDate}
          onStartDateChange={handleStartDateChange}
          probationEndDate={probationEndDate}
          onProbationEndDateChange={setProbationEndDate}
          probationDuration={probationDuration}
          onProbationDurationChange={setProbationDuration}
          position={position}
          onPositionChange={handlePositionChange}
          positionOptions={positionOptions}
          unitId={unitId}
          onUnitIdChange={setUnitId}
          units={units}
          unitOptions={unitOptions}
          team={team}
          onTeamChange={setTeam}
          roleCode={roleCode}
          onRoleCodeChange={setRoleCode}
          roles={roles}
          workLocation={workLocation}
          onWorkLocationChange={setWorkLocation}
          subLocation={subLocation}
          onSubLocationChange={setSubLocation}
          contractType={contractType}
          onContractTypeChange={setContractType}
          grade={grade}
          onGradeChange={setGrade}
          salaryBand={salaryBand}
          onSalaryBandChange={setSalaryBand}
          startingSalary={startingSalary}
          onStartingSalaryChange={setStartingSalary}
          notes={notes}
          onNotesChange={setNotes}
          errors={errors}
          titlePrefix={titlePrefix}
          fullName={fullName}
          idCardNumber={idCardNumber}
          email={email}
        />
      )}

      {stepIndex === 2 && !createdRow && (
        <AddEmployeeStepReview
          titlePrefix={titlePrefix}
          fullName={fullName}
          firstNameEn={firstNameEn}
          lastNameEn={lastNameEn}
          idCardNumber={idCardNumber}
          nationality={nationality}
          birthDate={birthDate}
          email={email}
          phone={phone}
          employeeCode={employeeCode}
          positionCode={positionCode}
          levelRole={levelRole}
          employmentType={employmentType}
          position={position}
          unitId={unitId}
          units={units}
          team={team}
          workLocation={workLocation}
          startDate={startDate}
          roles={roles}
          roleCode={roleCode}
          submitError={submitError}
        />
      )}

      {stepIndex === 2 && createdRow && (
        <AddEmployeeStepSuccess createdRow={createdRow} employmentType={employmentType} onAddNext={resetForNext} />
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
