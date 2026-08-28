import { Card } from "@/components/ui/Card";
import { Sparkline } from "@/components/ui/Sparkline";
import {
  CalendarIcon,
  CheckCircleIcon,
  MonitorIcon,
  PaperPlaneIcon,
} from "@/components/ui/icons";
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
  paperPlane: <PaperPlaneIcon />,
  calendar: <CalendarIcon />,
  checkCircle: <CheckCircleIcon />,
};

function StatCard({ stat }: { stat: StatCardData }) {
  return (
    <Card className="flex min-h-31 flex-col gap-3 p-4">
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
        {stat.total && (
          <span className="text-sm text-zinc-400">/ {stat.total}</span>
        )}
      </div>
      {stat.delta && <p className="text-xs text-zinc-500 dark:text-zinc-400">{stat.delta}</p>}
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
