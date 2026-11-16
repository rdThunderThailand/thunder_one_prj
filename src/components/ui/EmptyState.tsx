import type { ComponentType, ReactNode } from "react";
import { WarningTriangleIcon } from "./icons";
import { cn } from "@/lib/utils";

type Icon = ComponentType<{ className?: string }>;

/** Shared no-data presentation; actions and data behavior belong to the caller. */
export function EmptyState({
  icon: Icon,
  title,
  detail,
  action,
  compact = false,
  className = "",
}: {
  icon: Icon;
  title: string;
  detail: string;
  action?: ReactNode;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("grid place-items-center text-center", compact ? "min-h-28 py-4" : "min-h-40 py-6", className)}>
      <div>
        <span aria-hidden="true" className="mx-auto grid h-9 w-9 place-items-center rounded-full bg-muted text-muted-foreground">
          <Icon className="h-4 w-4" />
        </span>
        <h3 className="mt-2 text-sm font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
        {action && <div className="mt-3 flex justify-center">{action}</div>}
      </div>
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description = "Try again or return to the previous page.",
  action,
  compact = false,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div role="alert">
      <EmptyState icon={WarningTriangleIcon} title={title} detail={description} action={action} compact={compact} />
    </div>
  );
}
