import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Sparkline } from "@/components/ui/Sparkline";
import { SparklesIcon } from "@/components/ui/icons";
import { strategicBrief } from "../mock-data";

// CEO-01/CEO-02 rolled into one AI-style brief — five headline metrics next
// to a short summary, matching the requirement doc's "Strategic Brief" mockup.
export function StrategicBriefCard() {
  const { summary, organizationHealth, keyPriorities, financialSnapshot, engagement, criticalRisks } =
    strategicBrief;

  return (
    <Card className="p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-2">
        <SparklesIcon className="h-4 w-4 text-indigo-500" />
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Strategic Brief</h2>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr_1fr_1fr_1fr_0.8fr]">
        <ul className="space-y-1.5 text-sm text-zinc-600 dark:text-zinc-300">
          {summary.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>

        <div className="border-t border-zinc-100 pt-3 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6 dark:border-zinc-800">
          <p className="text-xs text-zinc-400">Organization Health</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {organizationHealth.score}
            <span className="text-sm font-normal text-zinc-400">/100</span>
          </p>
          <p className="mt-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            {organizationHealth.status}
          </p>
          <Sparkline data={organizationHealth.trend} className="mt-2 h-8 w-full text-emerald-500" />
        </div>

        <div className="border-t border-zinc-100 pt-3 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6 dark:border-zinc-800">
          <p className="text-xs text-zinc-400">Key Priorities</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {keyPriorities.active}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">Active</p>
          <div className="mt-2 space-y-0.5 text-xs">
            <p className="text-emerald-600 dark:text-emerald-400">On Track {keyPriorities.onTrack}</p>
            <p className="text-red-500">At Risk {keyPriorities.atRisk}</p>
          </div>
        </div>

        <div className="border-t border-zinc-100 pt-3 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6 dark:border-zinc-800">
          <p className="text-xs text-zinc-400">Financial Snapshot</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {financialSnapshot.budgetUtilization}%
          </p>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">Budget Utilization</p>
          <ProgressBar value={financialSnapshot.budgetUtilization} className="mt-2" />
        </div>

        <div className="border-t border-zinc-100 pt-3 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6 dark:border-zinc-800">
          <p className="text-xs text-zinc-400">Engagement (This Week)</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {engagement.interactions}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">Interactions</p>
          <Sparkline data={engagement.trend} className="mt-2 h-8 w-full text-blue-500" />
        </div>

        <div className="border-t border-zinc-100 pt-3 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6 dark:border-zinc-800">
          <p className="text-xs text-zinc-400">Critical Risks</p>
          <p className="mt-1 text-2xl font-semibold text-red-500">{criticalRisks.count}</p>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">Require attention</p>
        </div>
      </div>
    </Card>
  );
}
