import type { ReactNode } from "react";
import { Card } from "./Card";

type StatTileColor = "zinc" | "indigo" | "blue" | "amber" | "red" | "emerald";

interface StatTileProps {
  label: string;
  value: string;
  /** Small secondary line under the value, e.g. a percentage ("86%"). */
  hint?: string;
  /** Small muted line under the value, e.g. "+12 vs last month". */
  trend?: string;
  color?: StatTileColor;
  /** Optional leading icon, shown in a round chip tinted like the value. */
  icon?: ReactNode;
  className?: string;
}

const valueColor: Record<StatTileColor, string> = {
  zinc: "text-foreground",
  indigo: "text-primary",
  blue: "text-info",
  amber: "text-t1-amber-700",
  red: "text-t1-red-700",
  emerald: "text-t1-green-700",
};

const chipColor: Record<StatTileColor, string> = {
  zinc: "bg-muted text-muted-foreground",
  indigo: "bg-accent text-primary",
  blue: "bg-info-muted text-info",
  amber: "bg-warning-muted text-t1-amber-700",
  red: "bg-error-muted text-t1-red-700",
  emerald: "bg-success-muted text-t1-green-700",
};

export function StatTile({ label, value, hint, trend, color = "zinc", icon, className = "" }: StatTileProps) {
  return (
    <Card className={`flex items-start gap-3 p-4 ${className}`}>
      {icon && (
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg ${chipColor[color]}`}>
          {icon}
        </span>
      )}
      <div className="flex flex-col gap-1.5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <span className={`text-2xl font-semibold ${valueColor[color]}`}>
          {value}
          {hint && <span className="ml-1.5 text-sm font-normal text-t1-gray-400">{hint}</span>}
        </span>
        {trend && <p className="text-xs text-muted-foreground">{trend}</p>}
      </div>
    </Card>
  );
}
