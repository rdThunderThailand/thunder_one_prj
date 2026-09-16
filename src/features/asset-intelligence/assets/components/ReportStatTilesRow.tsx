import { Card } from "@/components/ui/Card";
import { BoxIcon, CheckCircleIcon, ClipboardIcon, CurrencyIcon, SettingsIcon, WarningTriangleIcon } from "@/components/ui/icons";
import { reportStatTiles, type ReportStatTileData } from "../mock-data";

const iconFor: Record<ReportStatTileData["icon"], React.ReactNode> = {
  box: <BoxIcon />,
  checkCircle: <CheckCircleIcon />,
  wrench: <SettingsIcon />,
  warning: <WarningTriangleIcon />,
  clipboard: <ClipboardIcon />,
  currency: <CurrencyIcon />,
};

export function ReportStatTilesRow() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {reportStatTiles.map((tile) => (
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
