import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        {/* 2026-09-19: matched to the Media Workspace design reference's
            page title (20px/extrabold/tight tracking) and subtitle
            (10px) — was text-2xl/font-semibold (24px/600) and text-sm
            (14px), both noticeably heavier/larger than the reference. */}
        <h1 className="text-xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-2xs text-zinc-500 dark:text-zinc-400">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
