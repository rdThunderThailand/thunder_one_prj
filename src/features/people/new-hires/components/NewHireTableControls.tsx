import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import { newHirePageSize, newHireTotalCount } from "../mock-data";

// Decorative — no real pagination backend exists yet. Only one page button:
// unlike people/personnel (128 people, 13 pages), all 8 new hires already
// fit on one page, matching the mockup exactly.
export function NewHireTableControls() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <span
        title="Not built yet"
        className="flex cursor-not-allowed items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400"
      >
        แสดง
        <span className="flex items-center gap-1 rounded-lg border border-zinc-200 px-2 py-1 dark:border-zinc-700">
          {newHirePageSize}
          <ChevronDownIcon className="h-3 w-3" />
        </span>
        รายการ
      </span>

      <div className="flex items-center gap-4">
        <span className="text-sm text-zinc-400">
          1-{newHireTotalCount} จาก {newHireTotalCount} รายการ
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
