import { Card } from "@/components/ui/Card";
import { ArrowRightIcon, TrendUpIcon, UsersIcon } from "@/components/ui/icons";
import { managerInsights, type ManagerInsightData } from "../mock-data";

const kindLabel: Record<ManagerInsightData["kind"], string> = {
  insight: "Insight",
  risk: "Risk",
  opportunity: "Opportunity",
};

const kindBadgeTone: Record<ManagerInsightData["kind"], string> = {
  insight: "bg-warning-muted text-t1-amber-700",
  risk: "bg-error-muted text-t1-red-700",
  opportunity: "bg-success-muted text-t1-green-700",
};

const kindIconTone: Record<ManagerInsightData["kind"], string> = {
  insight: "text-warning",
  risk: "text-error",
  opportunity: "text-success",
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
        <h2 className="text-sm font-semibold text-foreground">
          {managerInsights.length} Insights worth your attention
        </h2>
        <button className="flex items-center gap-1 text-xs font-medium text-primary hover:text-accent-foreground">
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

            <p className="text-sm font-semibold text-foreground">{insight.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{insight.description}</p>

            <div className="mt-3 space-y-2 text-xs">
              <div>
                <p className="font-medium text-muted-foreground">{insight.factorLabel}</p>
                <p className="text-foreground">{insight.factorDetail}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Evidence</p>
                <p className="text-foreground">{insight.evidence}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Recommendation</p>
                <p className="text-foreground">{insight.recommendation}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-1 items-end gap-2">
              {insight.secondaryActionLabel && (
                <button className="flex-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-t1-gray-50">
                  {insight.secondaryActionLabel}
                </button>
              )}
              <button
                className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  insight.kind === "opportunity"
                    ? "border border-success/30 text-t1-green-700 hover:bg-success-muted"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
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
