import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Whole-page fallback for the route's loading.tsx — shown while the
 * session/role check and the Core reads run, before the route knows which
 * variant to render. All three variants share this rhythm: header → a row of
 * stat tiles → a main list with a right rail.
 */
export function MyWorkSkeleton() {
  return (
    <div
      className="flex flex-col gap-6"
      aria-busy="true"
      aria-label="Loading My Work"
    >
      <div>
        <Skeleton className="h-7 w-40" />
        <Skeleton className="mt-2 h-4 w-80" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            {[0, 1, 2, 3, 4].map((i) => (
              <Card
                key={i}
                className="flex flex-col gap-2 p-4"
              >
                <div className="flex items-center gap-2">
                  <Skeleton className="h-7 w-7 rounded-lg" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-7 w-8" />
                <Skeleton className="h-3 w-20" />
              </Card>
            ))}
          </div>

          <Card className="p-4">
            <div className="flex gap-2 border-b border-zinc-100 pb-3 dark:border-zinc-800">
              {[0, 1, 2, 3, 4].map((i) => (
                <Skeleton
                  key={i}
                  className="h-7 w-16 rounded-lg"
                />
              ))}
            </div>
            <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
              {[0, 1, 2, 3].map((i) => (
                <li
                  key={i}
                  className="flex items-center gap-4 py-3"
                >
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-64" />
                    <Skeleton className="mt-1.5 h-3 w-40" />
                  </div>
                  <Skeleton className="h-8 w-16 rounded-lg" />
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          {[0, 1, 2].map((i) => (
            <Card
              key={i}
              className="p-4"
            >
              <Skeleton className="h-3 w-28" />
              <Skeleton className="mt-4 h-16 w-full" />
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
