"use client";

import { useId, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import { addMonths, monthCells, selectDateRange } from "../../../calendar-month";

const HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });

/** Frame 08: two clicks select an inclusive range, without changing the daily airing window. */
export function DateRangeCalendar({ startDate, endDate, today, onChange }: {
  startDate: string;
  endDate: string;
  today: string;
  onChange: (change: { startDate: string; endDate: string }) => void;
}) {
  const hintId = useId();
  const [anchor, setAnchor] = useState<string | null>(null);
  const [view, setView] = useState({ startDate, month: `${(startDate || today).slice(0, 7)}-01` });
  // Typing a new start date recenters the calendar; navigation otherwise keeps the visible pair.
  const month = view.startDate === startDate ? view.month : `${(startDate || today).slice(0, 7)}-01`;
  const isChoosingEnd = anchor !== null && anchor === startDate && endDate === startDate;
  const select = (date: string) => {
    const next = selectDateRange(isChoosingEnd ? anchor : null, date);
    setAnchor(next.anchor);
    setView({ startDate: next.startDate, month });
    onChange({ startDate: next.startDate, endDate: next.endDate });
  };

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Previous month"
          onClick={() => setView({ startDate, month: addMonths(month, -1) })}
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Next month"
          onClick={() => setView({ startDate, month: addMonths(month, 1) })}
        >
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid min-w-0 gap-3 @md:grid-cols-2">
        {[month, addMonths(month, 1)].map((visibleMonth) => (
          <section
            key={visibleMonth}
            aria-label={MONTH.format(new Date(`${visibleMonth}T00:00:00Z`))}
            className="min-w-0 rounded-lg border border-border p-2"
          >
            <h4 className="mb-2 text-center text-sm font-semibold text-foreground">
              {MONTH.format(new Date(`${visibleMonth}T00:00:00Z`))}
            </h4>
            <div className="grid grid-cols-7 gap-0.5 text-center">
              {HEADERS.map((day) => (
                <span key={day} className="py-1 text-[10px] text-muted-foreground">
                  {day}
                </span>
              ))}
              {monthCells(visibleMonth).map((date, index) => {
                if (!date) return <span key={`pad-${index}`} />;
                const isEndpoint = date === startDate || date === endDate;
                const isSelected = isEndpoint || (!!endDate && date >= startDate && date <= endDate);
                return (
                  <Button
                    key={date}
                    variant={isEndpoint ? "default" : "ghost"}
                    size="sm"
                    className={`h-8 min-w-0 px-0 ${isSelected && !isEndpoint ? "bg-primary/10 text-primary hover:bg-primary/20" : ""}`}
                    aria-label={date}
                    aria-pressed={isSelected}
                    aria-describedby={hintId}
                    disabled={date < today}
                    onClick={() => select(date)}
                  >
                    {Number(date.slice(8))}
                  </Button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
      <p id={hintId} role="status" className="text-xs text-muted-foreground">
        {isChoosingEnd ? "เลือกวันสุดท้ายของช่วงวันที่" : "เลือกวันเริ่มต้น แล้วเลือกวันสุดท้าย หรือกรอกวันที่ด้านบน"}
      </p>
    </div>
  );
}
