import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import { allocationPageSize, allocationRows, allocationTotalCount, allocationTotalPages } from "../mock-data";

export function AllocationTableControls() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <span
        title="Not built yet"
        className="flex cursor-not-allowed items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400"
      >
        แสดง
        <span className="flex items-center gap-1 rounded-lg border border-zinc-200 px-2 py-1 dark:border-zinc-700">
          {allocationPageSize}
          <ChevronDownIcon className="h-3 w-3" />
        </span>
        รายการ
      </span>

      <div className="flex items-center gap-4">
        <span className="text-sm text-zinc-400">
          1-{allocationRows.length} จาก {allocationTotalCount.toLocaleString()} รายการ
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            title="Not built yet"
            className="flex h-7 w-7 cursor-not-allowed items-center justify-center rounded-lg border border-zinc-200 text-zinc-300 dark:border-zinc-700"
          >
            <ChevronLeftIcon className="h-3.5 w-3.5" />
          </button>
          {[1, 2, 3, 4].map((page) => (
            <button
              key={page}
              type="button"
              title="Not built yet"
              className={`flex h-7 w-7 cursor-not-allowed items-center justify-center rounded-lg text-sm ${
                page === 1
                  ? "bg-indigo-600 text-white"
                  : "border border-zinc-200 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
              }`}
            >
              {page}
            </button>
          ))}
          <span className="px-1 text-zinc-300">...</span>
          <button
            type="button"
            title="Not built yet"
            className="flex h-7 w-7 cursor-not-allowed items-center justify-center rounded-lg border border-zinc-200 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
          >
            {allocationTotalPages}
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
