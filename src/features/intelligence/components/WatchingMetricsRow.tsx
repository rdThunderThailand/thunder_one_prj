import { Card } from "@/components/ui/Card";
import { ArrowRightIcon, CalendarIcon, CurrencyIcon, InfoIcon, TrendUpIcon, UsersIcon, WarningTriangleIcon } from "@/components/ui/icons";
import { watchingMetrics, type WatchingMetricData } from "../mock-data";

const iconFor: Record<WatchingMetricData["icon"], React.ReactNode> = {
  calendar: <CalendarIcon />,
  warning: <WarningTriangleIcon />,
  trendUp: <TrendUpIcon />,
  currency: <CurrencyIcon />,
  users: <UsersIcon />,
};

const iconTone: Record<WatchingMetricData["icon"], string> = {
  calendar: "bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400",
  warning: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400",
  trendUp: "bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400",
  currency: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400",
  users: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400",
};

const statusColor: Record<WatchingMetricData["statusTone"], string> = {
  red: "text-red-500",
  amber: "text-amber-500",
  emerald: "text-emerald-500",
  blue: "text-blue-500",
  zinc: "text-zinc-400",
};

export function WatchingMetricsRow() {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          What I&apos;m watching
          <InfoIcon className="h-3.5 w-3.5 text-zinc-300" />
        </h2>
        <button className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
          View all
          <ArrowRightIcon className="h-3 w-3" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {watchingMetrics.map((metric) => (
          <div key={metric.id}>
            <div className="mb-2 flex items-center gap-1.5">
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${iconTone[metric.icon]}`}>
                {iconFor[metric.icon]}
              </span>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{metric.label}</p>
            </div>
            <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{metric.value}</p>
            <p className={`text-xs font-medium ${statusColor[metric.statusTone]}`}>{metric.status}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
