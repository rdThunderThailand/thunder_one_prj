import { Card } from "@/components/ui/Card";
import { ArrowRightIcon, TrendUpIcon, UsersIcon } from "@/components/ui/icons";
import { managerInsights, type ManagerInsightData } from "../mock-data";

const kindLabel: Record<ManagerInsightData["kind"], string> = {
  insight: "Insight",
  risk: "Risk",
  opportunity: "Opportunity",
};

const kindBadgeTone: Record<ManagerInsightData["kind"], string> = {
  insight: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  risk: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
  opportunity: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
};

const kindIconTone: Record<ManagerInsightData["kind"], string> = {
  insight: "text-amber-500",
  risk: "text-red-500",
  opportunity: "text-emerald-500",
};

function KindIcon({ kind }: { kind: ManagerInsightData["kind"] }) {
  const cls = `h-4 w-4 ${kindIconTone[kind]}`;
  if (kind === "risk") return <UsersIcon className={cls} />;
  return <TrendUpIcon className={cls} />;
}

export function ManagerInsightsRow() {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {managerInsights.length} Insights worth your attention
        </h2>
        <button className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
          View all insights
          <ArrowRightIcon className="h-3 w-3" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {managerInsights.map((insight) => (
          <Card key={insight.id} className="flex flex-col p-4">
            <div className="mb-2 flex items-start justify-between">
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${kindBadgeTone[insight.kind]}`}
              >
                {kindLabel[insight.kind]}
              </span>
              <KindIcon kind={insight.kind} />
            </div>

            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{insight.title}</p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{insight.description}</p>

            <div className="mt-3 space-y-2 text-xs">
              <div>
                <p className="font-medium text-zinc-500 dark:text-zinc-400">{insight.factorLabel}</p>
                <p className="text-zinc-700 dark:text-zinc-200">{insight.factorDetail}</p>
              </div>
              <div>
                <p className="font-medium text-zinc-500 dark:text-zinc-400">Evidence</p>
                <p className="text-zinc-700 dark:text-zinc-200">{insight.evidence}</p>
              </div>
              <div>
                <p className="font-medium text-zinc-500 dark:text-zinc-400">Recommendation</p>
                <p className="text-zinc-700 dark:text-zinc-200">{insight.recommendation}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-1 items-end gap-2">
              {insight.secondaryActionLabel && (
                <button className="flex-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800">
                  {insight.secondaryActionLabel}
                </button>
              )}
              <button
                className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  insight.kind === "opportunity"
                    ? "border border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-500/30 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
                    : "bg-indigo-600 text-white hover:bg-indigo-500"
                }`}
              >
                {insight.primaryActionLabel}
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
