import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { channelStatusRows } from "../mock-data";

const barColor: Record<(typeof channelStatusRows)[number]["color"], "emerald" | "amber" | "red"> =
  {
    green: "emerald",
    yellow: "amber",
    red: "red",
  };

const dotColor: Record<(typeof channelStatusRows)[number]["color"], string> = {
  green: "bg-emerald-500",
  yellow: "bg-amber-500",
  red: "bg-red-500",
};

export function ChannelStatusCard() {
  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Channel Status</h2>
        <button className="text-xs font-medium text-indigo-600 hover:text-indigo-500">
          View all channels
        </button>
      </div>
      <ul className="space-y-3">
        {channelStatusRows.map((row) => (
          <li key={row.label}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                <span className={`h-1.5 w-1.5 rounded-full ${dotColor[row.color]}`} />
                {row.label}
              </span>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {row.count} ({row.percent}%)
              </span>
            </div>
            <ProgressBar value={row.percent} color={barColor[row.color]} />
          </li>
        ))}
      </ul>
    </Card>
  );
}
