import { Card } from "@/components/ui/Card";
import { DonutChart } from "@/components/ui/DonutChart";
import { DATA_STATUS_LABEL, WORKSPACES, type WorkspaceDataStatus } from "../catalog";

const COLORS: Record<WorkspaceDataStatus, string> = {
  live: "#10b981",
  sample: "#f59e0b",
  "coming-soon": "#a1a1aa",
};

// Workspaces by data status (`../catalog.ts`) — a real breakdown of what's
// on the platform, replacing the old mock "Active / Updated today / Needs
// attention / Not used recently" split, which had no usage data behind it.
export function WorkspaceOverviewCard() {
  const total = WORKSPACES.length;
  const segments = (Object.keys(COLORS) as WorkspaceDataStatus[]).map((status) => ({
    label: DATA_STATUS_LABEL[status],
    value: WORKSPACES.filter((w) => w.dataStatus === status).length,
    color: COLORS[status],
  }));

  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Workspace Overview</h2>
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <DonutChart
            segments={segments}
            size={104}
            strokeWidth={16}
          />
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">{total}</span>
            <span className="text-[10px] text-zinc-400">Total</span>
          </div>
        </div>
        <ul className="flex-1 space-y-1.5 text-sm">
          {segments.map((segment) => (
            <li
              key={segment.label}
              className="flex items-center justify-between gap-2"
            >
              <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: segment.color }}
                />
                {segment.label}
              </span>
              <span className="shrink-0 font-medium text-zinc-900 dark:text-zinc-50">
                {segment.value} ({Math.round((segment.value / total) * 100)}%)
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
