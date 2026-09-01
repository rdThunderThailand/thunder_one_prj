"use client";

import Link from "next/link";
import { useState } from "react";
import { buttonClasses, Button } from "@/components/ui/Button";
import { WizardSteps } from "@/components/ui/WizardSteps";
import { CheckCircleIcon, ChevronRightIcon, ImageIcon, InfoIcon } from "@/components/ui/icons";
import { ApiError } from "@/lib/api/api-error";
import { formatDaysUntilThai, formatThaiDate } from "@/lib/thai-date";
import { createMember, isPendingInvite, personnelRows, type CoreRole } from "@/features/people/personnel";
import type { OrgUnitNode } from "@/features/people/org-structure";
// Deep import (bypassing people/new-hires's index.ts) so this file doesn't
// pull in NewHiresPage — which itself imports this feature's handoff.ts —
// and create a barrel-file import cycle between add-person and new-hires.
import { buildStepsFromDoneIndices, type NewHireRow } from "@/features/people/new-hires/mock-data";
import { NEW_HIRE_HANDOFF_KEY } from "../handoff";

const POSITION_OPTIONS = Array.from(new Set(personnelRows.map((row) => row.position))).sort((a, b) =>
  a.localeCompare(b)
);

const MANAGER_OPTIONS = Array.from(
  new Map(
    personnelRows
      .filter((row) => row.managerName)
      .map((row) => [row.managerName as string, { name: row.managerName as string, role: row.managerRole ?? "" }])
  ).values()
);

const WORK_LOCATION_OPTIONS = ["สำนักงานใหญ่ (Bangkok Office)", "สาขาเชียงใหม่", "สาขาขอนแก่น", "ทำงานทางไกล (Remote)"];

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

const inputClasses =
  "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";
const labelClasses = "flex flex-col gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400";

// Fields with no backing at all in Core's schema (docs/people/add-employee-flow-design-guideline.md's
// "group E" — decided 2026-09-01: label instead of remove, so HR doesn't
// mistake them for saved data, but keep them since Product hasn't signed
// off on cutting them yet).
const referenceOnlyNote = (
  <span className="text-[11px] font-normal text-zinc-400">ข้อมูลอ้างอิง ยังไม่บันทึกในระบบ</span>
);

// Visual counterpart to each field's `required` attribute — closes the gap
// Core's integration doc flagged (a field marked required in markup with no
// visible indicator and no enforcement). Only on fields that are both
// marked `required` AND gated in canProceedStep0/canProceedStep1 below.
const requiredMark = <span className="text-red-500">*</span>;

function randomEmployeeCode(): string {
  return `EMP-0${String(Math.floor(100 + Math.random() * 900))}`;
}

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
// or directly from New Hires'/Personnel's headers. Real Core integration is
// unchanged: submitting still calls Core's actual
// `POST /tenants/:id/members` (people/personnel's createMember) with exactly
// the same 5 fields the old modal sent — email, role_code, employee_code,
// job_title (ตำแหน่งงาน), default_department_id (หน่วยงาน), start_date
// (วันที่เริ่มงาน). Every other field on this page is a richer cosmetic
// intake form than the old modal had, matching the FigJam "People Workspace"
// board's screens — kept in local state for the review step only, never
// sent to Core.
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
  const [employeeCode] = useState(randomEmployeeCode);
  const [employmentType, setEmploymentType] = useState(EMPLOYMENT_TYPE_OPTIONS[0]);
  const [jobType, setJobType] = useState("Full-time");
  const [workArrangement, setWorkArrangement] = useState("On-site");
  const [position, setPosition] = useState("");
  const [unitId, setUnitId] = useState("");
  const [team, setTeam] = useState("");
  const [managerName, setManagerName] = useState("");
  const [managerRole, setManagerRole] = useState("");
  const [secondaryManagerName, setSecondaryManagerName] = useState("");
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
  const [roleCode, setRoleCode] = useState(
    () => roles?.find((r) => r.code === "operator_technician")?.code ?? roles?.[0]?.code ?? ""
  );

  const [createdRow, setCreatedRow] = useState<NewHireRow | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fullName = `${firstNameTh} ${lastNameTh}`.trim();
  const unitOptions = Object.values(units ?? {}).sort((a, b) => a.name.localeCompare(b.name));

  // 2026-09-01: closes the bug Core's integration doc flagged — เลขบัตรประชาชน
  // was marked `required` in the markup but never actually enforced here.
  // วันที่เริ่มงาน also promoted to required: the new POST /employees
  // contract requires start_date (still optional on the currently-deployed
  // /members, but tightening the UI now avoids a second round of user
  // confusion once the new endpoint ships).
  const canProceedStep0 =
    firstNameTh.trim().length > 0 &&
    lastNameTh.trim().length > 0 &&
    idCardNumber.trim().length > 0 &&
    email.trim().length > 0;
  const canProceedStep1 = position.trim().length > 0 && roleCode.length > 0 && startDate.trim().length > 0;

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
    setPosition("");
    setUnitId("");
    setTeam("");
    setManagerName("");
    setManagerRole("");
    setSecondaryManagerName("");
    setSubLocation("");
    setStartDate("");
    setProbationEndDate("");
    setGrade("");
    setStartingSalary("");
    setNotes("");
    setRoleCode(roles?.find((r) => r.code === "operator_technician")?.code ?? roles?.[0]?.code ?? "");
    setCreatedRow(null);
    setSubmitError(null);
  }

  async function handleSubmit() {
    if (!tenantId) {
      setSubmitError("ไม่พบข้อมูล Tenant ของผู้ใช้ปัจจุบัน กรุณาโหลดหน้านี้ใหม่แล้วลองอีกครั้ง");
      return;
    }
    if (!roleCode) {
      setSubmitError("ไม่พบบทบาท (Role) ที่ใช้ได้ในองค์กรนี้ ไม่สามารถสร้างพนักงานใหม่ได้ในขณะนี้");
      return;
    }

    setSubmitError(null);
    setSubmitting(true);
    try {
      const result = await createMember(tenantId, {
        email: email.trim(),
        role_code: roleCode,
        employee_code: employeeCode,
        job_title: position.trim() || undefined,
        default_department_id: unitId || undefined,
        start_date: startDate || undefined,
      });

      const pending = isPendingInvite(result);
      const steps = buildStepsFromDoneIndices(pending ? [] : DONE_INDICES_ON_SUBMIT);
      const doneCount = steps.filter((s) => s.done).length;

      // `status`/`steps`/`progress` below are invented client-side, not read
      // from `result` — see this component's header comment. Only
      // `id`/`name`/`employeeCode` (and `inviteUrl`) actually come from
      // Core's response.
      const row: NewHireRow = {
        id: pending ? result.invitation_id : result.id,
        name: pending ? email.trim() : result.user.full_name,
        employeeCode: pending ? employeeCode : (result.employee_code ?? employeeCode),
        position: position.trim() || "-",
        unit: unitId ? unitLabel(unitId, units ?? {}) : "-",
        startDateLabel: startDate ? formatThaiDate(startDate) : "-",
        daysLeftLabel: startDate ? formatDaysUntilThai(startDate) : "-",
        progress: Math.round((doneCount / steps.length) * 100),
        status: pending ? "pre-boarding" : "ready-to-work",
        managerName: managerName.trim() || null,
        managerRole: managerName.trim() ? managerRole.trim() || "ผู้จัดการ" : null,
        steps,
        inviteUrl: pending ? result.invite_url : undefined,
      };
      setCreatedRow(row);
      try {
        sessionStorage.setItem(NEW_HIRE_HANDOFF_KEY, JSON.stringify(row));
      } catch {
        // sessionStorage unavailable (private mode, etc.) — the created row
        // just won't show up pre-prepended on /people/new-hires; not fatal.
      }
    } catch (err) {
      setSubmitError(
        err instanceof ApiError ? err.message : "ไม่สามารถสร้างพนักงานใหม่ได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง"
      );
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
                <input required value={firstNameTh} onChange={(e) => setFirstNameTh(e.target.value)} className={inputClasses} />
              </label>
              <label className={labelClasses}>
                <span>นามสกุล (ภาษาไทย) {requiredMark}</span>
                <input required value={lastNameTh} onChange={(e) => setLastNameTh(e.target.value)} className={inputClasses} />
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
                <span>เลขบัตรประชาชน {requiredMark}</span>
                <input required value={idCardNumber} onChange={(e) => setIdCardNumber(e.target.value)} className={inputClasses} />
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
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClasses}
                />
              </label>
              <label className={labelClasses}>
                เบอร์โทรศัพท์มือถือ
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClasses} />
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
                  <input readOnly value={employeeCode} className={`${inputClasses} cursor-not-allowed opacity-70`} />
                  <span className="text-[11px] font-normal text-zinc-400">ระบบจะสร้างอัตโนมัติหลังบันทึก</span>
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
                  <input required type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClasses} />
                  {startDate && (
                    <span className="text-[11px] font-normal text-zinc-400">
                      {formatThaiDate(startDate)} ({formatDaysUntilThai(startDate)})
                    </span>
                  )}
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
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="พิมพ์เพื่อค้นหา หรือระบุตำแหน่งใหม่"
                    className={inputClasses}
                  />
                  <datalist id="position-options">
                    {POSITION_OPTIONS.map((option) => (
                      <option key={option} value={option} />
                    ))}
                  </datalist>
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
                <label className={labelClasses}>
                  ผู้บังคับบัญชา (Reporting To)
                  <select
                    value={managerName}
                    onChange={(e) => {
                      setManagerName(e.target.value);
                      setManagerRole(MANAGER_OPTIONS.find((m) => m.name === e.target.value)?.role ?? "");
                    }}
                    className={inputClasses}
                  >
                    <option value="">ไม่ระบุ</option>
                    {MANAGER_OPTIONS.map((manager) => (
                      <option key={manager.name} value={manager.name}>
                        {manager.name} — {manager.role}
                      </option>
                    ))}
                  </select>
                  {referenceOnlyNote}
                </label>
                <label className={labelClasses}>
                  ผู้บังคับบัญชารอง (ถ้ามี)
                  <select value={secondaryManagerName} onChange={(e) => setSecondaryManagerName(e.target.value)} className={inputClasses}>
                    <option value="">เลือกผู้บังคับบัญชา</option>
                    {MANAGER_OPTIONS.map((manager) => (
                      <option key={manager.name} value={manager.name}>
                        {manager.name} — {manager.role}
                      </option>
                    ))}
                  </select>
                  {referenceOnlyNote}
                </label>
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
              <SummaryRow label="ผู้บังคับบัญชา" value={managerName} />
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
              <SummaryRow label="ผู้บังคับบัญชา" value={managerName} />
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
            <Button
              variant="primary"
              onClick={() => setStepIndex((i) => Math.min(i + 1, 2))}
              disabled={stepIndex === 0 ? !canProceedStep0 : !canProceedStep1}
            >
              ถัดไป
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
