import { Card } from "@/components/ui/Card";
import { DonutChart } from "@/components/ui/DonutChart";
import { workspaceOverview } from "../mock-data";

export function WorkspaceOverviewCard() {
  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Workspace Overview</h2>
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <DonutChart segments={workspaceOverview.segments} size={104} strokeWidth={16} />
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">{workspaceOverview.total}</span>
            <span className="text-[10px] text-zinc-400">Total</span>
          </div>
        </div>
        <ul className="flex-1 space-y-1.5 text-sm">
          {workspaceOverview.segments.map((segment) => (
            <li key={segment.label} className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: segment.color }} />
                {segment.label}
              </span>
              <span className="shrink-0 font-medium text-zinc-900 dark:text-zinc-50">
                {segment.value} ({segment.percentLabel})
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
