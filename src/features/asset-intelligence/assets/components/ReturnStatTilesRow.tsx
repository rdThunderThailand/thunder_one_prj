import { Card } from "@/components/ui/Card";
import { CheckCircleIcon, ClipboardIcon, RepeatIcon, WarningTriangleIcon } from "@/components/ui/icons";
import { returnStatTiles, type ReturnStatTileData } from "../mock-data";

const iconFor: Record<ReturnStatTileData["icon"], React.ReactNode> = {
  repeat: <RepeatIcon />,
  truck: <RepeatIcon />,
  clipboard: <ClipboardIcon />,
  checkCircle: <CheckCircleIcon />,
  warning: <WarningTriangleIcon />,
};

export function ReturnStatTilesRow() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {returnStatTiles.map((tile) => (
        <Card key={tile.id} className="flex flex-col gap-2 p-4">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tile.iconTone}`}>
            {iconFor[tile.icon]}
          </span>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{tile.label}</p>
          <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{tile.value}</p>
          {tile.id === "overdue" ? (
            <button className="text-left text-xs font-medium text-red-500 hover:text-red-600">{tile.sublabel}</button>
          ) : (
            <p className="text-xs text-zinc-400">{tile.sublabel}</p>
          )}
        </Card>
      ))}
    </div>
  );
}
