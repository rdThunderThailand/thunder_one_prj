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
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-foreground">3. ตรวจสอบและเพิ่ม</h2>
      <p className="text-xs text-t1-gray-400">ตรวจสอบข้อมูลก่อนเพิ่มพนักงานใหม่เข้าสู่องค์กร</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-t1-gray-50 p-4">
          <p className="mb-1 text-xs font-semibold text-t1-gray-400">ข้อมูลส่วนบุคคล</p>
          <SummaryRow label="ชื่อ-นามสกุล" value={`${titlePrefix} ${fullName}`} />
          <SummaryRow label="ชื่อ (อังกฤษ)" value={`${firstNameEn} ${lastNameEn}`.trim()} />
          <SummaryRow label="เลขบัตรประชาชน" value={idCardNumber} />
          <SummaryRow label="สัญชาติ" value={nationality} />
          <SummaryRow label="วันเกิด" value={birthDate ? formatThaiDate(birthDate) : ""} />
          <SummaryRow label="อีเมล" value={email} />
          <SummaryRow label="เบอร์โทรศัพท์" value={phone} />
        </div>
        <div className="rounded-xl bg-t1-gray-50 p-4">
          <p className="mb-1 text-xs font-semibold text-t1-gray-400">การจ้างงานและตำแหน่ง</p>
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
        <p className="rounded-lg bg-error-muted px-3 py-2 text-xs text-t1-red-700">{submitError}</p>
      )}
    </div>
  );
}
