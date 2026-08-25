import { ArrowRightIcon, LightbulbIcon, TrendUpIcon } from "@/components/ui/icons";
import { Card } from "@/components/ui/Card";
import { employeeInsight, employeeRecommendation } from "../mock-data";

export function EmployeeInsightsCard() {
  return (
    <Card className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Insights for You</h2>
        <button className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
          View more
          <ArrowRightIcon className="h-3 w-3" />
        </button>
      </div>

      <div className="flex items-start gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400">
          <TrendUpIcon />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{employeeInsight.title}</p>
            <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              {employeeInsight.badge}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{employeeInsight.detail}</p>
        </div>
      </div>

      <div className="mt-4 flex-1 rounded-xl bg-indigo-50/60 p-3 dark:bg-indigo-500/10">
        <div className="flex items-start gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-500 dark:bg-zinc-900">
            <LightbulbIcon />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{employeeRecommendation.title}</p>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{employeeRecommendation.detail}</p>
            <button className="mt-1.5 flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
              {employeeRecommendation.linkLabel}
              <ArrowRightIcon className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}
