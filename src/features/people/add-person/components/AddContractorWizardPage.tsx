"use client";

import Link from "next/link";
import { useState } from "react";
import { buttonClasses, Button } from "@/components/ui/Button";
import { WizardSteps } from "@/components/ui/WizardSteps";
import { CheckCircleIcon, ChevronRightIcon, ImageIcon, InfoIcon, ShieldIcon } from "@/components/ui/icons";
import { ApiError } from "@/lib/api/api-error";
import { formatDaysUntilThai, formatThaiDate } from "@/lib/thai-date";
import { createMember, isPendingInvite, personnelRows, type CoreRole } from "@/features/people/personnel";
import type { OrgUnitNode } from "@/features/people/org-structure";
// Deep import (bypassing people/new-hires's index.ts) — see
// AddEmployeeWizardPage's identical comment for why (avoids a barrel-file
// import cycle between add-person and new-hires).
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
const DURATION_OPTIONS = ["3 เดือน", "6 เดือน", "12 เดือน", "ไม่ระบุ"];
const PAYMENT_TYPE_OPTIONS = ["รายเดือน", "รายงวด", "เมื่อเสร็จงาน"];
const PAYMENT_CYCLE_OPTIONS = ["สิ้นเดือน", "ทุก 15 วัน"];

/** Same "Division / Team" convention as people/personnel's core-mapper.ts —
 *  a top-level unit's own name, everything below it prefixed with its
 *  parent's. */
function unitLabel(unitId: string, units: Record<string, OrgUnitNode>): string {
  const unit = units[unitId];
  if (!unit) return "-";
  const parent = unit.parentId ? units[unit.parentId] : null;
  return parent && parent.parentId ? `${parent.name} / ${unit.name}` : unit.name;
}

function ageFromBirthDate(birthDate: string): string {
  if (!birthDate) return "-";
  const dob = new Date(birthDate);
  if (Number.isNaN(dob.getTime())) return "-";
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const notYetBirthday = now.getMonth() < dob.getMonth() || (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate());
  if (notYetBirthday) age -= 1;
  return age >= 0 ? String(age) : "-";
}

const WIZARD_STEP_LABELS = ["ข้อมูลส่วนบุคคล", "ข้อมูลการจ้างงานและสัญญา", "ตรวจสอบและเพิ่ม"];

const inputClasses =
  "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";
const labelClasses = "flex flex-col gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400";

function randomContractorCode(): string {
  return `CON-0${String(Math.floor(100 + Math.random() * 900))}`;
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
      <span className="text-zinc-600 dark:text-zinc-300">เพิ่มผู้รับเหมา/ผู้ปฏิบัติงานภายนอก</span>
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

function EditLink({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400">
      แก้ไข
    </button>
  );
}

interface AddContractorWizardPageProps {
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

// "เพิ่มผู้รับเหมา / ผู้ปฏิบัติงานภายนอก (Contractor)" — full-page 3-step
// wizard, the Contractor sibling of AddEmployeeWizardPage. Reached from
// people/add's type picker (the Contractor card, previously inert — no
// mockup existed for this flow until 2026-09-01).
//
// Real Core integration: submitting calls the exact same
// `POST /tenants/:id/members` (people/personnel's createMember) Employee
// intake uses — Core's schema has no `member_type` distinction at all yet
// (confirmed, docs/people/core-response-people-workspace-api.md, §8 Q1
// "still open"), so a Contractor and an Employee are the same kind of row
// server-side today; only `employee_code`'s `CON-` prefix (a client-side
// convention, same as people/personnel's mock rows) and this page's own
// copy/fields distinguish them. Real fields sent: email, role_code,
// employee_code, job_title (ตำแหน่งงาน), default_department_id
// (หน่วยงาน), start_date (วันที่เริ่มงาน) — identical set to Employee's.
// Everything else on this page (ID/passport, contact channels, contract
// number/value/payment terms, work location/address, etc.) is cosmetic —
// kept in local state for the review step only, never sent to Core.
//
// Unlike Employee (which lands at 8/9, `status: "ready-to-work"`, since its
// wizard covers most onboarding-checklist topics), this flow's own copy is
// explicit that onboarding hasn't started — "บันทึกสำเร็จแล้ว
// สามารถเริ่มกระบวนการ Onboarding ได้จากเมนู 'เข้าใหม่'" — so a created
// contractor's NewHireRow always starts at 0/9, `status: "pre-boarding"`.
export function AddContractorWizardPage({ tenantId, roles, units }: AddContractorWizardPageProps) {
  const [stepIndex, setStepIndex] = useState(0);

  // Step 1 — personal info. Only `email` is real; the rest stays local, used
  // for the review step and the optimistic pending-invite name display,
  // never sent to Core.
  const [titlePrefix, setTitlePrefix] = useState("นาย");
  const [firstNameTh, setFirstNameTh] = useState("");
  const [lastNameTh, setLastNameTh] = useState("");
  const [firstNameEn, setFirstNameEn] = useState("");
  const [lastNameEn, setLastNameEn] = useState("");
  const [idOrPassportNumber, setIdOrPassportNumber] = useState("");
  const [nationality, setNationality] = useState("ไทย");
  const [gender, setGender] = useState("ชาย");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [secondaryPhone, setSecondaryPhone] = useState("");
  const [address, setAddress] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [lineId, setLineId] = useState("");
  const [otherContact, setOtherContact] = useState("");
  const [additionalNote, setAdditionalNote] = useState("");

  // Step 2 — employment & contract. position/unitId/startDate/roleCode are
  // real; the rest stays local/cosmetic.
  const [employeeCode] = useState(randomContractorCode);
  const [position, setPosition] = useState("");
  const [unitId, setUnitId] = useState("");
  const [team, setTeam] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [managerName, setManagerName] = useState("");
  const [managerRole, setManagerRole] = useState("");
  const [workArrangement, setWorkArrangement] = useState("On-site");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [duration, setDuration] = useState(DURATION_OPTIONS[2]);
  const [contractNumber, setContractNumber] = useState("");
  const [contractDate, setContractDate] = useState("");
  const [contractValue, setContractValue] = useState("");
  const [paymentType, setPaymentType] = useState(PAYMENT_TYPE_OPTIONS[0]);
  const [paymentCycle, setPaymentCycle] = useState(PAYMENT_CYCLE_OPTIONS[0]);
  const [contractNote, setContractNote] = useState("");
  const [workLocation, setWorkLocation] = useState(WORK_LOCATION_OPTIONS[0]);
  const [subLocation, setSubLocation] = useState("");
  const [workAddress, setWorkAddress] = useState("");
  const [roleCode, setRoleCode] = useState(
    () => roles?.find((r) => r.code === "operator_technician")?.code ?? roles?.[0]?.code ?? ""
  );

  const [createdRow, setCreatedRow] = useState<NewHireRow | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fullName = `${firstNameTh} ${lastNameTh}`.trim();
  const unitOptions = Object.values(units ?? {}).sort((a, b) => a.name.localeCompare(b.name));

  const canProceedStep0 = firstNameTh.trim().length > 0 && lastNameTh.trim().length > 0 && email.trim().length > 0;
  const canProceedStep1 = position.trim().length > 0 && managerName.trim().length > 0 && roleCode.length > 0;

  function resetForNext() {
    setStepIndex(0);
    setTitlePrefix("นาย");
    setFirstNameTh("");
    setLastNameTh("");
    setFirstNameEn("");
    setLastNameEn("");
    setIdOrPassportNumber("");
    setGender("ชาย");
    setEmail("");
    setPhone("");
    setSecondaryPhone("");
    setAddress("");
    setBirthDate("");
    setLineId("");
    setOtherContact("");
    setAdditionalNote("");
    setPosition("");
    setUnitId("");
    setTeam("");
    setJobDescription("");
    setManagerName("");
    setManagerRole("");
    setStartDate("");
    setEndDate("");
    setContractNumber("");
    setContractDate("");
    setContractValue("");
    setContractNote("");
    setSubLocation("");
    setWorkAddress("");
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
      setSubmitError("ไม่พบบทบาท (Role) ที่ใช้ได้ในองค์กรนี้ ไม่สามารถสร้างผู้รับเหมาได้ในขณะนี้");
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
      // Always 0/9 — see this component's header comment on why Contractor
      // lands at "pre-boarding" rather than Employee's 8/9 "ready-to-work".
      const steps = buildStepsFromDoneIndices([]);

      const row: NewHireRow = {
        id: pending ? result.invitation_id : result.id,
        name: pending ? email.trim() : result.user.full_name,
        employeeCode: pending ? employeeCode : (result.employee_code ?? employeeCode),
        position: position.trim() || "-",
        unit: unitId ? unitLabel(unitId, units ?? {}) : "-",
        startDateLabel: startDate ? formatThaiDate(startDate) : "-",
        daysLeftLabel: startDate ? formatDaysUntilThai(startDate) : "-",
        progress: 0,
        status: "pre-boarding",
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
        err instanceof ApiError ? err.message : "ไม่สามารถสร้างผู้รับเหมาได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง"
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
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              เพิ่มผู้รับเหมา / ผู้ปฏิบัติงานภายนอก (Contractor)
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              กรอกข้อมูลพื้นฐานของผู้รับเหมา เพื่อเข้าสู่กระบวนการ Onboarding
            </p>
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
                ชื่อ (ภาษาไทย)
                <input required value={firstNameTh} onChange={(e) => setFirstNameTh(e.target.value)} className={inputClasses} />
              </label>
              <label className={labelClasses}>
                นามสกุล (ภาษาไทย)
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
              <label className={`${labelClasses} sm:col-span-1`}>
                เลขบัตรประชาชน / เลขที่หนังสือเดินทาง
                <input
                  required
                  value={idOrPassportNumber}
                  onChange={(e) => setIdOrPassportNumber(e.target.value)}
                  placeholder="กรอกเลขบัตรประชาชน 13 หลัก หรือเลขหนังสือเดินทาง"
                  className={inputClasses}
                />
              </label>
              <label className={labelClasses}>
                สัญชาติ
                <input value={nationality} onChange={(e) => setNationality(e.target.value)} className={inputClasses} />
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
                อีเมล (สำหรับการเข้าสู่ระบบ)
                <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClasses} />
              </label>
              <label className={labelClasses}>
                เบอร์โทรศัพท์มือถือ
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClasses} />
              </label>
              <label className={labelClasses}>
                เบอร์โทรศัพท์สำรอง
                <input value={secondaryPhone} onChange={(e) => setSecondaryPhone(e.target.value)} className={inputClasses} />
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <label className={labelClasses}>
                วันเกิด
                <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className={inputClasses} />
              </label>
              <label className={labelClasses}>
                อายุ
                <input readOnly value={ageFromBirthDate(birthDate)} className={`${inputClasses} cursor-not-allowed opacity-70`} />
              </label>
              <label className={labelClasses}>
                ไลน์ไอดี (ถ้ามี)
                <input value={lineId} onChange={(e) => setLineId(e.target.value)} placeholder="เช่น @somchai" className={inputClasses} />
              </label>
              <label className={labelClasses}>
                ช่องทางติดต่ออื่น (ถ้ามี)
                <input
                  value={otherContact}
                  onChange={(e) => setOtherContact(e.target.value)}
                  placeholder="เช่น Telegram, WhatsApp"
                  className={inputClasses}
                />
              </label>
            </div>
            <details className="rounded-lg border border-zinc-100 p-3 dark:border-zinc-800">
              <summary className="cursor-pointer text-xs font-medium text-zinc-500 dark:text-zinc-400">
                ข้อมูลเพิ่มเติม (ถ้ามี)
              </summary>
              <label className={`${labelClasses} mt-2`}>
                หมายเหตุ
                <textarea rows={2} value={additionalNote} onChange={(e) => setAdditionalNote(e.target.value)} className={inputClasses} />
              </label>
            </details>
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">รูปภาพผู้รับเหมา (ถ้ามี)</h3>
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
                <li>อีเมลจะถูกใช้ในการเข้าสู่ระบบและรับการแจ้งเตือน</li>
                <li>ข้อมูลนี้จะถูกใช้ในกระบวนการ Onboarding และการออกเอกสารสัญญา</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">ข้อมูลที่จะสร้าง</h3>
              <ul className="flex flex-col gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                <li>Person Profile — โปรไฟล์บุคคลพื้นฐาน</li>
                <li>Contractor Record (รอสร้าง) — บันทึกผู้รับเหมา</li>
                <li>Onboarding (รอเริ่ม) — กระบวนการเตรียมความพร้อม</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {stepIndex === 1 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="flex flex-col gap-5 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm lg:col-span-2 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">2. ข้อมูลการจ้างงานและสัญญา</h2>

            <div>
              <p className="mb-2 text-xs font-semibold text-zinc-400">ตำแหน่งและหน้าที่</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className={labelClasses}>
                  ตำแหน่งงาน
                  <input
                    required
                    list="contractor-position-options"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="พิมพ์เพื่อค้นหา หรือระบุตำแหน่งใหม่"
                    className={inputClasses}
                  />
                  <datalist id="contractor-position-options">
                    {POSITION_OPTIONS.map((option) => (
                      <option key={option} value={option} />
                    ))}
                  </datalist>
                </label>
                <label className={labelClasses}>
                  หน่วยงาน / ทีม
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
                      title="ไม่สามารถโหลดรายชื่อหน่วยงานจาก Core ได้ในขณะนี้ — จะสร้างผู้รับเหมาโดยไม่ระบุหน่วยงาน"
                      className="flex cursor-not-allowed items-center rounded-lg border border-dashed border-zinc-200 px-3 py-2 text-sm text-zinc-400 dark:border-zinc-700"
                    >
                      ไม่พบข้อมูลหน่วยงาน
                    </span>
                  )}
                </label>
                <label className={`${labelClasses} sm:col-span-2`}>
                  หน้าที่หรือรายละเอียดงาน
                  <textarea
                    rows={2}
                    maxLength={300}
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="อธิบายหน้าที่ ความรับผิดชอบ และขอบเขตงาน"
                    className={inputClasses}
                  />
                </label>
                <label className={labelClasses}>
                  ทีม (Team)
                  <input value={team} onChange={(e) => setTeam(e.target.value)} className={inputClasses} />
                </label>
                <label className={labelClasses}>
                  ผู้บังคับบัญชา (Reporting To)
                  <select
                    required
                    value={managerName}
                    onChange={(e) => {
                      setManagerName(e.target.value);
                      setManagerRole(MANAGER_OPTIONS.find((m) => m.name === e.target.value)?.role ?? "");
                    }}
                    className={inputClasses}
                  >
                    <option value="">เลือกผู้บังคับบัญชา</option>
                    {MANAGER_OPTIONS.map((manager) => (
                      <option key={manager.name} value={manager.name}>
                        {manager.name} — {manager.role}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={labelClasses}>
                  บทบาท / สิทธิ์การเข้าถึง (Role)
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
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold text-zinc-400">ประเภทและระยะเวลาการจ้าง</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className={labelClasses}>
                  ประเภทการจ้างงาน
                  <input readOnly value="ผู้รับเหมา (Contractor)" className={`${inputClasses} cursor-not-allowed opacity-70`} />
                </label>
                <label className={labelClasses}>
                  ลักษณะการจ้าง
                  <select value={workArrangement} onChange={(e) => setWorkArrangement(e.target.value)} className={inputClasses}>
                    <option>On-site</option>
                    <option>Remote</option>
                    <option>Hybrid</option>
                  </select>
                </label>
                <label className={labelClasses}>
                  วันที่เริ่มงาน
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClasses} />
                  {startDate && (
                    <span className="text-[11px] font-normal text-zinc-400">
                      {formatThaiDate(startDate)} ({formatDaysUntilThai(startDate)})
                    </span>
                  )}
                </label>
                <label className={labelClasses}>
                  วันที่สิ้นสุด (คาดการณ์)
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClasses} />
                </label>
                <label className={labelClasses}>
                  ระยะเวลาการจ้าง
                  <select value={duration} onChange={(e) => setDuration(e.target.value)} className={inputClasses}>
                    {DURATION_OPTIONS.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold text-zinc-400">ข้อมูลสัญญา</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className={labelClasses}>
                  เลขที่สัญญา / PO No.
                  <input value={contractNumber} onChange={(e) => setContractNumber(e.target.value)} className={inputClasses} />
                </label>
                <label className={labelClasses}>
                  วันที่ทำสัญญา
                  <input type="date" value={contractDate} onChange={(e) => setContractDate(e.target.value)} className={inputClasses} />
                </label>
                <label className={labelClasses}>
                  มูลค่าสัญญา
                  <input
                    inputMode="numeric"
                    value={contractValue}
                    onChange={(e) => setContractValue(e.target.value)}
                    placeholder="บาท"
                    className={inputClasses}
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={labelClasses}>
                    รูปแบบการชำระเงิน
                    <select value={paymentType} onChange={(e) => setPaymentType(e.target.value)} className={inputClasses}>
                      {PAYMENT_TYPE_OPTIONS.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                  <label className={labelClasses}>
                    รอบการชำระเงิน
                    <select value={paymentCycle} onChange={(e) => setPaymentCycle(e.target.value)} className={inputClasses}>
                      {PAYMENT_CYCLE_OPTIONS.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
              <label className={`${labelClasses} mt-3`}>
                หมายเหตุสัญญา
                <textarea
                  rows={2}
                  maxLength={300}
                  value={contractNote}
                  onChange={(e) => setContractNote(e.target.value)}
                  placeholder="เงื่อนไขสัญญา ข้อตกลงพิเศษ หรือหมายเหตุเพิ่มเติม (ถ้ามี)"
                  className={inputClasses}
                />
              </label>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold text-zinc-400">สถานที่และการปฏิบัติงาน</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className={labelClasses}>
                  สถานที่ทำงานหลัก
                  <select value={workLocation} onChange={(e) => setWorkLocation(e.target.value)} className={inputClasses}>
                    {WORK_LOCATION_OPTIONS.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>
                <label className={labelClasses}>
                  พื้นที่ / ชั้น
                  <input value={subLocation} onChange={(e) => setSubLocation(e.target.value)} className={inputClasses} />
                </label>
                <label className={`${labelClasses} sm:col-span-2`}>
                  ที่อยู่สถานที่ทำงาน
                  <textarea
                    rows={2}
                    maxLength={200}
                    value={workAddress}
                    onChange={(e) => setWorkAddress(e.target.value)}
                    className={inputClasses}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">สรุปข้อมูลที่กรอก</h3>
                <EditLink onClick={() => setStepIndex(0)} />
              </div>
              <p className="mb-2 text-xs font-medium text-zinc-400">ข้อมูลส่วนบุคคล</p>
              <SummaryRow label="ชื่อ-นามสกุล" value={`${titlePrefix} ${fullName}`} />
              <SummaryRow label="อีเมล" value={email} />
              <SummaryRow label="เบอร์โทรศัพท์" value={phone} />
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">ข้อมูลที่จะสร้าง</h3>
              <ul className="flex flex-col gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                <li>Contractor Record (รอสร้าง)</li>
                <li>Onboarding (รอเริ่ม)</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {stepIndex === 2 && !createdRow && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm lg:col-span-2 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">3. ตรวจสอบและเพิ่ม</h2>
            <p className="text-xs text-zinc-400">ตรวจสอบข้อมูลทั้งหมดก่อนสร้างผู้รับเหมา</p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/50">
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-xs font-semibold text-zinc-400">ข้อมูลส่วนบุคคล</p>
                  <EditLink onClick={() => setStepIndex(0)} />
                </div>
                <SummaryRow label="ชื่อ-นามสกุล" value={`${titlePrefix} ${fullName}`} />
                <SummaryRow label="เลขบัตรประชาชน" value={idOrPassportNumber} />
                <SummaryRow label="อีเมล" value={email} />
                <SummaryRow label="เบอร์โทรศัพท์มือถือ" value={phone} />
              </div>
              <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/50">
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-xs font-semibold text-zinc-400">ตำแหน่งและหน้าที่</p>
                  <EditLink onClick={() => setStepIndex(1)} />
                </div>
                <SummaryRow label="ตำแหน่ง" value={position} />
                <SummaryRow label="หน่วยงาน / ทีม" value={[unitId ? unitLabel(unitId, units ?? {}) : "", team].filter(Boolean).join(" / ")} />
                <SummaryRow label="ผู้บังคับบัญชา" value={managerName} />
              </div>
              <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/50">
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-xs font-semibold text-zinc-400">ประเภทและรายละเอียดการจ้าง</p>
                  <EditLink onClick={() => setStepIndex(1)} />
                </div>
                <SummaryRow label="ประเภทการจ้างงาน" value="ผู้รับเหมา (Contractor)" />
                <SummaryRow label="ลักษณะการจ้าง" value={workArrangement} />
                <SummaryRow label="วันที่เริ่มงาน" value={startDate ? formatThaiDate(startDate) : ""} />
                <SummaryRow label="วันที่สิ้นสุด (คาดการณ์)" value={endDate ? formatThaiDate(endDate) : ""} />
                <SummaryRow label="ระยะเวลาการจ้าง" value={duration} />
              </div>
              <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/50">
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-xs font-semibold text-zinc-400">ข้อมูลสัญญา</p>
                  <EditLink onClick={() => setStepIndex(1)} />
                </div>
                <SummaryRow label="รูปแบบการชำระเงิน" value={paymentType} />
                <SummaryRow label="รอบการชำระเงิน" value={paymentCycle} />
                <SummaryRow label="มูลค่าสัญญา" value={contractValue ? `${contractValue} บาท` : ""} />
                <SummaryRow label="หมายเหตุสัญญา" value={contractNote} />
              </div>
              <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/50 sm:col-span-2">
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-xs font-semibold text-zinc-400">สถานที่และการปฏิบัติงาน</p>
                  <EditLink onClick={() => setStepIndex(1)} />
                </div>
                <SummaryRow label="สถานที่ทำงานหลัก" value={workLocation} />
                <SummaryRow label="พื้นที่ / ชั้น" value={subLocation} />
                <SummaryRow label="ที่อยู่สถานที่ทำงาน" value={workAddress} />
              </div>
            </div>

            {submitError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-500/10 dark:text-red-400">{submitError}</p>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">ข้อมูลที่จะสร้าง</h3>
              <ul className="flex flex-col gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                <li>Contractor Record (รอสร้าง)</li>
                <li>Onboarding (รอเริ่ม)</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5 dark:border-emerald-500/20 dark:bg-emerald-500/10">
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                <ShieldIcon className="h-4 w-4" />
                สถานะหลังสร้าง
              </h3>
              <span className="mb-2 inline-flex w-fit items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                Pre-boarding
              </span>
              <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80">
                บันทึกสำเร็จแล้ว สามารถเริ่มกระบวนการ Onboarding ได้จากเมนู &quot;เข้าใหม่&quot;
              </p>
            </div>
          </div>
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
              <>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  สร้างผู้รับเหมา {createdRow.name} เรียบร้อยแล้ว
                </p>
                <span className="mt-1 inline-flex w-fit items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                  Pre-boarding
                </span>
                <p className="max-w-sm text-xs text-zinc-400">
                  บันทึกสำเร็จแล้ว สามารถเริ่มกระบวนการ Onboarding ได้จากเมนู &quot;เข้าใหม่&quot;
                </p>
              </>
            )}
            <p className="text-xs text-zinc-400">
              {createdRow.employeeCode} · {createdRow.position}
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

          <div className="mx-auto flex items-center gap-2">
            <Button variant="secondary" onClick={resetForNext}>
              เพิ่มผู้รับเหมาคนถัดไป
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
            <div className="flex flex-col items-end gap-1">
              <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
                {submitting ? "กำลังบันทึก..." : "สร้างผู้รับเหมา"}
              </Button>
              <span className="text-[11px] text-zinc-400">สร้างข้อมูลและบันทึกสถานะเป็น Pre-boarding</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
