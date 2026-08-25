import { Card } from "@/components/ui/Card";
import { ArrowRightIcon } from "@/components/ui/icons";
import { employeeSchedule } from "../mock-data";

export function EmployeeScheduleCard() {
  return (
    <Card className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Today&apos;s Schedule</h2>
        <button className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
          View calendar
          <ArrowRightIcon className="h-3 w-3" />
        </button>
      </div>
      <ul className="flex flex-1 flex-col gap-3">
        {employeeSchedule.map((item, index) => (
          <li key={item.id} className="flex items-center gap-3">
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${index === 0 ? "bg-emerald-500" : "bg-indigo-400"}`} />
            <span className="w-12 shrink-0 text-xs font-medium text-zinc-400">{item.time}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{item.title}</p>
              <p className="truncate text-xs text-zinc-400">{item.subtitle}</p>
            </div>
            {index === 0 && (
              <span className="shrink-0 rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white">
                Join
              </span>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
