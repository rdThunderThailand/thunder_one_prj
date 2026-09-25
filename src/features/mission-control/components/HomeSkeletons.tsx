import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

// `<Suspense>` fallbacks for MissionControlPage's data-backed sections — each
// matches its real component's outer box (grid, card padding, row count) so
// nothing jumps when the data streams in.

export function HomeStatTilesSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex flex-col gap-2 rounded-[10px] border border-zinc-100 bg-white p-[18px] dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="ml-[60px] h-8 w-12" />
          <Skeleton className="ml-[60px] h-3 w-16" />
        </div>
      ))}
    </div>
  );
}

export function OrgOverviewSkeleton() {
  return (
    <Card className="flex flex-col p-4">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">ภาพรวมองค์กร</h2>
      <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i}>
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div className="mt-2 min-h-8">
              <Skeleton className="h-3 w-14" />
            </div>
            <Skeleton className="h-6 w-8" />
            <Skeleton className="mt-1.5 h-3 w-10" />
          </div>
        ))}
      </div>
    </Card>
  );
}

export function ActivityFeedSkeleton() {
  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">กิจกรรมล่าสุด</h2>
      <ul className="flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <li
            key={i}
            className="flex items-start gap-2.5"
          >
            <Skeleton className="mt-1.5 h-1.5 w-1.5 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="mt-1 h-3 w-44" />
            </div>
            <Skeleton className="h-3 w-12" />
          </li>
        ))}
      </ul>
    </Card>
  );
}
