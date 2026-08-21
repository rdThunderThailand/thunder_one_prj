"use client";

import Link from "next/link";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { mockWorkOrders, todaySummary, TODAY_DATE, type WorkOrderStatus } from "../mock-data";
import { MiniCalendar } from "./MiniCalendar";

function ScheduleRow({
  title,
  severity,
  subtitle,
  time,
  status,
  onStart,
}: {
  title: string;
  severity?: "critical";
  subtitle: string;
  time: string;
  status: WorkOrderStatus;
  onStart: () => void;
}) {
  return (
    <li className="flex items-center gap-3 py-3">
      <span className="w-14 shrink-0 text-sm font-medium text-zinc-500 dark:text-zinc-400">
        {time}
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-zinc-50">
          {title}
          {severity && (
            <Badge color="red" variant="pill">
              Critical
            </Badge>
          )}
        </p>
        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</p>
      </div>
      {status === "assigned" && (
        <button
          onClick={onStart}
          className="shrink-0 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
        >
          Start
        </button>
      )}
      {status === "in_progress" && (
        <span className="shrink-0 text-xs font-medium text-indigo-600 dark:text-indigo-400">
          In Progress
        </span>
      )}
      {status === "completed" && (
        <span className="shrink-0 text-xs font-medium text-emerald-600 dark:text-emerald-400">
          Completed
        </span>
      )}
    </li>
  );
}

function ScheduleList() {
  const today = mockWorkOrders.filter((w) => w.date === TODAY_DATE);
  const [statuses, setStatuses] = useState<Record<string, WorkOrderStatus>>(
    Object.fromEntries(today.map((w) => [w.id, w.status])),
  );

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">My Work</h2>
        <Link
          href="/thunder-care/work-orders/assigned"
          className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
        >
          View all assigned
        </Link>
      </div>
      <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-900">
        {today.map((item) => (
          <ScheduleRow
            key={item.id}
            title={item.title}
            severity={item.severity}
            subtitle={`${item.assetTag} · ${item.location}`}
            time={item.time}
            status={statuses[item.id]}
            onStart={() => setStatuses((prev) => ({ ...prev, [item.id]: "in_progress" }))}
          />
        ))}
      </ul>
    </Card>
  );
}

function TodaySummaryStrip() {
  return (
    <Card className="p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
        Today Summary
      </p>
      <div className="flex flex-col gap-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-zinc-500 dark:text-zinc-400">Assigned</span>
          <span className="font-medium text-zinc-900 dark:text-zinc-50">
            {todaySummary.assigned}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-zinc-500 dark:text-zinc-400">Completed</span>
          <span className="font-medium text-zinc-900 dark:text-zinc-50">
            {todaySummary.completed}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-zinc-500 dark:text-zinc-400">Overdue</span>
          <span className="font-medium text-red-500">{todaySummary.overdue}</span>
        </div>
      </div>
    </Card>
  );
}

export function MyWorkPage() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <ScheduleList />
      </div>
      <div className="flex flex-col gap-4">
        <MiniCalendar />
        <TodaySummaryStrip />
      </div>
    </div>
  );
}
