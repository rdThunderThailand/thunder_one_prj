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
      <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
        แสดง
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="cursor-pointer rounded-lg border border-border bg-card px-2 py-1 text-sm text-muted-foreground"
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
        <span className="text-sm text-t1-gray-400">
          {from}-{to} จาก {filteredCount.toLocaleString()} รายการ
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-t1-gray-50 disabled:cursor-not-allowed disabled:text-t1-gray-400"
          >
            <ChevronLeftIcon className="h-3.5 w-3.5" />
          </button>
          <span className="flex h-7 min-w-7 items-center justify-center rounded-lg bg-primary px-2 text-sm text-primary-foreground">
            {page}
          </span>
          <span className="text-xs text-t1-gray-400">/ {totalPages}</span>
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-t1-gray-50 disabled:cursor-not-allowed disabled:text-t1-gray-400"
          >
            <ChevronRightIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
