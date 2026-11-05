import { Skeleton } from "@/components/ui/Skeleton";
import { RegistrationBreadcrumb } from "./RegistrationBreadcrumb";

export function RegistrationLoading() {
  return (
    <div role="status" aria-label="Loading asset registration" className="flex h-full min-h-0 w-full min-w-0 flex-col gap-3">
      <div className="@container/registration min-h-0 min-w-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pb-3">
        <div className="space-y-3">
          <RegistrationBreadcrumb current="Single Asset" />
          <Skeleton className="h-7 w-48 motion-reduce:animate-none" />
          <Skeleton className="h-3 w-80 max-w-full motion-reduce:animate-none" />
          <div aria-hidden="true" className="flex justify-between gap-3 py-1">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="min-w-0 flex-1 space-y-2">
                <Skeleton className="size-8 rounded-full motion-reduce:animate-none" />
                <Skeleton className="hidden h-4 w-3/4 motion-reduce:animate-none sm:block" />
                <Skeleton className="hidden h-3 w-1/2 motion-reduce:animate-none sm:block" />
              </div>
            ))}
          </div>
        </div>
        <div aria-hidden="true" className="grid items-start gap-3 @min-4xl/registration:grid-cols-[minmax(0,7fr)_minmax(0,4fr)]">
          <div className="@container/basic-information space-y-4 rounded-card border border-border bg-card p-4">
            <Skeleton className="h-4 w-40 motion-reduce:animate-none" />
            <Skeleton className="h-3 w-3/4 motion-reduce:animate-none" />
            <div className="grid gap-4 @min-lg/basic-information:grid-cols-2">
              {Array.from({ length: 4 }, (_, field) => (
                <div key={field} className="space-y-2">
                  <Skeleton className="h-3 w-20 motion-reduce:animate-none" />
                  <Skeleton className={`${field === 2 ? "h-24" : "h-9"} w-full motion-reduce:animate-none`} />
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <div className="space-y-3 rounded-card border border-border bg-card p-4">
              <Skeleton className="h-4 w-32 motion-reduce:animate-none" />
              <Skeleton className="h-40 w-full motion-reduce:animate-none" />
              <Skeleton className="h-3 w-3/4 motion-reduce:animate-none" />
            </div>
            <div className="hidden space-y-3 rounded-card border border-border bg-card p-4 @min-4xl/registration:block">
              <Skeleton className="h-4 w-32 motion-reduce:animate-none" />
              <Skeleton className="h-16 w-full motion-reduce:animate-none" />
            </div>
          </div>
        </div>
      </div>
      <div className="flex shrink-0 justify-between border-t border-border bg-card p-3">
        <Skeleton className="h-8 w-20 motion-reduce:animate-none max-sm:h-10" />
        <Skeleton className="h-8 w-24 motion-reduce:animate-none max-sm:h-10" />
      </div>
    </div>
  );
}
