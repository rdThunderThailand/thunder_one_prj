import { CheckIcon, UploadIcon } from "@/components/ui/icons";
import { formatThaiDate } from "@/lib/thai-date";
import type { OrgUnitNode } from "@/features/people/org-structure";
import { ErrorText, fieldClasses, inputClasses, labelClasses } from "../form-field";
import { requiredMark } from "../wizard-parts";
import { DURATION_OPTIONS, ROWS_PER_PAGE, WORK_LOCATION_OPTIONS, unitLabel } from "../wizard-shared";

interface BulkPerson {
  name: string;
  email: string;
}

interface AddBulkStep2EmploymentProps {
  totalCount: number;
  unitId: string;
  onUnitIdChange: (value: string) => void;
  units: Record<string, OrgUnitNode> | null;
  unitOptions: OrgUnitNode[];
  team: string;
  onTeamChange: (value: string) => void;
  position: string;
  onPositionChange: (value: string) => void;
  positionOptions: string[];
  positionCode: string;
  onPositionCodeChange: (value: string) => void;
  levelRole: string;
  onLevelRoleChange: (value: string) => void;
  employmentType: string;
  onEmploymentTypeChange: (value: string) => void;
  workLocation: string;
  onWorkLocationChange: (value: string) => void;
  workArrangement: string;
  onWorkArrangementChange: (value: string) => void;
  startDate: string;
  onStartDateChange: (value: string) => void;
  endDate: string;
  onEndDateChange: (value: string) => void;
  duration: string;
  onDurationChange: (value: string) => void;
  contractValue: string;
  onContractValueChange: (value: string) => void;
  notes: string;
  onNotesChange: (value: string) => void;
  applyToAll: boolean;
  onApplyToAllChange: (checked: boolean) => void;
  pagedPeople: BulkPerson[];
  tablePage: number;
  onTablePageChange: (page: number) => void;
  pageCount: number;
  errors: Record<string, string>;
}

/** Step 2 of AddBulkWizardPage — presentational only, same convention as
 *  the other wizards' step components. Extracted 2026-09-17 (readability
 *  audit), no behavior change. */
export function AddBulkStep2Employment({
  totalCount,
  unitId,
  onUnitIdChange,
  units,
  unitOptions,
  team,
  onTeamChange,
  position,
  onPositionChange,
  positionOptions,
  positionCode,
  onPositionCodeChange,
  levelRole,
  onLevelRoleChange,
  employmentType,
  onEmploymentTypeChange,
  workLocation,
  onWorkLocationChange,
  workArrangement,
  onWorkArrangementChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  duration,
  onDurationChange,
  contractValue,
  onContractValueChange,
  notes,
  onNotesChange,
  applyToAll,
  onApplyToAllChange,
  pagedPeople,
  tablePage,
  onTablePageChange,
  pageCount,
  errors,
}: AddBulkStep2EmploymentProps) {
  return (
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
              <select value={unitId} onChange={(e) => onUnitIdChange(e.target.value)} className={fieldClasses(!!errors.unitId)}>
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
            <input value={team} onChange={(e) => onTeamChange(e.target.value)} className={inputClasses} />
          </label>
          <label className={labelClasses}>
            <span>ตำแหน่งงาน {requiredMark}</span>
            <input
              required
              list="bulk-position-options"
              value={position}
              onChange={(e) => onPositionChange(e.target.value)}
              placeholder="พิมพ์เพื่อค้นหา หรือระบุตำแหน่งใหม่"
              className={fieldClasses(!!errors.position)}
            />
            <datalist id="bulk-position-options">
              {positionOptions.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
            <ErrorText message={errors.position} />
          </label>
          <label className={labelClasses}>
            รหัสตำแหน่ง (Position Code)
            <input
              value={positionCode}
              onChange={(e) => onPositionCodeChange(e.target.value)}
              placeholder="เช่น POS-CEO"
              className={inputClasses}
            />
          </label>
          <label className={labelClasses}>
            ระดับตำแหน่ง (Level)
            <input
              value={levelRole}
              onChange={(e) => onLevelRoleChange(e.target.value)}
              placeholder="เช่น Executive, Senior"
              className={inputClasses}
            />
          </label>
          <label className={labelClasses}>
            ประเภทการจ้างงาน
            <select value={employmentType} onChange={(e) => onEmploymentTypeChange(e.target.value)} className={inputClasses}>
              <option>พนักงานประจำ (Employee)</option>
              <option>ผู้รับเหมา (Contractor)</option>
            </select>
          </label>
          <label className={labelClasses}>
            สถานที่ทำงานหลัก
            <select value={workLocation} onChange={(e) => onWorkLocationChange(e.target.value)} className={inputClasses}>
              {WORK_LOCATION_OPTIONS.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
          <label className={labelClasses}>
            ลักษณะการทำงาน
            <select value={workArrangement} onChange={(e) => onWorkArrangementChange(e.target.value)} className={inputClasses}>
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
              onChange={(e) => onStartDateChange(e.target.value)}
              className={fieldClasses(!!errors.startDate)}
            />
            <ErrorText message={errors.startDate} />
          </label>
          <label className={labelClasses}>
            วันที่สิ้นสุดสัญญา (คาดการณ์)
            <input type="date" value={endDate} onChange={(e) => onEndDateChange(e.target.value)} className={inputClasses} />
          </label>
          <label className={labelClasses}>
            ระยะเวลาการจ้าง
            <select value={duration} onChange={(e) => onDurationChange(e.target.value)} className={inputClasses}>
              {DURATION_OPTIONS.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
          <label className={labelClasses}>
            วงเงินสัญญา (ต่อปี)
            <input
              inputMode="numeric"
              value={contractValue}
              onChange={(e) => onContractValueChange(e.target.value)}
              placeholder="บาท"
              className={inputClasses}
            />
          </label>
          <label className={`${labelClasses} sm:col-span-2`}>
            หมายเหตุ
            <input value={notes} onChange={(e) => onNotesChange(e.target.value)} maxLength={200} className={inputClasses} />
          </label>
        </div>

        <label className="flex items-start gap-2 rounded-lg bg-zinc-50 p-3 text-xs text-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-300">
          <input type="checkbox" checked={applyToAll} onChange={(e) => onApplyToAllChange(e.target.checked)} className="mt-0.5" />
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
                    onClick={() => onTablePageChange(p)}
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
      </div>
    </div>
  );
}
