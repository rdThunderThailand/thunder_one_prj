import { Card } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/StatTile";
import { customerAttention, serviceStatTiles, todayCard } from "../mock-data";

const dotColor: Record<(typeof customerAttention)[number]["severity"], string> = {
  red: "bg-red-500",
  yellow: "bg-amber-500",
  green: "bg-emerald-500",
};

const actionColor: Record<(typeof customerAttention)[number]["severity"], string> = {
  red: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
  yellow: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  green: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
};

function CustomerAttentionCard() {
  return (
    <Card className="flex h-full flex-col p-4">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Customer Attention
      </h2>
      <ul className="flex flex-1 flex-col gap-3">
        {customerAttention.map((row) => (
          <li key={row.id} className="flex items-center gap-2.5">
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotColor[row.severity]}`} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {row.name}
              </p>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{row.subtitle}</p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${actionColor[row.severity]}`}
            >
              Open
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function TodayCard() {
  return (
    <Card className="p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">Today</p>
      <div className="flex flex-col gap-2.5 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-zinc-500 dark:text-zinc-400">Open Work Orders</span>
          <span className="font-medium text-zinc-900 dark:text-zinc-50">
            {todayCard.openWorkOrders}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-zinc-500 dark:text-zinc-400">SLA Risk</span>
          <span className="font-medium text-amber-500">{todayCard.slaRisk}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-zinc-500 dark:text-zinc-400">Onsite</span>
          <span className="font-medium text-zinc-900 dark:text-zinc-50">{todayCard.onsite}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-zinc-500 dark:text-zinc-400">Remote</span>
          <span className="font-medium text-zinc-900 dark:text-zinc-50">{todayCard.remote}</span>
        </div>
      </div>
    </Card>
  );
}

export function ServiceOpsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {serviceStatTiles.map((tile) => (
          <StatTile key={tile.id} label={tile.label} value={tile.value} color={tile.color} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CustomerAttentionCard />
        </div>
        <TodayCard />
      </div>
    </div>
  );
}
