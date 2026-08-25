import { Card } from "@/components/ui/Card";
import { DonutChart } from "@/components/ui/DonutChart";
import { workSummary } from "../mock-data";

export function WorkSummaryCard() {
  return (
    <Card className="p-4">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        My Work Summary
      </h2>
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <DonutChart segments={workSummary.segments} size={104} strokeWidth={16} />
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">{workSummary.total}</span>
            <span className="text-[10px] text-zinc-400">Total</span>
          </div>
        </div>
        <ul className="flex-1 space-y-1.5 text-sm">
          {workSummary.segments.map((segment) => {
            const percent = Math.round((segment.value / workSummary.total) * 100);
            return (
              <li key={segment.label} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: segment.color }} />
                  {segment.label}
                </span>
                <span className="shrink-0 font-medium text-zinc-900 dark:text-zinc-50">
                  {segment.value} ({percent}%)
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </Card>
  );
}
