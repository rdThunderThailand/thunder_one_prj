import { Card } from "@/components/ui/Card";
import { ChevronDownIcon, FilterIcon, ListIcon, SearchIcon } from "@/components/ui/icons";

const FILTERS = ["หน่วยงาน", "ระดับตำแหน่ง", "ประเภทตำแหน่ง"];

function FilterSelect({ label }: { label: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-zinc-400">{label}</span>
      <span
        title="ยังไม่เปิดใช้งาน"
        className="flex cursor-not-allowed items-center justify-between gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
      >
        ทั้งหมด
        <ChevronDownIcon className="h-3.5 w-3.5 text-zinc-400" />
      </span>
    </div>
  );
}

// Every control here is decorative — no search/filter backend exists for
// this fully-mock page, same convention as people/personnel's
// PersonnelFilterBar.
export function PositionFilterBar() {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-400 dark:border-zinc-700">
          <SearchIcon className="h-4 w-4 shrink-0" />
          <span className="flex-1 truncate" title="ยังไม่เปิดใช้งาน">
            ค้นหาตำแหน่งงาน, รหัสตำแหน่ง, หน่วยงาน...
          </span>
        </div>
        <span
          title="ยังไม่เปิดใช้งาน"
          className="flex h-9 w-9 shrink-0 cursor-not-allowed items-center justify-center rounded-lg border border-zinc-200 text-zinc-400 dark:border-zinc-700"
        >
          <ListIcon className="h-4 w-4" />
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {FILTERS.map((label) => (
          <FilterSelect key={label} label={label} />
        ))}
        <span
          title="ยังไม่เปิดใช้งาน"
          className="flex cursor-not-allowed items-center justify-center gap-1.5 self-end rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
        >
          <FilterIcon className="h-3.5 w-3.5" />
          ตัวกรอง
        </span>
      </div>
    </Card>
  );
}
