import { Card } from "@/components/ui/Card";
import { managerStatTiles, type ManagerStatTileData } from "../mock-data";

const valueColor: Record<ManagerStatTileData["color"], string> = {
  indigo: "text-primary",
  amber: "text-t1-amber-700",
  red: "text-t1-red-700",
  blue: "text-t1-blue-700",
  emerald: "text-t1-green-700",
  zinc: "text-foreground",
};

const deltaColor: Record<ManagerStatTileData["color"], string> = {
  indigo: "text-t1-gray-400",
  amber: "text-warning",
  red: "text-error",
  blue: "text-t1-gray-400",
  emerald: "text-success",
  zinc: "text-t1-gray-400",
};

export function ManagerStatTilesRow() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {managerStatTiles.map((tile) => (
        <Card key={tile.id} className="flex flex-col gap-1 p-4">
          <p className="text-xs text-muted-foreground">{tile.label}</p>
          <p>
            <span className={`text-2xl font-semibold ${valueColor[tile.color]}`}>{tile.value}</span>
          </p>
          <p className="text-xs text-t1-gray-400">{tile.sublabel}</p>
          {tile.deltaLabel && (
            <p className={`text-xs font-medium ${deltaColor[tile.color]}`}>{tile.deltaLabel}</p>
          )}
        </Card>
      ))}
    </div>
  );
}
