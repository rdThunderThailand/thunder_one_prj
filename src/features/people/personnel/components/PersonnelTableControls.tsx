import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";

interface PersonnelTableControlsProps {
  /** Rows currently shown on this page (after filtering). */
  shownCount: number;
  /** Rows matching the current filters, before pagination slices them —
   *  used for the "X-Y จาก Z รายการ" label and page-count math. */
  filteredCount: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50];

// Real client-side pagination since 2026-09-15 — slices the already-fetched
// (and filtered) roster rather than re-fetching Core per page. Core's own
// GET /tenants/:id/members does support real page/limit, but this page
// already fetches up to 100 rows in one call for the tab/filter views to
// have the full roster in memory (same reasoning as new-hires/contractors'
// client-side filters) — re-fetching per page would conflict with that, so
// pagination here is real (it genuinely slices what's shown) but operates
// on the client-side dataset, not a fresh Core round-trip per page.
export function PersonnelTableControls({
  shownCount,
  filteredCount,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: PersonnelTableControlsProps) {
  const totalPages = Math.max(1, Math.ceil(filteredCount / pageSize));
  const from = filteredCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = from + shownCount - 1;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <label className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
        แสดง
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="cursor-pointer rounded-lg border border-zinc-200 bg-white px-2 py-1 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
        รายการ
      </label>

      <div className="flex items-center gap-4">
        <span className="text-sm text-zinc-400">
          {from}-{to} จาก {filteredCount.toLocaleString()} รายการ
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:text-zinc-300 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <ChevronLeftIcon className="h-3.5 w-3.5" />
          </button>
          <span className="flex h-7 min-w-7 items-center justify-center rounded-lg bg-indigo-600 px-2 text-sm text-white">
            {page}
          </span>
          <span className="text-xs text-zinc-400">/ {totalPages}</span>
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:text-zinc-300 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <ChevronRightIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
