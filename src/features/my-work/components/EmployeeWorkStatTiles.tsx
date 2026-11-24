import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { CheckCircleIcon, ClipboardIcon, ClockIcon, UsersIcon } from "@/components/ui/icons";
import { countByGroup, type MyWork } from "../work-items";

export function EmployeeWorkStatTiles({ work, now }: { work: MyWork; now: Date }) {
  const counts = countByGroup(work.items, now);
  const tiles: { id: string; value: number; sublabel: string; icon: ReactNode; tone: string }[] = [
    { id: "due-today", value: counts["due-today"] + counts.overdue, sublabel: "Due today or overdue", icon: <ClipboardIcon />, tone: "bg-accent text-primary" },
    { id: "upcoming", value: counts.upcoming + counts["no-due"], sublabel: "Upcoming", icon: <ClockIcon />, tone: "bg-warning-muted text-t1-amber-700" },
    { id: "waiting", value: work.items.filter((item) => item.kind === "waiting").length, sublabel: "Waiting on others", icon: <UsersIcon />, tone: "bg-in-progress-muted text-t1-purple-700" },
    { id: "completed", value: work.completed.length, sublabel: "Completed", icon: <CheckCircleIcon />, tone: "bg-success-muted text-t1-green-700" },
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
            <p className="text-xl font-semibold text-foreground">{tile.value}</p>
            <p className="text-xs text-t1-gray-400">{tile.sublabel}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
