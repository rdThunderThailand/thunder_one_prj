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
          <p className="text-xs text-muted-foreground">{tile.label}</p>
          <p className="text-2xl font-semibold text-foreground">{tile.value}</p>
          {tile.id === "overdue" ? (
            <button className="text-left text-xs font-medium text-error hover:text-t1-red-700">{tile.sublabel}</button>
          ) : (
            <p className="text-xs text-t1-gray-400">{tile.sublabel}</p>
          )}
        </Card>
      ))}
    </div>
  );
}
