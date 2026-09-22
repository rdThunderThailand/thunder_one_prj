"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { buttonClasses, Button } from "@/components/ui/Button";
import { WizardSteps } from "@/components/ui/WizardSteps";
import { ChevronRightIcon } from "@/components/ui/icons";
import { classifyApiError } from "@/lib/api/api-error";
import { formatDaysUntilThai, formatThaiDate } from "@/lib/thai-date";
import {
  checkEmailTaken,
  createMember,
  isPendingInvite,
  updateMemberContract,
  type CoreRole,
} from "@/features/people/personnel";
import type { OrgUnitNode } from "@/features/people/org-structure";
// Deep import (bypassing people/new-hires's index.ts) — see
// AddEmployeeWizardPage's identical comment for why (avoids a barrel-file
// import cycle between add-person and new-hires).
import { buildStepsFromDoneIndices, type NewHireRow } from "@/features/people/new-hires/mock-data";
import { NEW_HIRE_HANDOFF_KEY } from "../handoff";
import { contractorStep0Schema, contractorStep1Schema, pickDefaultRoleCode, zodErrorsToFieldMap } from "../schemas";
import { clearFieldError } from "../form-field";
import { DURATION_OPTIONS, PAYMENT_CYCLE_OPTIONS, PAYMENT_TYPE_OPTIONS, WORK_LOCATION_OPTIONS, unitLabel } from "../wizard-shared";
import { AddContractorStep1Personal } from "./AddContractorStep1Personal";
import { AddContractorStep2Employment } from "./AddContractorStep2Employment";
import { AddContractorStepReview } from "./AddContractorStepReview";
import { AddContractorStepSuccess } from "./AddContractorStepSuccess";

// Maps this page's Thai option labels onto membership_contract's closed
// enums (docs/api/contractor-bulk-triage-response.md — payment_format:
// monthly/installment/on_completion, payment_cycle: end_of_month/every_15_days).
const PAYMENT_FORMAT_BY_LABEL: Record<string, "monthly" | "installment" | "on_completion"> = {
  รายเดือน: "monthly",
  รายงวด: "installment",
  เมื่อเสร็จงาน: "on_completion",
};
const PAYMENT_CYCLE_BY_LABEL: Record<string, "end_of_month" | "every_15_days"> = {
  สิ้นเดือน: "end_of_month",
  "ทุก 15 วัน": "every_15_days",
};

// Real column on `memberships` since the 2026-09-01 employment-fields
// migration (see members-api.ts's CreateMemberInput) — same enum Employee
// wires, this page just has a different label order in its <select>.
const WORK_ARRANGEMENT_BY_LABEL: Record<string, "on_site" | "hybrid" | "remote"> = {
  "On-site": "on_site",
  Hybrid: "hybrid",
  Remote: "remote",
};

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
  /** Real distinct `job_title` values from the current roster (`people/
   *  personnel`'s `derivePositionOptions`) — backs the ตำแหน่งงาน field's
   *  `<datalist>` autocomplete. `[]` just means no suggestions; the field
   *  itself is free text, so this never blocks submission. */
  positionOptions: string[];
}

// "เพิ่มผู้รับเหมา / ผู้ปฏิบัติงานภายนอก (Contractor)" — full-page 3-step
// wizard, the Contractor sibling of AddEmployeeWizardPage. Reached from
// people/add's type picker (the Contractor card, previously inert — no
// mockup existed for this flow until 2026-09-01).
//
// Real Core integration: submitting calls the same
// `POST /tenants/:id/members` (people/personnel's createMember) Employee
// intake uses, now with `member_type: "contractor"` — resolved 2026-08-28
// (docs/api/people-workspace-response.md §8 Q1) and reconfirmed
// 2026-09-04 (docs/api/contractor-bulk-triage-response.md) as not a gap:
// the row is correctly typed server-side as soon as this field is sent, no
// Core change needed. Real fields sent: email, role_code, member_type,
// employee_code, job_title (ตำแหน่งงาน), default_department_id
// (หน่วยงาน), start_date (วันที่เริ่มงาน), and — resolved 2026-09-01,
// same `addMemberSchema` employment-fields migration Employee's doc
// describes — work_arrangement (ลักษณะการจ้าง) and notes (this page's
// personal-info-step "หมายเหตุ" box; หมายเหตุสัญญา in step 2 has no
// backing column, see below, so only this one is sent).
//
// Contract fields (เลขที่สัญญา/PO No., วันที่ทำสัญญา, มูลค่าสัญญา, รูปแบบ/รอบ
// การชำระเงิน) are also real as of 2026-09-04 — `PUT
// /tenants/:id/members/:memberId/contract` (people/personnel's
// updateMemberContract), a separate call fired right after createMember
// succeeds, since the row lives in its own `membership_contract` table, not
// on the membership itself. Only fires when the member was actually
// created (not a pending invite — there's no membership id yet to attach a
// contract to until the invite is accepted) and at least one contract field
// was filled in; a failure here is reported but doesn't undo the
// already-created contractor. หมายเหตุสัญญา has no backing column
// (deliberately out of scope this pass) and stays cosmetic, same as
// everything else on this page (ID/passport, contact channels, work
// location/address, ผู้บังคับบัญชา, etc.) — kept in local state for the
// review step only, never sent to Core.
//
// Unlike Employee (which lands at 8/9, `status: "ready-to-work"`, since its
// wizard covers most onboarding-checklist topics), this flow's own copy is
// explicit that onboarding hasn't started — "บันทึกสำเร็จแล้ว
// สามารถเริ่มกระบวนการ Onboarding ได้จากเมนู 'เข้าใหม่'" — so a created
// contractor's NewHireRow always starts at 0/9, `status: "pre-boarding"`.
//
// Step JSX was split into AddContractorStep1Personal/
// AddContractorStep2Employment/AddContractorStepReview/
// AddContractorStepSuccess 2026-09-17 (readability audit) — pure
// presentational extraction, every state/handler below is unchanged from
// before the split and still lives only here.
export function AddContractorWizardPage({ tenantId, roles, units, positionOptions }: AddContractorWizardPageProps) {
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
  // Was `useState(randomContractorCode)` — a fake "CON-0xxx" code generated
  // client-side and sent to Core as if real (fixed 2026-09-15, same UAT
  // PP03-013 gap as AddEmployeeWizardPage's own employeeCode field). Stays
  // blank (sent as `undefined`) unless someone actually has a real code.
  const [employeeCode, setEmployeeCode] = useState("");
  // Real since 2026-09-16 — memberships.position_code/level_role, round-trip
  // confirmed against thunder_core_API (commit 489c3b1).
  const [positionCode, setPositionCode] = useState("");
  const [levelRole, setLevelRole] = useState("");
  const [position, setPosition] = useState("");
  const [unitId, setUnitId] = useState("");
  const [team, setTeam] = useState("");
  const [jobDescription, setJobDescription] = useState("");
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
  function handleIdOrPassportNumberChange(value: string) {
    setIdOrPassportNumber(value);
    clearFieldError(setErrors, "idOrPassportNumber");
  }
  function handleEmailChange(value: string) {
    setEmail(value);
    clearFieldError(setErrors, "email");
  }
  function handlePhoneChange(value: string) {
    setPhone(value);
    clearFieldError(setErrors, "phone");
  }
  function handleSecondaryPhoneChange(value: string) {
    setSecondaryPhone(value);
    clearFieldError(setErrors, "secondaryPhone");
  }
  function handlePositionChange(value: string) {
    setPosition(value);
    clearFieldError(setErrors, "position");
  }

  function validateStep(index: 0 | 1): boolean {
    const schema = index === 0 ? contractorStep0Schema : contractorStep1Schema;
    const data =
      index === 0
        ? { firstNameTh, lastNameTh, idOrPassportNumber, email, phone, secondaryPhone }
        : { position, roleCode };
    const result = schema.safeParse(data);
    if (!result.success) {
      setErrors(zodErrorsToFieldMap(result.error));
      toast.error("กรุณาตรวจสอบข้อมูลที่กรอกให้ครบถ้วนและถูกต้อง");
      return false;
    }
    setErrors({});
    return true;
  }

  // Same "check the duplicate before the last step, not only from Core's
  // 409" fix as AddEmployeeWizardPage.handleNext — see that component's own
  // comment. Fails open on a network/API error.
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
    setEmployeeCode("");
    setPositionCode("");
    setLevelRole("");
    setPosition("");
    setUnitId("");
    setTeam("");
    setJobDescription("");
    setStartDate("");
    setEndDate("");
    setContractNumber("");
    setContractDate("");
    setContractValue("");
    setContractNote("");
    setSubLocation("");
    setWorkAddress("");
    setRoleCode(pickDefaultRoleCode(roles));
    setCreatedRow(null);
    setSubmitError(null);
    setErrors({});
  }

  async function handleSubmit() {
    // Belt-and-suspenders re-check — see AddEmployeeWizardPage's identical
    // comment for why this re-validates rather than trusting handleNext alone.
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
      setSubmitError("ไม่พบบทบาท (Role) ที่ใช้ได้ในองค์กรนี้ ไม่สามารถสร้างผู้รับเหมาได้ในขณะนี้");
      toast.error("ไม่พบบทบาท (Role) ที่ใช้ได้ในองค์กรนี้ ไม่สามารถสร้างผู้รับเหมาได้ในขณะนี้");
      return;
    }

    setSubmitError(null);
    setSubmitting(true);
    try {
      const result = await createMember(tenantId, {
        email: email.trim(),
        role_code: roleCode,
        employee_code: employeeCode.trim() || undefined,
        position_code: positionCode.trim() || undefined,
        level_role: levelRole.trim() || undefined,
        job_title: position.trim() || undefined,
        default_department_id: unitId || undefined,
        start_date: startDate || undefined,
        member_type: "contractor",
        work_arrangement: WORK_ARRANGEMENT_BY_LABEL[workArrangement],
        notes: additionalNote.trim() || undefined,
      });

      const pending = isPendingInvite(result);

      // Contract fields live in their own table/route — only reachable once
      // a real membership exists (not a pending invite) and only worth the
      // call if the user actually entered contract info. A failure here is
      // surfaced but doesn't roll back the contractor that was just created.
      const hasContractInfo = Boolean(contractNumber.trim() || contractDate || contractValue.trim());
      if (!pending && hasContractInfo) {
        const parsedValue = contractValue.trim() ? Number(contractValue.replace(/,/g, "")) : undefined;
        try {
          await updateMemberContract(tenantId, result.id, {
            contract_number: contractNumber.trim() || undefined,
            contract_date: contractDate || undefined,
            contract_value: parsedValue !== undefined && !Number.isNaN(parsedValue) ? parsedValue : undefined,
            payment_format: PAYMENT_FORMAT_BY_LABEL[paymentType],
            payment_cycle: PAYMENT_CYCLE_BY_LABEL[paymentCycle],
          });
        } catch {
          toast.error("สร้างผู้รับเหมาสำเร็จ แต่บันทึกข้อมูลสัญญาไม่สำเร็จ กรุณาเพิ่มข้อมูลสัญญาภายหลัง");
        }
      }

      // Always 0/9 — see this component's header comment on why Contractor
      // lands at "pre-boarding" rather than Employee's 8/9 "ready-to-work".
      const steps = buildStepsFromDoneIndices([]);

      const row: NewHireRow = {
        id: pending ? result.invitation_id : result.id,
        name: pending ? email.trim() : result.user.full_name,
        employeeCode: pending ? employeeCode.trim() || "-" : result.employee_code || employeeCode.trim() || "-",
        position: position.trim() || "-",
        unit: unitId ? unitLabel(unitId, units ?? {}) : "-",
        startDateLabel: startDate ? formatThaiDate(startDate) : "-",
        daysLeftLabel: startDate ? formatDaysUntilThai(startDate) : "-",
        progress: 0,
        status: "pre-boarding",
        // Reporting-to field removed from the UI — see AddEmployeeWizardPage's
        // identical comment.
        managerName: null,
        managerRole: null,
        steps,
        inviteUrl: pending ? result.invite_url : undefined,
      };
      setCreatedRow(row);
      toast.success(pending ? `ส่งคำเชิญไปที่ ${email.trim()} แล้ว` : `เพิ่มผู้รับเหมา ${row.name} แล้ว`);
      try {
        sessionStorage.setItem(NEW_HIRE_HANDOFF_KEY, JSON.stringify(row));
      } catch {
        // sessionStorage unavailable (private mode, etc.) — the created row
        // just won't show up pre-prepended on /people/new-hires; not fatal.
      }
    } catch (err) {
      // classifyApiError() (2026-09-17, RBAC audit follow-up) — see
      // AddEmployeeWizardPage's identical comment for why this replaced a
      // raw err.message.
      const message = classifyApiError(err, "ไม่สามารถสร้างผู้รับเหมาได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง").message;
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
        <AddContractorStep1Personal
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
          idOrPassportNumber={idOrPassportNumber}
          onIdOrPassportNumberChange={handleIdOrPassportNumberChange}
          nationality={nationality}
          onNationalityChange={setNationality}
          gender={gender}
          onGenderChange={setGender}
          email={email}
          onEmailChange={handleEmailChange}
          phone={phone}
          onPhoneChange={handlePhoneChange}
          secondaryPhone={secondaryPhone}
          onSecondaryPhoneChange={handleSecondaryPhoneChange}
          address={address}
          onAddressChange={setAddress}
          birthDate={birthDate}
          onBirthDateChange={setBirthDate}
          age={ageFromBirthDate(birthDate)}
          lineId={lineId}
          onLineIdChange={setLineId}
          otherContact={otherContact}
          onOtherContactChange={setOtherContact}
          additionalNote={additionalNote}
          onAdditionalNoteChange={setAdditionalNote}
          errors={errors}
        />
      )}

      {stepIndex === 1 && (
        <AddContractorStep2Employment
          position={position}
          onPositionChange={handlePositionChange}
          positionOptions={positionOptions}
          unitId={unitId}
          onUnitIdChange={setUnitId}
          units={units}
          unitOptions={unitOptions}
          jobDescription={jobDescription}
          onJobDescriptionChange={setJobDescription}
          team={team}
          onTeamChange={setTeam}
          positionCode={positionCode}
          onPositionCodeChange={setPositionCode}
          levelRole={levelRole}
          onLevelRoleChange={setLevelRole}
          roleCode={roleCode}
          onRoleCodeChange={setRoleCode}
          roles={roles}
          workArrangement={workArrangement}
          onWorkArrangementChange={setWorkArrangement}
          startDate={startDate}
          onStartDateChange={setStartDate}
          endDate={endDate}
          onEndDateChange={setEndDate}
          duration={duration}
          onDurationChange={setDuration}
          contractNumber={contractNumber}
          onContractNumberChange={setContractNumber}
          contractDate={contractDate}
          onContractDateChange={setContractDate}
          contractValue={contractValue}
          onContractValueChange={setContractValue}
          paymentType={paymentType}
          onPaymentTypeChange={setPaymentType}
          paymentCycle={paymentCycle}
          onPaymentCycleChange={setPaymentCycle}
          contractNote={contractNote}
          onContractNoteChange={setContractNote}
          workLocation={workLocation}
          onWorkLocationChange={setWorkLocation}
          subLocation={subLocation}
          onSubLocationChange={setSubLocation}
          workAddress={workAddress}
          onWorkAddressChange={setWorkAddress}
          errors={errors}
          titlePrefix={titlePrefix}
          fullName={fullName}
          email={email}
          phone={phone}
          onEditStep1={() => setStepIndex(0)}
        />
      )}

      {stepIndex === 2 && !createdRow && (
        <AddContractorStepReview
          titlePrefix={titlePrefix}
          fullName={fullName}
          idOrPassportNumber={idOrPassportNumber}
          email={email}
          phone={phone}
          position={position}
          positionCode={positionCode}
          levelRole={levelRole}
          unitId={unitId}
          units={units}
          team={team}
          workArrangement={workArrangement}
          startDate={startDate}
          endDate={endDate}
          duration={duration}
          paymentType={paymentType}
          paymentCycle={paymentCycle}
          contractValue={contractValue}
          contractNote={contractNote}
          workLocation={workLocation}
          subLocation={subLocation}
          workAddress={workAddress}
          submitError={submitError}
          onEditPersonal={() => setStepIndex(0)}
          onEditEmployment={() => setStepIndex(1)}
        />
      )}

      {stepIndex === 2 && createdRow && <AddContractorStepSuccess createdRow={createdRow} onAddNext={resetForNext} />}

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
