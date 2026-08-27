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
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{tile.label}</p>
          <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{tile.value}</p>
          {tile.deltaLabel ? (
            <p className="text-xs font-medium text-emerald-500">
              {tile.deltaLabel} <span className="text-zinc-400">{tile.sublabel}</span>
            </p>
          ) : (
            <p className="text-xs text-zinc-400">{tile.sublabel}</p>
          )}
        </Card>
      ))}
    </div>
  );
}
