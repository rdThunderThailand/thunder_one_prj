import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export type BadgeColor = "green" | "yellow" | "red" | "blue" | "indigo" | "zinc";
// Keep legacy tone variants so consolidation does not reinterpret workspace status maps.
export const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-2xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow-xs hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/80",
        outline: "border-border text-foreground",
        success: "border-transparent bg-success-muted text-success",
        warning: "border-transparent bg-warning-muted text-warning",
        danger: "border-transparent bg-error-muted text-error",
        info: "border-transparent bg-info-muted text-info",
        neutral: "border-transparent bg-muted text-muted-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

type LegacyBadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  color?: BadgeColor;
  variant?: "dot" | "pill" | LegacyBadgeVariant | null;
}

// Status colours come from the design system's status tokens (DS-04): green = success,
// yellow = warning, red = error, blue = info, indigo = in progress, zinc = neutral. Text uses the
// 700 step of the same primitive ramp so small labels keep AA contrast on the muted fill.
const dotColor: Record<BadgeColor, string> = {
  green: "bg-success",
  yellow: "bg-warning",
  red: "bg-error",
  blue: "bg-info",
  indigo: "bg-in-progress",
  zinc: "bg-t1-gray-400",
};

const dotTextColor: Record<BadgeColor, string> = {
  green: "text-t1-green-700",
  yellow: "text-t1-amber-700",
  red: "text-t1-red-700",
  blue: "text-t1-blue-700",
  indigo: "text-t1-purple-700",
  zinc: "text-muted-foreground",
};

const pillClasses: Record<BadgeColor, string> = {
  green: "bg-success-muted text-t1-green-700",
  yellow: "bg-warning-muted text-t1-amber-700",
  red: "bg-error-muted text-t1-red-700",
  blue: "bg-info-muted text-t1-blue-700",
  indigo: "bg-in-progress-muted text-t1-purple-700",
  zinc: "bg-muted text-muted-foreground",
};

export function Badge({ color = "zinc", variant = "dot", children, className, ...props }: BadgeProps) {
  const classes = variant === "dot"
    ? cn("inline-flex items-center gap-1.5 text-2xs font-medium", dotTextColor[color], className)
    : variant === "pill"
      ? cn("inline-flex items-center rounded-full px-2 py-0.5 text-2xs font-medium", pillClasses[color], className)
      : cn(badgeVariants({ variant }), className);

  return (
    <span className={classes} {...props}>
      {variant === "dot" && (
        <span aria-hidden="true" className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotColor[color]}`} />
      )}
      {children}
    </span>
  );
}

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
    <Badge variant={tone} className={cn("gap-1.5", className)}>
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      <span className="sr-only">Status: </span>
      {label ?? status}
    </Badge>
  );
}
