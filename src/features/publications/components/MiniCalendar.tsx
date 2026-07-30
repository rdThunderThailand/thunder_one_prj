"use client";

import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_LABELS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface CalendarCell {
  date: number;
  inMonth: boolean;
  isoDate: string;
}

function toIso(year: number, month: number, day: number) {
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

function buildGrid(year: number, month: number): CalendarCell[] {
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells: CalendarCell[] = [];
  for (let i = firstWeekday - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    cells.push({ date: day, inMonth: false, isoDate: toIso(prevYear, prevMonth, day) });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ date: day, inMonth: true, isoDate: toIso(year, month, day) });
  }
  let nextDay = 1;
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  while (cells.length % 7 !== 0) {
    cells.push({ date: nextDay, inMonth: false, isoDate: toIso(nextYear, nextMonth, nextDay) });
    nextDay++;
  }
  return cells;
}

export function MiniCalendar({
  selectedIsoDate,
  onSelect,
}: {
  selectedIsoDate: string;
  onSelect: (isoDate: string) => void;
}) {
  const initial = selectedIsoDate ? new Date(`${selectedIsoDate}T00:00:00`) : new Date();
  const [year, setYear] = useState(initial.getFullYear());
  const [month, setMonth] = useState(initial.getMonth());

  const cells = buildGrid(year, month);

  const goPrevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };
  const goNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-zinc-900">
          {MONTH_LABELS[month]} {year}
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={goPrevMonth}
            aria-label="Previous month"
            className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <button
            onClick={goNextMonth}
            aria-label="Next month"
            className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAY_LABELS.map((d) => (
          <span key={d} className="text-xs font-medium text-zinc-400">
            {d}
          </span>
        ))}
        {cells.map((cell, i) => {
          const isSelected = cell.isoDate === selectedIsoDate;
          return (
            <button
              key={`${cell.isoDate}-${i}`}
              onClick={() => onSelect(cell.isoDate)}
              className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-sm transition-colors ${
                isSelected
                  ? "bg-indigo-600 font-semibold text-white"
                  : cell.inMonth
                    ? "text-zinc-700 hover:bg-zinc-100"
                    : "text-zinc-300 hover:bg-zinc-50"
              }`}
            >
              {cell.date}
            </button>
          );
        })}
      </div>
    </div>
  );
}
