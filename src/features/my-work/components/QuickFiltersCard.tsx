import { Card } from "@/components/ui/Card";
import { CalendarIcon, CheckIcon, RepeatIcon, UsersIcon, WarningTriangleIcon } from "@/components/ui/icons";
import { quickFilters, type QuickFilterData } from "../mock-data";

const iconFor: Record<QuickFilterData["icon"], React.ReactNode> = {
  warning: <WarningTriangleIcon />,
  calendar: <CalendarIcon />,
  delegated: <UsersIcon />,
  waiting: <RepeatIcon />,
  check: <CheckIcon />,
};

const badgeTone: Record<QuickFilterData["tone"], string> = {
  red: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400",
  blue: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400",
  indigo: "bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400",
  zinc: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
  emerald: "bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400",
};

// Filters the queue below by count bucket — decorative for now (WorkQueue's
// own tabs are the one real filter), same "not wired yet" convention as
// other placeholder controls in this sprint.
export function QuickFiltersCard() {
  return (
    <Card className="p-4">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Quick Filters
      </h2>
      <div className="grid grid-cols-2 gap-2">
        {quickFilters.map((filter) => (
          <div
            key={filter.id}
            title="Not built yet"
            className="flex cursor-not-allowed items-center gap-2 rounded-lg border border-zinc-100 px-2.5 py-2 text-sm dark:border-zinc-800"
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${badgeTone[filter.tone]}`}
            >
              {iconFor[filter.icon]}
            </span>
            <span className="min-w-0 flex-1 truncate text-zinc-600 dark:text-zinc-300">{filter.label}</span>
            <span className="shrink-0 text-xs font-semibold text-zinc-400">{filter.count}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
