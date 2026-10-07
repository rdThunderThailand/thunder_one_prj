import { Skeleton } from "@/components/ui/lovable/skeleton";

/** Editor-shaped placeholder while the Composition and its geometry load (#223). */
export function CompositionEditorSkeleton() {
  return (
    <div
      className="-m-6 flex h-dvh flex-col overflow-hidden bg-background"
      aria-busy="true"
      aria-label="กำลังโหลด Layout"
    >
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-4">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="ml-auto h-8 w-28" />
        <Skeleton className="h-8 w-24" />
      </div>
      <div className="flex h-11 shrink-0 items-center gap-2 border-b border-border bg-card px-4">
        <Skeleton className="h-7 w-20" />
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-7 w-24" />
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="w-64 shrink-0 space-y-3 border-r border-border bg-card p-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
        <div className="flex flex-1 items-center justify-center p-6">
          <Skeleton className="aspect-video w-full max-w-3xl" />
        </div>
        <div className="w-72 shrink-0 space-y-3 border-l border-border bg-card p-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    </div>
  );
}
