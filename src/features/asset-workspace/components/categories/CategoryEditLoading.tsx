import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { CategoriesWorkspace } from "./CategoriesWorkspace";

export function CategoryEditFormLoading() {
  return (
    <div data-category-results role="status" aria-label="Loading category edit form" aria-busy="true"
      className="@container/category-form flex min-w-0 flex-col gap-3 motion-reduce:[&_.animate-pulse]:animate-none group-data-[bounded=true]/categories-workspace:min-h-0 group-data-[bounded=true]/categories-workspace:flex-1 group-data-[bounded=true]/categories-workspace:shrink">
      <div aria-hidden="true"
        className="min-w-0 p-1 group-data-[bounded=true]/categories-workspace:min-h-0 group-data-[bounded=true]/categories-workspace:flex-1 group-data-[bounded=true]/categories-workspace:overflow-y-auto">
        <div className="grid items-start gap-3 @min-4xl/category-form:grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)]">
          <div className="min-w-0 space-y-3">
            <Card className="space-y-4 p-4 motion-reduce:transition-none">
              <Skeleton className="h-5 w-40" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-10 w-full rounded-control" />
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
                  <Skeleton className="h-4 w-12" />
                </div>
              </div>
            </Card>
            <Card className="space-y-3 p-4 motion-reduce:transition-none">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-4 w-24" />
              {[0, 1].map((option) => (
                <div key={option} className="flex items-start gap-3 rounded-control border border-border p-3">
                  <Skeleton className="mt-0.5 size-4 shrink-0 rounded-full" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              ))}
            </Card>
          </div>
          <div className="flex items-start gap-3 rounded-control bg-accent p-4">
            <Skeleton className="mt-0.5 size-4 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </div>
      </div>
      <div data-category-controls aria-hidden="true"
        className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border bg-background pt-3">
        <Skeleton className="h-8 w-20 rounded-md max-sm:h-10" />
        <Skeleton className="h-8 w-28 rounded-md max-sm:h-10" />
      </div>
    </div>
  );
}

export function CategoryEditLoading() {
  return (
    <CategoriesWorkspace>
      <div className="space-y-2">
        <div aria-hidden="true" className="flex h-8 items-center gap-2 motion-reduce:[&_.animate-pulse]:animate-none">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-8" />
        </div>
        <div className="flex items-start gap-3">
          <Skeleton className="size-9 shrink-0 motion-reduce:animate-none" />
          <PageHeader title="Edit Category" subtitle="Update category information and rules." />
        </div>
      </div>
      <CategoryEditFormLoading />
    </CategoriesWorkspace>
  );
}
