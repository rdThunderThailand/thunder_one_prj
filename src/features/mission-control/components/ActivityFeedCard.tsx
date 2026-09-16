import { Card } from "@/components/ui/Card";
import type { CoreRecentLog } from "../services/dashboard-api";

const DOT_COLORS = ["bg-indigo-500", "bg-emerald-500", "bg-blue-500", "bg-amber-500"];

/** "N ชม./วัน ที่แล้ว" — this app has no shared relative-time helper yet
 *  (`lib/thai-date.ts` only has absolute-date formatters), so a small local
 *  one lives here rather than a new shared util for a single caller. */
function timeAgo(isoDate: string, now: Date): string {
  const then = new Date(isoDate);
  if (Number.isNaN(then.getTime())) return "-";
  const minutes = Math.max(0, Math.round((now.getTime() - then.getTime()) / 60000));
  if (minutes < 1) return "เมื่อสักครู่";
  if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} ชม. ที่แล้ว`;
  const days = Math.round(hours / 24);
  return `${days} วันที่แล้ว`;
}

// Real since 2026-09-16 — `../services/dashboard-api.ts`'s getRecentLogs
// (`GET /tenants/:id/dashboard`'s `recentLogs`, a generic tenant-wide audit
// trail). `logs === null` means the fetch failed (shows an explicit "could
// not load" message); `logs.length === 0` means it loaded fine and there's
// genuinely nothing today (shows a plain empty state) — same distinction
// people/overview's own TodayActivityCard draws for this exact endpoint.
export function ActivityFeedCard({ logs }: { logs: CoreRecentLog[] | null }) {
  const now = new Date();

  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">กิจกรรมล่าสุด</h2>
      {logs === null ? (
        <p className="py-4 text-center text-sm text-zinc-400">ไม่สามารถโหลดกิจกรรมล่าสุดได้ในขณะนี้</p>
      ) : logs.length === 0 ? (
        <p className="py-4 text-center text-sm text-zinc-400">ยังไม่มีกิจกรรมล่าสุด</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {logs.slice(0, 5).map((log, i) => (
            <li key={log.id} className="flex items-start gap-2.5 text-sm">
              <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${DOT_COLORS[i % DOT_COLORS.length]}`} />
              <div className="min-w-0 flex-1">
                <p className="text-zinc-900 dark:text-zinc-50">{log.action}</p>
                {log.description && <p className="text-xs text-zinc-400">{log.description}</p>}
              </div>
              <span className="shrink-0 whitespace-nowrap text-xs text-zinc-400">{timeAgo(log.created_at, now)}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
