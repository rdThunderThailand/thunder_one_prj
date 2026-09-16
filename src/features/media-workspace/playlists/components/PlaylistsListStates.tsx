// Presentational blocks extracted from PlaylistsListPage.tsx so that file stays
// inside the 300-line rule. No data-fetching, no side-effects here.

import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import type { EmptyCause } from "../list-empty-state";

export function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-4">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{value}</p>
    </Card>
  );
}

/** Four StatCard-shaped skeleton boxes shown during the initial data load. */
export function SummarySkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-zinc-100 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <Skeleton className="mb-2 h-4 w-24" />
          <Skeleton className="h-8 w-12" />
        </div>
      ))}
    </div>
  );
}

/** Skeleton rows to fill the table area during initial load. */
export function ListSkeleton() {
  return (
    <div className="space-y-2 py-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

const EMPTY_MESSAGES: Record<EmptyCause, string> = {
  "no-playlists": "ยังไม่มี playlist — กด + Create Playlist เพื่อเริ่มต้น",
  "no-match": "ไม่พบ playlist ที่ตรงกับตัวกรองที่เลือก",
  "trash-empty": "ถังขยะว่าง",
  "folder-empty": "โฟลเดอร์นี้ยังไม่มี playlist",
  "tag-empty": "แท็กนี้ยังไม่มี playlist",
};

/** Empty-state message, with a Clear Filters button for the no-match cause only. */
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

/** Error card with a ลองใหม่ retry button, disabled while a retry is in-flight. */
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
