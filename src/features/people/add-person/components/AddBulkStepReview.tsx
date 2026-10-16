import { CheckCircleIcon, CheckIcon, EnvelopeIcon, InfoIcon, UsersIcon } from "@/components/ui/icons";
import { formatThaiDate } from "@/lib/thai-date";
import type { OrgUnitNode } from "@/features/people/org-structure";
import { unitLabel } from "../wizard-shared";

interface BulkPerson {
  name: string;
  email: string;
}

interface AddBulkStepReviewProps {
  totalCount: number;
  startDate: string;
  unitId: string;
  units: Record<string, OrgUnitNode> | null;
  position: string;
  employmentType: string;
  workLocation: string;
  duration: string;
  people: BulkPerson[];
}

/** Step 3 (pre-confirm review) of AddBulkWizardPage — presentational only,
 *  same convention as the other wizards' step components. Extracted
 *  2026-09-17 (readability audit), no behavior change. */
export function AddBulkStepReview({
  totalCount,
  startDate,
  unitId,
  units,
  position,
  employmentType,
  workLocation,
  duration,
  people,
}: AddBulkStepReviewProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="flex flex-col gap-4 lg:col-span-2">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-1 text-sm font-semibold text-foreground">3. ตรวจสอบและยืนยันการเพิ่ม</h2>
          <p className="mb-4 text-xs text-t1-gray-400">ตรวจสอบข้อมูลทั้งหมด {totalCount} รายการก่อนสร้างบุคคลและส่งคำเชิญ Onboarding</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl bg-muted p-3">
              <UsersIcon className="mb-1 h-4 w-4 text-primary" />
              <p className="text-lg font-semibold text-foreground">{totalCount} คน</p>
              <p className="text-[11px] text-t1-gray-400">จำนวนทั้งหมด</p>
            </div>
            <div className="rounded-xl bg-muted p-3">
              <CheckCircleIcon className="mb-1 h-4 w-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">สร้างบุคคลและส่งคำเชิญ</p>
              <p className="text-[11px] text-t1-gray-400">การดำเนินการ</p>
            </div>
            <div className="rounded-xl bg-muted p-3">
              <EnvelopeIcon className="mb-1 h-4 w-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">อีเมล</p>
              <p className="text-[11px] text-t1-gray-400">ช่องทางการเชิญ</p>
            </div>
            <div className="rounded-xl bg-muted p-3">
              <InfoIcon className="mb-1 h-4 w-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">{startDate ? formatThaiDate(startDate) : "-"}</p>
              <p className="text-[11px] text-t1-gray-400">วันที่เริ่มงาน</p>
            </div>
          </div>
        </div>

        <details className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <summary className="cursor-pointer text-sm font-semibold text-foreground">สรุปข้อมูลการจ้างงาน</summary>
          <ul className="mt-3 flex flex-col divide-y divide-border text-xs">
            {[
              ["หน่วยงาน", unitId ? unitLabel(unitId, units ?? {}) : "-"],
              ["ตำแหน่งงาน", position || "-"],
              ["ประเภทการจ้างงาน", employmentType],
              ["สถานที่ทำงานหลัก", workLocation],
              ["ระยะเวลาการจ้าง", duration],
            ].map(([label, value]) => (
              <li key={label} className="flex items-center justify-between py-1.5">
                <span className="text-t1-gray-400">{label}</span>
                <span className="font-medium text-foreground">{value}</span>
              </li>
            ))}
          </ul>
        </details>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="mb-2 text-sm font-medium text-foreground">รายการบุคลากรที่จะเพิ่ม ({totalCount} คน)</p>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-t1-gray-400">
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
                  <tr key={person.email} className="border-b border-border last:border-0">
                    <td className="px-4 py-2 text-t1-gray-400">{i + 1}</td>
                    <td className="px-4 py-2 font-medium text-foreground">{person.name}</td>
                    <td className="px-4 py-2 text-muted-foreground">{person.email}</td>
                    <td className="px-4 py-2 text-muted-foreground">{position || "-"}</td>
                    <td className="px-4 py-2 text-muted-foreground">{unitId ? unitLabel(unitId, units ?? {}) : "-"}</td>
                    <td className="px-4 py-2 text-muted-foreground">{workLocation}</td>
                    <td className="px-4 py-2 text-muted-foreground">{startDate ? formatThaiDate(startDate) : "-"}</td>
                    <td className="px-4 py-2">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-t1-green-700">
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

        <p className="flex items-start gap-2 rounded-lg bg-accent/60 p-3 text-xs text-accent-foreground">
          <InfoIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          หลังจากยืนยัน ระบบจะสร้างบุคคล และส่งคำเชิญ Onboarding ให้กับบุคคลทั้งหมดผ่านอีเมล
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-foreground">สรุปการดำเนินการ</h3>
          <div className="flex flex-col items-center gap-1 py-2 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-primary">
              <UsersIcon className="h-6 w-6" />
            </span>
            <p className="mt-1 text-sm font-medium text-foreground">กำลังจะดำเนินการ</p>
            <p className="text-xs text-t1-gray-400">สร้างบุคคล {totalCount} คน และส่งคำเชิญ Onboarding</p>
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
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-2 text-sm font-semibold text-foreground">การตั้งค่าการเชิญ</h3>
          <ul className="flex flex-col divide-y divide-border text-xs">
            {[
              ["ช่องทางการเชิญ", "อีเมล"],
              ["วันที่เริ่มงาน", startDate ? formatThaiDate(startDate) : "-"],
              ["ระยะเวลา Onboarding", duration],
              ["บทบาทเริ่มต้น", employmentType],
            ].map(([label, value]) => (
              <li key={label} className="flex items-center justify-between py-1.5">
                <span className="text-t1-gray-400">{label}</span>
                <span className="font-medium text-foreground">{value}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-t1-blue-100 bg-accent/50 p-5 text-xs text-accent-foreground">
          <h3 className="mb-2 text-sm font-semibold">หมายเหตุ</h3>
          <ul className="list-inside list-disc space-y-1">
            <li>บุคคลจะได้รับอีเมลพร้อมลิงก์สำหรับยืนยันเข้าใช้งาน</li>
            <li>เมื่อยืนยันแล้ว สถานะจะเปลี่ยนเป็น &quot;รอการยืนยัน&quot;</li>
            <li>สามารถติดตามสถานะได้ที่หน้า &quot;เข้าใหม่&quot;</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
