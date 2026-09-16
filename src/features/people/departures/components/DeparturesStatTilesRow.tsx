import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { CalendarIcon, CheckIcon, ClockIcon, UsersIcon } from "@/components/ui/icons";
import { departureStatTiles, type DepartureStatTile } from "../mock-data";

const iconFor: Record<DepartureStatTile["icon"], ReactNode> = {
  users: <UsersIcon className="h-4 w-4" />,
  clock: <ClockIcon className="h-4 w-4" />,
  calendar: <CalendarIcon className="h-4 w-4" />,
  check: <CheckIcon className="h-4 w-4" />,
  cancelled: <ClockIcon className="h-4 w-4" />,
};

export function DeparturesStatTilesRow() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {departureStatTiles.map((tile) => (
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
