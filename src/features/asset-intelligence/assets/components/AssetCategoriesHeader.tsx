import Link from "next/link";
import { ChartIcon, ChevronRightIcon, PlusIcon } from "@/components/ui/icons";

// No real "create category" flow exists yet — every header action here is inert.
export function AssetCategoriesHeader() {
  return (
    <div className="flex flex-col gap-3">
      <nav className="flex items-center gap-1.5 text-xs text-t1-gray-400">
        <Link href="/asset-intelligence/assets" className="hover:text-muted-foreground">
          หน้าหลัก
        </Link>
        <ChevronRightIcon className="h-3 w-3" />
        <span className="text-muted-foreground">ประเภททรัพย์สิน</span>
      </nav>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">ประเภททรัพย์สิน</h1>
          <p className="mt-1 text-sm text-muted-foreground">จัดการประเภททรัพย์สินและโครงสร้างหมวดหมู่</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <span
            title="Not built yet"
            className="flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground"
          >
            <ChartIcon className="h-4 w-4" />
            รายงาน
          </span>
          <span
            title="Not built yet"
            className="flex cursor-not-allowed items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
          >
            <PlusIcon className="h-4 w-4" />
            สร้างประเภททรัพย์สิน
          </span>
        </div>
      </div>
    </div>
  );
}
