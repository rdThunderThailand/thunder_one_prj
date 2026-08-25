import { Card } from "@/components/ui/Card";
import { todaysSchedule } from "../mock-data";

export function ScheduleCard() {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Today&apos;s Schedule
        </h2>
        <span className="cursor-not-allowed text-xs text-zinc-300 dark:text-zinc-700" title="Not built yet">
          View calendar
        </span>
      </div>
      <ul className="space-y-3">
        {todaysSchedule.map((row) => (
          <li key={row.id} className="flex items-center gap-3 text-sm">
            <span
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${row.dot === "indigo" ? "bg-indigo-500" : "bg-zinc-300 dark:bg-zinc-600"}`}
            />
            <span className="w-14 shrink-0 text-xs font-medium text-zinc-400">{row.time}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-zinc-700 dark:text-zinc-200">{row.title}</span>
              {row.note && <span className="block text-xs text-zinc-400">{row.note}</span>}
            </span>
            {row.badge && (
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  row.badge.tone === "now"
                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                    : "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
                }`}
              >
                {row.badge.label}
              </span>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
