"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { WEEKDAY_LABELS, WEEKS, TODAY_DAY } from "../calendar-grid";
import { mockWorkOrders } from "../mock-data";
import { WorkOrderCard } from "./WorkOrderCard";

function dateForDay(day: number): string {
  return `2026-08-${String(day).padStart(2, "0")}`;
}

// Full, interactive calendar per requirement doc §2.4: highlight today, a dot
// indicator on days with work, and clicking a day filters the schedule list
// below without a page reload. Hardcoded to August, same as MiniCalendar/
// calendar-grid.ts.
export function CalendarPage() {
  const [selectedDay, setSelectedDay] = useState(TODAY_DAY);
  const selectedDate = dateForDay(selectedDay);
  const dayOrders = mockWorkOrders.filter((w) => w.date === selectedDate);
  const daysWithWork = new Set(mockWorkOrders.map((w) => w.date));

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="p-4 lg:col-span-1">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">August</p>
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {WEEKDAY_LABELS.map((label, index) => (
            <span key={index} className="py-1 font-medium text-zinc-400">
              {label}
            </span>
          ))}
          {WEEKS.flatMap((week, weekIndex) =>
            week.map((day, dayIndex) => {
              if (!day) {
                return <span key={`${weekIndex}-${dayIndex}`} />;
              }
              const isSelected = day === selectedDay;
              const isToday = day === TODAY_DAY;
              const hasWork = daysWithWork.has(dateForDay(day));
              return (
                <button
                  key={`${weekIndex}-${dayIndex}`}
                  onClick={() => setSelectedDay(day)}
                  className={`relative flex h-8 w-8 items-center justify-center rounded-full text-xs transition-colors ${
                    isSelected
                      ? "bg-indigo-600 font-semibold text-white"
                      : isToday
                        ? "font-semibold text-indigo-600 ring-1 ring-inset ring-indigo-600 dark:text-indigo-400"
                        : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  }`}
                >
                  {day}
                  {hasWork && !isSelected && (
                    <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-indigo-500" />
                  )}
                </button>
              );
            }),
          )}
        </div>
      </Card>

      <div className="flex flex-col gap-3 lg:col-span-2">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {selectedDate}
          {selectedDay === TODAY_DAY && (
            <span className="ml-2 text-xs font-normal text-zinc-400">Today</span>
          )}
        </h2>
        {dayOrders.length === 0 ? (
          <Card className="p-6 text-sm text-zinc-500 dark:text-zinc-400">
            No work orders scheduled for this day.
          </Card>
        ) : (
          dayOrders.map((order) => <WorkOrderCard key={order.id} workOrder={order} />)
        )}
      </div>
    </div>
  );
}
