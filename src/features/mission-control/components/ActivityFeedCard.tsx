import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ArrowRightIcon, ClockIcon, WarningTriangleIcon } from "@/components/ui/icons";
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
// Async: awaited inside MissionControlPage's `<Suspense>`
// (`ActivityFeedSkeleton` is the fallback).
export async function ActivityFeedCard({ logs: logsPromise }: { logs: Promise<CoreRecentLog[] | null> }) {
  const logs = await logsPromise;
  const now = new Date();

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">กิจกรรมล่าสุด</h2>
        {/* No full activity-log page exists yet (same gap people/overview's
            TodayActivityCard has for this exact recentLogs endpoint) — an
            inert button rather than a Link to somewhere that doesn't exist. */}
        <button type="button" className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
          ดูทั้งหมด
          <ArrowRightIcon className="h-3 w-3" />
        </button>
      </div>
      {logs === null ? (
        <EmptyState
          icon={WarningTriangleIcon}
          title="ไม่สามารถโหลดกิจกรรมล่าสุดได้"
          detail="ลองรีเฟรชหน้านี้อีกครั้งในภายหลัง"
          compact
        />
      ) : logs.length === 0 ? (
        <EmptyState
          icon={ClockIcon}
          title="ยังไม่มีกิจกรรมล่าสุด"
          detail="กิจกรรมในองค์กรจะแสดงที่นี่"
          compact
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {logs.slice(0, 3).map((log, i) => (
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
