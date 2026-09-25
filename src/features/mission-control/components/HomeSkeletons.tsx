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

/** `TasksCard`'s `<Suspense>` fallback. */
export function TasksCardSkeleton() {
  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">งานที่ต้องดำเนินการ</h2>
      <ul className="flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <li
            key={i}
            className="flex items-start gap-2.5"
          >
            <Skeleton className="mt-1.5 h-1.5 w-1.5 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="mt-1 h-3 w-24" />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/** A card with a heading bar and `rows` two-line list rows — the right-rail
 *  Tasks/News shape. */
function RailCardSkeleton({ rows }: { rows: number }) {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-14" />
      </div>
      <ul className="flex flex-col gap-3">
        {Array.from({ length: rows }, (_, i) => (
          <li
            key={i}
            className="flex items-start gap-2.5"
          >
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="flex-1">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="mt-1 h-3 w-24" />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/**
 * Whole-page fallback for the route's `loading.tsx` — shown while the
 * session/role check runs, before the route knows which variant to render.
 * Mirrors MissionControlPage's grid (header, Brief, stat tiles, workspace
 * cards, overview + activity, right rail); the Manager/Employee variants
 * share the same header → 4 tiles → card grid rhythm, so it reads right for
 * them too.
 */
export function MissionControlSkeleton() {
  return (
    <div
      className="flex flex-col gap-6"
      aria-busy="true"
      aria-label="กำลังโหลดหน้าแรก"
    >
      <div className="flex flex-wrap items-end justify-between gap-4 px-6 pb-14 pt-8">
        <div>
          <Skeleton className="h-7 w-72" />
          <Skeleton className="mt-2 h-4 w-40" />
        </div>
        <div className="flex flex-col items-end gap-2">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-5 w-56" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center">
            <div className="flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="mt-3 h-5 w-64" />
              <Skeleton className="mt-2 h-4 w-full max-w-sm" />
            </div>
            <Skeleton className="h-24 w-40 rounded-xl" />
            <div className="flex-1">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="mt-3 h-4 w-32" />
            </div>
          </Card>

          <HomeStatTilesSkeleton />

          <div>
            <Skeleton className="mb-3 h-6 w-44" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="flex flex-col gap-3 rounded-[10px] border border-zinc-100 bg-white p-[22px] dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="flex items-start gap-3">
                    <Skeleton className="h-12 w-12 rounded-[14px]" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-20" />
                      <Skeleton className="mt-1.5 h-3 w-28" />
                    </div>
                  </div>
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="mt-2 h-10 w-full rounded-lg" />
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <OrgOverviewSkeleton />
            <ActivityFeedSkeleton />
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <RailCardSkeleton rows={3} />
          <RailCardSkeleton rows={3} />
        </div>
      </div>
    </div>
  );
}
