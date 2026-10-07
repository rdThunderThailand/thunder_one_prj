"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "../copy";
import { RETURN_STORAGE_KEY, parseStoredReturn, returnTarget } from "../navigation";
import type { Locale } from "../types";

function readStored(): string | null {
  try {
    return window.sessionStorage.getItem(RETURN_STORAGE_KEY);
  } catch {
    return null;
  }
}

// sessionStorage does not notify the tab that wrote it; the value only matters at render time.
const subscribe = () => () => {};

/**
 * "Back to ThunderOne" when Help was opened from a Workspace (returns to the exact originating page
 * when this tab still knows it, else that screen's list), "Go to ThunderOne" for a direct visitor —
 * which lands on the Platform or Login depending on auth state (F05, UC-006, AC-011).
 */
export function ExitButton({ from, locale, className }: { from: string | null; locale: Locale; className?: string }) {
  const raw = useSyncExternalStore(subscribe, readStored, () => null);
  const target = returnTarget(from, parseStoredReturn(raw));
  const back = target.kind === "back";
  return (
    <Link
      href={target.href}
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary",
        className,
      )}
    >
      {back && <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />}
      <span>{t(back ? "backToThunderOne" : "goToThunderOne", locale)}</span>
      {!back && <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />}
    </Link>
  );
}
