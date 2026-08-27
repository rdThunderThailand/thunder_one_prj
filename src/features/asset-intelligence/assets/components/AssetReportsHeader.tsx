import Link from "next/link";
import { CalendarIcon, ChevronDownIcon, ChevronRightIcon, PlusIcon } from "@/components/ui/icons";

// No real "custom date range" or "create report" flow exists yet — every
// header action here is inert.
export function AssetReportsHeader() {
  return (
    <div className="flex flex-col gap-3">
      <nav className="flex items-center gap-1.5 text-xs text-zinc-400">
        <Link href="/asset-intelligence/assets" className="hover:text-zinc-600 dark:hover:text-zinc-300">
          หน้าหลัก
        </Link>
        <ChevronRightIcon className="h-3 w-3" />
        <span className="text-zinc-600 dark:text-zinc-300">รายงาน</span>
      </nav>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">รายงาน</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            ภาพรวมข้อมูลและรายงานเชิงวิเคราะห์ของทรัพย์สินในองค์กร
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <span
            title="Not built yet"
            className="flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
          >
            <CalendarIcon className="h-4 w-4" />
            กำหนดช่วงเวลาดูเอง
          </span>
          <span
            title="Not built yet"
            className="flex cursor-not-allowed items-center gap-1.5 rounded-lg bg-indigo-300 px-4 py-2.5 text-sm font-medium text-white dark:bg-indigo-500/40"
          >
            <PlusIcon className="h-4 w-4" />
            สร้างรายงาน
            <ChevronDownIcon className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
}
