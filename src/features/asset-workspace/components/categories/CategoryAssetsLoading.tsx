import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

export function CategoryAssetsRowsLoading() {
  return (
    <div role="status" aria-label="Loading category assets" className="min-w-0 motion-reduce:[&_.animate-pulse]:animate-none">
      <div aria-hidden="true" className="min-w-96">
        {Array.from({ length: 6 }, (_, row) => (
          <div key={row} data-category-controls={row === 0 ? "" : undefined}
            className={`grid grid-cols-[minmax(0,1fr)_7rem_7rem] items-center gap-3 border-b border-border px-3 @min-4xl/assets-results:grid-cols-[minmax(0,2.6fr)_minmax(0,1.5fr)_minmax(0,1.7fr)_minmax(0,1.6fr)_minmax(0,1.4fr)_minmax(0,1.2fr)] ${row === 0 ? "h-10 bg-muted" : "h-28 @min-4xl/assets-results:h-14"}`}>
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              {row > 0 && <Skeleton className="h-12 w-full @min-4xl/assets-results:hidden" />}
            </div>
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="hidden h-4 w-3/4 @min-4xl/assets-results:block" />
            <Skeleton className="hidden h-4 w-3/4 @min-4xl/assets-results:block" />
            <Skeleton className="h-5 w-3/4 rounded-full" />
            <Skeleton className="hidden h-5 w-3/4 rounded-full @min-4xl/assets-results:block" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function CategoryAssetsPaginationLoading() {
  return (
    <div data-category-controls aria-hidden="true" className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border p-3 motion-reduce:[&_.animate-pulse]:animate-none">
      <Skeleton className="h-8 w-28 max-sm:h-10" />
      <Skeleton className="h-8 w-60 max-w-full max-sm:h-10" />
    </div>
  );
}

export function CategoryAssetsLoading() {
  return (
    <Card className="@container/assets-results flex min-h-0 min-w-0 flex-1 flex-col">
      <div data-category-controls aria-hidden="true" className="shrink-0 space-y-3 p-4 motion-reduce:[&_.animate-pulse]:animate-none">
        <Skeleton className="h-5 w-48 max-w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="grid gap-3 @min-2xl/assets-results:grid-cols-2 @min-5xl/assets-results:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))]">
          {[0, 1, 2, 3].map((filter) => (
            <div key={filter} className="space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full rounded-control" />
            </div>
          ))}
        </div>
      </div>
      <div className="min-h-0 min-w-0 flex-1 overflow-auto">
        <CategoryAssetsRowsLoading />
      </div>
      <CategoryAssetsPaginationLoading />
    </Card>
  );
}
