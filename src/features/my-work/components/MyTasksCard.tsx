"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { ArrowRightIcon, MoreIcon } from "@/components/ui/icons";
import { employeeTaskTabs, employeeTasksToday, type EmployeeTaskStatus } from "../mock-data";

const statusTone: Record<EmployeeTaskStatus, string> = {
  "In Progress": "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
  "To Do": "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

export function MyTasksCard() {
  const [activeTab, setActiveTab] = useState<(typeof employeeTaskTabs)[number]>(employeeTaskTabs[0]);
  const showToday = activeTab === "Today";

  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">My Tasks</h2>
      <div role="tablist" className="mb-3 flex gap-1 border-b border-zinc-100 dark:border-zinc-800">
        {employeeTaskTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={`border-b-2 px-2.5 py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {showToday ? (
        <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
          {employeeTasksToday.map((task) => (
            <li key={task.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
              <div className="w-16 shrink-0">
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{task.time}</p>
                <p className="text-xs text-zinc-400">{task.dueLabel}</p>
              </div>
              <div className="min-w-0 flex-1 basis-48">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{task.title}</p>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${statusTone[task.status]}`}>
                    {task.status}
                  </span>
                </div>
                <p className="truncate text-xs text-zinc-400">{task.project}</p>
              </div>
              <div className="flex items-center -space-x-2">
                <Avatar name={task.assignee} size={26} className="ring-2 ring-white dark:ring-zinc-900" />
                {task.assigneesExtra?.map((name) => (
                  <Avatar key={name} name={name} size={26} className="ring-2 ring-white dark:ring-zinc-900" />
                ))}
                {task.assigneesOverflow && task.assigneesOverflow > 0 && (
                  <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-zinc-100 text-[10px] font-semibold text-zinc-500 ring-2 ring-white dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-900">
                    +{task.assigneesOverflow}
                  </span>
                )}
                {!task.assigneesExtra && (
                  <span className="ml-1.5 text-xs text-zinc-500 dark:text-zinc-400">{task.assignee}</span>
                )}
              </div>
              <MoreIcon className="h-4 w-4 shrink-0 text-zinc-300" />
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-8 text-center text-sm text-zinc-400" title="Not built yet">
          Nothing here yet.
        </p>
      )}

      <button className="mt-3 flex items-center gap-1.5 border-t border-zinc-100 pt-3 text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:border-zinc-800 dark:text-indigo-400">
        View all tasks
        <ArrowRightIcon className="h-3.5 w-3.5" />
      </button>
    </Card>
  );
}
