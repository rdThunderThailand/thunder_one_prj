import { ChevronDownIcon, FilterIcon, SearchIcon } from "@/components/ui/icons";
import { locationFilterOptions } from "../mock-data";

function FilterSelect({ options }: { options: string[] }) {
  return (
    <span
      title="Not built yet"
      className="flex cursor-not-allowed items-center justify-between gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
    >
      {options[0]}
      <ChevronDownIcon className="h-3.5 w-3.5 text-zinc-400" />
    </span>
  );
}

export function LocationFilterBar() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex flex-1 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900">
        <SearchIcon className="h-4 w-4 shrink-0" />
        <span className="flex-1 truncate" title="Not built yet">
          ค้นหา สถานที่, อาคาร, ชั้น, ห้อง, รหัสพื้นที่...
        </span>
      </div>
      <FilterSelect options={locationFilterOptions.type} />
      <FilterSelect options={locationFilterOptions.status} />
      <span
        title="Not built yet"
        className="flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
      >
        <FilterIcon className="h-3.5 w-3.5" />
        ตัวกรองเพิ่มเติม
      </span>
    </div>
  );
}
