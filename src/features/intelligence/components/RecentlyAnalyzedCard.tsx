import { Card } from "@/components/ui/Card";
import { CheckCircleIcon } from "@/components/ui/icons";
import { recentlyAnalyzed } from "../mock-data";

export function RecentlyAnalyzedCard() {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Recently Analyzed</h2>
        <button className="text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
          View all
        </button>
      </div>
      <ul className="flex flex-col gap-3">
        {recentlyAnalyzed.map((item) => (
          <li key={item.id} className="flex items-start gap-2.5">
            <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            <div className="min-w-0">
              <p className="truncate text-sm text-zinc-700 dark:text-zinc-200">{item.title}</p>
              <p className="text-xs text-zinc-400">{item.analyzedLabel}</p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
