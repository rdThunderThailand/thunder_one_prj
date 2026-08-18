import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { todaySchedule, todaySummary } from "../mock-data";
import { MiniCalendar } from "./MiniCalendar";

function ScheduleList() {
  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">My Work</h2>
      <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-900">
        {todaySchedule.map((item) => (
          <li key={item.id} className="flex items-center gap-3 py-3">
            <span className="w-14 shrink-0 text-sm font-medium text-zinc-500 dark:text-zinc-400">
              {item.time}
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {item.title}
                {item.severity && (
                  <Badge color="red" variant="pill">
                    Critical
                  </Badge>
                )}
              </p>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{item.subtitle}</p>
            </div>
            <button className="shrink-0 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500">
              Start
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function TodaySummaryStrip() {
  return (
    <Card className="p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
        Today Summary
      </p>
      <div className="flex flex-col gap-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-zinc-500 dark:text-zinc-400">Assigned</span>
          <span className="font-medium text-zinc-900 dark:text-zinc-50">
            {todaySummary.assigned}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-zinc-500 dark:text-zinc-400">Completed</span>
          <span className="font-medium text-zinc-900 dark:text-zinc-50">
            {todaySummary.completed}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-zinc-500 dark:text-zinc-400">Overdue</span>
          <span className="font-medium text-red-500">{todaySummary.overdue}</span>
        </div>
      </div>
    </Card>
  );
}

export function MyWorkPage() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <ScheduleList />
      </div>
      <div className="flex flex-col gap-4">
        <MiniCalendar />
        <TodaySummaryStrip />
      </div>
    </div>
  );
}
