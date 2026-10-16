import { ShieldIcon } from "@/components/ui/icons";
import { formatThaiDate } from "@/lib/thai-date";
import type { OrgUnitNode } from "@/features/people/org-structure";
import { EditLink, SummaryRow } from "../wizard-parts";
import { unitLabel } from "../wizard-shared";

interface AddContractorStepReviewProps {
  titlePrefix: string;
  fullName: string;
  idOrPassportNumber: string;
  email: string;
  phone: string;
  position: string;
  positionCode: string;
  levelRole: string;
  unitId: string;
  units: Record<string, OrgUnitNode> | null;
  team: string;
  workArrangement: string;
  startDate: string;
  endDate: string;
  duration: string;
  paymentType: string;
  paymentCycle: string;
  contractValue: string;
  contractNote: string;
  workLocation: string;
  subLocation: string;
  workAddress: string;
  submitError: string | null;
  onEditPersonal: () => void;
  onEditEmployment: () => void;
}

/** Step 3 (pre-submit review) of AddContractorWizardPage — presentational
 *  only, same convention as the other extracted steps. Extracted
 *  2026-09-17 (readability audit), no behavior change. */
export function AddContractorStepReview({
  titlePrefix,
  fullName,
  idOrPassportNumber,
  email,
  phone,
  position,
  positionCode,
  levelRole,
  unitId,
  units,
  team,
  workArrangement,
  startDate,
  endDate,
  duration,
  paymentType,
  paymentCycle,
  contractValue,
  contractNote,
  workLocation,
  subLocation,
  workAddress,
  submitError,
  onEditPersonal,
  onEditEmployment,
}: AddContractorStepReviewProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm lg:col-span-2">
        <h2 className="text-sm font-semibold text-foreground">3. ตรวจสอบและเพิ่ม</h2>
        <p className="text-xs text-t1-gray-400">ตรวจสอบข้อมูลทั้งหมดก่อนสร้างผู้รับเหมา</p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-muted p-4">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-xs font-semibold text-t1-gray-400">ข้อมูลส่วนบุคคล</p>
              <EditLink onClick={onEditPersonal} />
            </div>
            <SummaryRow label="ชื่อ-นามสกุล" value={`${titlePrefix} ${fullName}`} />
            <SummaryRow label="เลขบัตรประชาชน" value={idOrPassportNumber} />
            <SummaryRow label="อีเมล" value={email} />
            <SummaryRow label="เบอร์โทรศัพท์มือถือ" value={phone} />
          </div>
          <div className="rounded-xl bg-muted p-4">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-xs font-semibold text-t1-gray-400">ตำแหน่งและหน้าที่</p>
              <EditLink onClick={onEditEmployment} />
            </div>
            <SummaryRow label="ตำแหน่ง" value={position} />
            <SummaryRow label="รหัสตำแหน่ง" value={positionCode} />
            <SummaryRow label="ระดับตำแหน่ง" value={levelRole} />
            <SummaryRow label="หน่วยงาน / ทีม" value={[unitId ? unitLabel(unitId, units ?? {}) : "", team].filter(Boolean).join(" / ")} />
          </div>
          <div className="rounded-xl bg-muted p-4">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-xs font-semibold text-t1-gray-400">ประเภทและรายละเอียดการจ้าง</p>
              <EditLink onClick={onEditEmployment} />
            </div>
            <SummaryRow label="ประเภทการจ้างงาน" value="ผู้รับเหมา (Contractor)" />
            <SummaryRow label="ลักษณะการจ้าง" value={workArrangement} />
            <SummaryRow label="วันที่เริ่มงาน" value={startDate ? formatThaiDate(startDate) : ""} />
            <SummaryRow label="วันที่สิ้นสุด (คาดการณ์)" value={endDate ? formatThaiDate(endDate) : ""} />
            <SummaryRow label="ระยะเวลาการจ้าง" value={duration} />
          </div>
          <div className="rounded-xl bg-muted p-4">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-xs font-semibold text-t1-gray-400">ข้อมูลสัญญา</p>
              <EditLink onClick={onEditEmployment} />
            </div>
            <SummaryRow label="รูปแบบการชำระเงิน" value={paymentType} />
            <SummaryRow label="รอบการชำระเงิน" value={paymentCycle} />
            <SummaryRow label="มูลค่าสัญญา" value={contractValue ? `${contractValue} บาท` : ""} />
            <SummaryRow label="หมายเหตุสัญญา" value={contractNote} />
          </div>
          <div className="rounded-xl bg-muted p-4 sm:col-span-2">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-xs font-semibold text-t1-gray-400">สถานที่และการปฏิบัติงาน</p>
              <EditLink onClick={onEditEmployment} />
            </div>
            <SummaryRow label="สถานที่ทำงานหลัก" value={workLocation} />
            <SummaryRow label="พื้นที่ / ชั้น" value={subLocation} />
            <SummaryRow label="ที่อยู่สถานที่ทำงาน" value={workAddress} />
          </div>
        </div>

        {submitError && (
          <p className="rounded-lg bg-error-muted px-3 py-2 text-xs text-t1-red-700">{submitError}</p>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-2 text-sm font-semibold text-foreground">ข้อมูลที่จะสร้าง</h3>
          <ul className="flex flex-col gap-2 text-xs text-muted-foreground">
            <li>Contractor Record (รอสร้าง)</li>
            <li>Onboarding (รอเริ่ม)</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-border bg-success-muted/50 p-5">
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-t1-green-700">
            <ShieldIcon className="h-4 w-4" />
            สถานะหลังสร้าง
          </h3>
          <span className="mb-2 inline-flex w-fit items-center rounded-full bg-success-muted px-2.5 py-1 text-xs font-medium text-t1-green-700">
            Pre-boarding
          </span>
          <p className="text-xs text-t1-green-700/80">
            บันทึกสำเร็จแล้ว สามารถเริ่มกระบวนการ Onboarding ได้จากเมนู &quot;เข้าใหม่&quot;
          </p>
        </div>
      </div>
    </div>
  );
}
