import { InfoIcon } from "@/components/ui/icons";
import { formatDaysUntilThai, formatThaiDate } from "@/lib/thai-date";
import type { CoreRole } from "@/features/people/personnel";
import type { OrgUnitNode } from "@/features/people/org-structure";
import { ErrorText, fieldClasses, inputClasses, labelClasses } from "../form-field";
import { requiredMark, SummaryRow } from "../wizard-parts";
import { EMPLOYMENT_TYPE_OPTIONS, SALARY_BAND_OPTIONS, WORK_LOCATION_OPTIONS, unitLabel } from "../wizard-shared";

const referenceOnlyNote = (
  <span className="text-[11px] font-normal text-zinc-400">ข้อมูลอ้างอิง ยังไม่บันทึกในระบบ</span>
);

interface AddEmployeeStep2EmploymentProps {
  employmentType: string;
  onEmploymentTypeChange: (value: string) => void;
  employeeCode: string;
  onEmployeeCodeChange: (value: string) => void;
  positionCode: string;
  onPositionCodeChange: (value: string) => void;
  levelRole: string;
  onLevelRoleChange: (value: string) => void;
  jobType: string;
  onJobTypeChange: (value: string) => void;
  workArrangement: string;
  onWorkArrangementChange: (value: string) => void;
  startDate: string;
  onStartDateChange: (value: string) => void;
  probationEndDate: string;
  onProbationEndDateChange: (value: string) => void;
  probationDuration: string;
  onProbationDurationChange: (value: string) => void;
  position: string;
  onPositionChange: (value: string) => void;
  positionOptions: string[];
  unitId: string;
  onUnitIdChange: (value: string) => void;
  units: Record<string, OrgUnitNode> | null;
  unitOptions: OrgUnitNode[];
  team: string;
  onTeamChange: (value: string) => void;
  roleCode: string;
  onRoleCodeChange: (value: string) => void;
  roles: CoreRole[] | null;
  workLocation: string;
  onWorkLocationChange: (value: string) => void;
  subLocation: string;
  onSubLocationChange: (value: string) => void;
  contractType: string;
  onContractTypeChange: (value: string) => void;
  grade: string;
  onGradeChange: (value: string) => void;
  salaryBand: string;
  onSalaryBandChange: (value: string) => void;
  startingSalary: string;
  onStartingSalaryChange: (value: string) => void;
  notes: string;
  onNotesChange: (value: string) => void;
  errors: Record<string, string>;
  // Summary sidebar only — read-only echoes of step 1's values.
  titlePrefix: string;
  fullName: string;
  idCardNumber: string;
  email: string;
}

/** Step 2 of AddEmployeeWizardPage — presentational only, same convention as
 *  AddEmployeeStep1Personal. Extracted 2026-09-17 (readability audit), no
 *  behavior change. */
export function AddEmployeeStep2Employment({
  employmentType,
  onEmploymentTypeChange,
  employeeCode,
  onEmployeeCodeChange,
  positionCode,
  onPositionCodeChange,
  levelRole,
  onLevelRoleChange,
  jobType,
  onJobTypeChange,
  workArrangement,
  onWorkArrangementChange,
  startDate,
  onStartDateChange,
  probationEndDate,
  onProbationEndDateChange,
  probationDuration,
  onProbationDurationChange,
  position,
  onPositionChange,
  positionOptions,
  unitId,
  onUnitIdChange,
  units,
  unitOptions,
  team,
  onTeamChange,
  roleCode,
  onRoleCodeChange,
  roles,
  workLocation,
  onWorkLocationChange,
  subLocation,
  onSubLocationChange,
  contractType,
  onContractTypeChange,
  grade,
  onGradeChange,
  salaryBand,
  onSalaryBandChange,
  startingSalary,
  onStartingSalaryChange,
  notes,
  onNotesChange,
  errors,
  titlePrefix,
  fullName,
  idCardNumber,
  email,
}: AddEmployeeStep2EmploymentProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="flex flex-col gap-5 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm lg:col-span-2 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">2. ข้อมูลการจ้างงานและตำแหน่ง</h2>

        <div>
          <p className="mb-2 text-xs font-semibold text-zinc-400">ข้อมูลการจ้างงาน</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className={labelClasses}>
              ประเภทการจ้างงาน
              <select value={employmentType} onChange={(e) => onEmploymentTypeChange(e.target.value)} className={inputClasses}>
                {EMPLOYMENT_TYPE_OPTIONS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
            <label className={labelClasses}>
              รหัสพนักงาน (Employee ID)
              <input
                value={employeeCode}
                onChange={(e) => onEmployeeCodeChange(e.target.value)}
                placeholder="เช่น EMP-0001"
                className={inputClasses}
              />
              <span className="text-[11px] font-normal text-zinc-400">เว้นว่างได้หากยังไม่มีรหัสพนักงาน</span>
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
              ประเภทงาน (Job Type)
              <select value={jobType} onChange={(e) => onJobTypeChange(e.target.value)} className={inputClasses}>
                <option>Full-time</option>
                <option>Part-time</option>
              </select>
            </label>
            <label className={labelClasses}>
              รูปแบบการทำงาน (Work Arrangement)
              <select value={workArrangement} onChange={(e) => onWorkArrangementChange(e.target.value)} className={inputClasses}>
                <option>On-site</option>
                <option>Hybrid</option>
                <option>Remote</option>
              </select>
            </label>
            <label className={labelClasses}>
              <span>วันที่เริ่มงาน {requiredMark}</span>
              <input
                required
                type="date"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                className={fieldClasses(!!errors.startDate)}
              />
              {startDate && (
                <span className="text-[11px] font-normal text-zinc-400">
                  {formatThaiDate(startDate)} ({formatDaysUntilThai(startDate)})
                </span>
              )}
              <ErrorText message={errors.startDate} />
            </label>
            <label className={labelClasses}>
              วันสิ้นสุดทดลองงาน (คาดการณ์)
              <input
                type="date"
                value={probationEndDate}
                onChange={(e) => onProbationEndDateChange(e.target.value)}
                className={inputClasses}
              />
            </label>
            <label className={labelClasses}>
              ระยะเวลาทดลองงาน
              <input value={probationDuration} onChange={(e) => onProbationDurationChange(e.target.value)} className={inputClasses} />
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
                onChange={(e) => onPositionChange(e.target.value)}
                placeholder="พิมพ์เพื่อค้นหา หรือระบุตำแหน่งใหม่"
                className={fieldClasses(!!errors.position)}
              />
              <datalist id="position-options">
                {positionOptions.map((option) => (
                  <option key={option} value={option} />
                ))}
              </datalist>
              <ErrorText message={errors.position} />
            </label>
            <label className={labelClasses}>
              หน่วยงาน
              {unitOptions.length > 0 ? (
                <select value={unitId} onChange={(e) => onUnitIdChange(e.target.value)} className={inputClasses}>
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
              <input value={team} onChange={(e) => onTeamChange(e.target.value)} className={inputClasses} />
              {referenceOnlyNote}
            </label>
            <label className={labelClasses}>
              <span>บทบาท / สิทธิ์การเข้าถึง (Role) {requiredMark}</span>
              {roles && roles.length > 0 ? (
                <select required value={roleCode} onChange={(e) => onRoleCodeChange(e.target.value)} className={inputClasses}>
                  {!roleCode && (
                    <option value="" disabled>
                      -- เลือกบทบาท --
                    </option>
                  )}
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
            {/* ผู้บังคับบัญชา (Reporting To / รอง) removed — was backed by
                a mock personnel roster, not real tenant members, and
                Core has no manager_id/reports_to column to wire it to
                anyway (see docs/people/add-contractor-and-bulk-field-
                requirements.md). Showing it invited HR to pick a fake
                "real" manager. */}
            <label className={labelClasses}>
              สถานที่ทำงาน
              <select value={workLocation} onChange={(e) => onWorkLocationChange(e.target.value)} className={inputClasses}>
                {WORK_LOCATION_OPTIONS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
            <label className={labelClasses}>
              สถานที่ทำงานย่อย / พื้นที่
              <input value={subLocation} onChange={(e) => onSubLocationChange(e.target.value)} className={inputClasses} />
              {referenceOnlyNote}
            </label>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold text-zinc-400">ข้อมูลการจ้างงานเพิ่มเติม</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className={labelClasses}>
              ประเภทสัญญาจ้าง
              <select value={contractType} onChange={(e) => onContractTypeChange(e.target.value)} className={inputClasses}>
                <option>สัญญาไม่มีกำหนด (Indefinite)</option>
                <option>สัญญาจ้าง 1 ปี</option>
              </select>
            </label>
            <label className={labelClasses}>
              ระดับ (Grade/Level)
              <input value={grade} onChange={(e) => onGradeChange(e.target.value)} className={inputClasses} />
            </label>
            <label className={labelClasses}>
              กลุ่มเงินเดือน (Salary Band)
              <select value={salaryBand} onChange={(e) => onSalaryBandChange(e.target.value)} className={inputClasses}>
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
                onChange={(e) => onStartingSalaryChange(e.target.value)}
                placeholder="บาท/เดือน"
                className={inputClasses}
              />
            </label>
          </div>
          <label className={`${labelClasses} mt-3`}>
            หมายเหตุ
            <textarea rows={2} maxLength={200} value={notes} onChange={(e) => onNotesChange(e.target.value)} className={inputClasses} />
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
  );
}
