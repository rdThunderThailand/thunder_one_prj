import { Card } from "@/components/ui/Card";
import { CheckCircleIcon, ListIcon, MegaphoneIcon, StarIcon, TrendUpIcon } from "@/components/ui/icons";
import { employeeStatTiles, type EmployeeStatTileData } from "../mock-data";

const iconFor: Record<EmployeeStatTileData["icon"], React.ReactNode> = {
  focus: <ListIcon />,
  checkCircle: <CheckCircleIcon />,
  megaphone: <MegaphoneIcon />,
  trendUp: <TrendUpIcon />,
  star: <StarIcon className="h-4 w-4" />,
};

const tone: Record<EmployeeStatTileData["color"], string> = {
  indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400",
  emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  purple: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
  blue: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
  amber: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
};

export function EmployeeStatTilesRow() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {employeeStatTiles.map((tile) => (
        <Card key={tile.id} className="flex items-center gap-3 p-4">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tone[tile.color]}`}>
            {iconFor[tile.icon]}
          </span>
          <div>
            <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">{tile.value}</p>
            <p className="text-xs text-zinc-400">{tile.sublabel}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
