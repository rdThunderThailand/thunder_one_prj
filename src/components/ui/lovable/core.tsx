import * as React from "react";
import { AlertTriangle, Search, type LucideIcon } from "lucide-react";

import { Badge, type BadgeProps } from "@/components/ui/lovable/badge";
import { Button, type ButtonProps } from "@/components/ui/lovable/button";
import { Input } from "@/components/ui/lovable/input";
import { Skeleton } from "@/components/ui/lovable/skeleton";
import { cn } from "@/lib/utils";

export function VisuallyHidden({ children }: { children: React.ReactNode }) {
  return <span className="sr-only">{children}</span>;
}

export function IconButton({ label, children, ...props }: ButtonProps & { label: string }) {
  return (
    <Button size="icon" aria-label={label} title={label} {...props}>
      <span aria-hidden="true" className="contents">
        {children}
      </span>
    </Button>
  );
}

export const SearchInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<typeof Input> & { label?: string }
>(({ className, label, placeholder, ...props }, ref) => {
  const accessibleName = label ?? (typeof placeholder === "string" ? placeholder : "Search");
  return (
    <div className={cn("relative min-w-48", className)}>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        ref={ref}
        type="search"
        role="searchbox"
        aria-label={accessibleName}
        placeholder={placeholder}
        className="pl-9"
        {...props}
      />
    </div>
  );
});
SearchInput.displayName = "SearchInput";

type StatusTone = "success" | "warning" | "danger" | "info" | "neutral";

const statusMap: Record<string, StatusTone> = {
  active: "success",
  online: "success",
  ready: "success",
  published: "success",
  completed: "success",
  scheduled: "warning",
  warning: "warning",
  pending: "warning",
  error: "danger",
  failed: "danger",
  offline: "danger",
  blocked: "danger",
  draft: "info",
  processing: "info",
  uploading: "info",
  inactive: "neutral",
  archived: "neutral",
  unknown: "neutral",
};

export function StatusBadge({ status, label, className }: { status: string; label?: string; className?: string }) {
  const tone = statusMap[status.toLowerCase()] ?? "neutral";
  return (
    <Badge variant={tone satisfies BadgeProps["variant"]} className={cn("gap-1.5", className)}>
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      <VisuallyHidden>Status: </VisuallyHidden>
      {label ?? status}
    </Badge>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  compact = false,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("grid place-items-center px-6 text-center", compact ? "min-h-28 py-4" : "min-h-52 py-8", className)}>
      <div className="max-w-sm">
        <span aria-hidden="true" className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-muted text-muted-foreground">
          <Icon className="h-4 w-4" strokeWidth={1.8} />
        </span>
        <h3 className="mt-3 text-sm font-semibold">{title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        {action && <div className="mt-4">{action}</div>}
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
  action?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div role="alert">
      <EmptyState icon={AlertTriangle} title={title} description={description} action={action} compact={compact} />
    </div>
  );
}

export function LoadingState({
  rows = 4,
  variant = "rows",
  label = "Loading content",
}: {
  rows?: number;
  variant?: "rows" | "cards";
  label?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(variant === "cards" ? "grid gap-3 sm:grid-cols-2 xl:grid-cols-4" : "space-y-2")}
    >
      <VisuallyHidden>{label}</VisuallyHidden>
      {Array.from({ length: rows }).map((_, index) =>
        variant === "cards" ? (
          <div key={index} aria-hidden="true" className="rounded-lg border border-border bg-card p-3">
            <Skeleton className="aspect-video w-full" />
            <Skeleton className="mt-3 h-3 w-2/3" />
            <Skeleton className="mt-2 h-2.5 w-1/2" />
          </div>
        ) : (
          <div key={index} aria-hidden="true" className="flex items-center gap-3 rounded-md border-b border-border-subtle p-3">
            <Skeleton className="h-9 w-12" />
            <div className="flex-1">
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="mt-2 h-2.5 w-1/4" />
            </div>
          </div>
        ),
      )}
    </div>
  );
}
