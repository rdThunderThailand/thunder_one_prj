import { Card } from "@/components/ui/Card";
import { DonutChart } from "@/components/ui/DonutChart";
import { ArrowRightIcon } from "@/components/ui/icons";
import { myProgress } from "../mock-data";

export function MyProgressCard() {
  return (
    <Card className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">My Team Progress</h2>
        <button className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
          View all
          <ArrowRightIcon className="h-3 w-3" />
        </button>
      </div>
      <div className="flex flex-1 items-center gap-4">
        <div className="relative shrink-0">
          <DonutChart segments={myProgress.segments} size={110} strokeWidth={16} />
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">{myProgress.onTrackPercent}%</span>
            <span className="text-[10px] text-zinc-400">On Track</span>
          </div>
        </div>
        <ul className="flex-1 space-y-1.5 text-sm">
          {myProgress.segments.map((segment) => (
            <li key={segment.label} className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: segment.color }} />
                {segment.label}
              </span>
              <span className="font-medium text-zinc-900 dark:text-zinc-50">{segment.value}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-3 text-xs text-zinc-400">{myProgress.totalTasks} tasks total</p>
    </Card>
  );
}
