"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";

const DEFAULT_PER_PAGE_OPTIONS = [10, 25, 50];

/** Windowed page numbers with "…" for the gaps — 1 … 4 5 6 … 12. Always shows the first
 *  and last page so the ends stay reachable in one click. */
function pageNumbers(page: number, totalPages: number): (number | "gap")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const middle = [page - 1, page, page + 1].filter((n) => n > 1 && n < totalPages);
  const out: (number | "gap")[] = [1];
  if (middle[0] !== undefined && middle[0] > 2) out.push("gap");
  out.push(...middle);
  if (middle[middle.length - 1]! < totalPages - 1) out.push("gap");
  out.push(totalPages);
  return out;
}

export function Pagination({
  page,
  totalPages,
  perPage,
  totalItems,
  rangeStart,
  rangeEnd,
  itemLabel = "playlists",
  perPageOptions = DEFAULT_PER_PAGE_OPTIONS,
  onPageChange,
  onPerPageChange,
}: {
  page: number;
  totalPages: number;
  perPage: number;
  totalItems: number;
  rangeStart: number;
  rangeEnd: number;
  itemLabel?: string;
  perPageOptions?: number[];
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
}) {
  const arrow =
    "flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground disabled:opacity-40 hover:bg-muted";

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
      <p className="text-muted-foreground">
        Showing {rangeStart} to {rangeEnd} of {totalItems} {itemLabel}
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Previous page"
          className={arrow}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeftIcon />
        </button>

        {pageNumbers(page, totalPages).map((n, i) =>
          n === "gap" ? (
            <span key={`gap-${i}`} className="px-1 text-t1-gray-400">
              …
            </span>
          ) : (
            <button
              key={n}
              type="button"
              aria-current={n === page ? "page" : undefined}
              onClick={() => onPageChange(n)}
              className={`h-8 min-w-8 rounded-lg px-2 ${
                n === page
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {n}
            </button>
          )
        )}

        <button
          type="button"
          aria-label="Next page"
          className={arrow}
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRightIcon />
        </button>

        <select
          aria-label="Rows per page"
          value={perPage}
          onChange={(e) => onPerPageChange(Number(e.target.value))}
          className="h-8 rounded-lg border border-border bg-card px-2 text-sm outline-none focus:border-primary"
        >
          {perPageOptions.map((n) => (
            <option key={n} value={n}>
              {n} / page
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
