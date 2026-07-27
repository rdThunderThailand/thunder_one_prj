"use client";

import { useState } from "react";
import type { ScheduleConflict, ScheduleForm } from "../types";
import { buildCalendarMonth } from "../schedule";

type ScheduleCalendarProps = {
  form: ScheduleForm;
  conflicts: ScheduleConflict[];
};

const MONTH_NAMES: readonly string[] = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAY_HEADERS: readonly string[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function ScheduleCalendar({ form, conflicts }: ScheduleCalendarProps) {
  const [viewYear, setViewYear] = useState<number>(() => {
    if (form.start_date && /^\d{4}-\d{2}-\d{2}$/.test(form.start_date)) {
      const [y] = form.start_date.split("-").map(Number);
      if (!isNaN(y)) return y;
    }
    return new Date().getFullYear();
  });

  const [viewMonth, setViewMonth] = useState<number>(() => {
    if (form.start_date && /^\d{4}-\d{2}-\d{2}$/.test(form.start_date)) {
      const [, m] = form.start_date.split("-").map(Number);
      if (!isNaN(m)) return m - 1;
    }
    return new Date().getMonth();
  });

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const weeks = buildCalendarMonth(form, conflicts, viewYear, viewMonth);

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Schedule Calendar</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="px-2 py-1 text-xs rounded border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
          >
            ‹
          </button>
          <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 min-w-[100px] text-center">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </span>
          <button
            type="button"
            onClick={handleNextMonth}
            className="px-2 py-1 text-xs rounded border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
          >
            ›
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-7 text-center text-[11px] text-zinc-400 font-medium">
          {WEEKDAY_HEADERS.map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>

        <div className="space-y-1">
          {weeks.map((week, wIndex) => (
            <div key={wIndex} className="grid grid-cols-7 gap-1 text-center">
              {week.map((cell, cIndex) => {
                if (!cell.inMonth) {
                  return <div key={cIndex} className="py-1.5 text-xs" />;
                }

                let cellStyle = "text-zinc-700 dark:text-zinc-300";
                if (cell.isOverlap) {
                  cellStyle = "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300 font-semibold ring-1 ring-red-400 dark:ring-red-700";
                } else if (cell.isActive) {
                  cellStyle = "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 font-medium";
                }

                const todayStyle = cell.isToday ? " outline outline-1 outline-zinc-400 dark:outline-zinc-500" : "";

                return (
                  <div
                    key={cIndex}
                    className={`rounded py-1.5 text-xs ${cellStyle}${todayStyle}`}
                  >
                    {cell.day}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4 text-[11px] text-zinc-600 dark:text-zinc-400 pt-1">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-blue-100 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-800" />
          <span>Scheduled</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-red-100 dark:bg-red-950/40 border border-red-300 dark:border-red-800" />
          <span>Conflict / overlap</span>
        </div>
      </div>
    </div>
  );
}
