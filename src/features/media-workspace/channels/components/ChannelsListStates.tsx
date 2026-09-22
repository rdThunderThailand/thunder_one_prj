import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import type { ClassifiedError } from "@/lib/api/api-error";

export function TableSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-border px-4 py-3">
        <Skeleton className="h-8 w-full max-w-sm" />
      </div>
      <div className="space-y-2 p-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-11 w-full" />
        ))}
      </div>
    </Card>
  );
}

export function LoadError({
  error,
  retrying,
  onRetry,
}: {
  error: ClassifiedError;
  retrying: boolean;
  onRetry: () => void;
}) {
  return (
    <Card className="border-danger/30 p-8 text-center">
      <p className="text-sm font-semibold text-foreground">
        Channels are unavailable
      </p>
      <p className="mx-auto mt-2 max-w-xl text-sm text-danger">
        {error.message}
      </p>
      <button
        type="button"
        disabled={retrying}
        onClick={onRetry}
        className="mt-4 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
      >
        {retrying ? "Retrying…" : "Retry"}
      </button>
    </Card>
  );
}

export function ListEmpty({
  isEmpty,
  hasFilters,
  onClearFilters,
}: {
  isEmpty: boolean;
  hasFilters: boolean;
  onClearFilters: () => void;
}) {
  return (
    <div className="px-6 py-14 text-center">
      <p className="text-sm font-medium text-muted-foreground">
        {isEmpty ? "No Channels yet" : "No Channels match these filters"}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {isEmpty
          ? "Use Add Channel to create the first delivery endpoint."
          : "Adjust the search or filters to widen the result set."}
      </p>
      {hasFilters && (
        <button
          type="button"
          onClick={onClearFilters}
          className="mt-4 text-sm font-semibold text-primary hover:text-primary"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
