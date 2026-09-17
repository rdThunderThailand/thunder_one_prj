import { formatThaiDate } from "@/lib/thai-date";
import type { CoreRole } from "@/features/people/personnel";
import type { OrgUnitNode } from "@/features/people/org-structure";
import { SummaryRow } from "../wizard-parts";
import { unitLabel } from "../wizard-shared";

interface AddEmployeeStepReviewProps {
  titlePrefix: string;
  fullName: string;
  firstNameEn: string;
  lastNameEn: string;
  idCardNumber: string;
  nationality: string;
  birthDate: string;
  email: string;
  phone: string;
  employeeCode: string;
  positionCode: string;
  levelRole: string;
  employmentType: string;
  position: string;
  unitId: string;
  units: Record<string, OrgUnitNode> | null;
  team: string;
  workLocation: string;
  startDate: string;
  roles: CoreRole[] | null;
  roleCode: string;
  submitError: string | null;
}

/** Step 3 (pre-submit review) of AddEmployeeWizardPage — presentational
 *  only, same convention as the other extracted steps. Extracted
 *  2026-09-17 (readability audit), no behavior change. */
export function AddEmployeeStepReview({
  titlePrefix,
  fullName,
  firstNameEn,
  lastNameEn,
  idCardNumber,
  nationality,
  birthDate,
  email,
  phone,
  employeeCode,
  positionCode,
  levelRole,
  employmentType,
  position,
  unitId,
  units,
  team,
  workLocation,
  startDate,
  roles,
  roleCode,
  submitError,
}: AddEmployeeStepReviewProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">3. ตรวจสอบและเพิ่ม</h2>
      <p className="text-xs text-zinc-400">ตรวจสอบข้อมูลก่อนเพิ่มพนักงานใหม่เข้าสู่องค์กร</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/50">
          <p className="mb-1 text-xs font-semibold text-zinc-400">ข้อมูลส่วนบุคคล</p>
          <SummaryRow label="ชื่อ-นามสกุล" value={`${titlePrefix} ${fullName}`} />
          <SummaryRow label="ชื่อ (อังกฤษ)" value={`${firstNameEn} ${lastNameEn}`.trim()} />
          <SummaryRow label="เลขบัตรประชาชน" value={idCardNumber} />
          <SummaryRow label="สัญชาติ" value={nationality} />
          <SummaryRow label="วันเกิด" value={birthDate ? formatThaiDate(birthDate) : ""} />
          <SummaryRow label="อีเมล" value={email} />
          <SummaryRow label="เบอร์โทรศัพท์" value={phone} />
        </div>
        <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/50">
          <p className="mb-1 text-xs font-semibold text-zinc-400">การจ้างงานและตำแหน่ง</p>
          <SummaryRow label="รหัสพนักงาน" value={employeeCode} />
          <SummaryRow label="รหัสตำแหน่ง" value={positionCode} />
          <SummaryRow label="ระดับตำแหน่ง" value={levelRole} />
          <SummaryRow label="ประเภทการจ้างงาน" value={employmentType} />
          <SummaryRow label="ตำแหน่งงาน" value={position} />
          <SummaryRow label="หน่วยงาน / ทีม" value={[unitId ? unitLabel(unitId, units ?? {}) : "", team].filter(Boolean).join(" / ")} />
          <SummaryRow label="สถานที่ทำงาน" value={workLocation} />
          <SummaryRow label="วันที่เริ่มงาน" value={startDate ? formatThaiDate(startDate) : ""} />
          <SummaryRow label="บทบาท (Role)" value={roles?.find((r) => r.code === roleCode)?.name ?? roleCode} />
        </div>
      </div>

      {submitError && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-500/10 dark:text-red-400">{submitError}</p>
      )}
    </div>
  );
}
