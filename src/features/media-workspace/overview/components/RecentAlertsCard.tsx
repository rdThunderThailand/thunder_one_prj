import { Card } from "@/components/ui/Card";
import { ArrowRightIcon, MonitorIcon, SettingsIcon, XIcon } from "@/components/ui/icons";
import { recentAlerts } from "../mock-data";

const badgeColor: Record<(typeof recentAlerts)[number]["severity"], string> = {
  red: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400",
  yellow: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400",
  blue: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400",
};

const iconFor: Record<(typeof recentAlerts)[number]["severity"], React.ReactNode> = {
  red: <XIcon />,
  yellow: <SettingsIcon />,
  blue: <MonitorIcon />,
};

export function RecentAlertsCard() {
  return (
    <Card className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Needs Attention</h2>
        <button disabled title="Alerts page is not built yet" className="flex items-center gap-1 text-xs font-medium text-indigo-600 disabled:cursor-not-allowed disabled:opacity-45">
          View all alerts <ArrowRightIcon />
        </button>
      </div>
      <ul className="flex flex-1 flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
        {recentAlerts.map((alert) => (
          <li key={alert.id} className="flex items-center gap-2.5 py-2 first:pt-0 last:pb-0">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${badgeColor[alert.severity]}`}
            >
              {iconFor[alert.severity]}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {alert.title}
              </p>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                {alert.subtitle}
              </p>
            </div>
            <span className="shrink-0 text-xs text-zinc-400">{alert.timeAgo}</span>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">{alert.category}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
