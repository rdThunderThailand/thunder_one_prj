import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { CheckCircleIcon, ClockIcon, EnvelopeIcon, ImageIcon, ListIcon, WarningTriangleIcon } from "@/components/ui/icons";
import { countByGroup, type MyWork, type WorkItemKind } from "../work-items";

interface TileSpec {
  id: string;
  label: string;
  icon: ReactNode;
  tone: string;
  /** `null` = no Core source for this tile at all. */
  kind: WorkItemKind | null;
  sublabel: string;
}

const TILES: TileSpec[] = [
  { id: "tasks", label: "Tasks", icon: <ListIcon />, tone: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400", kind: "task", sublabel: "To do" },
  { id: "approvals", label: "Approvals", icon: <CheckCircleIcon />, tone: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400", kind: "approval", sublabel: "Waiting for you" },
  { id: "drafts", label: "Drafts", icon: <ImageIcon />, tone: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400", kind: "draft", sublabel: "Unpublished" },
  { id: "waiting", label: "Waiting", icon: <ClockIcon />, tone: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400", kind: "waiting", sublabel: "Pending response" },
  { id: "inbox", label: "Inbox", icon: <EnvelopeIcon />, tone: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400", kind: null, sublabel: "No data source yet" },
];

/**
 * Five top-line counts from `MyWork`. A tile whose source failed or that
 * this user can't read shows "-" (not 0); "Inbox" has no Core source at all.
 * The red note only appears when an item of that kind is actually overdue.
 */
export function StatTilesRow({ work, now }: { work: MyWork; now: Date }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {TILES.map((tile) => {
        const available = tile.kind !== null && work.available[tile.kind];
        const items = tile.kind ? work.items.filter((item) => item.kind === tile.kind) : [];
        const overdue = countByGroup(items, now).overdue;
        return (
          <Card
            key={tile.id}
            className="flex flex-col gap-2 p-4"
          >
            <div className="flex items-center gap-2">
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${tile.tone}`}>
                {tile.icon}
              </span>
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{tile.label}</span>
            </div>
            <span className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              {available ? items.length : "-"}
            </span>
            <p className="text-xs text-zinc-400">{tile.kind !== null && !available ? "Not available" : tile.sublabel}</p>
            {overdue > 0 && (
              <p className="flex items-center gap-1 text-xs font-medium text-red-500">
                <WarningTriangleIcon className="h-3 w-3" />
                {overdue} overdue
              </p>
            )}
          </Card>
        );
      })}
    </div>
  );
}
