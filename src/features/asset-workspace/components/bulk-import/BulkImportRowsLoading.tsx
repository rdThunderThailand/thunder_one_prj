import { Skeleton } from "@/components/ui/lovable/skeleton";
import { cn } from "@/lib/utils";

export function BulkImportRowsLoading({ variant }: {
  variant: "validate" | "review" | "result";
}) {
  const columns = variant === "validate" ? 4 : variant === "review" ? 10 : 7;
  const gridClassName = variant === "validate"
    ? "grid-cols-[2rem_minmax(0,2fr)_minmax(0,3fr)_4rem]"
    : variant === "review" ? "grid-cols-10" : "grid-cols-7";

  return (
    <div role="status" className="flex min-h-0 flex-1 flex-col gap-3">
      <p className="shrink-0 text-xs text-muted-foreground">
        {variant === "validate" ? "Loading validation rows…" : "Loading import rows…"}
      </p>
      <div
        aria-hidden="true"
        className="max-h-64 min-h-0 overflow-hidden rounded-control border border-border xl:max-h-none xl:flex-1"
      >
        <div className={cn("grid items-center gap-3 bg-muted p-3", gridClassName)}>
          {Array.from({ length: columns }, (_, index) => (
            <Skeleton key={index} className="h-3 w-full bg-border motion-reduce:animate-none" />
          ))}
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 5 }, (_, row) => (
            <div key={row} className={cn("grid h-10 items-center gap-3 px-3", gridClassName)}>
              {Array.from({ length: columns }, (_, column) => (
                <Skeleton
                  key={column}
                  className={cn(
                    "h-3 min-w-0 bg-muted motion-reduce:animate-none",
                    (row + column) % 2 === 0 ? "w-3/4" : "w-full",
                    column === columns - 1 && "h-5 rounded-pill",
                  )}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div aria-hidden="true" className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
        <Skeleton className="h-8 w-28 bg-muted motion-reduce:animate-none" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-20 bg-muted motion-reduce:animate-none" />
          <Skeleton className="size-8 bg-muted motion-reduce:animate-none" />
          <Skeleton className="size-8 bg-muted motion-reduce:animate-none" />
        </div>
      </div>
    </div>
  );
}
