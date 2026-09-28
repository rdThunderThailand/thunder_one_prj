import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Whole-page fallback for the route's loading.tsx — shown while the
 * session/role check and the Core stat reads run. All three variants share
 * this rhythm: header → a grid of workspace tiles → a right rail.
 */
export function WorkspacesSkeleton() {
  return (
    <div
      className="flex flex-col gap-6"
      aria-busy="true"
      aria-label="Loading Workspaces"
    >
      <div>
        <Skeleton className="h-7 w-44" />
        <Skeleton className="mt-2 h-4 w-80" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="flex flex-col gap-6 lg:col-span-3">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <Card
                key={i}
                className="flex flex-col p-4"
              >
                <Skeleton className="h-11 w-11 rounded-xl" />
                <Skeleton className="mt-3 h-4 w-32" />
                <Skeleton className="mt-2 h-3 w-full" />
                <Skeleton className="mt-1 h-3 w-3/4" />
                <Skeleton className="mt-4 h-3 w-24" />
              </Card>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {[0, 1, 2].map((i) => (
            <Card
              key={i}
              className="p-4"
            >
              <Skeleton className="h-4 w-32" />
              <Skeleton className="mt-4 h-20 w-full" />
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
