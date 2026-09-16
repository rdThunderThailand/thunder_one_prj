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
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Governance Overview</h2>
        <span
          title="Not built yet"
          className="flex cursor-not-allowed items-center gap-1 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
        >
          This Month
          <ChevronDownIcon className="h-3 w-3" />
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">Compliance by Area</p>
          <ul className="space-y-3">
            {complianceByArea.map((area) => (
              <li key={area.id}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-zinc-700 dark:text-zinc-200">{area.label}</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">{area.percent}%</span>
                </div>
                <ProgressBar value={area.percent} color={barColor(area.percent)} />
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col items-center border-t border-zinc-100 pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0 dark:border-zinc-800">
          <p className="mb-3 self-start text-xs font-semibold uppercase tracking-wide text-zinc-400">Risk Overview</p>
          <div className="relative">
            <DonutChart segments={riskOverview.segments} size={140} strokeWidth={18} />
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{riskOverview.total}</span>
              <span className="text-[10px] text-zinc-400">Total Risks</span>
            </div>
          </div>
          <ul className="mt-4 w-full space-y-1.5 text-sm">
            {riskOverview.segments.map((segment) => (
              <li key={segment.label} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: segment.color }} />
                  {segment.label}
                </span>
                <span className="font-medium text-zinc-900 dark:text-zinc-50">{segment.value}</span>
              </li>
            ))}
          </ul>
          <button className="mt-3 flex items-center gap-1 self-start text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
            View all risks
            <ArrowRightIcon className="h-3 w-3" />
          </button>
        </div>

        <div className="border-t border-zinc-100 pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0 dark:border-zinc-800">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">Internal Control Status</p>
          <ul className="space-y-3 text-sm">
            {internalControlStatus.map((row) => (
              <li key={row.id} className="flex items-center justify-between">
                <span className="text-zinc-600 dark:text-zinc-300">{row.label}</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-50">{row.value}</span>
              </li>
            ))}
          </ul>
          <button className="mt-4 flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
            View details
            <ArrowRightIcon className="h-3 w-3" />
          </button>
        </div>
      </div>
    </Card>
  );
}
