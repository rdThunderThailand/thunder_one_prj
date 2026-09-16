import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { BoxIcon, CheckCircleIcon, ClipboardIcon, ClockIcon, EditIcon } from "@/components/ui/icons";
import { policyStatTiles, type PolicyStatTile } from "../mock-data";

const iconFor: Record<PolicyStatTile["icon"], ReactNode> = {
  document: <ClipboardIcon className="h-4 w-4" />,
  check: <CheckCircleIcon className="h-4 w-4" />,
  clock: <ClockIcon className="h-4 w-4" />,
  edit: <EditIcon className="h-4 w-4" />,
  archive: <BoxIcon className="h-4 w-4" />,
};

export function PolicyStatTilesRow() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {policyStatTiles.map((tile) => (
        <Card key={tile.id} className="flex flex-col gap-2 p-4">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tile.iconTone}`}>
            {iconFor[tile.icon]}
          </span>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{tile.label}</p>
          <span className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{tile.value}</span>
          <p className="text-xs text-zinc-400">{tile.sublabel}</p>
        </Card>
      ))}
    </div>
  );
}
