import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatTile } from "@/components/ui/StatTile";
import { WarningTriangleIcon, SettingsIcon, MonitorIcon } from "@/components/ui/icons";
import { assetStatTiles, attentionRequired, workStatus, teamWorkload } from "../mock-data";

const iconFor: Record<(typeof attentionRequired)[number]["severity"], React.ReactNode> = {
  red: <WarningTriangleIcon />,
  yellow: <SettingsIcon />,
};

const badgeColor: Record<(typeof attentionRequired)[number]["severity"], string> = {
  red: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400",
  yellow: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400",
};

function AttentionRequiredCard() {
  return (
    <Card className="flex h-full flex-col p-4">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Attention Required
      </h2>
      <ul className="flex flex-1 flex-col gap-3">
        {attentionRequired.map((row) => (
          <li key={row.id} className="flex items-center gap-2.5">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${badgeColor[row.severity]}`}
            >
              {iconFor[row.severity]}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {row.title}
              </p>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{row.subtitle}</p>
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

function WorkStatusCard() {
  return (
    <Card className="flex h-full flex-col p-4">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        <MonitorIcon className="h-4 w-4 text-zinc-400" /> Work Status
      </h2>
      <ul className="flex flex-1 flex-col gap-2.5">
        {workStatus.map((row) => (
          <li key={row.label} className="flex items-center justify-between text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">{row.label}</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-50">{row.count}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function TeamWorkloadCard() {
  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Team Workload</h2>
      <div className="flex flex-col gap-3">
        {teamWorkload.map((row) => (
          <div key={row.name}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-zinc-500 dark:text-zinc-400">{row.name}</span>
              <span
                className={row.overloaded ? "font-medium text-red-500" : "text-zinc-400"}
              >
                {row.current} tasks{row.overloaded ? " (Overload)" : ""}
              </span>
            </div>
            <ProgressBar
              value={(row.current / row.max) * 100}
              color={row.overloaded ? "red" : "indigo"}
            />
          </div>
        ))}
      </div>
    </Card>
  );
}

export function AssetOverviewDashboard() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {assetStatTiles.map((tile) => (
          <StatTile key={tile.id} label={tile.label} value={tile.value} color={tile.color} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AttentionRequiredCard />
        <WorkStatusCard />
      </div>
      <TeamWorkloadCard />
    </div>
  );
}
