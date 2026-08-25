import { Card } from "@/components/ui/Card";
import { CalendarIcon, ChevronRightIcon } from "@/components/ui/icons";
import { nextUpEvents, todaySchedule, type NextUpEventData } from "../mock-data";

const statusTone: Record<NextUpEventData["statusTone"], string> = {
  now: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  upcoming: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400",
};

// A static preview of the day's calendar — no calendar backend exists yet,
// so "View full calendar" is inert rather than pointing at a page that
// doesn't exist.
export function TodayScheduleCard() {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-indigo-500" />
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Today &amp; Now</h2>
        </div>
        <span className="cursor-not-allowed text-xs text-zinc-300 dark:text-zinc-700" title="Not built yet">
          View full calendar
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="mb-2.5 flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Right Now
          </p>
          <ul className="space-y-3">
            {nextUpEvents.map((event) => (
              <li key={event.id}>
                <div className="flex items-center justify-between gap-1">
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{event.title}</p>
                  <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 text-zinc-300" />
                </div>
                <p className="text-xs text-zinc-400">{event.timeRange}</p>
                <span
                  className={`mt-1 inline-block rounded-full px-1.5 py-0.5 text-[11px] font-medium ${statusTone[event.statusTone]}`}
                >
                  {event.statusLabel}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-l border-zinc-100 pl-4 dark:border-zinc-800">
          <p className="mb-2.5 flex items-center justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400">
            <span>Today&apos;s Schedule</span>
            <span className="text-zinc-400">{todaySchedule.length} events</span>
          </p>
          <ul className="space-y-3">
            {todaySchedule.map((event) => (
              <li key={event.id} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                <div className="min-w-0">
                  <p className="text-xs text-zinc-400">{event.time}</p>
                  <p className="truncate text-sm text-zinc-700 dark:text-zinc-200">{event.title}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}
