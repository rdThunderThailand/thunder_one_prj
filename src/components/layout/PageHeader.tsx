"use client";

import { useEffect, type ReactNode } from "react";
import { publishPageHeader } from "./page-header-store";

interface PageHeaderProps {
  /** ReactNode so a page can put an inline rename input in the heading slot. */
  title: ReactNode;
  subtitle?: string;
  actions?: ReactNode;
  /** Media Workspace only (docs/adr/0075 §4): the Topbar renders the title/subtitle
   *  itself, so this publishes them there instead of rendering its own heading row —
   *  every other caller is unaffected and keeps rendering the heading in `main`. */
  titleInTopbar?: boolean;
}

export function PageHeader({ title, subtitle, actions, titleInTopbar = false }: PageHeaderProps) {
  useEffect(() => {
    if (!titleInTopbar) return;
    publishPageHeader({ title, subtitle });
    return () => publishPageHeader(null);
  }, [titleInTopbar, title, subtitle]);

  if (titleInTopbar) {
    return actions ? <div className="flex shrink-0 items-center justify-end gap-2">{actions}</div> : null;
  }

  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
