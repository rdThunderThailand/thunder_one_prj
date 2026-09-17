import { Card } from "@/components/ui/Card";
import { LoadFailure } from "@/features/people/shared";
import type { CoreRecentLog } from "../services/dashboard-api";

interface TodayActivityCardProps {
  /** Real data since 2026-09-15 — `GET /tenants/:id/dashboard`'s
   *  `recentLogs`, pre-filtered to today by the app route. `null` when the
   *  Core fetch failed or no tenant/session was resolved; `[]` when it
   *  succeeded but nothing happened today — rendered as two different
   *  messages, same "explicit state, not fake content" discipline as
   *  org-structure/personnel.
   *
   *  Core's audit log has no onboarding/change/meeting/training/offboarding
   *  concept the way this card's old mock `ActivityTag` union implied (that
   *  was always a fabricated 5-category taxonomy for a generic system audit
   *  trail — `action`/`description` strings, not a curated HR calendar).
   *  Shown honestly as one plain action label + description per row instead
   *  of guessing which of the 5 mock colors a given audit event "should"
   *  be. */
  logs: CoreRecentLog[] | null;
}

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function TodayActivityCard({ logs }: TodayActivityCardProps) {
  return (
    <Card className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">กิจกรรมวันนี้</h2>
        <button type="button" className="text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
          ดูปฏิทินทั้งหมด
        </button>
      </div>
      {logs === null ? (
        <LoadFailure message="ไม่สามารถโหลดกิจกรรมได้ในขณะนี้" compact />
      ) : logs.length === 0 ? (
        <p className="flex flex-1 items-center justify-center text-center text-xs text-zinc-400">ไม่มีกิจกรรมวันนี้</p>
      ) : (
        <ul className="flex flex-1 flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
          {logs.map((log) => (
            <li key={log.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
              <span className="w-12 shrink-0 text-xs font-medium text-zinc-400">{formatTime(log.created_at)}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{log.description}</p>
              </div>
              <span className="shrink-0 text-xs font-medium text-zinc-500 dark:text-zinc-400">{log.action}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
