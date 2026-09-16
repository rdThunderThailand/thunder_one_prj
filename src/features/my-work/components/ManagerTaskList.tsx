"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ArrowRightIcon, ChevronDownIcon, FilterIcon, MoreIcon } from "@/components/ui/icons";
import { managerTasks, managerTasksTotalCount, managerWorkTabs, type ManagerTaskRow } from "../mock-data";

const priorityColor: Record<ManagerTaskRow["priority"], "red" | "yellow" | "zinc"> = {
  High: "red",
  Medium: "yellow",
  Low: "zinc",
};

const statusTone: Record<ManagerTaskRow["status"], string> = {
  "In Progress": "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
  "Pending Approval": "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  "To Do": "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  "Waiting on Others": "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
  Overdue: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
};

const FILTERS = ["Priority", "Status", "Type", "Due Date"];

function AvatarStack({ names, overflow }: { names: string[]; overflow?: number }) {
  return (
    <div className="flex items-center -space-x-2">
      {names.map((name) => (
        <Avatar key={name} name={name} size={24} className="ring-2 ring-white dark:ring-zinc-900" />
      ))}
      {overflow && overflow > 0 && (
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-semibold text-zinc-500 ring-2 ring-white dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-900">
          +{overflow}
        </span>
      )}
    </div>
  );
}

export function ManagerTaskList() {
  const [activeTab, setActiveTab] = useState(managerWorkTabs[0].id);
  const showTasks = activeTab === "my-tasks";

  return (
    <Card className="p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-3 dark:border-zinc-800">
        <div role="tablist" className="flex flex-wrap gap-1">
          {managerWorkTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            title="Not built yet"
            className="flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
          >
            <FilterIcon className="h-3.5 w-3.5" />
            Filters
          </button>
          <button
            type="button"
            title="Not built yet"
            className="flex cursor-not-allowed items-center justify-center rounded-lg border border-zinc-200 p-1.5 text-zinc-400 dark:border-zinc-700"
          >
            <MoreIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2" title="Not built yet">
        {FILTERS.map((filter) => (
          <span
            key={filter}
            className="flex cursor-not-allowed items-center gap-1 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
          >
            {filter}
            <ChevronDownIcon className="h-3 w-3" />
          </span>
        ))}
      </div>

      {showTasks ? (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-xs text-zinc-400 dark:border-zinc-800">
                  <th className="w-8 py-2 font-medium" />
                  <th className="py-2 font-medium">Task</th>
                  <th className="py-2 font-medium">Project / Workspace</th>
                  <th className="py-2 font-medium">Priority</th>
                  <th className="py-2 font-medium">Status</th>
                  <th className="py-2 font-medium">Due Date</th>
                  <th className="w-8 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {managerTasks.map((task) => (
                  <tr key={task.id} className={task.flagged ? "border-l-2 border-red-500" : ""}>
                    <td className="py-3 pl-2">
                      <span className="block h-4 w-4 rounded border border-zinc-300 dark:border-zinc-600" />
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-zinc-900 dark:text-zinc-50">{task.title}</p>
                        <AvatarStack names={task.assignees} overflow={task.assigneesOverflow} />
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <p className="text-zinc-700 dark:text-zinc-200">{task.project}</p>
                      <p className="text-xs text-zinc-400">{task.workspace}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge color={priorityColor[task.priority]} variant="pill">
                        {task.priority}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusTone[task.status]}`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap text-zinc-700 dark:text-zinc-200">
                      {task.dueDate}
                      <span className="ml-1 text-xs text-zinc-400">{task.dueTime}</span>
                    </td>
                    <td className="py-3 pr-2 text-right">
                      <MoreIcon className="ml-auto h-4 w-4 text-zinc-300" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-xs text-zinc-400">
              Showing 1-{managerTasks.length} of {managerTasksTotalCount} tasks
            </span>
            <button className="flex items-center gap-1 font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
              View all tasks
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </>
      ) : (
        <p className="py-8 text-center text-sm text-zinc-400" title="Not built yet">
          Nothing here yet.
        </p>
      )}
    </Card>
  );
}
