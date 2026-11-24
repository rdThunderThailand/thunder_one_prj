import type { HTMLAttributes } from "react";
import type { VariantProps } from "class-variance-authority";
import { Badge as BaseBadge, badgeVariants } from "../Badge";

export interface BadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, "color">, VariantProps<typeof badgeVariants> {}

function Badge({ variant = "default", ...props }: BadgeProps) {
  return <BaseBadge variant={variant} {...props} />;
}

export { Badge, badgeVariants };
