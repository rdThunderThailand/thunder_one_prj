import { Skeleton } from "@/components/ui/Skeleton";
import { Card } from "@/components/ui/Card";
import type { LwTab } from "../../domain/lifecycle-list";
import { LIFECYCLE_COLUMNS, WARRANTY_COLUMNS } from "./lw-columns";
import { LwTableLoading } from "./LwListBody";

/** Route and tab loading, shaped like the page: title, tabs, four tiles, filters, table. */
export function LwLoading({ tab = "lifecycle" }: { tab?: LwTab }) {
  return (
    <div className="@container/lw flex min-w-0 flex-col gap-3 motion-reduce:[&_*]:animate-none">
      <span className="sr-only" role="status">Loading Lifecycle &amp; Warranty</span>
      <div aria-hidden="true" className="space-y-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div aria-hidden="true" className="flex gap-3 border-b border-border pb-2">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-6 w-20" />
      </div>
      <div aria-hidden="true" className="grid grid-cols-2 gap-3 @4xl/lw:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-20 rounded-card" />
        ))}
      </div>
      <Skeleton aria-hidden="true" className="h-10 w-full rounded-control" />
      <Card className="overflow-hidden">
        <LwTableLoading columns={tab === "warranty" ? WARRANTY_COLUMNS : LIFECYCLE_COLUMNS} label={`Loading ${tab}`} />
      </Card>
    </div>
  );
}
