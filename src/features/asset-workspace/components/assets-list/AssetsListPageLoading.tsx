"use client";

import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { LIST_FILTER_KEYS } from "../../hooks/use-assets-list-url";
import { AssetsCompactList } from "./AssetsCompactList";
import { AssetsFilterOptionsLoading, AssetsSummaryLoading } from "./AssetsListLoading";
import { AssetsListWorkspace } from "./AssetsListWorkspace";
import { AssetsTable } from "./AssetsTable";

// The default page size, so the scrollbar and page length match the loaded list.
const ROWS = Array.from({ length: 25 }, (_, index) => index);
// One pulse for all rows instead of one animation per block.
const PULSE = "animate-pulse motion-reduce:animate-none [&_*]:animate-none";
const NO_ROWS = { rows: [], selected: new Set<string>(), pending: true, onSelect: () => {}, onSelectAll: () => {} };
// Same column widths as AssetsTable.
const COLUMNS =
  "grid-cols-[2.25rem_20%_6rem_9rem_minmax(0,1fr)_7rem_5rem_minmax(0,1fr)_6rem_3.5rem] @min-[90rem]/assets-results:grid-cols-[2.25rem_26%_6rem_9rem_minmax(0,1fr)_7rem_5rem_minmax(0,1fr)_6rem_3.5rem]";

export function AssetsRowsLoading() {
  return (
    <div aria-hidden="true">
      <div className="hidden @min-5xl/assets-results:block">
        <AssetsTable {...NO_ROWS} />
        <div className={PULSE}>
          {ROWS.map((row) => (
            <div key={row} data-row-skeleton className={`grid h-[49px] items-center border-b border-border [&>*]:mx-2 ${COLUMNS}`}>
              <Skeleton className="size-4" />
              <div className="flex min-w-0 items-center gap-2">
                <Skeleton className="size-8 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-4/5" />
                  <Skeleton className="h-2.5 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-3" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-3" />
              <Skeleton className="h-4.5 w-16 rounded-full" />
              <Skeleton className="h-4.5 rounded-full" />
              <Skeleton className="h-3" />
              <div className="space-y-1.5">
                <Skeleton className="h-3" />
                <Skeleton className="h-2.5 w-1/2" />
              </div>
              <Skeleton className="size-4 justify-self-center" />
            </div>
          ))}
        </div>
      </div>
      <div className="@min-5xl/assets-results:hidden">
        <AssetsCompactList {...NO_ROWS} />
        <div className={`divide-y divide-border ${PULSE}`}>
          {ROWS.map((row) => (
            <div key={row} data-row-skeleton className="space-y-2 p-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 items-center">
                  <Skeleton className="size-4" />
                </div>
                <Skeleton className="size-10 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1 space-y-2 py-0.5">
                  <Skeleton className="h-4 w-3/5" />
                  <Skeleton className="h-3 w-2/5" />
                </div>
                <Skeleton className="mx-3 my-3 size-4 shrink-0" />
              </div>
              <Skeleton className="h-4.5 w-36 rounded-full" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-8 w-24 max-sm:h-10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Same sizes as AssetsPagination; `compact` is the one beside the sort control. */
export function AssetsPaginationLoading({ compact = false }: { compact?: boolean }) {
  return (
    <div aria-hidden="true" className={`flex flex-wrap items-center gap-3 ${compact ? "justify-end" : "justify-between"}`}>
      {!compact && (
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20 rounded-lg max-sm:h-10" />
          <Skeleton className="h-4 w-12" />
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-4 w-27" />
        <div className="flex items-center gap-1">
          <Skeleton className="size-8 rounded-lg max-sm:size-10" />
          {!compact && <Skeleton className="hidden h-8 w-31 rounded-lg @min-2xl/assets-results:block" />}
          <Skeleton className={`h-4 w-8 ${compact ? "" : "@min-2xl/assets-results:hidden"}`} />
          <Skeleton className="size-8 rounded-lg max-sm:size-10" />
        </div>
      </div>
    </div>
  );
}

/** Route loading screen. Pages below Assets can show it too, so it has no title text. */
export function AssetsListPageLoading() {
  const params = useSearchParams();
  const applied = LIST_FILTER_KEYS.filter((key) => params.get(key));
  const chips = applied.filter((key) => key !== "import_batch_id" && !(key === "custody_id" && applied.includes("custody_type")));
  return (
    <AssetsListWorkspace>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p role="status" className="sr-only">Loading assets…</p>
        <div>
          <Skeleton className="h-7 w-20" />
          <Skeleton className="mt-1 h-3.5 w-48" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-8 w-28.5 rounded-lg max-sm:h-10" />
          <Skeleton className="h-8 w-41 rounded-lg max-sm:h-10 max-sm:w-43" />
          <Skeleton className="h-8 w-30 rounded-lg max-sm:h-10" />
        </div>
      </div>
      {/* The list folds its totals when it opens with a filter. */}
      {applied.length === 0 && <AssetsSummaryLoading />}
      <div className="@container/asset-filters min-w-0 space-y-3">
        <div className="grid items-start gap-2 @min-2xl/asset-filters:grid-cols-[minmax(0,1fr)_auto] @min-5xl/asset-filters:grid-cols-[minmax(11rem,1.3fr)_minmax(0,4fr)_auto]">
          <Skeleton className="h-10 rounded-lg @min-2xl/asset-filters:col-span-2 @min-5xl/asset-filters:col-span-1" />
          <AssetsFilterOptionsLoading />
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-10 w-29 rounded-lg" />
            {applied.length > 0 && <Skeleton className="h-10 w-31 rounded-lg" />}
          </div>
        </div>
        {chips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {chips.map((key) => <Skeleton key={key} className="h-7 w-32 rounded-full" />)}
          </div>
        )}
      </div>
      <Card
        data-assets-table
        className="@container/assets-results flex min-w-0 flex-col overflow-hidden motion-reduce:transition-none min-[60rem]:group-data-[bounded=true]/assets-workspace:min-h-0 min-[60rem]:group-data-[bounded=true]/assets-workspace:flex-1"
      >
        <div data-assets-controls className="flex shrink-0 flex-wrap items-center gap-2 px-3 py-2">
          <div className="flex min-h-8 min-w-0 flex-1 basis-48 items-center">
            <Skeleton className="h-4 w-41" />
          </div>
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 @min-4xl/assets-results:justify-end">
            <Skeleton className="h-8 w-44 rounded-lg max-sm:h-10" />
            <AssetsPaginationLoading compact />
          </div>
        </div>
        <div className="relative min-w-0 min-[60rem]:group-data-[bounded=true]/assets-workspace:min-h-0 min-[60rem]:group-data-[bounded=true]/assets-workspace:flex-1 min-[60rem]:group-data-[bounded=true]/assets-workspace:overflow-y-auto">
          <AssetsRowsLoading />
        </div>
        <div data-assets-controls className="shrink-0 border-t border-border px-3 py-2">
          <AssetsPaginationLoading />
        </div>
      </Card>
    </AssetsListWorkspace>
  );
}
