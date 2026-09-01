import { Card } from "@/components/ui/Card";
import { CalendarIcon, ChevronDownIcon, FilterIcon, ListIcon, SearchIcon } from "@/components/ui/icons";

// Every control here is decorative — no search/filter backend exists yet,
// same convention as people/personnel's PersonnelFilterBar.
export function NewHiresFilterBar() {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-400 dark:border-zinc-700">
          <SearchIcon className="h-4 w-4 shrink-0" />
          <span className="flex-1 truncate" title="Not built yet">
            ค้นหาชื่อ, ตำแหน่ง, หน่วยงาน...
          </span>
        </div>
        <span
          title="Not built yet"
          className="flex h-9 w-9 shrink-0 cursor-not-allowed items-center justify-center rounded-lg border border-zinc-200 text-zinc-400 dark:border-zinc-700"
        >
          <ListIcon className="h-4 w-4" />
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-zinc-400">หน่วยงาน</span>
          <span
            title="Not built yet"
            className="flex cursor-not-allowed items-center justify-between gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
          >
            ทั้งหมด
            <ChevronDownIcon className="h-3.5 w-3.5 text-zinc-400" />
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-zinc-400">ตำแหน่งงาน</span>
          <span
            title="Not built yet"
            className="flex cursor-not-allowed items-center justify-between gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
          >
            ทั้งหมด
            <ChevronDownIcon className="h-3.5 w-3.5 text-zinc-400" />
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-zinc-400">วันที่เริ่มงาน</span>
          <span
            title="Not built yet"
            className="flex cursor-not-allowed items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-400 dark:border-zinc-700"
          >
            <CalendarIcon className="h-3.5 w-3.5 shrink-0" />
            เลือกช่วงวันที่
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-zinc-400">ผู้จัดการ</span>
          <span
            title="Not built yet"
            className="flex cursor-not-allowed items-center justify-between gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
          >
            ทั้งหมด
            <ChevronDownIcon className="h-3.5 w-3.5 text-zinc-400" />
          </span>
        </div>
        <span
          title="Not built yet"
          className="flex cursor-not-allowed items-center justify-center gap-1.5 self-end rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
        >
          <FilterIcon className="h-3.5 w-3.5" />
          ตัวกรองเพิ่มเติม
        </span>
      </div>
    </Card>
  );
}
