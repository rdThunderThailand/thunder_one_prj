import { Card } from "@/components/ui/Card";
import { DonutChart } from "@/components/ui/DonutChart";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ArrowRightIcon } from "@/components/ui/icons";
import { trainingCompletion, trainingItems } from "../mock-data";

export function TrainingAwarenessCard() {
  return (
    <Card className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Training &amp; Awareness</h2>
        <button className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
          View all
          <ArrowRightIcon className="h-3 w-3" />
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <DonutChart
            segments={[
              { label: "Completed", value: trainingCompletion.percent, color: "#10b981" },
              { label: "Remaining", value: 100 - trainingCompletion.percent, color: "#e4e4e7" },
            ]}
            size={88}
            strokeWidth={12}
          />
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {trainingCompletion.percent}%
            </span>
          </div>
        </div>
        <p className="text-xs text-zinc-400">Completion Rate</p>
      </div>

      <ul className="mt-4 flex-1 space-y-3">
        {trainingItems.map((item) => (
          <li key={item.id}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-zinc-600 dark:text-zinc-300">{item.label}</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-50">{item.percent}%</span>
            </div>
            <ProgressBar value={item.percent} color="emerald" />
          </li>
        ))}
      </ul>
    </Card>
  );
}
