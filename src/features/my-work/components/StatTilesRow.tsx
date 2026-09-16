import { Card } from "@/components/ui/Card";
import { CheckCircleIcon, EnvelopeIcon, ImageIcon, ListIcon, UsersIcon, WarningTriangleIcon } from "@/components/ui/icons";
import { workStatTiles, type WorkStatTileData } from "../mock-data";

const iconFor: Record<WorkStatTileData["icon"], React.ReactNode> = {
  tasks: <ListIcon />,
  approvals: <CheckCircleIcon />,
  inbox: <EnvelopeIcon />,
  drafts: <ImageIcon />,
  delegated: <UsersIcon />,
};

const badgeTone: Record<WorkStatTileData["icon"], string> = {
  tasks: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400",
  approvals: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  inbox: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
  drafts: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
  delegated: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
};

const noteTone: Record<WorkStatTileData["noteTone"], string> = {
  red: "text-red-500",
  amber: "text-amber-500",
  blue: "text-blue-500",
  zinc: "text-zinc-400",
};

export function StatTilesRow() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {workStatTiles.map((tile) => (
        <Card key={tile.id} className="flex flex-col gap-2 p-4">
          <div className="flex items-center gap-2">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${badgeTone[tile.icon]}`}
            >
              {iconFor[tile.icon]}
            </span>
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{tile.label}</span>
          </div>
          <span className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{tile.value}</span>
          <p className="text-xs text-zinc-400">{tile.sublabel}</p>
          <p className={`flex items-center gap-1 text-xs font-medium ${noteTone[tile.noteTone]}`}>
            {(tile.noteTone === "red" || tile.noteTone === "amber") && (
              <WarningTriangleIcon className="h-3 w-3" />
            )}
            {tile.note}
          </p>
        </Card>
      ))}
    </div>
  );
}
