import { Skeleton } from "@/components/ui/Skeleton";
import { LoadingState } from "@/features/asset-workspace/components/states/states";

export default function AssetsLoading() {
  return (
    <div role="status" aria-label="Loading assets" className="@container space-y-4">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-4 w-64 max-w-full" />
      <div className="flex justify-end">
        <Skeleton className="h-8 w-64 max-w-full" />
      </div>
      <div className="grid grid-cols-2 gap-3 @3xl:grid-cols-3 @6xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-28 rounded-card" />)}
      </div>
      <Skeleton className="h-12 w-full" />
      <div className="rounded-card border border-border bg-card p-4">
        <LoadingState rows={10} />
      </div>
    </div>
  );
}
