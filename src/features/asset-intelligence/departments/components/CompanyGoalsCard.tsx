import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ArrowRightIcon } from "@/components/ui/icons";
import { companyGoals } from "../mock-data";

export function CompanyGoalsCard() {
  return (
    <Card className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Company Goals</h2>
        <button className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
          View all
          <ArrowRightIcon className="h-3 w-3" />
        </button>
      </div>
      <ul className="flex-1 space-y-4">
        {companyGoals.map((goal) => (
          <li key={goal.id}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <p className="font-medium text-zinc-900 dark:text-zinc-50">{goal.title}</p>
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">{goal.percent}%</span>
            </div>
            <p className="mb-1.5 text-xs text-zinc-400">{goal.detail}</p>
            <ProgressBar value={goal.percent} color="emerald" />
          </li>
        ))}
      </ul>
    </Card>
  );
}
