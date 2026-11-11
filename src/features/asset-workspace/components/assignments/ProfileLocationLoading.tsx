import { Skeleton } from "@/components/ui/Skeleton";
import type { ReactNode } from "react";

export function ProfileLocationLoading({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="status" aria-label={label} className="motion-reduce:[&_*]:animate-none">
      <div aria-hidden="true">{children}</div>
    </div>
  );
}

export function NearbyAssetsLoading() {
  return (
    <ProfileLocationLoading label="Loading nearby assets…">
      <div className="divide-y divide-border">
        {[0, 1, 2, 3].map((row) => (
          <div key={row} className="flex items-center gap-2 py-2">
            <Skeleton className="size-8 shrink-0" />
            <div className="min-w-0 flex-1 space-y-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-16 max-w-full" />
            </div>
            <Skeleton className="h-5 w-14 shrink-0 rounded-full" />
          </div>
        ))}
      </div>
    </ProfileLocationLoading>
  );
}

export function ProfileLocationHistoryFooterLoading() {
  return (
    <div aria-hidden="true" className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
      <Skeleton className="h-4 w-32 max-w-full" />
      <div className="flex gap-1">
        {[0, 1, 2].map((index) => <Skeleton key={index} className="size-8" />)}
      </div>
    </div>
  );
}
