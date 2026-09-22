"use client";

import Link from "next/link";
import { useMemo, useState, type ChangeEvent, type DragEvent } from "react";
import { toast } from "sonner";
import { buttonClasses, Button } from "@/components/ui/Button";
import { WizardSteps } from "@/components/ui/WizardSteps";
import { ChevronRightIcon } from "@/components/ui/icons";
import { ApiError, classifyApiError } from "@/lib/api/api-error";
import { formatDaysUntilThai, formatThaiDate } from "@/lib/thai-date";
import {
  createEmployee,
  createMember,
  isPendingInvite,
  type CoreEmployeeResult,
  type CoreInviteResult,
  type CoreMemberRow,
  type CoreRole,
} from "@/features/people/personnel";
import type { OrgUnitNode } from "@/features/people/org-structure";
// Deep import, same reasoning as AddEmployeeWizardPage/AddContractorWizardPage:
// avoids a barrel-file import cycle between add-person and new-hires.
import { buildStepsFromDoneIndices, type NewHireRow } from "@/features/people/new-hires/mock-data";
import { NEW_HIRE_HANDOFF_KEY } from "../handoff";
import { parseBulkCsvText, type BulkCsvRow, type BulkCsvRowError } from "../bulk-csv";
import { bulkStep0Schema, bulkStep1Schema, pickDefaultRoleCode, zodErrorsToFieldMap } from "../schemas";
import { clearFieldError } from "../form-field";
import { DURATION_OPTIONS, ROWS_PER_PAGE, WORK_LOCATION_OPTIONS, unitLabel } from "../wizard-shared";
import { AddBulkStep1Upload } from "./AddBulkStep1Upload";
import { AddBulkStep2Employment } from "./AddBulkStep2Employment";
import { AddBulkStepReview } from "./AddBulkStepReview";
import { AddBulkStepSuccess } from "./AddBulkStepSuccess";

const WIZARD_STEP_LABELS = ["ข้อมูลพื้นฐาน", "รายละเอียดการจ้างงาน", "ตรวจสอบและเพิ่ม"];

const WORK_ARRANGEMENT_CODE: Record<string, "on_site" | "hybrid" | "remote"> = {
  "On-site": "on_site",
  Hybrid: "hybrid",
  Remote: "remote",
};

export interface BulkSubmitResult {
  row: BulkCsvRow;
  name: string;
  outcome: "created" | "invited" | "failed";
  message?: string;
  newHireRow?: NewHireRow;
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
      <span className="text-zinc-600 dark:text-zinc-300">เพิ่มหลายคนเข้าองค์กร (Bulk)</span>
    </nav>
  );
}

interface AddBulkWizardPageProps {
  /** `GET /tenants/:id/roles` result — same "disables submission if empty"
   *  gate as AddEmployeeWizardPage, since `POST /tenants/:id/employees` (and
   *  its `/members` fallback) both require a `role_code`. This page has no
   *  role picker of its own; it defaults to `operator_technician` the same
   *  way AddEmployeeWizardPage does. */
  roles: CoreRole[] | null;
  /** Tenant id, for the real `createEmployee`/`createMember` calls on
   *  confirm. `null` disables submission (see AddEmployeeWizardPage). */
  tenantId: string | null;
  /** Real org units, for the หน่วยงาน dropdown — sent as
   *  `default_department_id` on every row's create call when selected. */
  units: Record<string, OrgUnitNode> | null;
  /** Real distinct `job_title` values from the current roster (`people/
   *  personnel`'s `derivePositionOptions`) — backs the ตำแหน่งงาน field's
   *  `<datalist>` autocomplete. `[]` just means no suggestions; the field
   *  itself is free text, so this never blocks submission. */
  positionOptions: string[];
}

// "เพิ่มหลายคนเข้าองค์กร (Bulk)" — full-page 3-step flow, built 2026-09-01
// once its own FigJam screens were provided, made real 2026-09-10 once a
// CSV-only parsing + per-row Core submission approach was agreed on (see
// docs/people/add-contractor-and-bulk-field-requirements.md's "What Core
// would need to build" — a real `POST /tenants/:id/members/bulk` doesn't
// exist, so this loops the same single-row `createEmployee`/`createMember`
// calls AddEmployeeWizardPage uses, once per row, and reports partial
// success/failure itself since Core has no batch response to relay).
//
// - The file picker only accepts real `.csv` (not the `.xlsx` the mockup's
//   copy used to advertise — parsing a binary Excel format isn't worth a new
//   dependency for this pass; an `.xlsx` selection is rejected with a
//   message asking for CSV instead). `../bulk-csv.ts`'s `parseBulkCsvText`
//   does the actual parsing — RFC4180 quoting, header-row column mapping
//   (`skipFirstRow`) or positional mapping, per-row validation. Rows that
//   fail validation (bad email, duplicate email in-file, invalid Thai ID,
//   etc.) are dropped and reported, not silently included.
// - "ยืนยันและส่งคำเชิญ" (`handleConfirm` below) really does call Core, once
//   per valid row, sequentially — see this function's own comment for why
//   sequential, not parallel. Every row gets `createEmployee` first, falling
//   back to `createMember` on a 409 (email already has an account), same
//   fallback AddEmployeeWizardPage uses. Step 2's bulk-applied fields
//   (หน่วยงาน/ตำแหน่งงาน/ประเภทการจ้างงาน/ลักษณะการทำงาน/วันที่เริ่มงาน/หมายเหตุ)
//   are the ones with a real Core field to land in
//   (default_department_id/job_title/member_type/work_arrangement/
//   start_date/notes) — the contract-specific fields (สัญญา, วงเงิน,
//   ระยะเวลา, ผู้บังคับบัญชา) stay cosmetic, same "not in Core's schema"
//   story as AddContractorWizardPage's own step 2.
// - Successfully created/invited rows ARE now stashed via
//   NEW_HIRE_HANDOFF_KEY (as a JSON array — NewHiresPage's readHandoff()
//   accepts either a single object or an array under this key), same as
//   Employee/Contractor. Failed rows are surfaced in the confirmation
//   screen's own list instead, never faked into the roster.
//
// Step JSX was split into AddBulkStep1Upload/AddBulkStep2Employment/
// AddBulkStepReview/AddBulkStepSuccess 2026-09-17 (readability audit) —
// pure presentational extraction, every state/handler below is unchanged
// from before the split and still lives only here.
export function AddBulkWizardPage({ roles, tenantId, units, positionOptions }: AddBulkWizardPageProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [tablePage, setTablePage] = useState(1);

  // Step 1 — file upload. `importMode` stays decorative (see this file's
  // header comment / the field-requirements doc's open question #2 — Core
  // has no update/upsert semantics for this endpoint yet). `fileText` is
  // kept so toggling `skipFirstRow` after upload can re-parse without asking
  // for the file again.
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileText, setFileText] = useState<string | null>(null);
  const [rows, setRows] = useState<BulkCsvRow[]>([]);
  const [parseErrors, setParseErrors] = useState<BulkCsvRowError[]>([]);
  const [parsing, setParsing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [importMode, setImportMode] = useState<"new" | "update" | "mix">("new");
  const [skipFirstRow, setSkipFirstRow] = useState(true);

  // Step 2 — bulk-applied employment details, applied to every row in the
  // batch. unitId/position/workArrangement/notes/startDate below are real
  // (sent in `sharedFields`); team/employmentType label/workLocation/endDate
  // stay decorative — this comment previously said "All decorative", which
  // was stale (fixed 2026-09-16, same mock-data audit as the rest of
  // People Workspace).
  const [unitId, setUnitId] = useState("");
  const [team, setTeam] = useState("");
  // Real since 2026-09-16 — memberships.position_code/level_role, round-trip
  // confirmed against thunder_core_API (commit 489c3b1), applied to every
  // row in this batch same as position/unitId above.
  const [positionCode, setPositionCode] = useState("");
  const [levelRole, setLevelRole] = useState("");
  const [position, setPosition] = useState("");
  const [employmentType, setEmploymentType] = useState("ผู้รับเหมา (Contractor)");
  const [workLocation, setWorkLocation] = useState(WORK_LOCATION_OPTIONS[0]);
  const [workArrangement, setWorkArrangement] = useState("On-site");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [duration, setDuration] = useState(DURATION_OPTIONS[2]);
  const [contractValue, setContractValue] = useState("");
  const [notes, setNotes] = useState("");
  const [applyToAll, setApplyToAll] = useState(true);

  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState(0);
  const [submitResults, setSubmitResults] = useState<BulkSubmitResult[] | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const roleCode = useMemo(() => pickDefaultRoleCode(roles), [roles]);

  const unitOptions = Object.values(units ?? {}).sort((a, b) => a.name.localeCompare(b.name));
  const people = useMemo(
    () => rows.map((row) => ({ name: `${row.firstName} ${row.lastName}`, email: row.email, raw: row })),
    [rows]
  );
  const totalCount = people.length;

  const pageCount = Math.max(1, Math.ceil(people.length / ROWS_PER_PAGE));
  const pagedPeople = useMemo(
    () => people.slice((tablePage - 1) * ROWS_PER_PAGE, tablePage * ROWS_PER_PAGE),
    [people, tablePage]
  );

  function handleUnitIdChange(value: string) {
    setUnitId(value);
    clearFieldError(setErrors, "unitId");
  }
  function handlePositionChange(value: string) {
    setPosition(value);
    clearFieldError(setErrors, "position");
  }
  function handleStartDateChange(value: string) {
    setStartDate(value);
    clearFieldError(setErrors, "startDate");
  }

  function validateStep(index: 0 | 1): boolean {
    const schema = index === 0 ? bulkStep0Schema : bulkStep1Schema;
    const data = index === 0 ? { fileName: fileName ?? "" } : { unitId, position, startDate };
    const result = schema.safeParse(data);
    if (!result.success) {
      setErrors(zodErrorsToFieldMap(result.error));
      toast.error("กรุณาตรวจสอบข้อมูลที่กรอกให้ครบถ้วนและถูกต้อง");
      return false;
    }
    setErrors({});
    return true;
  }

  function handleNext() {
    if (!validateStep(stepIndex === 0 ? 0 : 1)) return;
    if (stepIndex === 0 && rows.length === 0) {
      toast.error("ไม่มีข้อมูลที่ถูกต้องในไฟล์ กรุณาตรวจสอบไฟล์แล้วลองใหม่");
      return;
    }
    setStepIndex((i) => Math.min(i + 1, 2));
  }

  function applyParsedFile(text: string, skipHeader: boolean) {
    const result = parseBulkCsvText(text, skipHeader);
    setRows(result.rows);
    setParseErrors(result.errors);
    setTablePage(1);
  }

  async function handleFile(file: File | null) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setFileName(null);
      setRows([]);
      setParseErrors([]);
      setErrors((prev) => ({
        ...prev,
        fileName: "รองรับเฉพาะไฟล์ CSV (.csv) ในขณะนี้ กรุณาบันทึกไฟล์เป็น .csv แล้วลองใหม่",
      }));
      return;
    }
    setParsing(true);
    try {
      const text = await file.text();
      setFileName(file.name);
      setFileText(text);
      applyParsedFile(text, skipFirstRow);
      clearFieldError(setErrors, "fileName");
    } catch {
      setErrors((prev) => ({ ...prev, fileName: "ไม่สามารถอ่านไฟล์นี้ได้ กรุณาลองใหม่อีกครั้ง" }));
    } finally {
      setParsing(false);
    }
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave() {
    setDragOver(false);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    void handleFile(e.dataTransfer.files?.[0] ?? null);
  }

  function handleFileInput(e: ChangeEvent<HTMLInputElement>) {
    void handleFile(e.target.files?.[0] ?? null);
  }

  function handleSkipFirstRowChange(checked: boolean) {
    setSkipFirstRow(checked);
    if (fileText) applyParsedFile(fileText, checked);
  }

  function resetForNextImport() {
    setStepIndex(0);
    setFileName(null);
    setFileText(null);
    setRows([]);
    setParseErrors([]);
    setSubmitResults(null);
    setConfirmed(false);
    setTablePage(1);
    setErrors({});
  }

  /**
   * Sequential, not `Promise.all` — this fires a real invite email per row
   * (docs/people/add-contractor-and-bulk-field-requirements.md's open
   * question #1 about rate limiting), and Core has no batch endpoint to
   * absorb a burst, so going one at a time is the closest thing to
   * self-imposed throttling available without a real queue. It also keeps
   * `submitProgress` meaningful as an "i / N" counter.
   */
  async function handleConfirm() {
    if (!validateStep(1)) {
      setStepIndex(1);
      return;
    }
    if (!tenantId) {
      toast.error("ไม่พบข้อมูล Tenant ของผู้ใช้ปัจจุบัน กรุณาโหลดหน้านี้ใหม่แล้วลองอีกครั้ง");
      return;
    }
    if (!roleCode) {
      toast.error("ไม่พบบทบาท (Role) ที่ใช้ได้ในองค์กรนี้ ไม่สามารถสร้างบุคคลใหม่ได้ในขณะนี้");
      return;
    }
    if (rows.length === 0) {
      toast.error("ไม่มีข้อมูลที่ถูกต้องให้นำเข้า");
      return;
    }

    setSubmitting(true);
    setSubmitProgress(0);

    const memberType: "employee" | "contractor" = employmentType.includes("Contractor")
      ? "contractor"
      : "employee";
    const workArrangementCode = WORK_ARRANGEMENT_CODE[workArrangement];
    const results: BulkSubmitResult[] = [];

    for (const row of rows) {
      const name = `${row.firstName} ${row.lastName}`;
      // Was `randomCode(...)` — a fake "EMP-0xxx"/"CON-0xxx" code fabricated
      // for every row and sent to Core as if real (fixed 2026-09-15, UAT
      // PP03-013). REQUIRED_COLUMNS has no employee_code column at all, so
      // there was never a real value to send here — omitted entirely now,
      // same as AddEmployeeWizardPage/AddContractorWizardPage's own fix.
      const sharedFields = {
        email: row.email,
        role_code: roleCode,
        default_department_id: unitId || undefined,
        position_code: positionCode.trim() || undefined,
        level_role: levelRole.trim() || undefined,
        member_type: memberType,
        work_arrangement: workArrangementCode,
        notes: notes.trim() || undefined,
      };

      try {
        let result: CoreEmployeeResult | CoreMemberRow | CoreInviteResult;
        try {
          result = await createEmployee(tenantId, {
            ...sharedFields,
            first_name: row.firstName,
            last_name: row.lastName,
            // Also captured explicitly (real since 2026-09-16) — see
            // AddEmployeeWizardPage's identical comment. The CSV's
            // "ชื่อ (ภาษาไทย)" column maps to both; if the source file's own
            // data is genuinely Thai script, this keeps it recoverable even
            // if first_name/last_name are ever overwritten downstream.
            first_name_th: row.firstName,
            last_name_th: row.lastName,
            job_title: position.trim(),
            start_date: startDate,
            phone: row.mobile,
            national_id: row.idCard ?? undefined,
            date_of_birth: row.dateOfBirth ?? undefined,
          });
        } catch (err) {
          // Same 409-means-"email already has an account" fallback
          // AddEmployeeWizardPage uses — `/employees` can't attach to an
          // existing `users` row, `/members` just adds the membership.
          if (!(err instanceof ApiError) || err.status !== 409) throw err;
          result = await createMember(tenantId, {
            ...sharedFields,
            job_title: position.trim() || undefined,
            start_date: startDate || undefined,
          });
        }

        // Calling the type guard directly in each branch, not via a stored
        // boolean — same reasoning as AddEmployeeWizardPage.handleSubmit's
        // comment: narrowing a 3-way union through a plain boolean stops
        // working once a third member (CoreEmployeeResult) joins it.
        const identity = isPendingInvite(result)
          ? { id: result.invitation_id, name: row.email, employeeCode: "-", inviteUrl: result.invite_url as string | undefined }
          : {
              id: result.id,
              name: result.user.full_name,
              employeeCode: result.employee_code || "-",
              inviteUrl: undefined as string | undefined,
            };
        const pending = isPendingInvite(result);
        const newHireRow: NewHireRow = {
          id: identity.id,
          name: identity.name,
          employeeCode: identity.employeeCode,
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
          steps: buildStepsFromDoneIndices([]),
          inviteUrl: identity.inviteUrl,
        };
        results.push({ row, name, outcome: pending ? "invited" : "created", newHireRow });
      } catch (err) {
        // classifyApiError() (2026-09-17, RBAC audit follow-up) — see
        // AddEmployeeWizardPage's identical comment for why this replaced a
        // raw err.message (matters per-row here too: a non-admin's whole
        // batch would otherwise show Core's raw 403 text on every row).
        const message = classifyApiError(err, "สร้างไม่สำเร็จ กรุณาลองใหม่ภายหลัง").message;
        results.push({ row, name, outcome: "failed", message });
      }
      setSubmitProgress((p) => p + 1);
    }

    setSubmitResults(results);
    setSubmitting(false);
    setConfirmed(true);

    const createdRows = results.map((r) => r.newHireRow).filter((r): r is NewHireRow => r != null);
    if (createdRows.length > 0) {
      try {
        sessionStorage.setItem(NEW_HIRE_HANDOFF_KEY, JSON.stringify(createdRows));
      } catch {
        // sessionStorage unavailable (private mode, etc.) — not fatal, same
        // as AddEmployeeWizardPage's own handoff write.
      }
    }

    const failedCount = results.length - createdRows.length;
    if (failedCount === 0) {
      toast.success(`สร้างบุคคล ${results.length} คน และส่งคำเชิญ Onboarding เรียบร้อยแล้ว`);
    } else {
      toast.error(`สร้างสำเร็จ ${createdRows.length}/${results.length} คน — ${failedCount} คนล้มเหลว ดูรายละเอียดด้านล่าง`);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-3">
          <Breadcrumb />
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">เพิ่มหลายคนเข้าองค์กร (Bulk)</h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              นำเข้าข้อมูลบุคคลหลายคนพร้อมกัน เพื่อเริ่มกระบวนการ Onboarding
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
        <AddBulkStep1Upload
          fileName={fileName}
          parsing={parsing}
          dragOver={dragOver}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onFileInput={handleFileInput}
          fileNameError={errors.fileName}
          parseErrors={parseErrors}
          importMode={importMode}
          onImportModeChange={setImportMode}
          skipFirstRow={skipFirstRow}
          onSkipFirstRowChange={handleSkipFirstRowChange}
          totalCount={totalCount}
        />
      )}

      {stepIndex === 1 && (
        <AddBulkStep2Employment
          totalCount={totalCount}
          unitId={unitId}
          onUnitIdChange={handleUnitIdChange}
          units={units}
          unitOptions={unitOptions}
          team={team}
          onTeamChange={setTeam}
          position={position}
          onPositionChange={handlePositionChange}
          positionOptions={positionOptions}
          positionCode={positionCode}
          onPositionCodeChange={setPositionCode}
          levelRole={levelRole}
          onLevelRoleChange={setLevelRole}
          employmentType={employmentType}
          onEmploymentTypeChange={setEmploymentType}
          workLocation={workLocation}
          onWorkLocationChange={setWorkLocation}
          workArrangement={workArrangement}
          onWorkArrangementChange={setWorkArrangement}
          startDate={startDate}
          onStartDateChange={handleStartDateChange}
          endDate={endDate}
          onEndDateChange={setEndDate}
          duration={duration}
          onDurationChange={setDuration}
          contractValue={contractValue}
          onContractValueChange={setContractValue}
          notes={notes}
          onNotesChange={setNotes}
          applyToAll={applyToAll}
          onApplyToAllChange={setApplyToAll}
          pagedPeople={pagedPeople}
          tablePage={tablePage}
          onTablePageChange={setTablePage}
          pageCount={pageCount}
          errors={errors}
        />
      )}

      {stepIndex === 2 && !confirmed && (
        <AddBulkStepReview
          totalCount={totalCount}
          startDate={startDate}
          unitId={unitId}
          units={units}
          position={position}
          employmentType={employmentType}
          workLocation={workLocation}
          duration={duration}
          people={people}
        />
      )}

      {stepIndex === 2 && confirmed && (
        <AddBulkStepSuccess submitResults={submitResults} onImportNext={resetForNextImport} />
      )}

      {!confirmed && (
        <div className="flex justify-end gap-2">
          {stepIndex > 0 && (
            <Button variant="secondary" onClick={() => setStepIndex((i) => Math.max(i - 1, 0))} disabled={submitting}>
              ย้อนกลับ
            </Button>
          )}
          {stepIndex < 2 ? (
            <Button variant="primary" onClick={handleNext}>
              {stepIndex === 0 ? "ถัดไป: รายละเอียดการจ้างงาน" : "ถัดไป: ตรวจสอบและเพิ่ม"}
            </Button>
          ) : (
            <>
              <span title="ยังไม่เปิดใช้งาน" className="flex cursor-not-allowed items-center rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                บันทึกร่าง
              </span>
              <div className="flex flex-col items-end gap-1">
                <Button variant="primary" onClick={handleConfirm} disabled={submitting}>
                  {submitting ? `กำลังสร้าง... (${submitProgress}/${rows.length})` : "ยืนยันและส่งคำเชิญ"}
                </Button>
                <span className="text-[11px] text-zinc-400">จะส่งอีเมลเชิญทันทีหลังยืนยัน</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
