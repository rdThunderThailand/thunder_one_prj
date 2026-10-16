import type { ChangeEvent, DragEvent } from "react";
import { CheckIcon, EnvelopeIcon, InfoIcon, PhoneIcon, UploadIcon, UsersIcon } from "@/components/ui/icons";
import { ErrorText } from "../form-field";
import type { BulkCsvRowError } from "../bulk-csv";

const REQUIRED_COLUMNS = [
  { en: "first_name*", th: "ชื่อ (ภาษาไทย)", example: "สมชาย", required: true },
  { en: "last_name*", th: "นามสกุล (ภาษาไทย)", example: "วงศ์ดี", required: true },
  { en: "email*", th: "อีเมล (สำหรับการเข้าสู่ระบบ)", example: "somchai.wongdee@thunderone.co.th", required: true },
  { en: "mobile*", th: "เบอร์โทรศัพท์มือถือ", example: "081-234-5678", required: true },
  { en: "date_of_birth", th: "วันเกิด (ค.ศ.)", example: "1990-01-15", required: false },
  { en: "id_card", th: "เลขบัตรประชาชน", example: "1-2345-67890-12-3", required: false },
];

interface AddBulkStep1UploadProps {
  fileName: string | null;
  parsing: boolean;
  dragOver: boolean;
  onDragOver: (e: DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
  onDrop: (e: DragEvent<HTMLDivElement>) => void;
  onFileInput: (e: ChangeEvent<HTMLInputElement>) => void;
  fileNameError?: string;
  parseErrors: BulkCsvRowError[];
  importMode: "new" | "update" | "mix";
  onImportModeChange: (mode: "new" | "update" | "mix") => void;
  skipFirstRow: boolean;
  onSkipFirstRowChange: (checked: boolean) => void;
  totalCount: number;
}

/** Step 1 of AddBulkWizardPage — presentational only, same convention as
 *  the other wizards' step components. Extracted 2026-09-17 (readability
 *  audit), no behavior change. */
export function AddBulkStep1Upload({
  fileName,
  parsing,
  dragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileInput,
  fileNameError,
  parseErrors,
  importMode,
  onImportModeChange,
  skipFirstRow,
  onSkipFirstRowChange,
  totalCount,
}: AddBulkStep1UploadProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm lg:col-span-2">
        <h2 className="text-sm font-semibold text-foreground">1. ข้อมูลพื้นฐาน</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
              dragOver ? "border-primary bg-accent/50" : "border-border"
            }`}
          >
            <label className="flex cursor-pointer flex-col items-center gap-2">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-primary">
                <UploadIcon className="h-5 w-5" />
              </span>
              <span className="text-sm text-muted-foreground">
                ลากไฟล์มาวางที่นี่ หรือ <span className="font-medium text-primary">คลิกเพื่อเลือกไฟล์</span>
              </span>
              <span className="text-xs text-t1-gray-400">รองรับไฟล์ CSV (.csv) เท่านั้นในขณะนี้</span>
              <span className="text-xs text-t1-gray-400">ขนาดไฟล์ไม่เกิน 10MB</span>
              <input type="file" accept=".csv" className="hidden" onChange={onFileInput} />
            </label>
            {parsing && <span className="mt-2 text-xs text-t1-gray-400">กำลังอ่านไฟล์...</span>}
            {fileName && !parsing && (
              <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-success-muted px-2.5 py-1 text-xs font-medium text-t1-green-700">
                <CheckIcon className="h-3.5 w-3.5" />
                {fileName}
              </span>
            )}
            <ErrorText message={fileNameError} />
            {parseErrors.length > 0 && (
              <div className="mt-2 w-full max-w-sm rounded-lg border border-border bg-warning-muted/60 p-2.5 text-left text-xs text-t1-amber-700">
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
              className="mt-1 text-xs font-medium text-primary hover:text-primary"
            >
              ↓ ดาวน์โหลดไฟล์ตัวอย่าง (Template)
            </a>
          </div>

          <div className="rounded-xl border border-border p-4">
            <p className="mb-3 text-xs font-semibold text-t1-gray-400">ตัวเลือกการนำเข้า</p>
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
                    onChange={() => onImportModeChange(option.id)}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="block font-medium text-foreground">{option.label}</span>
                    <span className="block text-xs text-t1-gray-400">{option.sub}</span>
                  </span>
                </label>
              ))}
            </div>
            <label className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <input type="checkbox" checked={skipFirstRow} onChange={(e) => onSkipFirstRowChange(e.target.checked)} />
              ข้ามแถวแรก (ใช้เป็นหัวตาราง)
            </label>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-foreground">
            คอลัมน์ที่จำเป็นในไฟล์ <span className="text-error">*</span> จำเป็นต้องมีทุกคอลัมน์
          </p>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-t1-gray-400">
                  <th className="px-4 py-2 font-medium">คอลัมน์ (ชื่อภาษาอังกฤษ)</th>
                  <th className="px-4 py-2 font-medium">คอลัมน์ (ชื่อภาษาไทย)</th>
                  <th className="px-4 py-2 font-medium">ตัวอย่างข้อมูล</th>
                  <th className="px-4 py-2 font-medium">จำเป็น</th>
                </tr>
              </thead>
              <tbody>
                {REQUIRED_COLUMNS.map((col) => (
                  <tr key={col.en} className="border-b border-border last:border-0">
                    <td className="px-4 py-2 font-mono text-xs text-foreground">{col.en}</td>
                    <td className="px-4 py-2 text-muted-foreground">{col.th}</td>
                    <td className="px-4 py-2 text-t1-gray-400">{col.example}</td>
                    <td className="px-4 py-2">
                      {col.required ? <CheckIcon className="h-4 w-4 text-success" /> : <span className="text-t1-gray-400">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-t1-gray-400">
            <InfoIcon className="h-3.5 w-3.5" />
            คุณสามารถเพิ่มคอลัมน์อื่นๆ ได้ในขั้นตอนถัดไป
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-foreground">สรุปการนำเข้า</h3>
          <div className="flex flex-col items-center gap-1 py-3 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-primary">
              <UsersIcon className="h-6 w-6" />
            </span>
            <p className="mt-1 text-sm font-medium text-foreground">
              {fileName ? "อัปโหลดไฟล์สำเร็จ" : "ยังไม่มีไฟล์ถูกอัปโหลด"}
            </p>
            <p className="text-xs text-t1-gray-400">
              {fileName ? `พบข้อมูลทั้งหมด ${totalCount} รายการ` : "อัปโหลดไฟล์เพื่อดูสรุปจำนวนข้อมูล"}
            </p>
          </div>
          <div className="grid grid-cols-3 divide-x divide-border text-center">
            <div>
              <p className="text-lg font-semibold text-foreground">{totalCount}</p>
              <p className="text-[11px] text-t1-gray-400">ทั้งหมด</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">0</p>
              <p className="text-[11px] text-t1-gray-400">เพิ่มใหม่</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">0</p>
              <p className="text-[11px] text-t1-gray-400">อัปเดต</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-primary bg-accent/50 p-5 text-xs text-accent-foreground">
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
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-2 text-sm font-semibold text-foreground">ติดปัญหา?</h3>
          <p className="mb-3 text-xs text-muted-foreground">ติดต่อทีม HR Support</p>
          <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
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
            className="mt-3 flex cursor-not-allowed items-center justify-center rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground"
          >
            คู่มือการใช้งาน
          </span>
        </div>
      </div>
    </div>
  );
}
