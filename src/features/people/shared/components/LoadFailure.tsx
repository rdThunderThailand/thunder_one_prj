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
        <p className="text-xs text-t1-gray-400">{message}</p>
        <button
          type="button"
          onClick={handleRetry}
          disabled={retrying}
          className="flex items-center gap-1 text-xs font-medium text-primary hover:text-accent-foreground disabled:opacity-50"
        >
          <RefreshIcon className={`h-3 w-3 ${retrying ? "animate-spin" : ""}`} />
          ลองใหม่
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border p-10 text-center">
      <p className="text-sm text-t1-gray-400">{message}</p>
      <button
        type="button"
        onClick={handleRetry}
        disabled={retrying}
        className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
      >
        <RefreshIcon className={`h-3.5 w-3.5 ${retrying ? "animate-spin" : ""}`} />
        ลองใหม่
      </button>
    </div>
  );
}
