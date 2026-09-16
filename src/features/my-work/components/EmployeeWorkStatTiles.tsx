import { Card } from "@/components/ui/Card";
import { CheckCircleIcon, ClipboardIcon, ClockIcon, UsersIcon } from "@/components/ui/icons";
import { employeeWorkStatTiles, type EmployeeWorkStatTileData } from "../mock-data";

const iconFor: Record<EmployeeWorkStatTileData["icon"], React.ReactNode> = {
  dueToday: <ClipboardIcon />,
  upcoming: <ClockIcon />,
  waiting: <UsersIcon />,
  completed: <CheckCircleIcon />,
};

const tone: Record<EmployeeWorkStatTileData["color"], string> = {
  indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400",
  amber: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  purple: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
  emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
};

export function EmployeeWorkStatTiles() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {employeeWorkStatTiles.map((tile) => (
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
