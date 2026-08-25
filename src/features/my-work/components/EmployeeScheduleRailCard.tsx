import { Card } from "@/components/ui/Card";
import { ArrowRightIcon, BroadcastIcon, MegaphoneIcon, UsersIcon, VideoIcon } from "@/components/ui/icons";
import { employeeMyWorkSchedule } from "../mock-data";

const iconFor = [<UsersIcon key="0" />, <MegaphoneIcon key="1" />, <VideoIcon key="2" />, <BroadcastIcon key="3" />];
const tone = [
  "bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400",
  "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400",
  "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400",
  "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400",
];

export function EmployeeScheduleRailCard() {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Today&apos;s Schedule</h2>
        <button className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
          View calendar
          <ArrowRightIcon className="h-3 w-3" />
        </button>
      </div>
      <ul className="space-y-3">
        {employeeMyWorkSchedule.map((row, index) => (
          <li key={row.id} className="flex items-center gap-2.5">
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tone[index % tone.length]}`}>
              {iconFor[index % iconFor.length]}
            </span>
            <span className="w-12 shrink-0 text-xs font-medium text-zinc-400">{row.time}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-zinc-900 dark:text-zinc-50">{row.title}</p>
              <p className="truncate text-xs text-zinc-400">{row.subtitle}</p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
