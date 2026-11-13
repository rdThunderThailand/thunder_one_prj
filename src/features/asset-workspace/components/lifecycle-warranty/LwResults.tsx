"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import type { LwTab } from "../../domain/lifecycle-list";

/** Results card, as AssignmentsResults: rows scroll inside it, the pager stays below. */
export function LwResults({ tab, label, busy, scrollKey, footer, children }: {
  tab: LwTab; label: string; busy: boolean; scrollKey: string; footer?: ReactNode; children: ReactNode;
}) {
  const scroll = useRef<HTMLDivElement>(null);
  useEffect(() => { scroll.current?.scrollTo({ top: 0 }); }, [scrollKey]);
  return (
    <Card
      data-list-results
      id="lw-panel"
      role="tabpanel"
      aria-labelledby={`lw-tab-${tab}`}
      className="flex min-w-0 flex-col overflow-hidden focus-within:border-foreground/20 focus-within:shadow-float motion-reduce:transition-none group-data-[bounded=true]/list-viewport:min-h-0 group-data-[bounded=true]/list-viewport:flex-1"
    >
      <div
        ref={scroll}
        role="region"
        aria-label={label}
        aria-busy={busy}
        tabIndex={0}
        className="relative min-w-0 overflow-x-auto overscroll-contain focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring group-data-[bounded=true]/list-viewport:min-h-0 group-data-[bounded=true]/list-viewport:flex-1 group-data-[bounded=true]/list-viewport:overflow-auto"
      >
        {children}
      </div>
      {footer && (
        <div data-list-controls className="shrink-0 border-t border-border px-4 pb-4">
          <fieldset disabled={busy} aria-busy={busy} className="min-w-0">
            {footer}
          </fieldset>
        </div>
      )}
    </Card>
  );
}
