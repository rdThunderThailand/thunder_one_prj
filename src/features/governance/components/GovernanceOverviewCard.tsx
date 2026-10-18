import { Card } from "@/components/ui/Card";
import { DonutChart } from "@/components/ui/DonutChart";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ArrowRightIcon, ChevronDownIcon } from "@/components/ui/icons";
import { complianceByArea, internalControlStatus, riskOverview } from "../mock-data";

function barColor(percent: number): "emerald" | "amber" | "red" {
  if (percent >= 90) return "emerald";
  if (percent >= 80) return "amber";
  return "red";
}

export function GovernanceOverviewCard() {
  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Governance Overview</h2>
        <span
          title="Not built yet"
          className="flex cursor-not-allowed items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground"
        >
          This Month
          <ChevronDownIcon className="h-3 w-3" />
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-t1-gray-400">Compliance by Area</p>
          <ul className="space-y-3">
            {complianceByArea.map((area) => (
              <li key={area.id}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-foreground">{area.label}</span>
                  <span className="font-medium text-foreground">{area.percent}%</span>
                </div>
                <ProgressBar value={area.percent} color={barColor(area.percent)} />
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col items-center border-t border-border pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <p className="mb-3 self-start text-xs font-semibold uppercase tracking-wide text-t1-gray-400">Risk Overview</p>
          <div className="relative">
            <DonutChart segments={riskOverview.segments} size={140} strokeWidth={18} />
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-semibold text-foreground">{riskOverview.total}</span>
              <span className="text-[10px] text-t1-gray-400">Total Risks</span>
            </div>
          </div>
          <ul className="mt-4 w-full space-y-1.5 text-sm">
            {riskOverview.segments.map((segment) => (
              <li key={segment.label} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: segment.color }} />
                  {segment.label}
                </span>
                <span className="font-medium text-foreground">{segment.value}</span>
              </li>
            ))}
          </ul>
          <button className="mt-3 flex items-center gap-1 self-start text-xs font-medium text-primary hover:text-accent-foreground">
            View all risks
            <ArrowRightIcon className="h-3 w-3" />
          </button>
        </div>

        <div className="border-t border-border pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-t1-gray-400">Internal Control Status</p>
          <ul className="space-y-3 text-sm">
            {internalControlStatus.map((row) => (
              <li key={row.id} className="flex items-center justify-between">
                <span className="text-muted-foreground">{row.label}</span>
                <span className="font-semibold text-foreground">{row.value}</span>
              </li>
            ))}
          </ul>
          <button className="mt-4 flex items-center gap-1 text-xs font-medium text-primary hover:text-accent-foreground">
            View details
            <ArrowRightIcon className="h-3 w-3" />
          </button>
        </div>
      </div>
    </Card>
  );
}
