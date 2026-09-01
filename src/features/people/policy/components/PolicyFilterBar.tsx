import { Card } from "@/components/ui/Card";
import { ChevronDownIcon, FilterIcon, GridIcon, ListIcon, SearchIcon } from "@/components/ui/icons";

const FILTERS = ["หมวดหมู่", "สถานะ", "กลุ่มเป้าหมาย", "ประกาศโดย"];

// Every control here is decorative — no search/filter backend exists yet,
// same convention as people/personnel's PersonnelFilterBar.
export function PolicyFilterBar() {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-400 dark:border-zinc-700">
          <SearchIcon className="h-4 w-4 shrink-0" />
          <span className="flex-1 truncate" title="Not built yet">
            ค้นหานโยบาย, หัวข้อ, คำสำคัญ...
          </span>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-zinc-200 p-1 dark:border-zinc-700">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
            <GridIcon className="h-3.5 w-3.5" />
          </span>
          <span
            title="Not built yet"
            className="flex h-7 w-7 cursor-not-allowed items-center justify-center rounded-md text-zinc-400"
          >
            <ListIcon className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {FILTERS.map((label) => (
          <div key={label} className="flex flex-col gap-1">
            <span className="text-xs text-zinc-400">{label}</span>
            <span
              title="Not built yet"
              className="flex cursor-not-allowed items-center justify-between gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
            >
              ทั้งหมด
              <ChevronDownIcon className="h-3.5 w-3.5 text-zinc-400" />
            </span>
          </div>
        ))}
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
