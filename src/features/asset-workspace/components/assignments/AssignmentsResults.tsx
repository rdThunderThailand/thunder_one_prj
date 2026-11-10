"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Card } from "@/components/ui/Card";

export function AssignmentsResults({ children, footer, busy = false, tab, scrollKey, aside }: {
  children: ReactNode;
  footer?: ReactNode;
  busy?: boolean;
  tab?: "current" | "history";
  scrollKey?: string;
  /** Omit for Current's original card; null keeps History's wrapper stable when its panel is closed. */
  aside?: ReactNode;
}) {
  const scroll = useRef<HTMLDivElement>(null);
  useEffect(() => { scroll.current?.scrollTo({ top: 0 }); }, [scrollKey]);
  const split = aside !== undefined;

  const card = (
    <Card
      data-list-results={split ? undefined : true}
      data-list-table={split ? true : undefined}
      id={!split && tab ? "assignments-panel" : undefined}
      role={!split && tab ? "tabpanel" : undefined}
      aria-labelledby={!split && tab ? `assignments-tab-${tab}` : undefined}
      className="flex min-w-0 flex-col overflow-hidden focus-within:border-foreground/20 focus-within:shadow-float motion-reduce:transition-none group-data-[bounded=true]/list-viewport:min-h-0 group-data-[bounded=true]/list-viewport:flex-1"
    >
      <div
        ref={scroll}
        role="region"
        aria-label="Assignment results"
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
  if (!split) return card;

  return (
    <div
      data-list-results
      id={tab ? "assignments-panel" : undefined}
      role={tab ? "tabpanel" : undefined}
      aria-labelledby={tab ? `assignments-tab-${tab}` : undefined}
      className={`grid min-w-0 grid-cols-1 gap-3 group-data-[bounded=true]/list-viewport:min-h-0 group-data-[bounded=true]/list-viewport:flex-1 ${aside
        ? "group-data-[bounded=true]/list-viewport:grid-rows-[minmax(0,1fr)_minmax(0,1fr)] @5xl/assignments:grid-cols-[minmax(0,1fr)_var(--container-xs)] @5xl/assignments:group-data-[bounded=true]/list-viewport:grid-rows-[minmax(0,1fr)]"
        : "group-data-[bounded=true]/list-viewport:grid-rows-[minmax(0,1fr)]"}`}
    >
      {card}
      {aside}
    </div>
  );
}
