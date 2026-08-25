import { Card } from "@/components/ui/Card";
import { CheckCircleIcon } from "@/components/ui/icons";
import { recentlyCompleted } from "../mock-data";

export function RecentlyCompletedCard() {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Recently Completed
        </h2>
        <span className="cursor-not-allowed text-xs text-zinc-300 dark:text-zinc-700" title="Not built yet">
          View all
        </span>
      </div>
      <ul className="space-y-3">
        {recentlyCompleted.map((item) => (
          <li key={item.id} className="flex items-start gap-2.5">
            <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            <div className="min-w-0">
              <p className="truncate text-sm text-zinc-700 dark:text-zinc-200">{item.title}</p>
              <p className="text-xs text-zinc-400">{item.completedOn}</p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
