import { ArrowRightIcon, LightbulbIcon, TrendUpIcon } from "@/components/ui/icons";
import { Card } from "@/components/ui/Card";
import { employeeInsight, employeeRecommendation } from "../mock-data";

export function EmployeeInsightsCard() {
  return (
    <Card className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Insights for You</h2>
        <button className="flex items-center gap-1 text-xs font-medium text-primary hover:text-accent-foreground">
          View more
          <ArrowRightIcon className="h-3 w-3" />
        </button>
      </div>

      <div className="flex items-start gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-success-muted text-success">
          <TrendUpIcon />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-foreground">{employeeInsight.title}</p>
            <span className="shrink-0 rounded-full bg-success-muted px-2 py-0.5 text-[11px] font-semibold text-t1-green-700">
              {employeeInsight.badge}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{employeeInsight.detail}</p>
        </div>
      </div>

      <div className="mt-4 flex-1 rounded-xl bg-accent/60 p-3">
        <div className="flex items-start gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-card text-primary">
            <LightbulbIcon />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">{employeeRecommendation.title}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{employeeRecommendation.detail}</p>
            <button className="mt-1.5 flex items-center gap-1 text-xs font-medium text-primary hover:text-accent-foreground">
              {employeeRecommendation.linkLabel}
              <ArrowRightIcon className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}
