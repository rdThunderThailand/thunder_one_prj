import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { GaugeIcon } from "@/components/ui/icons";
import { teamGoals } from "../mock-data";

export function TeamGoalsCard() {
  return (
    <Card className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Team Goals</h2>
        <button className="text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
          View all
        </button>
      </div>
      <ul className="flex flex-1 flex-col gap-3">
        {teamGoals.map((goal) => (
          <li key={goal.id}>
            <div className="mb-1 flex items-center gap-2">
              <GaugeIcon className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
              <p className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {goal.title}
              </p>
              <span className="shrink-0 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                {goal.percent}%
              </span>
            </div>
            <p className="mb-1.5 truncate text-xs text-zinc-400">{goal.detail}</p>
            <ProgressBar value={goal.percent} color="indigo" />
          </li>
        ))}
      </ul>
    </Card>
  );
}
