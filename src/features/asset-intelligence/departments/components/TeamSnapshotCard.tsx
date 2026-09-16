import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { DonutChart } from "@/components/ui/DonutChart";
import { ArrowRightIcon } from "@/components/ui/icons";
import { teamProgress, teamWorkloadRows, type WorkloadRow } from "../mock-data";

const barColor: Record<WorkloadRow["tone"], string> = {
  high: "bg-indigo-500",
  medium: "bg-indigo-400",
  good: "bg-emerald-500",
};

const badgeTone: Record<WorkloadRow["tone"], string> = {
  high: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
  medium: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  good: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
};

const badgeLabel: Record<WorkloadRow["tone"], string> = {
  high: "High",
  medium: "Medium",
  good: "Good",
};

export function TeamSnapshotCard() {
  return (
    <Card className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Team Snapshot</h2>
        <button
          type="button"
          className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
        >
          View team report
          <ArrowRightIcon className="h-3 w-3" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-zinc-100 p-3 dark:border-zinc-800">
          <p className="self-start text-xs font-medium text-zinc-500 dark:text-zinc-400">Task Progress vs Plan</p>
          <div className="relative">
            <DonutChart segments={teamProgress.segments} size={100} strokeWidth={14} />
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {teamProgress.onPlanPercent}%
              </span>
              <span className="text-[10px] text-zinc-400">On Track</span>
            </div>
          </div>
          <ul className="w-full space-y-1 text-xs">
            {teamProgress.segments.map((segment) => (
              <li key={segment.label} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: segment.color }} />
                  {segment.label}
                </span>
                <span className="font-medium text-zinc-700 dark:text-zinc-200">{segment.value}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-zinc-400">{teamProgress.totalTasks} tasks total</p>
        </div>

        <div className="rounded-xl border border-zinc-100 p-3 dark:border-zinc-800">
          <p className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">Team Workload</p>
          <ul className="space-y-3">
            {teamWorkloadRows.map((row) => (
              <li key={row.id} className="flex items-center gap-2.5">
                <Avatar name={row.name} size={24} />
                <span className="w-16 shrink-0 truncate text-xs text-zinc-700 dark:text-zinc-200">{row.name}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div className={`h-full rounded-full ${barColor[row.tone]}`} style={{ width: `${row.percent}%` }} />
                </div>
                <span className="w-8 shrink-0 text-right text-xs text-zinc-500 dark:text-zinc-400">
                  {row.percent}%
                </span>
                <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${badgeTone[row.tone]}`}>
                  {badgeLabel[row.tone]}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}
