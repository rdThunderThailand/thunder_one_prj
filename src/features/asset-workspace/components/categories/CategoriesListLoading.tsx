import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { CategoriesWorkspace } from "./CategoriesWorkspace";

export function CategoriesTableLoading() {
  return (
    <div role="status" aria-label="Loading categories" className="@container/categories-results min-w-0 motion-reduce:[&_.animate-pulse]:animate-none">
      <div aria-hidden="true" className="min-w-96">
        <div data-category-controls className="grid h-10 grid-cols-[minmax(0,1fr)_5rem_6rem] items-center gap-3 border-b border-border bg-muted px-3 @min-2xl/categories-results:grid-cols-[minmax(0,2.5fr)_minmax(0,1.75fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <Skeleton className="h-4 w-28 max-w-full" />
          <Skeleton className="hidden h-4 w-28 max-w-full @min-2xl/categories-results:block" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-12" />
        </div>
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="grid h-11 grid-cols-[minmax(0,1fr)_5rem_6rem] items-center gap-3 border-b border-border px-3 @min-2xl/categories-results:grid-cols-[minmax(0,2.5fr)_minmax(0,1.75fr)_minmax(0,1fr)_minmax(0,1fr)]">
            <div className="flex min-w-0 items-center gap-2">
              <Skeleton className="size-5 shrink-0" />
              <div className="min-w-0 flex-1 space-y-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2 @min-2xl/categories-results:hidden" />
              </div>
            </div>
            <Skeleton className="hidden h-4 w-3/4 @min-2xl/categories-results:block" />
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function CategoriesPaginationLoading() {
  return (
    <div data-category-controls aria-hidden="true" className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 motion-reduce:[&_.animate-pulse]:animate-none">
      <Skeleton className="h-4 w-52 max-w-full" />
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-28 max-sm:h-10" />
        <Skeleton className="h-8 w-28 max-sm:h-10" />
      </div>
    </div>
  );
}

export function CategoriesListLoading() {
  return (
    <CategoriesWorkspace>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader title="Categories" subtitle="Organize and manage asset categories." />
        <Skeleton className="h-8 w-32 motion-reduce:animate-none max-sm:h-10" />
      </div>
      <Card aria-hidden="true" className="@container/category-filters min-w-0 p-3 motion-reduce:[&_.animate-pulse]:animate-none">
        <div className="grid min-w-0 items-end gap-3 @min-2xl/category-filters:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)_minmax(0,1.5fr)]">
          {[0, 1, 2].map((field) => (
            <div key={field} className="space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full rounded-control" />
            </div>
          ))}
        </div>
      </Card>
      <Card data-category-results className="flex min-w-0 flex-col overflow-hidden group-data-[bounded=true]/categories-workspace:min-h-0 group-data-[bounded=true]/categories-workspace:flex-1 group-data-[bounded=true]/categories-workspace:shrink">
        <div className="min-w-0 overflow-auto group-data-[bounded=true]/categories-workspace:min-h-0 group-data-[bounded=true]/categories-workspace:flex-1">
          <CategoriesTableLoading />
        </div>
        <CategoriesPaginationLoading />
      </Card>
    </CategoriesWorkspace>
  );
}
