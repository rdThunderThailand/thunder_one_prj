import { Card } from "@/components/ui/Card";
import { EyeIcon, MonitorIcon, ShareNodesIcon } from "@/components/ui/icons";
import { topPerformingChannels } from "../mock-data";

export function TopPerformingChannelsCard() {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Top Performing Channels (7 Days)
        </h2>
        <button className="text-xs font-medium text-indigo-600 hover:text-indigo-500">
          View report
        </button>
      </div>
      <ul className="space-y-3">
        {topPerformingChannels.map((row) => (
          <li key={row.rank} className="flex items-center gap-3">
            <span className="w-4 shrink-0 text-xs font-medium text-zinc-400">{row.rank}</span>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
              {row.platform === "Social" ? (
                <ShareNodesIcon className="h-4 w-4" />
              ) : (
                <MonitorIcon className="h-4 w-4" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {row.name}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{row.platform}</p>
            </div>
            <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              <EyeIcon className="h-3.5 w-3.5" />
              {row.views}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
