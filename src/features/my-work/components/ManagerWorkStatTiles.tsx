import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { CheckCircleIcon, ClockIcon, ListIcon, WarningTriangleIcon } from "@/components/ui/icons";
import { countByGroup, dueGroup, type MyWork } from "../work-items";

const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

// Five counts from `MyWork`. "Due within 2 days" counts items with a real
// deadline today or in the next 48h; items without a deadline never count.
export function ManagerWorkStatTiles({ work, now }: { work: MyWork; now: Date }) {
  const counts = countByGroup(work.items, now);
  const dueSoon = work.items.filter((item) => {
    const group = dueGroup(item, now);
    if (group === "due-today") return true;
    return group === "upcoming" && item.dueAt !== null && new Date(item.dueAt).getTime() - now.getTime() <= TWO_DAYS_MS;
  }).length;
  const approvals = work.items.filter((item) => item.kind === "approval").length;

  const tiles: { id: string; value: string | number; sublabel: string; icon: ReactNode; tone: string }[] = [
    { id: "open", value: work.items.length, sublabel: "Open items", icon: <ListIcon />, tone: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400" },
    { id: "due-soon", value: dueSoon, sublabel: "Due within 2 days", icon: <ClockIcon />, tone: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" },
    { id: "overdue", value: counts.overdue, sublabel: "Overdue", icon: <WarningTriangleIcon />, tone: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400" },
    { id: "approvals", value: work.available.approval ? approvals : "-", sublabel: "Pending approvals", icon: <CheckCircleIcon />, tone: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" },
    { id: "completed", value: work.completed.length, sublabel: "Completed", icon: <CheckCircleIcon />, tone: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
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
