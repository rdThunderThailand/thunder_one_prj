import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import type { summarizeChannels } from "../channel-logic";

type ChannelSummary = ReturnType<typeof summarizeChannels>;

const lifecycleMetrics = [
  { key: "total", label: "Total", tone: "bg-indigo-500" },
  { key: "draft", label: "Draft", tone: "bg-zinc-400" },
  { key: "active", label: "Active", tone: "bg-emerald-500" },
  { key: "inactive", label: "Inactive", tone: "bg-zinc-600" },
] as const;

const healthMetrics = [
  { key: "online", label: "Online", tone: "bg-emerald-500" },
  { key: "warning", label: "Warning", tone: "bg-amber-500" },
  { key: "degraded", label: "Degraded", tone: "bg-orange-500" },
  { key: "offline", label: "Offline", tone: "bg-red-500" },
  { key: "unassigned", label: "Unassigned", tone: "bg-zinc-400" },
] as const;

function Metric({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="min-w-0 border-l border-zinc-100 pl-3 first:border-l-0 first:pl-0 dark:border-zinc-800">
      <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${tone}`} aria-hidden="true" />
        <span className="truncate">{label}</span>
      </div>
      <p className="mt-1 text-xl font-semibold tabular-nums text-zinc-950 dark:text-zinc-50">
        {value}
      </p>
    </div>
  );
}

export function ChannelSummaryTiles({ summary }: { summary: ChannelSummary | null }) {
  if (summary === null) {
    return (
      <div className="grid gap-3 xl:grid-cols-[minmax(0,4fr)_minmax(0,5fr)]">
        {[4, 5].map((count) => (
          <Card key={count} className="p-4">
            <Skeleton className="mb-4 h-3 w-20" />
            <div className={`grid gap-3 ${count === 4 ? "grid-cols-4" : "grid-cols-5"}`}>
              {Array.from({ length: count }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <Skeleton className="h-3 w-14" />
                  <Skeleton className="h-7 w-9" />
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3 xl:grid-cols-[minmax(0,4fr)_minmax(0,5fr)]">
      <Card className="p-4">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-400">
          Lifecycle
        </p>
        <div className="grid grid-cols-4 gap-3">
          {lifecycleMetrics.map((metric) => (
            <Metric
              key={metric.key}
              label={metric.label}
              value={summary.lifecycle[metric.key]}
              tone={metric.tone}
            />
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-400">
          Health
        </p>
        <div className="grid grid-cols-5 gap-3">
          {healthMetrics.map((metric) => (
            <Metric
              key={metric.key}
              label={metric.label}
              value={
                metric.key === "unassigned"
                  ? summary.unassigned
                  : summary.health[metric.key]
              }
              tone={metric.tone}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}
