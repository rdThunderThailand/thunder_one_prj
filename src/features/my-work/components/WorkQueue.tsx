"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import {
  ChartIcon,
  ChevronDownIcon,
  CalendarIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  MegaphoneIcon,
  UsersIcon,
} from "@/components/ui/icons";
import { workItems, upcomingCountLabel, type WorkItemData, type WorkItemType } from "../mock-data";

const TABS: { key: WorkItemType | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "task", label: "Tasks" },
  { key: "approval", label: "Approvals" },
  { key: "inbox", label: "Inbox" },
  { key: "draft", label: "Drafts" },
  { key: "delegated", label: "Delegated" },
];

const GROUPS: { key: WorkItemData["group"]; label: string }[] = [
  { key: "overdue", label: "Overdue" },
  { key: "due-today", label: "Due Today" },
  { key: "upcoming", label: "Upcoming" },
];

const iconFor: Record<WorkItemData["icon"], React.ReactNode> = {
  megaphone: <MegaphoneIcon />,
  users: <UsersIcon />,
  check: <CheckCircleIcon />,
  budget: <ChartIcon />,
  calendar: <CalendarIcon />,
  feedback: <EnvelopeIcon />,
};

const iconTone: Record<WorkItemData["icon"], string> = {
  megaphone: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400",
  users: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400",
  check: "bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400",
  budget: "bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400",
  calendar: "bg-purple-50 text-purple-500 dark:bg-purple-500/10 dark:text-purple-400",
  feedback: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400",
};

const priorityColor: Record<WorkItemData["priority"], "red" | "yellow" | "zinc"> = {
  High: "red",
  Medium: "yellow",
  Low: "zinc",
};

const dueTone: Record<WorkItemData["dueTone"], string> = {
  red: "text-red-500",
  amber: "text-amber-500",
  zinc: "text-zinc-400",
};

function AvatarStack({ names, overflow }: { names: string[]; overflow?: number }) {
  if (names.length === 0) return <div className="w-0 shrink-0" />;
  return (
    <div className="flex shrink-0 items-center -space-x-2">
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

export function WorkQueue() {
  const [activeTab, setActiveTab] = useState<WorkItemType | "all">("all");
  const filtered = activeTab === "all" ? workItems : workItems.filter((item) => item.type === activeTab);

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-3 dark:border-zinc-800">
        <div role="tablist" className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <span
          className="flex cursor-not-allowed items-center gap-1 text-sm text-zinc-400"
          title="Not built yet"
        >
          Sort by: Priority
          <ChevronDownIcon className="h-3.5 w-3.5" />
        </span>
      </div>

      <div className="flex flex-col">
        {GROUPS.map((group) => {
          const items = filtered.filter((item) => item.group === group.key);
          if (items.length === 0) return null;
          return (
            <div key={group.key} className="pt-4">
              <p
                className={`mb-2 text-xs font-semibold uppercase tracking-wide ${
                  group.key === "overdue" ? "text-red-500" : group.key === "due-today" ? "text-amber-500" : "text-zinc-400"
                }`}
              >
                {group.label} ({group.key === "upcoming" ? upcomingCountLabel : items.length})
              </p>
              <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
                {items.map((item) => (
                  <li key={item.id} className="flex flex-wrap items-center gap-4 py-3">
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconTone[item.icon]}`}
                    >
                      {iconFor[item.icon]}
                    </span>

                    <div className="min-w-0 flex-1 basis-64">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{item.title}</p>
                        <Badge color={priorityColor[item.priority]} variant="pill">
                          {item.priority}
                        </Badge>
                      </div>
                      <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
                        {item.category} • {item.team}
                      </p>
                      <p className={`text-xs font-medium ${dueTone[item.dueTone]}`}>{item.dueNote}</p>
                    </div>

                    <div className="min-w-0 shrink-0 basis-40 text-sm">
                      <p className="truncate font-medium text-zinc-700 dark:text-zinc-200">{item.relatedTitle}</p>
                      <p className="truncate text-xs text-zinc-400">{item.relatedSubtitle}</p>
                    </div>

                    <AvatarStack names={item.collaborators} overflow={item.collaboratorsOverflow} />

                    <button
                      type="button"
                      className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                        item.actionLabel === "Review"
                          ? "bg-indigo-600 text-white hover:bg-indigo-500"
                          : "border border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                      }`}
                    >
                      {item.actionLabel}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        className="mt-4 flex w-full items-center justify-center gap-1.5 border-t border-zinc-100 pt-3 text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:border-zinc-800 dark:text-indigo-400"
      >
        View all my work
        <ChevronDownIcon className="h-3.5 w-3.5" />
      </button>
    </Card>
  );
}
