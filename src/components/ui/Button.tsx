import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

// 2026-09-19: colors/radius matched to the design reference's own button
// treatment (semantic tokens + hover states measured directly off it) —
// size/padding deliberately left unchanged (this component has 87 call
// sites app-wide; the reference's own compact h-8/px-3 sizing was only
// verified against media-workspace's overview page, not every one of them).
const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-primary/40",
  secondary: "bg-card text-foreground border border-border hover:bg-muted disabled:text-muted-foreground",
  ghost: "text-muted-foreground hover:text-foreground",
};

/** Button styling for elements that must not be a <button> — chiefly next/link,
 * since <a> wrapping <button> is invalid HTML and breaks keyboard navigation. */
export function buttonClasses(variant: ButtonVariant = "primary", className = ""): string {
  return `inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`;
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  return <button className={buttonClasses(variant, className)} {...props} />;
}
