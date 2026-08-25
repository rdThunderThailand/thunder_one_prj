import { Card } from "@/components/ui/Card";
import { MonitorIcon, SettingsIcon, WarningTriangleIcon } from "@/components/ui/icons";
import { recentAlerts } from "../mock-data";

const dotColor: Record<(typeof recentAlerts)[number]["severity"], string> = {
  red: "bg-red-500",
  yellow: "bg-amber-500",
  blue: "bg-blue-500",
};

const badgeColor: Record<(typeof recentAlerts)[number]["severity"], string> = {
  red: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400",
  yellow: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400",
  blue: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400",
};

const iconFor: Record<(typeof recentAlerts)[number]["severity"], React.ReactNode> = {
  red: <WarningTriangleIcon />,
  yellow: <SettingsIcon />,
  blue: <MonitorIcon />,
};

export function RecentAlertsCard() {
  return (
    <Card className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Recent Alerts</h2>
        <button className="text-xs font-medium text-indigo-600 hover:text-indigo-500">
          View all
        </button>
      </div>
      <ul className="flex flex-1 flex-col gap-3">
        {recentAlerts.map((alert) => (
          <li key={alert.id} className="flex items-center gap-2.5">
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotColor[alert.severity]}`} />
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
          </li>
        ))}
      </ul>
    </Card>
  );
}
