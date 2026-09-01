"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { WizardSteps } from "@/components/ui/WizardSteps";
import { CheckCircleIcon } from "@/components/ui/icons";
import { ApiError } from "@/lib/api/api-error";
import { formatDaysUntilThai, formatThaiDate } from "@/lib/thai-date";
import {
  createMember,
  isPendingInvite,
  personnelRows,
  type CoreRole,
} from "@/features/people/personnel";
import type { OrgUnitNode } from "@/features/people/org-structure";
import { buildStepsFromDoneIndices, type NewHireRow } from "../mock-data";

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

/** Same "Division / Team" convention as people/personnel's core-mapper.ts —
 *  a top-level unit's own name, everything below it prefixed with its
 *  parent's. */
function unitLabel(unitId: string, units: Record<string, OrgUnitNode>): string {
  const unit = units[unitId];
  if (!unit) return "-";
  const parent = unit.parentId ? units[unit.parentId] : null;
  return parent && parent.parentId ? `${parent.name} / ${unit.name}` : unit.name;
}

const WIZARD_STEP_LABELS = [
  "ข้อมูลส่วนตัว",
  "ตำแหน่งและหน่วยงาน",
  "เอกสารและสัญญาจ้าง",
  "อุปกรณ์และการเข้าถึง",
  "การอบรมและเตรียมความพร้อม",
  "Work Ready",
];

// Which of the 9 canonical OnboardingStep labels (people/new-hires/mock-data.ts's
// STEP_LABELS) each wizard step accounts for — a complete, non-overlapping
// partition of all 9. "พร้อมเริ่มงาน" (index 8) is deliberately left out: it's
// the real first-day readiness check, not something an intake wizard can
// mark done on its own, so a freshly-added hire always lands at 8/9 with one
// step still open — see the component's own comment below. A pending invite
// (see isPendingInvite below) skips this partition entirely — none of it has
// really happened until the invite is accepted.
const STEP_LABEL_INDICES: number[][] = [
  [0], // ข้อมูลส่วนตัว → ข้อมูลบุคลากร
  [1], // ตำแหน่งและหน่วยงาน → โครงสร้างและตำแหน่งงาน
  [5], // เอกสารและสัญญาจ้าง → นโยบายและเอกสาร
  [2, 3, 4], // อุปกรณ์และการเข้าถึง → บัญชีผู้ใช้/อุปกรณ์/แอปพลิเคชัน
  [6, 7], // การอบรมและเตรียมความพร้อม → การอบรม/เตรียมผู้จัดการ
];

const inputClasses =
  "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

function randomEmployeeCode(): string {
  return `EMP-0${String(Math.floor(100 + Math.random() * 900))}`;
}

interface AddEmployeeModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (row: NewHireRow) => void;
  /** `null` when session/tenant resolution failed server-side — submission
   *  is disabled with an explanation rather than guessing a tenant. */
  tenantId: string | null;
  /** `GET /tenants/:id/roles` result — `null`/`[]` disables submission the
   *  same way, since Core requires a `role_code` this app has no other way
   *  to get valid values for (confirmed 2026-08-28, §8 Q8,
   *  docs/people/core-response-people-workspace-api.md). */
  roles: CoreRole[] | null;
  /** Real org units (`people/org-structure`'s mapped Core tree, fetched by
   *  this feature's own app route) — `null`/`{}` degrades the หน่วยงาน field
   *  to "unavailable, will be created without one" rather than silently
   *  sending a mock unit's fake id as a real `default_department_id`. */
  units: Record<string, OrgUnitNode> | null;
}

// "เพิ่มพนักงานใหม่" — the Employee-only onboarding intake flow (requirement
// doc: see the "เพิ่มคน / เพิ่มพนักงานใหม่ ต่างกันอย่างไร?" reference
// diagram, §2/§4's 5-step Onboarding sequence). **Real** as of 2026-08-28 —
// submitting calls Core's actual `POST /tenants/:id/members`
// (people/personnel/services/members-api.ts's createMember), contract
// confirmed directly with Core. Two real outcomes, both handled:
// - The email already has a Thunder One account → a real membership is
//   created immediately (`CoreMemberRow`).
// - The email is brand new → Core sends a real invitation instead
//   (`CoreInviteResult`, discriminated via `isPendingInvite`) — no account
//   exists yet, so this feature's own 9-step onboarding checklist can't have
//   actually progressed; every step renders pending regardless of which
//   wizard steps were filled in, and the row's `status` is `"pending"`
//   rather than `"in-progress"`.
//
// IMPORTANT — what's real here and what isn't (Core flagged this explicitly,
// 2026-08-28, worth repeating verbatim rather than losing the nuance): the
// Person/Membership *creation* above is real and persisted. Everything
// downstream of it — `status: "in-progress"`/`"pending"`, the 9-step
// checklist, `progress` — is **UI-fabricated, not derived from Core**.
// Core's own membership `status` (`invited`/`active`/...) is account-access
// state, a different axis entirely from this feature's onboarding Lifecycle
// concept; there is no `member_type`, `lifecycle_stage`, or checklist table
// in Core's schema at all yet (P3 is still fully unbuilt server-side,
// blocked on Core's own DB-access issue as of this comment). When P3 lands
// as a real `POST /onboarding` with a real response shape, this local
// mapping needs **replacing, not extending** — and rows created by today's
// stopgap won't retroactively gain real onboarding state.
//
// ตำแหน่งงาน/ผู้จัดการ stay cosmetic suggestions sourced from
// people/personnel's mock roster (Core's contract doesn't have a "manager"
// concept for a membership at all, and `job_title` is free text server-side
// — neither needs to be "real" for this call to be correct). หน่วยงาน is the
// one field that does: it becomes `default_department_id`, which Core
// validates against real rows, so it's sourced from the real `units` prop.
export function AddEmployeeModal({ open, onClose, onAdd, tenantId, roles, units }: AddEmployeeModalProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [position, setPosition] = useState("");
  const [unitId, setUnitId] = useState("");
  const [managerName, setManagerName] = useState("");
  const [managerRole, setManagerRole] = useState("");
  const [startDate, setStartDate] = useState("");
  const [contractType, setContractType] = useState("พนักงานประจำ");
  const [roleCode, setRoleCode] = useState(
    () => roles?.find((r) => r.code === "operator_technician")?.code ?? roles?.[0]?.code ?? ""
  );
  const [managerNote, setManagerNote] = useState("");
  const [createdRow, setCreatedRow] = useState<NewHireRow | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isFinalStep = stepIndex === WIZARD_STEP_LABELS.length - 1;
  const unitOptions = Object.values(units ?? {}).sort((a, b) => a.name.localeCompare(b.name));

  function reset() {
    setStepIndex(0);
    setName("");
    setEmail("");
    setPosition("");
    setUnitId("");
    setManagerName("");
    setManagerRole("");
    setStartDate("");
    setContractType("พนักงานประจำ");
    setRoleCode(roles?.find((r) => r.code === "operator_technician")?.code ?? roles?.[0]?.code ?? "");
    setManagerNote("");
    setCreatedRow(null);
    setSubmitError(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleNext() {
    if (stepIndex !== WIZARD_STEP_LABELS.length - 2) {
      setStepIndex((i) => Math.min(i + 1, WIZARD_STEP_LABELS.length - 1));
      return;
    }

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
      const employeeCode = randomEmployeeCode();
      const result = await createMember(tenantId, {
        email: email.trim(),
        role_code: roleCode,
        employee_code: employeeCode,
        job_title: position.trim() || undefined,
        default_department_id: unitId || undefined,
        start_date: startDate || undefined,
      });

      const pending = isPendingInvite(result);
      const doneIndices = pending ? [] : STEP_LABEL_INDICES.slice(0, stepIndex + 1).flat();
      const steps = buildStepsFromDoneIndices(doneIndices);
      const doneCount = steps.filter((s) => s.done).length;

      // `status`/`steps`/`progress` below are invented client-side, not read
      // from `result` — see this component's header comment ("what's real
      // here and what isn't"). Only `id`/`name`/`employeeCode` (and
      // `inviteUrl`) actually come from Core's response.
      const row: NewHireRow = {
        id: pending ? result.invitation_id : result.id,
        name: pending ? email.trim() : result.user.full_name,
        employeeCode: pending ? employeeCode : (result.employee_code ?? employeeCode),
        position: position.trim() || "-",
        unit: unitId ? unitLabel(unitId, units ?? {}) : "-",
        startDateLabel: startDate ? formatThaiDate(startDate) : "-",
        daysLeftLabel: startDate ? formatDaysUntilThai(startDate) : "-",
        progress: Math.round((doneCount / steps.length) * 100),
        status: pending ? "pending" : "in-progress",
        managerName: managerName.trim() || null,
        managerRole: managerName.trim() ? managerRole.trim() || "ผู้จัดการ" : null,
        steps,
        inviteUrl: pending ? result.invite_url : undefined,
      };
      setCreatedRow(row);
      onAdd(row);
      setStepIndex((i) => i + 1);
    } catch (err) {
      setSubmitError(
        err instanceof ApiError ? err.message : "ไม่สามารถสร้างพนักงานใหม่ได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง"
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleBack() {
    setSubmitError(null);
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  const canProceed =
    (stepIndex !== 0 || (name.trim().length > 0 && email.trim().length > 0)) &&
    (stepIndex !== 1 || position.trim().length > 0) &&
    (stepIndex !== 3 || roleCode.length > 0);

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="เพิ่มพนักงานใหม่"
      size="lg"
      footer={
        isFinalStep ? (
          <Button variant="primary" onClick={handleClose}>
            เสร็จสิ้น
          </Button>
        ) : (
          <>
            <Button variant="secondary" onClick={stepIndex === 0 ? handleClose : handleBack} disabled={submitting}>
              {stepIndex === 0 ? "ยกเลิก" : "ย้อนกลับ"}
            </Button>
            <Button variant="primary" onClick={handleNext} disabled={!canProceed || submitting}>
              {submitting ? "กำลังบันทึก..." : "ถัดไป"}
            </Button>
          </>
        )
      }
    >
      <div className="mb-4">
        <WizardSteps steps={WIZARD_STEP_LABELS} currentIndex={stepIndex} />
      </div>

      {stepIndex === 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            ชื่อ-นามสกุล
            <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClasses} />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            อีเมล
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ใช้เพื่อสร้างบัญชีหรือส่งคำเชิญ"
              className={inputClasses}
            />
          </label>
        </div>
      )}

      {stepIndex === 1 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            ตำแหน่งงาน
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
          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
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
                title="ไม่สามารถโหลดรายชื่อหน่วยงานจาก Core ได้ในขณะนี้ — จะสร้างพนักงานใหม่โดยไม่ระบุหน่วยงาน"
                className="flex cursor-not-allowed items-center rounded-lg border border-dashed border-zinc-200 px-3 py-2 text-sm text-zinc-400 dark:border-zinc-700"
              >
                ไม่พบข้อมูลหน่วยงาน
              </span>
            )}
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            ผู้จัดการ
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
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            วันที่เริ่มงาน
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={inputClasses}
            />
            {startDate && (
              <span className="text-[11px] font-normal text-zinc-400">
                {formatThaiDate(startDate)} ({formatDaysUntilThai(startDate)})
              </span>
            )}
          </label>
        </div>
      )}

      {stepIndex === 2 && (
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            ประเภทการจ้าง
            <select value={contractType} onChange={(e) => setContractType(e.target.value)} className={inputClasses}>
              <option>พนักงานประจำ</option>
              <option>สัญญาจ้าง 1 ปี</option>
            </select>
          </label>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">เอกสารที่ต้องเตรียม:</p>
          <ul className="list-inside list-disc text-xs text-zinc-500 dark:text-zinc-400">
            <li>สำเนาบัตรประชาชน / หนังสือเดินทาง</li>
            <li>สำเนาวุฒิการศึกษา</li>
            <li>สัญญาจ้างที่ลงนามแล้ว</li>
          </ul>
        </div>
      )}

      {stepIndex === 3 && (
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
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
                ไม่พบบทบาทที่ใช้ได้จาก Core — ไม่สามารถสร้างพนักงานใหม่ได้ในขณะนี้
              </span>
            )}
          </label>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">ระบบจะเตรียมสิ่งต่อไปนี้ให้พนักงานใหม่:</p>
          <ul className="list-inside list-disc text-xs text-zinc-500 dark:text-zinc-400">
            <li>บัญชีผู้ใช้และอีเมลบริษัท</li>
            <li>โน้ตบุ๊กและอุปกรณ์ทำงาน</li>
            <li>สิทธิ์เข้าถึงแอปพลิเคชันที่จำเป็นตามตำแหน่ง</li>
          </ul>
        </div>
      )}

      {stepIndex === 4 && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-zinc-600 dark:text-zinc-300">แผนการอบรมและเตรียมความพร้อม:</p>
          <ul className="list-inside list-disc text-xs text-zinc-500 dark:text-zinc-400">
            <li>ปฐมนิเทศพนักงานใหม่</li>
            <li>อบรมนโยบายบริษัทและ PDPA</li>
            <li>เตรียมความพร้อมผู้จัดการต้นสังกัด</li>
          </ul>
          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            หมายเหตุถึงผู้จัดการ (ถ้ามี)
            <textarea
              value={managerNote}
              onChange={(e) => setManagerNote(e.target.value)}
              rows={2}
              className={inputClasses}
            />
          </label>
          {submitError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-500/10 dark:text-red-400">
              {submitError}
            </p>
          )}
        </div>
      )}

      {isFinalStep && createdRow && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col items-center gap-2 py-2 text-center">
            <CheckCircleIcon className="h-8 w-8 text-emerald-500" />
            {createdRow.inviteUrl ? (
              <>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  ส่งคำเชิญไปที่ {createdRow.name} แล้ว
                </p>
                <p className="max-w-sm text-xs text-zinc-400">
                  อีเมลนี้ยังไม่มีบัญชี Thunder One — รอการตอบรับคำเชิญก่อนจึงจะเริ่มกระบวนการ Onboarding ได้
                </p>
              </>
            ) : (
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {createdRow.name} พร้อมเริ่มกระบวนการ Onboarding
              </p>
            )}
            <p className="text-xs text-zinc-400">
              {createdRow.employeeCode} · {createdRow.position} · {contractType}
            </p>
          </div>

          {createdRow.inviteUrl && (
            <div className="flex items-center gap-2 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
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

          <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
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
        </div>
      )}
    </Modal>
  );
}
