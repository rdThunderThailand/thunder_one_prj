import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import type { ClassifiedError } from "@/lib/api/api-error";

export function TabButton({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`border-b-2 px-3 py-3 text-sm font-semibold transition-colors ${
        active
          ? "border-indigo-600 text-indigo-700 dark:text-indigo-400"
          : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
      }`}
    >
      {label} ({count})
    </button>
  );
}

export function TableSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
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
    <Card className="border-red-200 p-8 text-center dark:border-red-900/70">
      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        Channels are unavailable
      </p>
      <p className="mx-auto mt-2 max-w-xl text-sm text-red-600 dark:text-red-400">
        {error.message}
      </p>
      <button
        type="button"
        disabled={retrying}
        onClick={onRetry}
        className="mt-4 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
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
      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {isEmpty ? "No Channels yet" : "No Channels match these filters"}
      </p>
      <p className="mt-1 text-sm text-zinc-400">
        {isEmpty
          ? "Use Add Channel to create the first delivery endpoint."
          : "Adjust the search or filters to widen the result set."}
      </p>
      {hasFilters && (
        <button
          type="button"
          onClick={onClearFilters}
          className="mt-4 text-sm font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
