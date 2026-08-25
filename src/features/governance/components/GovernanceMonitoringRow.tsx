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
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Governance Monitoring</h2>
        <button className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
          View Dashboard
          <ArrowRightIcon className="h-3 w-3" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-4">
          <p className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Compliance by Area</p>
          <ul className="space-y-3">
            {employeeComplianceByArea.map((area) => (
              <li key={area.id}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-zinc-700 dark:text-zinc-200">{area.label}</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">{area.percent}%</span>
                </div>
                <ProgressBar value={area.percent} color={barColor(area.percent)} />
              </li>
            ))}
          </ul>
        </Card>

        <Card className="flex flex-col items-center p-4">
          <p className="mb-3 self-start text-sm font-semibold text-zinc-900 dark:text-zinc-50">Risk Overview</p>
          <div className="relative">
            <DonutChart segments={employeeRiskOverview.segments} size={140} strokeWidth={18} />
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{employeeRiskOverview.total}</span>
              <span className="text-[10px] text-zinc-400">Total Risks</span>
            </div>
          </div>
          <ul className="mt-4 w-full space-y-1.5 text-sm">
            {employeeRiskOverview.segments.map((segment) => (
              <li key={segment.label} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: segment.color }} />
                  {segment.label}
                </span>
                <span className="font-medium text-zinc-900 dark:text-zinc-50">{segment.value}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-4">
          <p className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Internal Controls</p>
          <ul className="space-y-3 text-sm">
            {employeeInternalControls.map((row) => (
              <li key={row.id} className="flex items-center justify-between">
                <span className="text-zinc-600 dark:text-zinc-300">{row.label}</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-50">{row.value}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
