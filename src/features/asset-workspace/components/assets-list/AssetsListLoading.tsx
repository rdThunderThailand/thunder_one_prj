import { Skeleton } from "@/components/ui/Skeleton";

export function AssetsSummaryLoading() {
  return (
    <section aria-label="Loading asset totals" role="status" className="grid grid-cols-2 gap-3 @3xl:grid-cols-3 @6xl:grid-cols-6">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="flex min-h-24 gap-3 rounded-card border border-border bg-card p-3">
          <Skeleton className="size-8 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-20 max-w-full" />
            <Skeleton className="h-7 w-12" />
            <Skeleton className="h-3 w-8" />
          </div>
        </div>
      ))}
    </section>
  );
}

export function AssetsFilterOptionsLoading() {
  return (
    <div role="status" aria-label="Loading filter options" className="grid min-w-0 grid-cols-2 gap-2 @2xl:grid-cols-4">
      {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-13 w-full rounded-control" />)}
    </div>
  );
}

export function AssetsTableLoading() {
  return (
    <div role="status" aria-label="Loading asset rows" className="min-w-[76rem]">
      <div className="grid h-10 grid-cols-[2rem_2fr_repeat(9,1fr)] items-center gap-3 border-y border-border bg-muted px-3">
        {Array.from({ length: 11 }, (_, index) => <Skeleton key={index} className="h-3 w-full" />)}
      </div>
      {Array.from({ length: 8 }, (_, row) => (
        <div key={row} className="grid h-13 grid-cols-[2rem_2fr_repeat(9,1fr)] items-center gap-3 border-b border-border px-3">
          <Skeleton className="size-4 rounded-control" />
          <div className="flex items-center gap-2">
            <Skeleton className="size-8 shrink-0 rounded-control" />
            <div className="w-full space-y-1">
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="h-2 w-1/2" />
            </div>
          </div>
          {Array.from({ length: 9 }, (_, col) => <Skeleton key={col} className="h-3 w-4/5" />)}
        </div>
      ))}
    </div>
  );
}

export function AssetsListLoading() {
  return (
    <div role="status" aria-label="Loading assets" className="@container min-w-0 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-3 w-56 max-w-full" />
        </div>
        <Skeleton className="h-8 w-72 max-w-full" />
      </div>
      <AssetsSummaryLoading />
      <div className="grid gap-2 @3xl:grid-cols-[1fr_2fr]">
        <Skeleton className="h-13 w-full rounded-control" />
        <AssetsFilterOptionsLoading />
      </div>
      <div className="overflow-hidden rounded-card border border-border bg-card">
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
      </div>
    </div>
  );
}
