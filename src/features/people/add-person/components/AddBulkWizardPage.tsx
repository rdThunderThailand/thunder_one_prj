"use client";

import Link from "next/link";
import { useMemo, useState, type ChangeEvent, type DragEvent } from "react";
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
import { formatThaiDate } from "@/lib/thai-date";
import { personnelRows } from "@/features/people/personnel";
import type { OrgUnitNode } from "@/features/people/org-structure";

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

// The mockup's own example rows (step 2/3's table) — this flow never
// actually parses the uploaded file (see this component's header comment),
// so any selected file just populates this fixed list.
const BULK_MOCK_PEOPLE = [
  { name: "สมชาย วงศ์ดี", email: "somchai.w@thunderone.co.th" },
  { name: "วรรณา ใจดี", email: "wanna.j@thunderone.co.th" },
  { name: "กานต์พงศ์ ศรีสุข", email: "kanp.s@thunderone.co.th" },
  { name: "นภัสสร มากมี", email: "naphat.m@thunderone.co.th" },
  { name: "ปริญญา คำดี", email: "parinya.k@thunderone.co.th" },
  { name: "จิรทรรศน์ ทองคำ", email: "jirapat.t@thunderone.co.th" },
  { name: "ณัฐชนา ระวี", email: "nutchana.r@thunderone.co.th" },
  { name: "กิตติพงษ์ พลจันทร์", email: "kittipong.p@thunderone.co.th" },
];

const ROWS_PER_PAGE = 5;

const inputClasses =
  "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";
const labelClasses = "flex flex-col gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400";

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
  /** Real org units, for the หน่วยงาน dropdown's options only — cosmetic,
   *  same as every other field on this page (see header comment: this flow
   *  never calls Core). `null`/`{}` just means an empty dropdown. */
  units: Record<string, OrgUnitNode> | null;
}

// "เพิ่มหลายคนเข้าองค์กร (Bulk)" — full-page 3-step flow, built 2026-09-01
// once its own FigJam screens were provided. Reached from people/add's Bulk
// card (previously inert).
//
// Deliberately **fully mock/demo**, by explicit product decision (not an
// oversight) — unlike Employee/Contractor, this is the first people/*
// intake flow capable of creating many records from a single click, and
// this app has no CSV/Excel parsing dependency today. Rather than add one
// just to parse a file whose rows would then fire N real
// `POST /tenants/:id/members` invites at fake placeholder emails on every
// demo run, both halves stay simulated:
// - The file picker is real (drag-and-drop or click, shows the chosen
//   filename) but never reads the file's contents — selecting ANY file just
//   populates BULK_MOCK_PEOPLE (the mockup's own 8 example rows) below.
// - "ยืนยันและส่งคำเชิญ" never calls Core — it shows a local success state
//   only. Unlike AddEmployeeWizardPage/AddContractorWizardPage, nothing
//   here is stashed via the NEW_HIRE_HANDOFF_KEY sessionStorage handoff —
//   doing so would prepend fabricated rows into people/new-hires's roster
//   that don't correspond to any real Core record, unlike a genuine
//   Employee/Contractor creation.
// If real bulk creation is wanted later, both halves need real
// implementations together — parsing a real file into rows that don't
// actually get created would be a worse, more confusing half-measure than
// today's fully-simulated version.
export function AddBulkWizardPage({ units }: AddBulkWizardPageProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [tablePage, setTablePage] = useState(1);

  // Step 1 — file + import options. All decorative (see header comment).
  const [fileName, setFileName] = useState<string | null>(null);
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
  const [managerName, setManagerName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [duration, setDuration] = useState(DURATION_OPTIONS[2]);
  const [contractValue, setContractValue] = useState("");
  const [notes, setNotes] = useState("");
  const [applyToAll, setApplyToAll] = useState(true);

  const [confirmed, setConfirmed] = useState(false);

  const unitOptions = Object.values(units ?? {}).sort((a, b) => a.name.localeCompare(b.name));
  const people = useMemo(() => (fileName ? BULK_MOCK_PEOPLE : []), [fileName]);
  const totalCount = people.length;

  const pageCount = Math.max(1, Math.ceil(people.length / ROWS_PER_PAGE));
  const pagedPeople = useMemo(
    () => people.slice((tablePage - 1) * ROWS_PER_PAGE, tablePage * ROWS_PER_PAGE),
    [people, tablePage]
  );

  const canProceedStep0 = fileName !== null;
  const canProceedStep1 =
    unitId.trim().length > 0 && position.trim().length > 0 && managerName.trim().length > 0 && startDate.trim().length > 0;

  function handleFile(file: File | null) {
    if (!file) return;
    setFileName(file.name);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0] ?? null);
  }

  function handleFileInput(e: ChangeEvent<HTMLInputElement>) {
    handleFile(e.target.files?.[0] ?? null);
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
                  <span className="text-xs text-zinc-400">รองรับไฟล์ Excel (.xlsx) หรือ CSV (.csv)</span>
                  <span className="text-xs text-zinc-400">ขนาดไฟล์ไม่เกิน 10MB</span>
                  <input type="file" accept=".xlsx,.csv" className="hidden" onChange={handleFileInput} />
                </label>
                {fileName && (
                  <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                    <CheckIcon className="h-3.5 w-3.5" />
                    {fileName}
                  </span>
                )}
                <span title="ยังไม่เปิดใช้งาน" className="mt-1 cursor-not-allowed text-xs text-indigo-400">
                  ↓ ดาวน์โหลดไฟล์ตัวอย่าง (Template)
                </span>
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
                  <input type="checkbox" checked={skipFirstRow} onChange={(e) => setSkipFirstRow(e.target.checked)} />
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
              <span title="ยังไม่เปิดใช้งาน" className="flex cursor-not-allowed items-center gap-1.5 text-xs font-medium text-indigo-400">
                <UploadIcon className="h-3.5 w-3.5 rotate-180" />
                ดาวน์โหลดตัวอย่างไฟล์
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
                  <span className="flex cursor-not-allowed items-center rounded-lg border border-dashed border-zinc-200 px-3 py-2 text-sm text-zinc-400 dark:border-zinc-700">
                    ไม่พบข้อมูลหน่วยงาน
                  </span>
                )}
              </label>
              <label className={labelClasses}>
                ทีม (Team)
                <input value={team} onChange={(e) => setTeam(e.target.value)} className={inputClasses} />
              </label>
              <label className={labelClasses}>
                ตำแหน่งงาน
                <input
                  required
                  list="bulk-position-options"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="พิมพ์เพื่อค้นหา หรือระบุตำแหน่งใหม่"
                  className={inputClasses}
                />
                <datalist id="bulk-position-options">
                  {POSITION_OPTIONS.map((option) => (
                    <option key={option} value={option} />
                  ))}
                </datalist>
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
              <label className={labelClasses}>
                ผู้บังคับบัญชา (Reporting To)
                <select value={managerName} onChange={(e) => setManagerName(e.target.value)} className={inputClasses}>
                  <option value="">เลือกผู้บังคับบัญชา</option>
                  {MANAGER_OPTIONS.map((manager) => (
                    <option key={manager.name} value={manager.name}>
                      {manager.name} — {manager.role}
                    </option>
                  ))}
                </select>
              </label>
              <label className={labelClasses}>
                วันที่เริ่มงาน
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClasses} />
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
                  ["ผู้บังคับบัญชา", managerName || "-"],
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

      {stepIndex === 2 && confirmed && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <CheckCircleIcon className="h-9 w-9 text-emerald-500" />
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            สร้างบุคคล {totalCount} คน และส่งคำเชิญ Onboarding เรียบร้อยแล้ว
          </p>
          <p className="max-w-sm text-xs text-zinc-400">
            แต่ละคนจะได้รับอีเมลพร้อมลิงก์ยืนยันเข้าใช้งาน สามารถติดตามสถานะได้ที่หน้า &quot;เข้าใหม่&quot;
          </p>
          <div className="mt-1 flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setStepIndex(0);
                setFileName(null);
                setConfirmed(false);
                setTablePage(1);
              }}
            >
              นำเข้าไฟล์ถัดไป
            </Button>
            <Link href="/people/new-hires" className={buttonClasses("primary")}>
              ไปที่หน้าเข้าใหม่
            </Link>
          </div>
        </div>
      )}

      {!confirmed && (
        <div className="flex justify-end gap-2">
          {stepIndex > 0 && (
            <Button variant="secondary" onClick={() => setStepIndex((i) => Math.max(i - 1, 0))}>
              ย้อนกลับ
            </Button>
          )}
          {stepIndex < 2 ? (
            <Button
              variant="primary"
              onClick={() => setStepIndex((i) => Math.min(i + 1, 2))}
              disabled={stepIndex === 0 ? !canProceedStep0 : !canProceedStep1}
            >
              {stepIndex === 0 ? "ถัดไป: รายละเอียดการจ้างงาน" : "ถัดไป: ตรวจสอบและเพิ่ม"}
            </Button>
          ) : (
            <>
              <span title="ยังไม่เปิดใช้งาน" className="flex cursor-not-allowed items-center rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                บันทึกร่าง
              </span>
              <div className="flex flex-col items-end gap-1">
                <Button variant="primary" onClick={() => setConfirmed(true)}>
                  ยืนยันและส่งคำเชิญ
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
