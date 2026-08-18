import { Card } from "@/components/ui/Card";

// Static, non-interactive — a real calendar (query by assignee_id + date range,
// click-to-filter) is a separate build, per the requirement doc §2.4 acceptance
// criteria. This only shows August with "today" (11) highlighted, matching the
// requirement doc's mockup.
const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const WEEKS: (number | null)[][] = [
  [null, null, null, null, null, 1, 2],
  [3, 4, 5, 6, 7, 8, 9],
  [10, 11, 12, 13, 14, 15, 16],
  [17, 18, 19, 20, 21, 22, 23],
  [24, 25, 26, 27, 28, 29, 30],
  [31, null, null, null, null, null, null],
];
const TODAY = 11;

export function MiniCalendar() {
  return (
    <Card className="p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">August</p>
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {WEEKDAY_LABELS.map((label, index) => (
          <span key={index} className="py-1 font-medium text-zinc-400">
            {label}
          </span>
        ))}
        {WEEKS.flatMap((week, weekIndex) =>
          week.map((day, dayIndex) => (
            <span
              key={`${weekIndex}-${dayIndex}`}
              className={`flex h-7 w-7 items-center justify-center rounded-full ${
                day === TODAY
                  ? "bg-indigo-600 font-semibold text-white"
                  : day
                    ? "text-zinc-600 dark:text-zinc-300"
                    : ""
              }`}
            >
              {day ?? ""}
            </span>
          )),
        )}
      </div>
    </Card>
  );
}
