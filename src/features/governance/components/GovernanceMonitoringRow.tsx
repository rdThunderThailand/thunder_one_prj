import { Card } from "@/components/ui/Card";
import { DonutChart } from "@/components/ui/DonutChart";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ArrowRightIcon } from "@/components/ui/icons";
import { employeeComplianceByArea, employeeInternalControls, employeeRiskOverview } from "../mock-data";

function barColor(percent: number): "emerald" | "amber" | "red" {
  if (percent >= 90) return "emerald";
  if (percent >= 80) return "amber";
  return "red";
}

export function GovernanceMonitoringRow() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Governance Monitoring</h2>
        <button className="flex items-center gap-1 text-xs font-medium text-primary hover:text-accent-foreground">
          View Dashboard
          <ArrowRightIcon className="h-3 w-3" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-4">
          <p className="mb-3 text-sm font-semibold text-foreground">Compliance by Area</p>
          <ul className="space-y-3">
            {employeeComplianceByArea.map((area) => (
              <li key={area.id}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-foreground">{area.label}</span>
                  <span className="font-medium text-foreground">{area.percent}%</span>
                </div>
                <ProgressBar value={area.percent} color={barColor(area.percent)} />
              </li>
            ))}
          </ul>
        </Card>

        <Card className="flex flex-col items-center p-4">
          <p className="mb-3 self-start text-sm font-semibold text-foreground">Risk Overview</p>
          <div className="relative">
            <DonutChart segments={employeeRiskOverview.segments} size={140} strokeWidth={18} />
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-semibold text-foreground">{employeeRiskOverview.total}</span>
              <span className="text-[10px] text-t1-gray-400">Total Risks</span>
            </div>
          </div>
          <ul className="mt-4 w-full space-y-1.5 text-sm">
            {employeeRiskOverview.segments.map((segment) => (
              <li key={segment.label} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: segment.color }} />
                  {segment.label}
                </span>
                <span className="font-medium text-foreground">{segment.value}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-4">
          <p className="mb-3 text-sm font-semibold text-foreground">Internal Controls</p>
          <ul className="space-y-3 text-sm">
            {employeeInternalControls.map((row) => (
              <li key={row.id} className="flex items-center justify-between">
                <span className="text-muted-foreground">{row.label}</span>
                <span className="font-semibold text-foreground">{row.value}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
