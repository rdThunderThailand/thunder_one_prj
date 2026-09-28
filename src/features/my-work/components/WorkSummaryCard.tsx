import { Card } from "@/components/ui/Card";
import { DonutChart } from "@/components/ui/DonutChart";
import { EmptyState } from "@/components/ui/EmptyState";
import { ChartIcon } from "@/components/ui/icons";
import { countByGroup, type WorkItem } from "../work-items";
import { GROUP_META, GROUP_ORDER } from "./work-item-meta";

export function WorkSummaryCard({ items, now }: { items: WorkItem[]; now: Date }) {
  const counts = countByGroup(items, now);
  const total = items.length;
  const segments = GROUP_ORDER.map((group) => ({
    label: GROUP_META[group].label,
    value: counts[group],
    color: GROUP_META[group].color,
  }));

  return (
    <Card className="p-4">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        My Work Summary
      </h2>
      {total === 0 ? (
        <EmptyState
          icon={ChartIcon}
          title="No open work"
          detail="A breakdown by due date appears once you have open items."
          compact
        />
      ) : (
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
      )}
    </Card>
  );
}
