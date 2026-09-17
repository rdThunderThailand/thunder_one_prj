import type { CoreRole } from "@/features/people/personnel";
import type { OrgUnitNode } from "@/features/people/org-structure";
import { ErrorText, fieldClasses, inputClasses, labelClasses } from "../form-field";
import { EditLink, requiredMark, SummaryRow } from "../wizard-parts";
import {
  DURATION_OPTIONS,
  PAYMENT_CYCLE_OPTIONS,
  PAYMENT_TYPE_OPTIONS,
  WORK_LOCATION_OPTIONS,
  unitLabel,
} from "../wizard-shared";
import { formatDaysUntilThai, formatThaiDate } from "@/lib/thai-date";

interface AddContractorStep2EmploymentProps {
  position: string;
  onPositionChange: (value: string) => void;
  positionOptions: string[];
  unitId: string;
  onUnitIdChange: (value: string) => void;
  units: Record<string, OrgUnitNode> | null;
  unitOptions: OrgUnitNode[];
  jobDescription: string;
  onJobDescriptionChange: (value: string) => void;
  team: string;
  onTeamChange: (value: string) => void;
  positionCode: string;
  onPositionCodeChange: (value: string) => void;
  levelRole: string;
  onLevelRoleChange: (value: string) => void;
  roleCode: string;
  onRoleCodeChange: (value: string) => void;
  roles: CoreRole[] | null;
  workArrangement: string;
  onWorkArrangementChange: (value: string) => void;
  startDate: string;
  onStartDateChange: (value: string) => void;
  endDate: string;
  onEndDateChange: (value: string) => void;
  duration: string;
  onDurationChange: (value: string) => void;
  contractNumber: string;
  onContractNumberChange: (value: string) => void;
  contractDate: string;
  onContractDateChange: (value: string) => void;
  contractValue: string;
  onContractValueChange: (value: string) => void;
  paymentType: string;
  onPaymentTypeChange: (value: string) => void;
  paymentCycle: string;
  onPaymentCycleChange: (value: string) => void;
  contractNote: string;
  onContractNoteChange: (value: string) => void;
  workLocation: string;
  onWorkLocationChange: (value: string) => void;
  subLocation: string;
  onSubLocationChange: (value: string) => void;
  workAddress: string;
  onWorkAddressChange: (value: string) => void;
  errors: Record<string, string>;
  // Summary sidebar only.
  titlePrefix: string;
  fullName: string;
  email: string;
  phone: string;
  onEditStep1: () => void;
}

/** Step 2 of AddContractorWizardPage — presentational only, same convention
 *  as AddEmployeeStep2Employment. Extracted 2026-09-17 (readability audit),
 *  no behavior change. */
export function AddContractorStep2Employment({
  position,
  onPositionChange,
  positionOptions,
  unitId,
  onUnitIdChange,
  units,
  unitOptions,
  jobDescription,
  onJobDescriptionChange,
  team,
  onTeamChange,
  positionCode,
  onPositionCodeChange,
  levelRole,
  onLevelRoleChange,
  roleCode,
  onRoleCodeChange,
  roles,
  workArrangement,
  onWorkArrangementChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  duration,
  onDurationChange,
  contractNumber,
  onContractNumberChange,
  contractDate,
  onContractDateChange,
  contractValue,
  onContractValueChange,
  paymentType,
  onPaymentTypeChange,
  paymentCycle,
  onPaymentCycleChange,
  contractNote,
  onContractNoteChange,
  workLocation,
  onWorkLocationChange,
  subLocation,
  onSubLocationChange,
  workAddress,
  onWorkAddressChange,
  errors,
  titlePrefix,
  fullName,
  email,
  phone,
  onEditStep1,
}: AddContractorStep2EmploymentProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="flex flex-col gap-5 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm lg:col-span-2 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">2. ข้อมูลการจ้างงานและสัญญา</h2>

        <div>
          <p className="mb-2 text-xs font-semibold text-zinc-400">ตำแหน่งและหน้าที่</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className={labelClasses}>
              <span>ตำแหน่งงาน {requiredMark}</span>
              <input
                required
                list="contractor-position-options"
                value={position}
                onChange={(e) => onPositionChange(e.target.value)}
                placeholder="พิมพ์เพื่อค้นหา หรือระบุตำแหน่งใหม่"
                className={fieldClasses(!!errors.position)}
              />
              <datalist id="contractor-position-options">
                {positionOptions.map((option) => (
                  <option key={option} value={option} />
                ))}
              </datalist>
              <ErrorText message={errors.position} />
            </label>
            <label className={labelClasses}>
              หน่วยงาน / ทีม
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
                onChange={(e) => onJobDescriptionChange(e.target.value)}
                placeholder="อธิบายหน้าที่ ความรับผิดชอบ และขอบเขตงาน"
                className={inputClasses}
              />
            </label>
            <label className={labelClasses}>
              ทีม (Team)
              <input value={team} onChange={(e) => onTeamChange(e.target.value)} className={inputClasses} />
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
            {/* ผู้บังคับบัญชา (Reporting To) removed — see
                AddEmployeeWizardPage's identical comment. */}
            <label className={labelClasses}>
              บทบาท / สิทธิ์การเข้าถึง (Role)
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
              <select value={workArrangement} onChange={(e) => onWorkArrangementChange(e.target.value)} className={inputClasses}>
                <option>On-site</option>
                <option>Remote</option>
                <option>Hybrid</option>
              </select>
            </label>
            <label className={labelClasses}>
              วันที่เริ่มงาน
              <input type="date" value={startDate} onChange={(e) => onStartDateChange(e.target.value)} className={inputClasses} />
              {startDate && (
                <span className="text-[11px] font-normal text-zinc-400">
                  {formatThaiDate(startDate)} ({formatDaysUntilThai(startDate)})
                </span>
              )}
            </label>
            <label className={labelClasses}>
              วันที่สิ้นสุด (คาดการณ์)
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
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold text-zinc-400">ข้อมูลสัญญา</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className={labelClasses}>
              เลขที่สัญญา / PO No.
              <input value={contractNumber} onChange={(e) => onContractNumberChange(e.target.value)} className={inputClasses} />
            </label>
            <label className={labelClasses}>
              วันที่ทำสัญญา
              <input type="date" value={contractDate} onChange={(e) => onContractDateChange(e.target.value)} className={inputClasses} />
            </label>
            <label className={labelClasses}>
              มูลค่าสัญญา
              <input
                inputMode="numeric"
                value={contractValue}
                onChange={(e) => onContractValueChange(e.target.value)}
                placeholder="บาท"
                className={inputClasses}
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className={labelClasses}>
                รูปแบบการชำระเงิน
                <select value={paymentType} onChange={(e) => onPaymentTypeChange(e.target.value)} className={inputClasses}>
                  {PAYMENT_TYPE_OPTIONS.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </label>
              <label className={labelClasses}>
                รอบการชำระเงิน
                <select value={paymentCycle} onChange={(e) => onPaymentCycleChange(e.target.value)} className={inputClasses}>
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
              onChange={(e) => onContractNoteChange(e.target.value)}
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
              <select value={workLocation} onChange={(e) => onWorkLocationChange(e.target.value)} className={inputClasses}>
                {WORK_LOCATION_OPTIONS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
            <label className={labelClasses}>
              พื้นที่ / ชั้น
              <input value={subLocation} onChange={(e) => onSubLocationChange(e.target.value)} className={inputClasses} />
            </label>
            <label className={`${labelClasses} sm:col-span-2`}>
              ที่อยู่สถานที่ทำงาน
              <textarea
                rows={2}
                maxLength={200}
                value={workAddress}
                onChange={(e) => onWorkAddressChange(e.target.value)}
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
            <EditLink onClick={onEditStep1} />
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
  );
}
