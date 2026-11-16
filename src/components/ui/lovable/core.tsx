import * as React from "react";
import { EmptyState as BaseEmptyState } from "../EmptyState";

import { Button, type ButtonProps } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
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

export { SearchInput } from "../SearchInput";

export { StatusBadge } from "../Badge";

export function EmptyState({ description, ...props }: Omit<React.ComponentProps<typeof BaseEmptyState>, "detail"> & { description: string }) {
  return <BaseEmptyState {...props} detail={description} />;
}

export { ErrorState } from "../EmptyState";

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
