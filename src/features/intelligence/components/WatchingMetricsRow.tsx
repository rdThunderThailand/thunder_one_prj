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
  calendar: "bg-accent text-primary",
  warning: "bg-error-muted text-error",
  trendUp: "bg-success-muted text-success",
  currency: "bg-info-muted text-info",
  users: "bg-warning-muted text-warning",
};

const statusColor: Record<WatchingMetricData["statusTone"], string> = {
  red: "text-error",
  amber: "text-warning",
  emerald: "text-success",
  blue: "text-info",
  zinc: "text-t1-gray-400",
};

export function WatchingMetricsRow() {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          What I&apos;m watching
          <InfoIcon className="h-3.5 w-3.5 text-t1-gray-400" />
        </h2>
        <button className="flex items-center gap-1 text-xs font-medium text-primary hover:text-accent-foreground">
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
              <p className="truncate text-xs text-muted-foreground">{metric.label}</p>
            </div>
            <p className="text-lg font-semibold text-foreground">{metric.value}</p>
            <p className={`text-xs font-medium ${statusColor[metric.statusTone]}`}>{metric.status}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
