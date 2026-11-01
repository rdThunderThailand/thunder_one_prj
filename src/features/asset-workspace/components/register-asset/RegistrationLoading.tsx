import { Skeleton } from "@/components/ui/Skeleton";

export function RegistrationLoading() {
  return (
    <div role="status" aria-label="Loading asset registration" className="mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col gap-3">
      <div className="shrink-0 space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-80 max-w-full" />
        <div className="flex justify-between gap-3 py-3">
          {Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-8 w-8 rounded-full sm:w-28" />)}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        <div className="grid items-start gap-3 xl:grid-cols-[minmax(0,1fr)_20rem] 2xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-3">
            {[0, 1].map((index) => (
              <div key={index} className="space-y-3 rounded-card border border-border bg-card p-4">
                <Skeleton className="h-5 w-40" />
                <div className="grid gap-3 sm:grid-cols-2">
                  {Array.from({ length: 4 }, (_, field) => <Skeleton key={field} className="h-10 w-full" />)}
                </div>
              </div>
            ))}
          </div>
          <div className="hidden space-y-3 rounded-card border border-border bg-card p-4 xl:block">
            <Skeleton className="h-5 w-32" />
            <div className="flex gap-3">
              <Skeleton className="h-12 w-12 shrink-0" />
              <Skeleton className="h-12 flex-1" />
            </div>
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
      <div className="flex shrink-0 justify-between border-t border-border bg-card p-3">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-32" />
      </div>
    </div>
  );
}
