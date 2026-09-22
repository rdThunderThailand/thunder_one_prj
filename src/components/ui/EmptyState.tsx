import type { ComponentType } from "react";

type Icon = ComponentType<{ className?: string }>;

/** Lovable-mockup empty state (docs/adr/0075) — used where Overview has no data to show,
 *  honestly, instead of the mockup's placeholder numbers. */
export function EmptyState({
  icon: Icon,
  title,
  detail,
  compact = false,
  className = "",
}: {
  icon: Icon;
  title: string;
  detail: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={`grid place-items-center text-center ${compact ? "min-h-28 py-4" : "min-h-40 py-6"} ${className}`}>
      <div>
        <span className="mx-auto grid h-9 w-9 place-items-center rounded-full bg-muted text-muted-foreground">
          <Icon className="h-4 w-4" />
        </span>
        <p className="mt-2 text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}
