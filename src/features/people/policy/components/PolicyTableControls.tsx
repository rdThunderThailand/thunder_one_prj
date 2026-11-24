import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import { policyPageSize, policyRows, policyTotalCount, policyTotalPages } from "../mock-data";

// Decorative — no real pagination backend exists yet, same convention as
// people/personnel's PersonnelTableControls.
export function PolicyTableControls() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <span
        title="Not built yet"
        className="flex cursor-not-allowed items-center gap-1.5 text-sm text-muted-foreground"
      >
        แสดง
        <span className="flex items-center gap-1 rounded-lg border border-border px-2 py-1">
          {policyPageSize}
          <ChevronDownIcon className="h-3 w-3" />
        </span>
        รายการ
      </span>

      <div className="flex items-center gap-4">
        <span className="text-sm text-t1-gray-400">
          1-{policyRows.length} จาก {policyTotalCount.toLocaleString()} รายการ
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            title="Not built yet"
            className="flex h-7 w-7 cursor-not-allowed items-center justify-center rounded-lg border border-border text-t1-gray-400"
          >
            <ChevronLeftIcon className="h-3.5 w-3.5" />
          </button>
          {Array.from({ length: policyTotalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              type="button"
              title="Not built yet"
              className={`flex h-7 w-7 cursor-not-allowed items-center justify-center rounded-lg text-sm ${
                page === 1
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted-foreground"
              }`}
            >
              {page}
            </button>
          ))}
          <button
            type="button"
            title="Not built yet"
            className="flex h-7 w-7 cursor-not-allowed items-center justify-center rounded-lg border border-border text-t1-gray-400"
          >
            <ChevronRightIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
