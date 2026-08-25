import { Card } from "@/components/ui/Card";
import { CheckCircleIcon, ClipboardIcon, ShieldIcon, UsersIcon, WarningTriangleIcon } from "@/components/ui/icons";
import { governanceStatTiles, type GovernanceStatTileData } from "../mock-data";

const iconFor: Record<GovernanceStatTileData["icon"], React.ReactNode> = {
  shield: <ShieldIcon />,
  checkCircle: <CheckCircleIcon />,
  warning: <WarningTriangleIcon />,
  document: <ClipboardIcon />,
  users: <UsersIcon />,
};

const tone: Record<GovernanceStatTileData["color"], string> = {
  indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400",
  emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  amber: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  purple: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
  blue: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
};

export function GovernanceStatTiles() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {governanceStatTiles.map((tile) => (
        <Card key={tile.id} className="flex flex-col gap-2 p-4">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tone[tile.color]}`}>
            {iconFor[tile.icon]}
          </span>
          <p>
            <span className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{tile.value}</span>
          </p>
          <p className="text-xs text-zinc-400">{tile.sublabel}</p>
          {tile.deltaLabel && <p className="text-xs font-medium text-emerald-500">{tile.deltaLabel}</p>}
          <button className="mt-1 flex items-center gap-1 text-left text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
            {tile.linkLabel} →
          </button>
        </Card>
      ))}
    </div>
  );
}
