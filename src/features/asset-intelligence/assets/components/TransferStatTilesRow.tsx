import { Card } from "@/components/ui/Card";
import { CheckCircleIcon, ClockIcon, RepeatIcon, XIcon } from "@/components/ui/icons";
import { transferStatTiles, type TransferStatTileData } from "../mock-data";

const iconFor: Record<TransferStatTileData["icon"], React.ReactNode> = {
  repeat: <RepeatIcon />,
  checkCircle: <CheckCircleIcon />,
  clock: <ClockIcon />,
  truck: <RepeatIcon />,
  xCircle: <XIcon />,
};

export function TransferStatTilesRow() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {transferStatTiles.map((tile) => (
        <Card key={tile.id} className="flex flex-col gap-2 p-4">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tile.iconTone}`}>
            {iconFor[tile.icon]}
          </span>
          <p className="text-xs text-muted-foreground">{tile.label}</p>
          <p className="text-2xl font-semibold text-foreground">{tile.value}</p>
          {tile.deltaLabel ? (
            <p className="text-xs font-medium text-success">
              {tile.deltaLabel} <span className="text-t1-gray-400">{tile.sublabel}</span>
            </p>
          ) : (
            <p className="text-xs text-t1-gray-400">{tile.sublabel}</p>
          )}
        </Card>
      ))}
    </div>
  );
}
