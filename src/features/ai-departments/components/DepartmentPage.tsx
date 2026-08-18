import { Card } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/StatTile";
import { SettingsIcon, WarningTriangleIcon } from "@/components/ui/icons";
import { departmentStatTiles, needsAttention, requestsSummary } from "../mock-data";

const badgeColor: Record<(typeof needsAttention)[number]["severity"], string> = {
  red: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400",
  yellow: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400",
};

const iconFor: Record<(typeof needsAttention)[number]["severity"], React.ReactNode> = {
  red: <WarningTriangleIcon />,
  yellow: <SettingsIcon />,
};

function NeedsAttentionCard() {
  return (
    <Card className="flex h-full flex-col p-4">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Needs Attention
      </h2>
      <ul className="flex flex-1 flex-col gap-3">
        {needsAttention.map((row) => (
          <li key={row.id} className="flex items-center gap-2.5">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${badgeColor[row.severity]}`}
            >
              {iconFor[row.severity]}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {row.tag}
              </p>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                {row.subtitle} · Assigned: {row.assignee}
              </p>
            </div>
            <button className="shrink-0 text-xs font-medium text-indigo-600 hover:text-indigo-500">
              Review
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function RequestsCard() {
  return (
    <Card className="flex h-full flex-col p-4">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Requests</h2>
      <ul className="flex flex-1 flex-col gap-2.5">
        <li className="flex items-center justify-between text-sm">
          <span className="text-zinc-500 dark:text-zinc-400">Waiting IT</span>
          <span className="font-medium text-zinc-900 dark:text-zinc-50">
            {requestsSummary.waitingIT}
          </span>
        </li>
        <li className="flex items-center justify-between text-sm">
          <span className="text-zinc-500 dark:text-zinc-400">Completed Today</span>
          <span className="font-medium text-zinc-900 dark:text-zinc-50">
            {requestsSummary.completedToday}
          </span>
        </li>
      </ul>
    </Card>
  );
}

export function DepartmentPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {departmentStatTiles.map((tile) => (
          <StatTile key={tile.id} label={tile.label} value={tile.value} color={tile.color} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <NeedsAttentionCard />
        <RequestsCard />
      </div>
      <button className="self-start text-sm font-medium text-indigo-600 hover:text-indigo-500">
        View all department assets →
      </button>
    </div>
  );
}
