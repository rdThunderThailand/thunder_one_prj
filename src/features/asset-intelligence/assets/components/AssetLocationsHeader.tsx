import Link from "next/link";
import { ChevronDownIcon, ChevronRightIcon, PlusIcon, UploadIcon } from "@/components/ui/icons";

// No real import/export/create-location flow exists yet — every header
// action here is inert.
export function AssetLocationsHeader() {
  return (
    <div className="flex flex-col gap-3">
      <nav className="flex items-center gap-1.5 text-xs text-zinc-400">
        <Link href="/asset-intelligence/assets" className="hover:text-zinc-600 dark:hover:text-zinc-300">
          หน้าหลัก
        </Link>
        <ChevronRightIcon className="h-3 w-3" />
        <span className="text-zinc-600 dark:text-zinc-300">สถานที่และพื้นที่</span>
      </nav>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">สถานที่และพื้นที่</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            จัดการโครงสร้างสถานที่ อาคาร ชั้น ห้อง และพื้นที่ทั้งหมดในองค์กร
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <span
            title="Not built yet"
            className="flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
          >
            <UploadIcon className="h-4 w-4 -rotate-180" />
            นำเข้า (Import)
          </span>
          <span
            title="Not built yet"
            className="flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
          >
            <UploadIcon className="h-4 w-4" />
            ส่งออก (Export)
          </span>
          <span
            title="Not built yet"
            className="flex cursor-not-allowed items-center gap-1.5 rounded-lg bg-indigo-300 px-4 py-2.5 text-sm font-medium text-white dark:bg-indigo-500/40"
          >
            <PlusIcon className="h-4 w-4" />
            เพิ่มสถานที่ / อาคาร
            <ChevronDownIcon className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
}
