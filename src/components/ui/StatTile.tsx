import { Card } from "./Card";

type StatTileColor = "zinc" | "indigo" | "blue" | "amber" | "red" | "emerald";

interface StatTileProps {
  label: string;
  value: string;
  /** Small secondary line under the value, e.g. a percentage ("86%"). */
  hint?: string;
  color?: StatTileColor;
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

export function StatTile({ label, value, hint, color = "zinc", className = "" }: StatTileProps) {
  return (
    <Card className={`flex flex-col gap-1.5 p-4 ${className}`}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <span className={`text-2xl font-semibold ${valueColor[color]}`}>
        {value}
        {hint && <span className="ml-1.5 text-sm font-normal text-t1-gray-400">{hint}</span>}
      </span>
    </Card>
  );
}
