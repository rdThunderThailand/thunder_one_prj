// Presentational blocks extracted from CompositionsListPage.tsx so that file stays inside
// the 300-line rule. No data-fetching, no side-effects here. Mirrors
// src/features/media-workspace/layouts/components/LayoutsListStates.tsx.

import { Skeleton } from "@/components/ui/Skeleton";

export type EmptyCause = "no-compositions" | "no-match";

const EMPTY_MESSAGES: Record<EmptyCause, string> = {
  "no-compositions": "ยังไม่มี Composition — กด + New Composition เพื่อเริ่มต้น",
  "no-match": "ไม่พบ Composition ที่ตรงกับตัวกรองที่เลือก",
};

export function SummarySkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-zinc-100 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <Skeleton className="mb-2 h-4 w-24" />
          <Skeleton className="h-8 w-12" />
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton() {
  return (
    <div className="space-y-3 py-2" aria-hidden="true">
      <div className="grid grid-cols-[72px_minmax(0,1fr)_64px_92px_96px_96px_180px_132px] gap-4">
        {Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-4 w-full" />)}
      </div>
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="grid grid-cols-[72px_minmax(0,1fr)_64px_92px_96px_96px_180px_132px] items-center gap-4">
          <Skeleton className="h-10 w-16" />
          <div className="space-y-2"><Skeleton className="h-4 w-4/5" /><Skeleton className="h-3 w-24" /></div>
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-full" />
        </div>
      ))}
    </div>
  );
}

export function ListEmpty({
  cause,
  onClearFilters,
}: {
  cause: EmptyCause;
  onClearFilters: () => void;
}) {
  return (
    <div className="py-10 text-center">
      <p className="text-sm text-zinc-400">{EMPTY_MESSAGES[cause]}</p>
      {cause === "no-match" && (
        <button
          type="button"
          onClick={onClearFilters}
          className="mt-3 rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          ล้างตัวกรอง
        </button>
      )}
    </div>
  );
}

export function ListError({
  message,
  onRetry,
  retrying,
}: {
  message: string;
  onRetry: () => void;
  retrying: boolean;
}) {
  return (
    <div className="py-10 text-center">
      <p className="text-sm text-red-500">{message}</p>
      <button
        type="button"
        disabled={retrying}
        onClick={onRetry}
        className="mt-3 rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        {retrying ? "กำลังลองใหม่…" : "ลองใหม่"}
      </button>
    </div>
  );
}
