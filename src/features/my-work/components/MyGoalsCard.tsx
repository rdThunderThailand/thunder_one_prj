import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { GaugeIcon } from "@/components/ui/icons";
import { myGoals } from "../mock-data";

export function MyGoalsCard() {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">My Goals</h2>
        <span className="cursor-not-allowed text-xs text-zinc-300 dark:text-zinc-700" title="Not built yet">
          View all
        </span>
      </div>
      <ul className="space-y-3">
        {myGoals.map((goal) => {
          const percent = goal.percent ?? 0;
          return (
            <li key={goal.id}>
              <div className="mb-1 flex items-center gap-2">
                <GaugeIcon className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
                <p className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {goal.title}
                </p>
                <span className="shrink-0 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  {goal.current ?? `${percent}%`}
                </span>
              </div>
              <p className="mb-1.5 truncate text-xs text-zinc-400">{goal.detail}</p>
              <ProgressBar value={goal.percent ?? 0} color="indigo" />
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
