import { Card } from "@/components/ui/Card";
import { changeStatTiles } from "../mock-data";

export function ChangesStatTilesRow() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {changeStatTiles.map((tile) => (
        <Card key={tile.id} className="flex flex-col gap-1 p-4">
          <p className="text-xs text-muted-foreground">{tile.label}</p>
          <span className="text-2xl font-semibold text-foreground">{tile.value}</span>
          <p className="text-xs text-t1-gray-400">{tile.sublabel}</p>
        </Card>
      ))}
    </div>
  );
}
