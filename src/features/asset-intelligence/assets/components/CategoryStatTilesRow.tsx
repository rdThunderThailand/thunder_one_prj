import { Card } from "@/components/ui/Card";
import { BoxIcon, ChartIcon, CheckCircleIcon, GridIcon } from "@/components/ui/icons";
import { categoryStatTiles, type CategoryStatTileData } from "../mock-data";

const iconFor: Record<CategoryStatTileData["icon"], React.ReactNode> = {
  box: <BoxIcon />,
  checkCircle: <CheckCircleIcon />,
  boxInactive: <BoxIcon />,
  grid: <GridIcon />,
  chart: <ChartIcon />,
};

export function CategoryStatTilesRow() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {categoryStatTiles.map((tile) => (
        <Card key={tile.id} className="flex flex-col gap-2 p-4">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tile.iconTone}`}>
            {iconFor[tile.icon]}
          </span>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{tile.label}</p>
          <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{tile.value}</p>
          <p className="text-xs text-zinc-400">{tile.sublabel}</p>
        </Card>
      ))}
    </div>
  );
}
