import { ChevronDownIcon, FilterIcon, SearchIcon } from "@/components/ui/icons";
import { categoryFilterOptions } from "../mock-data";

export function CategoryFilterBar() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-t1-gray-400">
        <SearchIcon className="h-4 w-4 shrink-0" />
        <span className="flex-1 truncate" title="Not built yet">
          ค้นหา ประเภททรัพย์สิน...
        </span>
      </div>
      <span
        title="Not built yet"
        className="flex cursor-not-allowed items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground"
      >
        {categoryFilterOptions.status[0]}
        <ChevronDownIcon className="h-3.5 w-3.5 text-t1-gray-400" />
      </span>
      <span
        title="Not built yet"
        className="flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground"
      >
        <FilterIcon className="h-3.5 w-3.5" />
        ตัวกรองเพิ่มเติม
      </span>
    </div>
  );
}
