import { Card } from "@/components/ui/Card";
import { managerStatTiles, type ManagerStatTileData } from "../mock-data";

const valueColor: Record<ManagerStatTileData["color"], string> = {
  indigo: "text-indigo-600 dark:text-indigo-400",
  amber: "text-amber-600 dark:text-amber-400",
  red: "text-red-600 dark:text-red-400",
  blue: "text-blue-600 dark:text-blue-400",
  emerald: "text-emerald-600 dark:text-emerald-400",
  zinc: "text-zinc-900 dark:text-zinc-50",
};

const deltaColor: Record<ManagerStatTileData["color"], string> = {
  indigo: "text-zinc-400",
  amber: "text-amber-500",
  red: "text-red-500",
  blue: "text-zinc-400",
  emerald: "text-emerald-500",
  zinc: "text-zinc-400",
};

export function ManagerStatTilesRow() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {managerStatTiles.map((tile) => (
        <Card key={tile.id} className="flex flex-col gap-1 p-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{tile.label}</p>
          <p>
            <span className={`text-2xl font-semibold ${valueColor[tile.color]}`}>{tile.value}</span>
          </p>
          <p className="text-xs text-zinc-400">{tile.sublabel}</p>
          {tile.deltaLabel && (
            <p className={`text-xs font-medium ${deltaColor[tile.color]}`}>{tile.deltaLabel}</p>
          )}
        </Card>
      ))}
    </div>
  );
}
