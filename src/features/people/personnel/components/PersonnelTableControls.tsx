import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import { personnelPageSize } from "../mock-data";

interface PersonnelTableControlsProps {
  shownCount: number;
  totalCount: number;
}

// Page-turning is still decorative (Core's members list is fetched one page
// of up to 100 at a time server-side — see people/personnel/page.tsx — real
// pagination isn't wired to these buttons yet). `totalCount`/`shownCount`
// are real, though — Core's `count` field, not the mockup's static "128".
export function PersonnelTableControls({ shownCount, totalCount }: PersonnelTableControlsProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <span
        title="Not built yet"
        className="flex cursor-not-allowed items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400"
      >
        แสดง
        <span className="flex items-center gap-1 rounded-lg border border-zinc-200 px-2 py-1 dark:border-zinc-700">
          {personnelPageSize}
          <ChevronDownIcon className="h-3 w-3" />
        </span>
        รายการ
      </span>

      <div className="flex items-center gap-4">
        <span className="text-sm text-zinc-400">
          1-{shownCount} จาก {totalCount.toLocaleString()} รายการ
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            title="Not built yet"
            className="flex h-7 w-7 cursor-not-allowed items-center justify-center rounded-lg border border-zinc-200 text-zinc-300 dark:border-zinc-700"
          >
            <ChevronLeftIcon className="h-3.5 w-3.5" />
          </button>
          <button type="button" className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-sm text-white">
            1
          </button>
          <button
            type="button"
            title="Not built yet"
            className="flex h-7 w-7 cursor-not-allowed items-center justify-center rounded-lg border border-zinc-200 text-zinc-300 dark:border-zinc-700"
          >
            <ChevronRightIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
