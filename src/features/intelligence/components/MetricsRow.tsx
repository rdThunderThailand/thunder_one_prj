import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Sparkline } from "@/components/ui/Sparkline";
import { ChevronRightIcon, CurrencyIcon, GaugeIcon, HeartIcon, ShieldIcon, SmileIcon, UsersIcon } from "@/components/ui/icons";
import { headlineMetrics, type HeadlineMetricData } from "../mock-data";

const iconFor: Record<HeadlineMetricData["icon"], React.ReactNode> = {
  heart: <HeartIcon />,
  gauge: <GaugeIcon />,
  currency: <CurrencyIcon />,
  users: <UsersIcon />,
  smile: <SmileIcon />,
  shield: <ShieldIcon />,
};

export function MetricsRow() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {headlineMetrics.map((metric) => (
        <Card key={metric.id} className="flex flex-col gap-3 p-4">
          <div className="flex items-center gap-1.5">
            <span className={`h-4 w-4 shrink-0 ${metric.iconTone}`}>{iconFor[metric.icon]}</span>
            <p className="truncate text-sm font-medium text-foreground">{metric.label}</p>
            {metric.emphasize && <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 text-t1-gray-400" />}
          </div>

          <div>
            <p>
              <span
                className={`text-2xl font-semibold ${metric.emphasize ? "text-t1-green-700" : "text-foreground"}`}
              >
                {metric.value}
              </span>
              {metric.unit && <span className="ml-0.5 text-sm text-t1-gray-400">{metric.unit}</span>}
            </p>
            <p
              className={`text-xs ${metric.emphasize ? "text-t1-green-700" : "text-t1-gray-400"}`}
            >
              {metric.status}
            </p>
          </div>

          <p className="flex items-center gap-1 text-xs text-t1-gray-400">
            {metric.deltaCaption}
            <span className="font-medium text-t1-blue-700">{metric.deltaLabel}</span>
          </p>

          {metric.viz.type === "sparkline" ? (
            <Sparkline data={metric.viz.data} className={`h-8 w-full ${metric.viz.color}`} />
          ) : (
            <ProgressBar value={metric.viz.value} color={metric.viz.color} />
          )}
        </Card>
      ))}
    </div>
  );
}
