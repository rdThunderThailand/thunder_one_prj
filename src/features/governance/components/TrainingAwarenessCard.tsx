import { Card } from "@/components/ui/Card";
import { DonutChart } from "@/components/ui/DonutChart";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ArrowRightIcon } from "@/components/ui/icons";
import { trainingCompletion, trainingItems } from "../mock-data";

export function TrainingAwarenessCard() {
  return (
    <Card className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Training &amp; Awareness</h2>
        <button className="flex items-center gap-1 text-xs font-medium text-primary hover:text-accent-foreground">
          View all
          <ArrowRightIcon className="h-3 w-3" />
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <DonutChart
            segments={[
              { label: "Completed", value: trainingCompletion.percent, color: "var(--color-success)" },
              { label: "Remaining", value: 100 - trainingCompletion.percent, color: "var(--color-border)" },
            ]}
            size={88}
            strokeWidth={12}
          />
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-semibold text-foreground">
              {trainingCompletion.percent}%
            </span>
          </div>
        </div>
        <p className="text-xs text-t1-gray-400">Completion Rate</p>
      </div>

      <ul className="mt-4 flex-1 space-y-3">
        {trainingItems.map((item) => (
          <li key={item.id}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-medium text-foreground">{item.percent}%</span>
            </div>
            <ProgressBar value={item.percent} color="emerald" />
          </li>
        ))}
      </ul>
    </Card>
  );
}
