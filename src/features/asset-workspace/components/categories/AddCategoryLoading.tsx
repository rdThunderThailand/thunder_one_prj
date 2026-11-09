import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { CategoriesWorkspace } from "./CategoriesWorkspace";

export function AddCategoryFieldsLoading() {
  return (
    <div role="status" aria-label="Loading category form" className="grid items-start gap-3 motion-reduce:[&_.animate-pulse]:animate-none @min-4xl/category-form:grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)]">
      <div aria-hidden="true" className="min-w-0 space-y-3">
        <Card className="space-y-4 p-4">
          <Skeleton className="h-5 w-36" />
          <div className="grid gap-4 @min-2xl/category-form:grid-cols-2">
            {[0, 1].map((field) => (
              <div key={field} className="space-y-1">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-10 w-full rounded-control" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
          <div className="space-y-1">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10 w-full rounded-control" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-24 w-full rounded-control" />
            <div className="flex justify-end">
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
        </Card>
        <Card className="space-y-3 p-4">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-4 w-24" />
          <div className="grid gap-3 @min-2xl/category-form:grid-cols-2">
            {[0, 1].map((option) => (
              <div key={option} className="flex gap-3 rounded-control border border-border p-3">
                <Skeleton className="size-4 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <div aria-hidden="true" className="min-w-0 space-y-3">
        <Skeleton className="h-10 w-full rounded-control @min-4xl/category-form:hidden" />
        <div className="hidden space-y-3 @min-4xl/category-form:block">
          <Card className="space-y-4 p-4">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-10 w-full" />
            {[0, 1, 2, 3].map((row) => <Skeleton key={row} className="h-8 w-full" />)}
          </Card>
          <Card className="space-y-4 p-4">
            <Skeleton className="h-5 w-28" />
            {[0, 1, 2].map((row) => <Skeleton key={row} className="h-12 w-full" />)}
          </Card>
        </div>
      </div>
    </div>
  );
}

export function AddCategoryLoading() {
  return (
    <CategoriesWorkspace>
      <div className="space-y-2">
        <Skeleton className="my-2 h-4 w-56 max-w-full motion-reduce:animate-none" />
        <PageHeader title="Add Category" subtitle="Create a new asset category for organizing similar assets." />
      </div>
      <div data-category-results className="@container/category-form flex min-w-0 flex-col gap-3 group-data-[bounded=true]/categories-workspace:min-h-0 group-data-[bounded=true]/categories-workspace:flex-1 group-data-[bounded=true]/categories-workspace:shrink">
        <div className="min-w-0 p-1 group-data-[bounded=true]/categories-workspace:min-h-0 group-data-[bounded=true]/categories-workspace:flex-1 group-data-[bounded=true]/categories-workspace:overflow-y-auto">
          <AddCategoryFieldsLoading />
        </div>
        <div data-category-controls aria-hidden="true" className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border px-1 py-3 motion-reduce:[&_.animate-pulse]:animate-none">
          <Skeleton className="h-4 w-44" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20 max-sm:h-10" />
            <Skeleton className="h-8 w-36 max-sm:h-10" />
          </div>
        </div>
      </div>
    </CategoriesWorkspace>
  );
}
