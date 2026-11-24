import Link from "next/link";
import { ChevronDownIcon, ChevronRightIcon, PlusIcon, UploadIcon } from "@/components/ui/icons";

// No real "create warranty/contract" flow exists yet — every header action
// here is inert.
export function WarrantyHeader() {
  return (
    <div className="flex flex-col gap-3">
      <nav className="flex items-center gap-1.5 text-xs text-t1-gray-400">
        <Link href="/asset-intelligence/assets" className="hover:text-muted-foreground">
          หน้าหลัก
        </Link>
        <ChevronRightIcon className="h-3 w-3" />
        <span className="text-muted-foreground">Warranty / Lifecycle</span>
      </nav>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Warranty / Lifecycle</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            ติดตามการรับประกัน สัญญาบริการ และวงจรชีวิตทรัพย์สินตลอดอายุการใช้งาน
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <span
            title="Not built yet"
            className="flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground"
          >
            รายงาน
            <ChevronDownIcon className="h-3.5 w-3.5" />
          </span>
          <span
            title="Not built yet"
            className="flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground"
          >
            <UploadIcon className="h-4 w-4" />
            ส่งออก (Export)
          </span>
          <span
            title="Not built yet"
            className="flex cursor-not-allowed items-center gap-1.5 rounded-lg bg-t1-blue-300 px-4 py-2.5 text-sm font-medium text-primary-foreground"
          >
            <PlusIcon className="h-4 w-4" />
            เพิ่มสัญญา / Warranty
            <ChevronDownIcon className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
}
