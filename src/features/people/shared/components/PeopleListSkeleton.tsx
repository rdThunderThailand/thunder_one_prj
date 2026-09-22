import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Route-level `loading.tsx` fallback for People's list pages (personnel,
 * org-structure, contractors) — added 2026-09-17. These pages are async
 * Server Components that `await Promise.all([...])` two Core calls before
 * rendering anything; without a `loading.tsx`, a slow Core response left the
 * content pane blank under the shell chrome (no skeleton, no spinner), which
 * read as the app hanging — the top "feels laggy" complaint from the audit
 * this fixes. Shape approximates the common header + 4-stat-tile row + table
 * layout all three pages share, so there's minimal layout shift on swap-in.
 */
export function PeopleListSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="กำลังโหลดข้อมูล">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="flex flex-col gap-2 p-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-12" />
          </Card>
        ))}
      </div>

      <Card className="flex flex-col divide-y divide-zinc-100 p-0 dark:divide-zinc-800">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-4">
            <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-3.5 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </Card>
    </div>
  );
}
