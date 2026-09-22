import type { HTMLAttributes } from "react";

// 2026-09-19: matched to the design reference's own card treatment (border,
// radius, shadow, and hover state all measured directly off it) — was a
// flat rounded-2xl/border-zinc-200/shadow-sm box with no hover feedback.
export function Card({
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-xl border border-border bg-card shadow-panel transition-[box-shadow,border-color] duration-200 hover:border-foreground/20 hover:shadow-float ${className}`}
      {...props}
    />
  );
}
