import { Card } from "./Card";

type StatTileColor = "zinc" | "indigo" | "blue" | "amber" | "red" | "emerald";

interface StatTileProps {
  label: string;
  value: string;
  color?: StatTileColor;
  className?: string;
}

const valueColor: Record<StatTileColor, string> = {
  zinc: "text-zinc-900 dark:text-zinc-50",
  indigo: "text-indigo-600 dark:text-indigo-400",
  blue: "text-blue-600 dark:text-blue-400",
  amber: "text-amber-600 dark:text-amber-400",
  red: "text-red-600 dark:text-red-400",
  emerald: "text-emerald-600 dark:text-emerald-400",
};

export function StatTile({ label, value, color = "zinc", className = "" }: StatTileProps) {
  return (
    <Card className={`flex flex-col gap-1.5 p-4 ${className}`}>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
      <span className={`text-2xl font-semibold ${valueColor[color]}`}>{value}</span>
    </Card>
  );
}
