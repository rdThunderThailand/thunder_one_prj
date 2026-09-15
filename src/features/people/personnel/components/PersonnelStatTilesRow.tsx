import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { DonutChart } from "@/components/ui/DonutChart";
import { ArrowRightIcon } from "@/components/ui/icons";
import { personnelRetentionRate } from "../mock-data";

interface PersonnelStatTilesRowProps {
  totalCount: number;
  /** Real since 2026-09-15 — computed from the fetched roster (`member_type
   *  === "contractor"` / real start_date in the current month), same as
   *  overview's StatTilesRow. "ออกจากองค์กร (เดือนนี้)" and "อัตราการคงอยู่"
   *  stay mock — no offboarding/departure entity exists in Core at all
   *  (same gap as /people/departures and overview's own two blocked
   *  tiles). */
  contractorCount: number;
  newHiresThisMonth: number;
}

export function PersonnelStatTilesRow({ totalCount, contractorCount, newHiresThisMonth }: PersonnelStatTilesRowProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      <Card className="flex flex-col gap-1 p-4">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">พนักงานทั้งหมด</p>
        <span className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{totalCount}</span>
        <p className="text-xs text-zinc-400">คน</p>
      </Card>

      <Card className="flex flex-col gap-1 p-4">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">ผู้ปฏิบัติงานภายนอก</p>
        <span className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{contractorCount}</span>
        <p className="text-xs text-zinc-400">คน</p>
      </Card>

      <Card className="flex flex-col gap-1 p-4">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">เข้าใหม่ (เดือนนี้)</p>
        <span className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{newHiresThisMonth}</span>
        <Link
          href="/people/new-hires"
          className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
        >
          ดูรายละเอียด
          <ArrowRightIcon className="h-3 w-3" />
        </Link>
      </Card>

      <Card className="flex flex-col gap-1 p-4">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">ออกจากองค์กร (เดือนนี้)</p>
        {/* No offboarding/departure entity exists in Core at all — showing an
            honest "-" rather than a fabricated count, same discipline as
            asset-intelligence/assets's AllAssetsPage. */}
        <span className="text-2xl font-semibold text-zinc-400 dark:text-zinc-500">-</span>
        <Link
          href="/people/departures"
          className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
        >
          ดูรายละเอียด
          <ArrowRightIcon className="h-3 w-3" />
        </Link>
      </Card>

      <Card className="flex items-center gap-3 p-4">
        <div className="relative shrink-0" style={{ width: 56, height: 56 }}>
          <DonutChart
            size={56}
            strokeWidth={7}
            segments={[
              { label: "อัตราการคงอยู่", value: personnelRetentionRate, color: "#6366f1" },
              { label: "Remaining", value: 100 - personnelRetentionRate, color: "#e4e4e7" },
            ]}
          />
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[11px] font-semibold text-zinc-900 dark:text-zinc-50">
            {personnelRetentionRate}%
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">อัตราการคงอยู่</p>
          <p className="text-xs text-zinc-400">เป้าหมาย 90%</p>
        </div>
      </Card>
    </div>
  );
}
