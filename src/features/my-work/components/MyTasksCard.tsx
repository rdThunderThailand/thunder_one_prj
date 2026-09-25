"use client";

import Link from "next/link";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ArrowRightIcon, CheckCircleIcon } from "@/components/ui/icons";
import { dueGroup, formatDate, type CompletedItem, type WorkItem } from "../work-items";
import { GROUP_META, KIND_META } from "./work-item-meta";

const TABS = ["Today", "Upcoming", "Completed", "All"] as const;
type Tab = (typeof TABS)[number];

// The employee's own list over `MyWork` — "Today" includes overdue items,
// "Upcoming" includes items with no due date.
export function MyTasksCard({ items, completed, nowIso }: { items: WorkItem[]; completed: CompletedItem[]; nowIso: string }) {
  const [activeTab, setActiveTab] = useState<Tab>("Today");
  const now = new Date(nowIso);
  const open = items.filter((item) => item.kind !== "waiting");
  const visible =
    activeTab === "Today"
      ? open.filter((item) => ["overdue", "due-today"].includes(dueGroup(item, now)))
      : activeTab === "Upcoming"
        ? open.filter((item) => ["upcoming", "no-due"].includes(dueGroup(item, now)))
        : open;

  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">My Tasks</h2>
      <div
        role="tablist"
        className="mb-3 flex gap-1 border-b border-zinc-100 dark:border-zinc-800"
      >
        {TABS.map((tab) => (
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

      {activeTab === "Completed" ? (
        completed.length === 0 ? (
          <EmptyState
            icon={CheckCircleIcon}
            title="Nothing completed yet"
            detail="Work you finish will show here."
            compact
          />
        ) : (
          <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
            {completed.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
              >
                <CheckCircleIcon className="h-4 w-4 shrink-0 text-emerald-500" />
                <p className="min-w-0 flex-1 truncate text-sm text-zinc-700 dark:text-zinc-200">{item.title}</p>
                <span className="shrink-0 text-xs text-zinc-400">{formatDate(item.completedAt)}</span>
              </li>
            ))}
          </ul>
        )
      ) : visible.length === 0 ? (
        <EmptyState
          icon={CheckCircleIcon}
          title="You're all caught up"
          detail="Nothing here needs your attention right now."
          compact
        />
      ) : (
        <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
          {visible.map((item) => {
            const group = dueGroup(item, now);
            return (
              <li
                key={item.id}
                className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0"
              >
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${KIND_META[item.kind].tone}`}>
                  {KIND_META[item.kind].icon}
                </span>
                <div className="min-w-0 flex-1 basis-48">
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{item.title}</p>
                  <p className="truncate text-xs text-zinc-400">
                    {item.source} • <span className={group === "no-due" ? "" : GROUP_META[group].text}>{item.dateNote}</span>
                  </p>
                </div>
                <Link
                  href={item.href}
                  aria-label={`Open ${item.title}`}
                  className="shrink-0 text-zinc-400 hover:text-indigo-600"
                >
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
