"use client";

import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import { buildCalendarMonth } from "../schedule";
import type { ScheduleConflict, ScheduleForm } from "../types";

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_LABELS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export interface MiniCalendarProps {
  form: ScheduleForm;
  conflicts: ScheduleConflict[];
  onSelectDate?: (ymd: string) => void;
}

export function MiniCalendar({
  form,
  conflicts,
  onSelectDate,
}: MiniCalendarProps) {
  const initial =
    form.start_date && !isNaN(Date.parse(form.start_date))
      ? new Date(`${form.start_date}T00:00:00`)
      : new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  const weeks = buildCalendarMonth(form, conflicts, viewYear, viewMonth);

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };
  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">
          {MONTH_LABELS[viewMonth]} {viewYear}
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={goPrevMonth}
            aria-label="Previous month"
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={goNextMonth}
            aria-label="Next month"
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAY_LABELS.map((d) => (
          <span key={d} className="text-xs font-medium text-muted-foreground">
            {d}
          </span>
        ))}
        {weeks.flat().map((cell, i) => {
          if (!cell.inMonth && cell.ymd === "") {
            return <div key={`pad-${i}`} className="h-8 w-8" />;
          }

          let style = "text-muted-foreground hover:bg-muted";
          if (!cell.inMonth) {
            style = "text-muted-foreground";
          } else if (cell.isOverlap) {
            style = "bg-primary-soft font-medium text-primary ring-2 ring-warning";
          } else if (cell.isActive) {
            style = "bg-primary-soft font-medium text-primary";
          } else if (cell.isToday) {
            style = "ring-1 ring-ring text-muted-foreground hover:bg-muted";
          }

          const isClickable = Boolean(onSelectDate && cell.ymd !== "");

          return (
            <button
              key={`${cell.ymd}-${i}`}
              type="button"
              disabled={!isClickable}
              onClick={() => {
                if (isClickable && cell.ymd) {
                  onSelectDate?.(cell.ymd);
                }
              }}
              className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-sm transition-colors ${style} ${
                !isClickable ? "cursor-default" : "cursor-pointer"
              }`}
            >
              {cell.day}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-primary" /> Active
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-primary ring-2 ring-warning" /> Conflict
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full ring-1 ring-ring" /> Today
        </span>
      </div>
    </div>
  );
}
