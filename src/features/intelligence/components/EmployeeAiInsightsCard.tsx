import { Card } from "@/components/ui/Card";
import { ClockIcon, TargetIcon, TrendUpIcon } from "@/components/ui/icons";
import { employeeAiInsights, type EmployeeAiInsightData } from "../mock-data";

const iconFor: Record<EmployeeAiInsightData["icon"], React.ReactNode> = {
  target: <TargetIcon />,
  trendUp: <TrendUpIcon />,
  clock: <ClockIcon />,
};

export function EmployeeAiInsightsCard() {
  return (
    <Card className="flex flex-col gap-4 p-4">
      {employeeAiInsights.map((insight) => (
        <div key={insight.id} className="flex items-start gap-3 border-b border-zinc-100 pb-4 last:border-0 last:pb-0 dark:border-zinc-800">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${insight.iconTone}`}>
            {iconFor[insight.icon]}
          </span>
          <div className="flex-1">
            <p className="text-xs font-medium text-zinc-400">{insight.eyebrow}</p>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{insight.title}</p>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{insight.detail}</p>
            {insight.actionLabel && (
              <span
                title="Not built yet"
                className="mt-2 inline-flex cursor-not-allowed items-center rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
              >
                {insight.actionLabel}
              </span>
            )}
          </div>
        </div>
      ))}
    </Card>
  );
}
