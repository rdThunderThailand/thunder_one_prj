import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ClockIcon, WarningTriangleIcon } from "@/components/ui/icons";
import { timeAgo } from "@/lib/time-ago";
import type { CoreRecentLog } from "../services/workspace-stats-api";

// Core's tenant-wide audit trail (`GET /tenants/:id/dashboard` recentLogs).
// `null` = the read failed, `[]` = genuinely nothing yet.
export function RecentActivityCard({ logs, nowIso }: { logs: CoreRecentLog[] | null; nowIso: string }) {
  const now = new Date(nowIso);

  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Recent Activity</h2>
      {logs === null ? (
        <EmptyState
          icon={WarningTriangleIcon}
          title="Couldn't load activity"
          detail="Try refreshing the page later."
          compact
        />
      ) : logs.length === 0 ? (
        <EmptyState
          icon={ClockIcon}
          title="No recent activity"
          detail="Activity across your organization will show here."
          compact
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {logs.slice(0, 5).map((log) => (
            <li
              key={log.id}
              className="flex items-start gap-2.5"
            >
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-zinc-900 dark:text-zinc-50">{log.action}</p>
                {log.description && <p className="truncate text-xs text-zinc-400">{log.description}</p>}
              </div>
              <span className="shrink-0 whitespace-nowrap text-xs text-zinc-400">{timeAgo(log.created_at, now)}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
