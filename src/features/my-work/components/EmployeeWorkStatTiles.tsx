import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { CheckCircleIcon, ClipboardIcon, ClockIcon, UsersIcon } from "@/components/ui/icons";
import { countByGroup, type MyWork } from "../work-items";

export function EmployeeWorkStatTiles({ work, now }: { work: MyWork; now: Date }) {
  const counts = countByGroup(work.items, now);
  const tiles: { id: string; value: number; sublabel: string; icon: ReactNode; tone: string }[] = [
    { id: "due-today", value: counts["due-today"] + counts.overdue, sublabel: "Due today or overdue", icon: <ClipboardIcon />, tone: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400" },
    { id: "upcoming", value: counts.upcoming + counts["no-due"], sublabel: "Upcoming", icon: <ClockIcon />, tone: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" },
    { id: "waiting", value: work.items.filter((item) => item.kind === "waiting").length, sublabel: "Waiting on others", icon: <UsersIcon />, tone: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400" },
    { id: "completed", value: work.completed.length, sublabel: "Completed", icon: <CheckCircleIcon />, tone: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {tiles.map((tile) => (
        <Card
          key={tile.id}
          className="flex items-center gap-3 p-4"
        >
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tile.tone}`}>
            {tile.icon}
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
