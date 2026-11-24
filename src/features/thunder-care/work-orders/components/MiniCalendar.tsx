import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { WEEKDAY_LABELS, WEEKS, TODAY_DAY } from "../calendar-grid";

// Compact, non-interactive preview for the My Work dashboard — click-to-filter
// lives on the full Calendar page (see components/CalendarPage.tsx), per the
// requirement doc §2.4 acceptance criteria.
export function MiniCalendar() {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-t1-gray-400">August</p>
        <Link
          href="/thunder-care/work-orders/calendar"
          className="text-xs font-medium text-primary hover:text-accent-foreground"
        >
          View full calendar
        </Link>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {WEEKDAY_LABELS.map((label, index) => (
          <span key={index} className="py-1 font-medium text-t1-gray-400">
            {label}
          </span>
        ))}
        {WEEKS.flatMap((week, weekIndex) =>
          week.map((day, dayIndex) => (
            <span
              key={`${weekIndex}-${dayIndex}`}
              className={`flex h-7 w-7 items-center justify-center rounded-full ${
                day === TODAY_DAY
                  ? "bg-primary font-semibold text-primary-foreground"
                  : day
                    ? "text-muted-foreground"
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
