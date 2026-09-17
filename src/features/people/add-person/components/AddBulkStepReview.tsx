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
  );
}
