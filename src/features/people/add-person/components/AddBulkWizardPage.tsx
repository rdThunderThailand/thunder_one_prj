"use client";

import Link from "next/link";
import { useMemo, useState, type ChangeEvent, type DragEvent } from "react";
import { toast } from "sonner";
import { buttonClasses, Button } from "@/components/ui/Button";
import { WizardSteps } from "@/components/ui/WizardSteps";
import {
  CheckCircleIcon,
  CheckIcon,
  ChevronRightIcon,
  EnvelopeIcon,
  InfoIcon,
  PhoneIcon,
  UploadIcon,
  UsersIcon,
} from "@/components/ui/icons";
import { ApiError } from "@/lib/api/api-error";
import { formatDaysUntilThai, formatThaiDate } from "@/lib/thai-date";
import {
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
// Deep import, same reasoning as AddEmployeeWizardPage/AddContractorWizardPage:
// avoids a barrel-file import cycle between add-person and new-hires.
import { buildStepsFromDoneIndices, type NewHireRow } from "@/features/people/new-hires/mock-data";
import { NEW_HIRE_HANDOFF_KEY } from "../handoff";
import { parseBulkCsvText, type BulkCsvRow, type BulkCsvRowError } from "../bulk-csv";
import { bulkStep0Schema, bulkStep1Schema, pickDefaultRoleCode, zodErrorsToFieldMap } from "../schemas";
import { clearFieldError, ErrorText, fieldClasses, inputClasses, labelClasses } from "../form-field";

const POSITION_OPTIONS = Array.from(new Set(personnelRows.map((row) => row.position))).sort((a, b) =>
  a.localeCompare(b)
);
const WORK_LOCATION_OPTIONS = ["สำนักงานใหญ่ (Bangkok Office)", "สาขาเชียงใหม่", "สาขาขอนแก่น", "ทำงานทางไกล (Remote)"];
const DURATION_OPTIONS = ["3 เดือน", "6 เดือน", "12 เดือน", "ไม่ระบุ"];

function unitLabel(unitId: string, units: Record<string, OrgUnitNode>): string {
  const unit = units[unitId];
  if (!unit) return "-";
  const parent = unit.parentId ? units[unit.parentId] : null;
  return parent && parent.parentId ? `${parent.name} / ${unit.name}` : unit.name;
}

const WIZARD_STEP_LABELS = ["ข้อมูลพื้นฐาน", "รายละเอียดการจ้างงาน", "ตรวจสอบและเพิ่ม"];

const REQUIRED_COLUMNS = [
  { en: "first_name*", th: "ชื่อ (ภาษาไทย)", example: "สมชาย", required: true },
  { en: "last_name*", th: "นามสกุล (ภาษาไทย)", example: "วงศ์ดี", required: true },
  { en: "email*", th: "อีเมล (สำหรับการเข้าสู่ระบบ)", example: "somchai.wongdee@thunderone.co.th", required: true },
  { en: "mobile*", th: "เบอร์โทรศัพท์มือถือ", example: "081-234-5678", required: true },
  { en: "date_of_birth", th: "วันเกิด (ค.ศ.)", example: "1990-01-15", required: false },
  { en: "id_card", th: "เลขบัตรประชาชน", example: "1-2345-67890-12-3", required: false },
];

const ROWS_PER_PAGE = 5;

const WORK_ARRANGEMENT_CODE: Record<string, "on_site" | "hybrid" | "remote"> = {
  "On-site": "on_site",
  Hybrid: "hybrid",
  Remote: "remote",
};

function randomCode(prefix: "EMP" | "CON"): string {
  return `${prefix}-0${String(Math.floor(100 + Math.random() * 900))}`;
}

interface BulkSubmitResult {
  row: BulkCsvRow;
  name: string;
  outcome: "created" | "invited" | "failed";
  message?: string;
  newHireRow?: NewHireRow;
}

// Visual counterpart to each field's `required` attribute — same convention
// as AddEmployeeWizardPage's requiredMark. Only on fields covered by
// bulkStep0Schema/bulkStep1Schema (../schemas.ts).
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
export function AddBulkWizardPage({ roles, tenantId, units }: AddBulkWizardPageProps) {
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

  // Step 2 — bulk-applied employment details. All decorative.
  const [unitId, setUnitId] = useState("");
  const [team, setTeam] = useState("");
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

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    void handleFile(e.dataTransfer.files?.[0] ?? null);
  }

  function handleFileInput(e: ChangeEvent<HTMLInputElement>) {
    void handleFile(e.target.files?.[0] ?? null);
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
      const employeeCode = randomCode(memberType === "contractor" ? "CON" : "EMP");
      const sharedFields = {
        email: row.email,
        role_code: roleCode,
        employee_code: employeeCode,
        default_department_id: unitId || undefined,
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
          ? { id: result.invitation_id, name: row.email, employeeCode, inviteUrl: result.invite_url as string | undefined }
          : {
              id: result.id,
              name: result.user.full_name,
              employeeCode: result.employee_code ?? employeeCode,
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
        const message = err instanceof ApiError ? err.message : "สร้างไม่สำเร็จ กรุณาลองใหม่ภายหลัง";
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
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm lg:col-span-2 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">1. ข้อมูลพื้นฐาน</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
                  dragOver ? "border-indigo-400 bg-indigo-50/50 dark:bg-indigo-500/5" : "border-zinc-200 dark:border-zinc-700"
                }`}
              >
                <label className="flex cursor-pointer flex-col items-center gap-2">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                    <UploadIcon className="h-5 w-5" />
                  </span>
                  <span className="text-sm text-zinc-600 dark:text-zinc-300">
                    ลากไฟล์มาวางที่นี่ หรือ <span className="font-medium text-indigo-600 dark:text-indigo-400">คลิกเพื่อเลือกไฟล์</span>
                  </span>
                  <span className="text-xs text-zinc-400">รองรับไฟล์ CSV (.csv) เท่านั้นในขณะนี้</span>
                  <span className="text-xs text-zinc-400">ขนาดไฟล์ไม่เกิน 10MB</span>
                  <input type="file" accept=".csv" className="hidden" onChange={handleFileInput} />
                </label>
                {parsing && <span className="mt-2 text-xs text-zinc-400">กำลังอ่านไฟล์...</span>}
                {fileName && !parsing && (
                  <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                    <CheckIcon className="h-3.5 w-3.5" />
                    {fileName}
                  </span>
                )}
                <ErrorText message={errors.fileName} />
                {parseErrors.length > 0 && (
                  <div className="mt-2 w-full max-w-sm rounded-lg border border-amber-200 bg-amber-50/60 p-2.5 text-left text-xs text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
                    <p className="mb-1 font-semibold">ข้าม {parseErrors.length} แถวที่ข้อมูลไม่ถูกต้อง:</p>
                    <ul className="list-inside list-disc space-y-0.5">
                      {parseErrors.slice(0, 5).map((e, i) => (
                        <li key={i}>
                          แถว {e.row}: {e.message}
                        </li>
                      ))}
                    </ul>
                    {parseErrors.length > 5 && <p className="mt-1">และอีก {parseErrors.length - 5} รายการ</p>}
                  </div>
                )}
                <a
                  href="/templates/bulk-import-template.csv"
                  download
                  className="mt-1 text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                >
                  ↓ ดาวน์โหลดไฟล์ตัวอย่าง (Template)
                </a>
              </div>

              <div className="rounded-xl border border-zinc-100 p-4 dark:border-zinc-800">
                <p className="mb-3 text-xs font-semibold text-zinc-400">ตัวเลือกการนำเข้า</p>
                <div className="flex flex-col gap-3">
                  {(
                    [
                      { id: "new", label: "เพิ่มบุคคลใหม่ทั้งหมด", sub: "สร้างบุคคลใหม่จากข้อมูลในไฟล์" },
                      { id: "update", label: "อัปเดตข้อมูลบุคคล", sub: "อัปเดตข้อมูลของบุคคลเดิม (ต้องมีอีเมลหรือรหัสพนักงาน)" },
                      { id: "mix", label: "ผสม (เพิ่มและอัปเดต)", sub: "เพิ่มบุคคลใหม่ และอัปเดตข้อมูลบุคคลเดิม" },
                    ] as const
                  ).map((option) => (
                    <label key={option.id} className="flex cursor-pointer items-start gap-2 text-sm">
                      <input
                        type="radio"
                        name="import-mode"
                        checked={importMode === option.id}
                        onChange={() => setImportMode(option.id)}
                        className="mt-0.5"
                      />
                      <span>
                        <span className="block font-medium text-zinc-900 dark:text-zinc-50">{option.label}</span>
                        <span className="block text-xs text-zinc-400">{option.sub}</span>
                      </span>
                    </label>
                  ))}
                </div>
                <label className="mt-4 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                  <input
                    type="checkbox"
                    checked={skipFirstRow}
                    onChange={(e) => {
                      const next = e.target.checked;
                      setSkipFirstRow(next);
                      if (fileText) applyParsedFile(fileText, next);
                    }}
                  />
                  ข้ามแถวแรก (ใช้เป็นหัวตาราง)
                </label>
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                คอลัมน์ที่จำเป็นในไฟล์ <span className="text-red-500">*</span> จำเป็นต้องมีทุกคอลัมน์
              </p>
              <div className="overflow-x-auto rounded-xl border border-zinc-100 dark:border-zinc-800">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 text-xs text-zinc-400 dark:border-zinc-800">
                      <th className="px-4 py-2 font-medium">คอลัมน์ (ชื่อภาษาอังกฤษ)</th>
                      <th className="px-4 py-2 font-medium">คอลัมน์ (ชื่อภาษาไทย)</th>
                      <th className="px-4 py-2 font-medium">ตัวอย่างข้อมูล</th>
                      <th className="px-4 py-2 font-medium">จำเป็น</th>
                    </tr>
                  </thead>
                  <tbody>
                    {REQUIRED_COLUMNS.map((col) => (
                      <tr key={col.en} className="border-b border-zinc-50 last:border-0 dark:border-zinc-800/60">
                        <td className="px-4 py-2 font-mono text-xs text-zinc-700 dark:text-zinc-200">{col.en}</td>
                        <td className="px-4 py-2 text-zinc-600 dark:text-zinc-300">{col.th}</td>
                        <td className="px-4 py-2 text-zinc-400">{col.example}</td>
                        <td className="px-4 py-2">
                          {col.required ? <CheckIcon className="h-4 w-4 text-emerald-500" /> : <span className="text-zinc-300">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-xs text-zinc-400">
                <InfoIcon className="h-3.5 w-3.5" />
                คุณสามารถเพิ่มคอลัมน์อื่นๆ ได้ในขั้นตอนถัดไป
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">สรุปการนำเข้า</h3>
              <div className="flex flex-col items-center gap-1 py-3 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400">
                  <UsersIcon className="h-6 w-6" />
                </span>
                <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {fileName ? "อัปโหลดไฟล์สำเร็จ" : "ยังไม่มีไฟล์ถูกอัปโหลด"}
                </p>
                <p className="text-xs text-zinc-400">
                  {fileName ? `พบข้อมูลทั้งหมด ${totalCount} รายการ` : "อัปโหลดไฟล์เพื่อดูสรุปจำนวนข้อมูล"}
                </p>
              </div>
              <div className="grid grid-cols-3 divide-x divide-zinc-100 text-center dark:divide-zinc-800">
                <div>
                  <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{totalCount}</p>
                  <p className="text-[11px] text-zinc-400">ทั้งหมด</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">0</p>
                  <p className="text-[11px] text-zinc-400">เพิ่มใหม่</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">0</p>
                  <p className="text-[11px] text-zinc-400">อัปเดต</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5 text-xs text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300">
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                <InfoIcon className="h-4 w-4" />
                คำแนะนำ
              </h3>
              <ul className="list-inside list-disc space-y-1">
                <li>ใช้ไฟล์ตาม Template ที่ดาวน์โหลด เพื่อให้ระบบอ่านข้อมูลได้ถูกต้อง</li>
                <li>ข้อมูลที่มี * เป็นข้อมูลที่จำเป็นต่อการสร้างบุคคล</li>
                <li>ใช้รูปแบบวันที่เป็น ค.ศ. (YYYY-MM-DD)</li>
                <li>ตรวจสอบอีเมลให้ถูกต้องและไม่ซ้ำกัน</li>
                <li>ขนาดไฟล์ไม่เกิน 10MB</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">ติดปัญหา?</h3>
              <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">ติดต่อทีม HR Support</p>
              <div className="flex flex-col gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <EnvelopeIcon className="h-3.5 w-3.5" />
                  hr.support@thunderone.co.th
                </span>
                <span className="flex items-center gap-1.5">
                  <PhoneIcon className="h-3.5 w-3.5" />
                  02-123-4567 ต่อ 123
                </span>
              </div>
              <span
                title="ยังไม่เปิดใช้งาน"
                className="mt-3 flex cursor-not-allowed items-center justify-center rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
              >
                คู่มือการใช้งาน
              </span>
            </div>
          </div>
        </div>
      )}

      {stepIndex === 1 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm lg:col-span-2 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">2. รายละเอียดการจ้างงาน</h2>
                <p className="text-xs text-zinc-400">ระบุข้อมูลการจ้างงานสำหรับบุคคลที่เลือก {totalCount} คน</p>
              </div>
              <a
                href="/templates/bulk-import-template.csv"
                download
                className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
              >
                <UploadIcon className="h-3.5 w-3.5 rotate-180" />
                ดาวน์โหลดตัวอย่างไฟล์
              </a>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className={labelClasses}>
                <span>หน่วยงาน {requiredMark}</span>
                {unitOptions.length > 0 ? (
                  <select
                    value={unitId}
                    onChange={(e) => {
                      setUnitId(e.target.value);
                      clearFieldError(setErrors, "unitId");
                    }}
                    className={fieldClasses(!!errors.unitId)}
                  >
                    <option value="">ไม่ระบุ</option>
                    {unitOptions.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unitLabel(unit.id, units ?? {})}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="flex cursor-not-allowed items-center rounded-lg border border-dashed border-zinc-200 px-3 py-2 text-sm text-zinc-400 dark:border-zinc-700">
                    ไม่พบข้อมูลหน่วยงาน
                  </span>
                )}
                <ErrorText message={errors.unitId} />
              </label>
              <label className={labelClasses}>
                ทีม (Team)
                <input value={team} onChange={(e) => setTeam(e.target.value)} className={inputClasses} />
              </label>
              <label className={labelClasses}>
                <span>ตำแหน่งงาน {requiredMark}</span>
                <input
                  required
                  list="bulk-position-options"
                  value={position}
                  onChange={(e) => {
                    setPosition(e.target.value);
                    clearFieldError(setErrors, "position");
                  }}
                  placeholder="พิมพ์เพื่อค้นหา หรือระบุตำแหน่งใหม่"
                  className={fieldClasses(!!errors.position)}
                />
                <datalist id="bulk-position-options">
                  {POSITION_OPTIONS.map((option) => (
                    <option key={option} value={option} />
                  ))}
                </datalist>
                <ErrorText message={errors.position} />
              </label>
              <label className={labelClasses}>
                ประเภทการจ้างงาน
                <select value={employmentType} onChange={(e) => setEmploymentType(e.target.value)} className={inputClasses}>
                  <option>พนักงานประจำ (Employee)</option>
                  <option>ผู้รับเหมา (Contractor)</option>
                </select>
              </label>
              <label className={labelClasses}>
                สถานที่ทำงานหลัก
                <select value={workLocation} onChange={(e) => setWorkLocation(e.target.value)} className={inputClasses}>
                  {WORK_LOCATION_OPTIONS.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </label>
              <label className={labelClasses}>
                ลักษณะการทำงาน
                <select value={workArrangement} onChange={(e) => setWorkArrangement(e.target.value)} className={inputClasses}>
                  <option>On-site</option>
                  <option>Remote</option>
                  <option>Hybrid</option>
                </select>
              </label>
              {/* ผู้บังคับบัญชา (Reporting To) removed — see
                  AddEmployeeWizardPage's identical comment. */}
              <label className={labelClasses}>
                <span>วันที่เริ่มงาน {requiredMark}</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    clearFieldError(setErrors, "startDate");
                  }}
                  className={fieldClasses(!!errors.startDate)}
                />
                <ErrorText message={errors.startDate} />
              </label>
              <label className={labelClasses}>
                วันที่สิ้นสุดสัญญา (คาดการณ์)
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
              <label className={labelClasses}>
                วงเงินสัญญา (ต่อปี)
                <input inputMode="numeric" value={contractValue} onChange={(e) => setContractValue(e.target.value)} placeholder="บาท" className={inputClasses} />
              </label>
              <label className={`${labelClasses} sm:col-span-2`}>
                หมายเหตุ
                <input value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={200} className={inputClasses} />
              </label>
            </div>

            <label className="flex items-start gap-2 rounded-lg bg-zinc-50 p-3 text-xs text-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-300">
              <input type="checkbox" checked={applyToAll} onChange={(e) => setApplyToAll(e.target.checked)} className="mt-0.5" />
              <span>
                <span className="block font-medium">ใช้ข้อมูลชุดนี้กับทุกคน</span>
                <span className="block text-zinc-400">นำข้อมูลการจ้างงานแบบนี้ไปใช้กับบุคคลที่เลือกทั้งหมด {totalCount} คน</span>
              </span>
            </label>

            <div>
              <p className="mb-2 text-sm font-medium text-zinc-900 dark:text-zinc-50">รายการบุคคลที่นำเข้า ({totalCount} คน)</p>
              <div className="overflow-x-auto rounded-xl border border-zinc-100 dark:border-zinc-800">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 text-xs text-zinc-400 dark:border-zinc-800">
                      <th className="px-4 py-2 font-medium">ลำดับ</th>
                      <th className="px-4 py-2 font-medium">ชื่อ-นามสกุล</th>
                      <th className="px-4 py-2 font-medium">อีเมล</th>
                      <th className="px-4 py-2 font-medium">ตำแหน่งงาน</th>
                      <th className="px-4 py-2 font-medium">สถานที่ทำงาน</th>
                      <th className="px-4 py-2 font-medium">วันที่เริ่มงาน</th>
                      <th className="px-4 py-2 font-medium">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedPeople.map((person, i) => {
                      const index = (tablePage - 1) * ROWS_PER_PAGE + i + 1;
                      const configured = applyToAll && position.trim().length > 0;
                      return (
                        <tr key={person.email} className="border-b border-zinc-50 last:border-0 dark:border-zinc-800/60">
                          <td className="px-4 py-2 text-zinc-400">{index}</td>
                          <td className="px-4 py-2 font-medium text-zinc-900 dark:text-zinc-50">{person.name}</td>
                          <td className="px-4 py-2 text-zinc-500 dark:text-zinc-400">{person.email}</td>
                          <td className="px-4 py-2 text-zinc-600 dark:text-zinc-300">{position || "-"}</td>
                          <td className="px-4 py-2 text-zinc-600 dark:text-zinc-300">{workLocation}</td>
                          <td className="px-4 py-2 text-zinc-600 dark:text-zinc-300">{startDate ? formatThaiDate(startDate) : "-"}</td>
                          <td className="px-4 py-2">
                            {configured ? (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                <CheckIcon className="h-3.5 w-3.5" />
                                กำหนดแล้ว
                              </span>
                            ) : (
                              <span className="text-xs font-medium text-amber-600 dark:text-amber-400">รอกำหนด</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {pageCount > 1 && (
                <div className="mt-2 flex items-center justify-between text-xs text-zinc-400">
                  <span>
                    แสดง {pagedPeople.length} จาก {totalCount} รายการ
                  </span>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setTablePage(p)}
                        className={`h-6 w-6 rounded-md text-xs font-medium ${
                          p === tablePage
                            ? "bg-indigo-600 text-white"
                            : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">สรุปการนำเข้า</h3>
              <div className="grid grid-cols-3 divide-x divide-zinc-100 text-center dark:divide-zinc-800">
                <div>
                  <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{totalCount}</p>
                  <p className="text-[11px] text-zinc-400">ทั้งหมด</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">0</p>
                  <p className="text-[11px] text-zinc-400">เพิ่มใหม่</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">0</p>
                  <p className="text-[11px] text-zinc-400">อัปเดต</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">ข้อมูลการจ้างงานที่จะกำหนด</h3>
              <ul className="flex flex-col divide-y divide-zinc-100 text-xs dark:divide-zinc-800">
                {[
                  ["หน่วยงาน", unitId ? unitLabel(unitId, units ?? {}) : "-"],
                  ["ทีม (Team)", team || "-"],
                  ["ตำแหน่งงาน", position || "-"],
                  ["ประเภทการจ้างงาน", employmentType],
                  ["ลักษณะการทำงาน", workArrangement],
                  ["สถานที่ทำงานหลัก", workLocation],
                  ["วันที่เริ่มงาน", startDate ? formatThaiDate(startDate) : "-"],
                  ["วันที่สิ้นสุดสัญญา", endDate ? formatThaiDate(endDate) : "-"],
                  ["ระยะเวลาการจ้าง", duration],
                  ["วงเงินสัญญา", contractValue ? `${contractValue} บาท/ปี` : "-"],
                ].map(([label, value]) => (
                  <li key={label} className="flex items-center justify-between py-1.5">
                    <span className="text-zinc-400">{label}</span>
                    <span className="truncate text-right font-medium text-zinc-900 dark:text-zinc-50">{value}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5 text-xs text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300">
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                <InfoIcon className="h-4 w-4" />
                คำแนะนำ
              </h3>
              <ul className="list-inside list-disc space-y-1">
                <li>สามารถแก้ไขรายละเอียดรายบุคคลได้ในขั้นตอนถัดไป</li>
                <li>กรุณาตรวจสอบวันที่และวงเงินสัญญาให้ถูกต้อง</li>
                <li>เมื่อสร้างเสร็จแล้ว จะเข้าสู่สถานะ Pre-boarding</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {stepIndex === 2 && !confirmed && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="flex flex-col gap-4 lg:col-span-2">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="mb-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">3. ตรวจสอบและยืนยันการเพิ่ม</h2>
              <p className="mb-4 text-xs text-zinc-400">ตรวจสอบข้อมูลทั้งหมด {totalCount} รายการก่อนสร้างบุคคลและส่งคำเชิญ Onboarding</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/50">
                  <UsersIcon className="mb-1 h-4 w-4 text-indigo-500" />
                  <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{totalCount} คน</p>
                  <p className="text-[11px] text-zinc-400">จำนวนทั้งหมด</p>
                </div>
                <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/50">
                  <CheckCircleIcon className="mb-1 h-4 w-4 text-indigo-500" />
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">สร้างบุคคลและส่งคำเชิญ</p>
                  <p className="text-[11px] text-zinc-400">การดำเนินการ</p>
                </div>
                <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/50">
                  <EnvelopeIcon className="mb-1 h-4 w-4 text-indigo-500" />
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">อีเมล</p>
                  <p className="text-[11px] text-zinc-400">ช่องทางการเชิญ</p>
                </div>
                <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/50">
                  <InfoIcon className="mb-1 h-4 w-4 text-indigo-500" />
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{startDate ? formatThaiDate(startDate) : "-"}</p>
                  <p className="text-[11px] text-zinc-400">วันที่เริ่มงาน</p>
                </div>
              </div>
            </div>

            <details className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <summary className="cursor-pointer text-sm font-semibold text-zinc-900 dark:text-zinc-50">สรุปข้อมูลการจ้างงาน</summary>
              <ul className="mt-3 flex flex-col divide-y divide-zinc-100 text-xs dark:divide-zinc-800">
                {[
                  ["หน่วยงาน", unitId ? unitLabel(unitId, units ?? {}) : "-"],
                  ["ตำแหน่งงาน", position || "-"],
                  ["ประเภทการจ้างงาน", employmentType],
                  ["สถานที่ทำงานหลัก", workLocation],
                  ["ระยะเวลาการจ้าง", duration],
                ].map(([label, value]) => (
                  <li key={label} className="flex items-center justify-between py-1.5">
                    <span className="text-zinc-400">{label}</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-50">{value}</span>
                  </li>
                ))}
              </ul>
            </details>

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <p className="mb-2 text-sm font-medium text-zinc-900 dark:text-zinc-50">รายการบุคลากรที่จะเพิ่ม ({totalCount} คน)</p>
              <div className="overflow-x-auto rounded-xl border border-zinc-100 dark:border-zinc-800">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 text-xs text-zinc-400 dark:border-zinc-800">
                      <th className="px-4 py-2 font-medium">ลำดับ</th>
                      <th className="px-4 py-2 font-medium">ชื่อ-นามสกุล</th>
                      <th className="px-4 py-2 font-medium">อีเมล</th>
                      <th className="px-4 py-2 font-medium">ตำแหน่งงาน</th>
                      <th className="px-4 py-2 font-medium">หน่วยงาน</th>
                      <th className="px-4 py-2 font-medium">สถานที่ทำงาน</th>
                      <th className="px-4 py-2 font-medium">วันที่เริ่มงาน</th>
                      <th className="px-4 py-2 font-medium">การเชิญ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {people.map((person, i) => (
                      <tr key={person.email} className="border-b border-zinc-50 last:border-0 dark:border-zinc-800/60">
                        <td className="px-4 py-2 text-zinc-400">{i + 1}</td>
                        <td className="px-4 py-2 font-medium text-zinc-900 dark:text-zinc-50">{person.name}</td>
                        <td className="px-4 py-2 text-zinc-500 dark:text-zinc-400">{person.email}</td>
                        <td className="px-4 py-2 text-zinc-600 dark:text-zinc-300">{position || "-"}</td>
                        <td className="px-4 py-2 text-zinc-600 dark:text-zinc-300">{unitId ? unitLabel(unitId, units ?? {}) : "-"}</td>
                        <td className="px-4 py-2 text-zinc-600 dark:text-zinc-300">{workLocation}</td>
                        <td className="px-4 py-2 text-zinc-600 dark:text-zinc-300">{startDate ? formatThaiDate(startDate) : "-"}</td>
                        <td className="px-4 py-2">
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            <CheckIcon className="h-3.5 w-3.5" />
                            อีเมล
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <p className="flex items-start gap-2 rounded-lg bg-indigo-50/60 p-3 text-xs text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
              <InfoIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              หลังจากยืนยัน ระบบจะสร้างบุคคล และส่งคำเชิญ Onboarding ให้กับบุคคลทั้งหมดผ่านอีเมล
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">สรุปการดำเนินการ</h3>
              <div className="flex flex-col items-center gap-1 py-2 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400">
                  <UsersIcon className="h-6 w-6" />
                </span>
                <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-50">กำลังจะดำเนินการ</p>
                <p className="text-xs text-zinc-400">สร้างบุคคล {totalCount} คน และส่งคำเชิญ Onboarding</p>
              </div>
              <div className="grid grid-cols-3 divide-x divide-zinc-100 text-center dark:divide-zinc-800">
                <div>
                  <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{totalCount}</p>
                  <p className="text-[11px] text-zinc-400">ทั้งหมด</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">0</p>
                  <p className="text-[11px] text-zinc-400">เพิ่มใหม่</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">0</p>
                  <p className="text-[11px] text-zinc-400">อัปเดต</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">การตั้งค่าการเชิญ</h3>
              <ul className="flex flex-col divide-y divide-zinc-100 text-xs dark:divide-zinc-800">
                {[
                  ["ช่องทางการเชิญ", "อีเมล"],
                  ["วันที่เริ่มงาน", startDate ? formatThaiDate(startDate) : "-"],
                  ["ระยะเวลา Onboarding", duration],
                  ["บทบาทเริ่มต้น", employmentType],
                ].map(([label, value]) => (
                  <li key={label} className="flex items-center justify-between py-1.5">
                    <span className="text-zinc-400">{label}</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-50">{value}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5 text-xs text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300">
              <h3 className="mb-2 text-sm font-semibold">หมายเหตุ</h3>
              <ul className="list-inside list-disc space-y-1">
                <li>บุคคลจะได้รับอีเมลพร้อมลิงก์สำหรับยืนยันเข้าใช้งาน</li>
                <li>เมื่อยืนยันแล้ว สถานะจะเปลี่ยนเป็น &quot;รอการยืนยัน&quot;</li>
                <li>สามารถติดตามสถานะได้ที่หน้า &quot;เข้าใหม่&quot;</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {stepIndex === 2 && confirmed && (() => {
        const results = submitResults ?? [];
        const failedResults = results.filter((r) => r.outcome === "failed");
        const successCount = results.length - failedResults.length;
        return (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <CheckCircleIcon className="h-9 w-9 text-emerald-500" />
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              สร้างสำเร็จ {successCount} จาก {results.length} คน
            </p>
            <p className="max-w-sm text-xs text-zinc-400">
              แต่ละคนจะได้รับอีเมลพร้อมลิงก์ยืนยันเข้าใช้งาน สามารถติดตามสถานะได้ที่หน้า &quot;เข้าใหม่&quot;
            </p>
            {failedResults.length > 0 && (
              <div className="w-full max-w-md rounded-xl border border-red-100 bg-red-50/60 p-3 text-left text-xs text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
                <p className="mb-1 font-semibold">{failedResults.length} รายการล้มเหลว:</p>
                <ul className="list-inside list-disc space-y-0.5">
                  {failedResults.map((r) => (
                    <li key={r.row.email}>
                      {r.name} ({r.row.email}) — {r.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-1 flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setStepIndex(0);
                  setFileName(null);
                  setFileText(null);
                  setRows([]);
                  setParseErrors([]);
                  setSubmitResults(null);
                  setConfirmed(false);
                  setTablePage(1);
                  setErrors({});
                }}
              >
                นำเข้าไฟล์ถัดไป
              </Button>
              <Link href="/people/new-hires" className={buttonClasses("primary")}>
                ไปที่หน้าเข้าใหม่
              </Link>
            </div>
          </div>
        );
      })()}

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
