"use client";

import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import { addMonths, monthCells } from "../../../calendar-month";

const HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });

/** Frame 10 "Select Custom Days": click a day to add or remove it. */
export function DatesCalendar({
  dates,
  today,
  onChange,
}: {
  dates: string[];
  today: string;
  onChange: (dates: string[]) => void;
}) {
  const [month, setMonth] = useState(`${(dates[0] ?? today).slice(0, 7)}-01`);
  const toggle = (ymd: string) =>
    onChange(dates.includes(ymd) ? dates.filter((d) => d !== ymd) : [...dates, ymd].sort());

  return (
    <div className="rounded-lg border border-border p-3">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          aria-label="Previous month"
          className="rounded p-1 text-muted-foreground hover:bg-muted"
          onClick={() => setMonth(addMonths(month, -1))}
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        <p className="text-sm font-semibold text-foreground">{MONTH.format(new Date(`${month}T00:00:00Z`))}</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="text-xs font-medium text-primary disabled:text-muted-foreground"
            disabled={dates.length === 0}
            onClick={() => onChange([])}
          >
            Clear all
          </button>
          <button
            type="button"
            aria-label="Next month"
            className="rounded p-1 text-muted-foreground hover:bg-muted"
            onClick={() => setMonth(addMonths(month, 1))}
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {HEADERS.map((day) => (
          <span
            key={day}
            className="py-1 text-xs text-muted-foreground"
          >
            {day}
          </span>
        ))}
        {monthCells(month).map((ymd, index) =>
          ymd ? (
            <button
              key={ymd}
              type="button"
              aria-pressed={dates.includes(ymd)}
              aria-label={ymd}
              disabled={ymd < today}
              onClick={() => toggle(ymd)}
              className={
                dates.includes(ymd)
                  ? "h-8 rounded-md bg-primary text-sm font-semibold text-primary-foreground"
                  : "h-8 rounded-md text-sm text-foreground hover:bg-muted disabled:text-muted-foreground disabled:hover:bg-transparent"
              }
            >
              {Number(ymd.slice(8))}
            </button>
          ) : (
            <span key={`pad-${index}`} />
          ),
        )}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {dates.length} date{dates.length === 1 ? "" : "s"} selected
      </p>
    </div>
  );
}
