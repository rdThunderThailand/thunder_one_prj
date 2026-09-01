import { Card } from "@/components/ui/Card";
import { ChevronDownIcon, SearchIcon } from "@/components/ui/icons";

const FILTERS = ["สถานะ", "หน่วยงาน", "บริษัท / ผู้ว่าจ้าง", "ผู้ประสานงานภายใน"];
const DATE_FILTERS = ["วันที่เริ่มสัญญา", "วันที่สิ้นสุดสัญญา"];

// A right-side filter panel instead of a per-row detail view — matches the
// mockup's own 4th screen (dropdown filters + ค้นหา/ล้างตัวกรอง), unlike
// people/positions' OrgDetailPanel-style master/detail. Every control here
// is decorative — no filter backend exists for this fully-mock page.
export function ContractorFilterPanel() {
  return (
    <Card className="flex flex-col gap-4 p-4">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">ตัวกรองด่วน</h3>

      <div className="flex flex-col gap-1">
        <span className="text-xs text-zinc-400">ค้นหา</span>
        <div className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-400 dark:border-zinc-700">
          <SearchIcon className="h-4 w-4 shrink-0" />
          <span className="flex-1 truncate" title="ยังไม่เปิดใช้งาน">
            ค้นหาชื่อ, ตำแหน่ง, บริษัท, ผู้ประสานงาน...
          </span>
        </div>
      </div>

      {FILTERS.map((label) => (
        <div key={label} className="flex flex-col gap-1">
          <span className="text-xs text-zinc-400">{label}</span>
          <span
            title="ยังไม่เปิดใช้งาน"
            className="flex cursor-not-allowed items-center justify-between gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
          >
            ทั้งหมด
            <ChevronDownIcon className="h-3.5 w-3.5 text-zinc-400" />
          </span>
        </div>
      ))}

      {DATE_FILTERS.map((label) => (
        <div key={label} className="flex flex-col gap-1">
          <span className="text-xs text-zinc-400">{label}</span>
          <span
            title="ยังไม่เปิดใช้งาน"
            className="flex cursor-not-allowed items-center gap-2 rounded-lg border border-dashed border-zinc-200 px-3 py-2 text-sm text-zinc-400 dark:border-zinc-700"
          >
            เลือกวันที่
          </span>
        </div>
      ))}

      <div className="mt-2 flex flex-col gap-2">
        <span
          title="ยังไม่เปิดใช้งาน"
          className="flex cursor-not-allowed items-center justify-center rounded-lg bg-indigo-300 py-2 text-sm font-medium text-white dark:bg-indigo-500/40"
        >
          ค้นหา
        </span>
        <span
          title="ยังไม่เปิดใช้งาน"
          className="flex cursor-not-allowed items-center justify-center rounded-lg border border-zinc-200 py-2 text-sm font-medium text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
        >
          ล้างตัวกรอง
        </span>
      </div>
    </Card>
  );
}
