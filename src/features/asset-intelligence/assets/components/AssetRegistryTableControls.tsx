import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";

interface AssetRegistryTableControlsProps {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  /** Current filter query params (category/status/building/owner), minus
   *  `page` — carried through every page-number link so paginating never
   *  drops an active filter. */
  filterQuery: Record<string, string | undefined>;
}

function pageHref(filterQuery: Record<string, string | undefined>, page: number): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filterQuery)) {
    if (value) params.set(key, value);
  }
  params.set("page", String(page));
  return `?${params.toString()}`;
}

export function AssetRegistryTableControls({ page, pageSize, total, totalPages, filterQuery }: AssetRegistryTableControlsProps) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <span className="text-sm text-zinc-500 dark:text-zinc-400">แสดง {pageSize} รายการ</span>

      <div className="flex items-center gap-4">
        <span className="text-sm text-zinc-400">
          {from}-{to} จาก {total.toLocaleString()} รายการ
        </span>
        <div className="flex items-center gap-1">
          {page > 1 ? (
            <Link
              href={pageHref(filterQuery, page - 1)}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              <ChevronLeftIcon className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 text-zinc-300 dark:border-zinc-700">
              <ChevronLeftIcon className="h-3.5 w-3.5" />
            </span>
          )}
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
            .map((p, i, arr) => (
              <span key={p} className="flex items-center">
                {i > 0 && arr[i - 1] !== p - 1 && <span className="px-1 text-zinc-300">...</span>}
                <Link
                  href={pageHref(filterQuery, p)}
                  className={`flex h-7 w-7 items-center justify-center rounded-lg text-sm ${
                    p === page
                      ? "bg-indigo-600 text-white"
                      : "border border-zinc-200 text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  }`}
                >
                  {p}
                </Link>
              </span>
            ))}
          {page < totalPages ? (
            <Link
              href={pageHref(filterQuery, page + 1)}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              <ChevronRightIcon className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 text-zinc-300 dark:border-zinc-700">
              <ChevronRightIcon className="h-3.5 w-3.5" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
