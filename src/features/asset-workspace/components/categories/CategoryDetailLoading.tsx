import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { CategoriesWorkspace } from "./CategoriesWorkspace";
import { CategoriesPaginationLoading } from "./CategoriesListLoading";
import { CategoryAssetsLoading } from "./CategoryAssetsLoading";

export function CategoryDetailLoading({ assets = false }: { assets?: boolean }) {
  return (
    <CategoriesWorkspace>
      <div aria-hidden="true" className="flex h-8 items-center gap-2 motion-reduce:[&_.animate-pulse]:animate-none">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Card aria-hidden="true" className="flex flex-wrap items-start gap-4 p-4 motion-reduce:[&_.animate-pulse]:animate-none">
        <Skeleton className="size-14 shrink-0 rounded-control" />
        <div className="min-w-0 flex-1 basis-48 space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <Skeleton className="h-7 w-44 max-w-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-8 w-32 max-sm:h-10" />
          <Skeleton className="h-8 w-32 max-sm:h-10" />
          <Skeleton className="size-8 max-sm:size-10" />
        </div>
        {assets && (
          <div className="grid w-full basis-full gap-3 rounded-control border border-border p-3 @min-xl/categories:grid-cols-2 @min-4xl/categories:grid-cols-5">
            {[0, 1, 2, 3, 4].map((field) => (
              <div key={field} className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-5 w-12" />
              </div>
            ))}
          </div>
        )}
      </Card>
      <div data-category-results role="status" aria-label="Loading category details" aria-busy="true"
        className="flex min-w-0 flex-col motion-reduce:[&_.animate-pulse]:animate-none group-data-[bounded=true]/categories-workspace:min-h-0 group-data-[bounded=true]/categories-workspace:flex-1 group-data-[bounded=true]/categories-workspace:shrink">
        <div data-category-controls aria-hidden="true" className="flex h-10 shrink-0 items-center gap-1 border-b border-border">
          <Skeleton className="h-9 w-28 rounded-t-control" />
          <Skeleton className="h-9 w-24 rounded-t-control" />
        </div>
        {assets ? (
          <div className="flex min-h-0 min-w-0 flex-1 flex-col p-1 pt-3">
            <CategoryAssetsLoading />
          </div>
        ) : (
          <div aria-hidden="true" className="@container/category-detail min-w-0 space-y-3 p-1 pt-3 group-data-[bounded=true]/categories-workspace:min-h-0 group-data-[bounded=true]/categories-workspace:flex-1 group-data-[bounded=true]/categories-workspace:overflow-y-auto">
            <div className="grid items-stretch gap-3 @min-3xl/category-detail:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
              {[4, 3].map((rows) => (
                <Card key={rows} className="min-w-0 p-4">
                  <Skeleton className="h-5 w-40 max-w-full" />
                  {Array.from({ length: rows }, (_, row) => (
                    <div key={row} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)] gap-3 border-b border-border py-3 last:border-0 last:pb-0">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className={`${rows === 4 && row === 2 ? "h-10" : "h-5"} w-full`} />
                    </div>
                  ))}
                </Card>
              ))}
            </div>
            <Card className="@container/categories-results min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                <Skeleton className="h-5 w-44" />
                <Skeleton className="h-9 w-full @min-xl/categories-results:w-72" />
              </div>
              <div className="overflow-x-auto">
                <div className="min-w-96">
                  {Array.from({ length: 5 }, (_, row) => (
                    <div key={row} className={`grid h-11 grid-cols-[minmax(0,2.2fr)_minmax(0,0.8fr)_minmax(0,1fr)] items-center gap-3 border-b border-border px-4 ${row === 0 ? "bg-muted" : ""}`}>
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-12 max-w-full" />
                      <Skeleton className="h-5 w-16 max-w-full rounded-full" />
                    </div>
                  ))}
                </div>
              </div>
              <CategoriesPaginationLoading />
            </Card>
          </div>
        )}
      </div>
    </CategoriesWorkspace>
  );
}
