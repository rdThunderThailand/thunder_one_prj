import type { ReactNode } from "react";

export type BadgeColor = "green" | "yellow" | "red" | "blue" | "indigo" | "zinc";
type BadgeVariant = "dot" | "pill";

interface BadgeProps {
  color?: BadgeColor;
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const dotColor: Record<BadgeColor, string> = {
  green: "bg-emerald-500",
  yellow: "bg-amber-500",
  red: "bg-red-500",
  blue: "bg-blue-500",
  indigo: "bg-indigo-500",
  zinc: "bg-zinc-400",
};

const dotTextColor: Record<BadgeColor, string> = {
  green: "text-emerald-700 dark:text-emerald-400",
  yellow: "text-amber-700 dark:text-amber-400",
  red: "text-red-700 dark:text-red-400",
  blue: "text-blue-700 dark:text-blue-400",
  indigo: "text-indigo-700 dark:text-indigo-400",
  zinc: "text-zinc-600 dark:text-zinc-400",
};

const pillClasses: Record<BadgeColor, string> = {
  green:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  yellow:
    "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  red: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
  blue: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  indigo:
    "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400",
  zinc: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
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
