import { Card } from "@/components/ui/Card";
import { Sparkline } from "@/components/ui/Sparkline";
import { CheckCircleIcon, ClipboardIcon, ClockIcon, UsersIcon } from "@/components/ui/icons";
import { employeeIntelStatTiles, type EmployeeStatTileData } from "../mock-data";

const iconFor: Record<EmployeeStatTileData["icon"], React.ReactNode> = {
  inProgress: <ClipboardIcon />,
  dueSoon: <ClockIcon />,
  onTime: <CheckCircleIcon />,
  collaboration: <UsersIcon />,
};

export function EmployeeIntelStatTiles() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {employeeIntelStatTiles.map((tile) => (
        <Card key={tile.id} className="flex flex-col gap-2 p-4">
          <div className="flex items-center gap-2">
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tile.iconTone}`}>
              {iconFor[tile.icon]}
            </span>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{tile.label}</p>
          </div>
          <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{tile.value}</p>
          <p className="text-xs text-zinc-400">{tile.sublabel}</p>
          <p className={`text-xs font-medium ${tile.trendColor}`}>{tile.deltaLabel}</p>
          <Sparkline data={tile.trend} className={`h-8 w-full ${tile.trendColor}`} />
        </Card>
      ))}
    </div>
  );
}
