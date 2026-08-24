import { Card } from "@/components/ui/Card";
import { DonutChart } from "@/components/ui/DonutChart";
import { channelDistribution } from "../mock-data";

export function ChannelDistributionCard() {
  const total = channelDistribution.reduce((sum, s) => sum + s.value, 0);

  return (
    <Card className="p-4">
      <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Channel Distribution
      </h2>
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <DonutChart segments={channelDistribution} size={128} strokeWidth={18} />
          {/* pointer-events-none: this label sits over the donut's full
              bounding box, not just its hollow center, so without it the
              whole ring would be unhoverable and the tooltip could never fire */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {total}
            </span>
            <span className="text-[10px] text-zinc-400">Total</span>
          </div>
        </div>
        <ul className="flex-1 space-y-1.5">
          {channelDistribution.map((segment) => {
            const percent = ((segment.value / total) * 100).toFixed(1);
            return (
              <li
                key={segment.label}
                className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400"
              >
                <span className="flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: segment.color }}
                  />
                  {segment.label}
                </span>
                <span>
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
