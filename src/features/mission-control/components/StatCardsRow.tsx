import { Card } from "@/components/ui/Card";
import { Sparkline } from "@/components/ui/Sparkline";
import { ChartIcon, CheckCircleIcon, MonitorIcon, WarningTriangleIcon } from "@/components/ui/icons";
import { statCards, type StatCardData } from "../mock-data";

const textColor: Record<StatCardData["color"], string> = {
  indigo: "text-indigo-500",
  blue: "text-blue-500",
  amber: "text-amber-500",
  emerald: "text-emerald-500",
};

const badgeColor: Record<StatCardData["color"], string> = {
  indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400",
  blue: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
  amber: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
};

const iconFor: Record<StatCardData["icon"], React.ReactNode> = {
  monitor: <MonitorIcon />,
  warningTriangle: <WarningTriangleIcon />,
  checkCircle: <CheckCircleIcon />,
  chart: <ChartIcon />,
};

function StatCard({ stat }: { stat: StatCardData }) {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{stat.label}</p>
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${badgeColor[stat.color]}`}
        >
          {iconFor[stat.icon]}
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          {stat.value}
        </span>
      </div>
      <p className="flex items-center gap-1.5 text-xs">
        <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 font-semibold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
          ▲ {stat.delta}
        </span>
        <span className="text-zinc-400">vs last year</span>
      </p>
      <Sparkline data={stat.trend} className={`h-8 w-full ${textColor[stat.color]}`} />
    </Card>
  );
}

export function StatCardsRow() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => (
        <StatCard key={stat.id} stat={stat} />
      ))}
    </div>
  );
}
