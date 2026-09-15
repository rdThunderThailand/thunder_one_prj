import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { ArrowRightIcon } from "@/components/ui/icons";

interface PersonnelStatTilesRowProps {
  totalCount: number;
  /** Real since 2026-09-15 — computed from the fetched roster (`member_type
   *  === "contractor"` / real start_date in the current month), same as
   *  overview's StatTilesRow. "ออกจากองค์กร (เดือนนี้)" shows an honest "-" —
   *  no offboarding/departure entity exists in Core at all (same gap as
   *  /people/departures). "อัตราการคงอยู่" was dropped entirely 2026-09-16 —
   *  see this component's own header comment. */
  contractorCount: number;
  newHiresThisMonth: number;
}

// **2026-09-16**: dropped the 5th tile ("อัตราการคงอยู่", a synthetic 94.1%
// retention-rate donut) — a mock-data audit found it showing a fabricated
// number with no real formula behind it. Real retention needs departure
// dates, which need the Offboarding entity proposed separately (see
// ../README.md). Now 4 tiles, matching this component's own grid.
export function PersonnelStatTilesRow({ totalCount, contractorCount, newHiresThisMonth }: PersonnelStatTilesRowProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
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
    </div>
  );
}
