import { Card } from "@/components/ui/Card";
import { BroadcastIcon, MegaphoneIcon, UsersIcon, VideoIcon } from "@/components/ui/icons";
import { managerCalendar, type CalendarRowData } from "../mock-data";

const iconFor: Record<CalendarRowData["icon"], React.ReactNode> = {
  team: <UsersIcon />,
  campaign: <MegaphoneIcon />,
  customer: <VideoIcon />,
  townhall: <BroadcastIcon />,
};

const tone: Record<CalendarRowData["icon"], string> = {
  team: "bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400",
  campaign: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400",
  customer: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400",
  townhall: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400",
};

export function MyCalendarCard() {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">My Calendar</h2>
        <span className="cursor-not-allowed text-xs text-zinc-300 dark:text-zinc-700" title="Not built yet">
          View calendar
        </span>
      </div>
      <ul className="space-y-3">
        {managerCalendar.map((row) => (
          <li key={row.id} className="flex items-center gap-2.5">
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tone[row.icon]}`}>
              {iconFor[row.icon]}
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
