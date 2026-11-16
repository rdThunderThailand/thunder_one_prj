import type { HTMLAttributes } from "react";
import { Badge } from "./Badge";
import { cn } from "@/lib/utils";

export type TagProps = Omit<HTMLAttributes<HTMLSpanElement>, "color">;

export function Tag({ className, ...props }: TagProps) {
  return <Badge variant="outline" className={cn("rounded-full bg-card text-muted-foreground", className)} {...props} />;
}
