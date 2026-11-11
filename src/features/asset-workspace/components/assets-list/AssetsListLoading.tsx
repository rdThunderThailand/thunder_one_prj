import { Skeleton } from "@/components/ui/Skeleton";
import { Card } from "@/components/ui/Card";

export function AssetsSummaryLoading() {
  return (
    <section aria-label="Loading asset totals" role="status" className="grid grid-cols-2 gap-3 @3xl:grid-cols-3 @6xl:grid-cols-6">
      {Array.from({ length: 6 }, (_, index) => (
        <Card key={index} className="flex min-w-0 gap-3 p-4 motion-reduce:[&_*]:animate-none">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-5 w-20 max-w-full" />
            <Skeleton className="h-8 w-12" />
            {index === 0 && <Skeleton className="h-4 w-20 max-w-full" />}
          </div>
        </Card>
      ))}
    </section>
  );
}

export function AssetsFilterOptionsLoading() {
  return (
    <div role="status" aria-label="Loading filter options" className="grid min-w-0 grid-cols-1 gap-2 @min-xs/asset-filters:grid-cols-2 @min-2xl/asset-filters:grid-cols-4">
      {Array.from({ length: 4 }, (_, index) => (
        <Skeleton key={index} className="h-10 w-full rounded-control motion-reduce:animate-none" />
      ))}
    </div>
  );
}

export function AssetsTableLoading() {
  return (
    <div role="status" aria-label="Loading asset rows" className="min-w-0">
      <div className="hidden @min-4xl/assets-results:block">
        <div className="grid h-10 grid-cols-[2rem_minmax(0,2fr)_repeat(4,minmax(0,1fr))_2rem] items-center gap-3 border-y border-border bg-muted px-3">
          {Array.from({ length: 7 }, (_, index) => (
            <Skeleton key={index} className="h-3 w-full motion-reduce:animate-none" />
          ))}
        </div>
        {Array.from({ length: 8 }, (_, row) => (
          <div key={row} className="grid h-13 grid-cols-[2rem_minmax(0,2fr)_repeat(4,minmax(0,1fr))_2rem] items-center gap-3 border-b border-border px-3">
            <Skeleton className="size-4 rounded-control motion-reduce:animate-none" />
            <div className="flex min-w-0 items-center gap-2">
              <Skeleton className="size-8 shrink-0 rounded-control motion-reduce:animate-none" />
              <Skeleton className="h-3 w-4/5 motion-reduce:animate-none" />
            </div>
            {Array.from({ length: 5 }, (_, col) => (
              <Skeleton key={col} className="h-3 w-4/5 motion-reduce:animate-none" />
            ))}
          </div>
        ))}
      </div>
      <div className="divide-y divide-border @min-4xl/assets-results:hidden">
        {Array.from({ length: 5 }, (_, row) => (
          <div key={row} className="space-y-3 p-3">
            <div className="flex items-center gap-3">
              <Skeleton className="size-4 shrink-0 motion-reduce:animate-none" />
              <Skeleton className="size-10 shrink-0 rounded-control motion-reduce:animate-none" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4 motion-reduce:animate-none" />
                <Skeleton className="h-3 w-1/2 motion-reduce:animate-none" />
              </div>
            </div>
            <Skeleton className="h-4 w-1/3 motion-reduce:animate-none" />
            <Skeleton className="h-3 w-1/2 motion-reduce:animate-none" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AssetsListLoading() {
  return (
    <div role="status" aria-label="Loading assets" className="@container min-w-0 space-y-3">
      <Skeleton className="h-8 w-32 motion-reduce:animate-none" />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-3 w-56 max-w-full" />
        </div>
        <Skeleton className="h-8 w-72 max-w-full" />
      </div>
      <AssetsSummaryLoading />
      <div className="@container/asset-filters">
        <div className="grid gap-2 @min-2xl/asset-filters:grid-cols-[minmax(0,1fr)_auto] @min-6xl/asset-filters:grid-cols-[minmax(12rem,1.7fr)_minmax(0,4fr)_auto]">
          <Skeleton className="h-10 w-full rounded-control motion-reduce:animate-none @min-2xl/asset-filters:col-span-2 @min-6xl/asset-filters:col-span-1" />
          <AssetsFilterOptionsLoading />
          <Skeleton className="h-10 w-48 max-w-full rounded-control motion-reduce:animate-none" />
        </div>
      </div>
      <Card className="@container/assets-results overflow-hidden motion-reduce:transition-none">
        <div className="flex h-12 items-center justify-between gap-3 px-3">
          <Skeleton className="h-7 w-1/2" />
          <Skeleton className="h-7 w-1/4" />
        </div>
        <div className="overflow-hidden">
          <AssetsTableLoading />
        </div>
        <div className="flex h-12 items-center justify-between gap-3 px-3">
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-7 w-60 max-w-full" />
        </div>
      </Card>
    </div>
  );
}
