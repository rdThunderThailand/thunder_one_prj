"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { RefreshIcon } from "@/components/ui/icons";

interface LoadFailureProps {
  message: string;
  /** Compact variant for a card-sized slot (e.g. a dashboard widget) instead
   *  of a full-width dashed block — matches TodayActivityCard's previous
   *  centered-text treatment. */
  compact?: boolean;
}

// Added 2026-09-17 (performance/usability audit) — replaces ~8 independently
// hand-copied "ไม่สามารถโหลด...ได้" blocks across People's pages, each a dead
// end with no way to recover short of a full page reload. `router.refresh()`
// re-runs the Server Component's Core fetch without a full navigation, so
// this same component works whether it's rendered inside a client or a
// server component tree.
export function LoadFailure({ message, compact = false }: LoadFailureProps) {
  const router = useRouter();
  const [retrying, setRetrying] = useState(false);

  function handleRetry() {
    setRetrying(true);
    router.refresh();
    // No completion event for a Server Component refresh — release the
    // spinner after a beat rather than leaving it stuck if the retry itself
    // fails silently.
    setTimeout(() => setRetrying(false), 1500);
  }

  if (compact) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
        <p className="text-xs text-zinc-400">{message}</p>
        <button
          type="button"
          onClick={handleRetry}
          disabled={retrying}
          className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-500 disabled:opacity-50 dark:text-indigo-400"
        >
          <RefreshIcon className={`h-3 w-3 ${retrying ? "animate-spin" : ""}`} />
          ลองใหม่
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-zinc-200 p-10 text-center dark:border-zinc-800">
      <p className="text-sm text-zinc-400">{message}</p>
      <button
        type="button"
        onClick={handleRetry}
        disabled={retrying}
        className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        <RefreshIcon className={`h-3.5 w-3.5 ${retrying ? "animate-spin" : ""}`} />
        ลองใหม่
      </button>
    </div>
  );
}
