import type { ReactNode } from "react";

export type BadgeColor = "green" | "yellow" | "red" | "blue" | "indigo" | "zinc";
type BadgeVariant = "dot" | "pill";

interface BadgeProps {
  color?: BadgeColor;
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

// Status colours come from the design system's status tokens (DS-04): green = success,
// yellow = warning, red = error, blue = info, indigo = in progress, zinc = neutral. Text uses the
// 700 step of the same primitive ramp so 12px labels keep AA contrast on the muted fill.
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

export function Badge({
  color = "zinc",
  variant = "dot",
  children,
  className = "",
}: BadgeProps) {
  if (variant === "pill") {
    return (
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${pillClasses[color]} ${className}`}
      >
        {children}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium ${dotTextColor[color]} ${className}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotColor[color]}`} />
      {children}
    </span>
  );
}
