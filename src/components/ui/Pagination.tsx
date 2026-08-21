"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";

const PER_PAGE_OPTIONS = [10, 25, 50];

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
  onPageChange,
  onPerPageChange,
}: {
  page: number;
  totalPages: number;
  perPage: number;
  totalItems: number;
  rangeStart: number;
  rangeEnd: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
}) {
  const arrow =
    "flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 disabled:opacity-40 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800";

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
      <p className="text-zinc-500 dark:text-zinc-400">
        Showing {rangeStart} to {rangeEnd} of {totalItems} playlists
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
            <span key={`gap-${i}`} className="px-1 text-zinc-400">
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
                  ? "bg-indigo-600 text-white"
                  : "border border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
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
          className="h-8 rounded-lg border border-zinc-200 bg-white px-2 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-900"
        >
          {PER_PAGE_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n} / page
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
