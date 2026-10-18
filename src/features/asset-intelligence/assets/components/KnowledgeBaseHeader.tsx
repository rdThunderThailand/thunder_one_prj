import Link from "next/link";
import { ChevronRightIcon, PlusIcon } from "@/components/ui/icons";

// No real "create article" flow exists yet.
export function KnowledgeBaseHeader() {
  return (
    <div className="flex flex-col gap-3">
      <nav className="flex items-center gap-1.5 text-xs text-t1-gray-400">
        <Link href="/asset-intelligence/assets" className="hover:text-muted-foreground">
          หน้าหลัก
        </Link>
        <ChevronRightIcon className="h-3 w-3" />
        <span className="text-muted-foreground">คลังความรู้</span>
      </nav>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">คลังความรู้</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            แหล่งรวมความรู้ คู่มือ และแนวปฏิบัติเกี่ยวกับการบริหารจัดการทรัพย์สิน
          </p>
        </div>
        <span
          title="Not built yet"
          className="flex shrink-0 cursor-not-allowed items-center gap-1.5 rounded-lg bg-t1-blue-300 px-4 py-2.5 text-sm font-medium text-primary-foreground"
        >
          <PlusIcon className="h-4 w-4" />
          สร้างบทความใหม่
        </span>
      </div>
    </div>
  );
}
