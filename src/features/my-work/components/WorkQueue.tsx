"use client";

import Link from "next/link";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { CheckCircleIcon } from "@/components/ui/icons";
import { dueGroup, type WorkItem, type WorkItemKind } from "../work-items";
import { GROUP_META, GROUP_ORDER, KIND_META } from "./work-item-meta";

const TABS: { key: WorkItemKind | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "approval", label: "Approvals" },
  { key: "task", label: "Tasks" },
  { key: "draft", label: "Drafts" },
  { key: "waiting", label: "Waiting" },
];

/**
 * The tab-filtered, due-date-grouped work list. `nowIso` comes from the
 * server render so grouping can't drift between server and client. Each row
 * links to where the item is actually handled.
 */
export function WorkQueue({ items, nowIso }: { items: WorkItem[]; nowIso: string }) {
  const [activeTab, setActiveTab] = useState<WorkItemKind | "all">("all");
  const now = new Date(nowIso);
  const filtered = activeTab === "all" ? items : items.filter((item) => item.kind === activeTab);

  return (
    <Card className="p-4">
      <div
        role="tablist"
        className="flex flex-wrap gap-1 border-b border-zinc-100 pb-3 dark:border-zinc-800"
      >
        {TABS.map((tab) => {
          const count = tab.key === "all" ? items.length : items.filter((item) => item.kind === tab.key).length;
          return (
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
              <span className="ml-1 text-xs text-zinc-400">{count}</span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={CheckCircleIcon}
          title="You're all caught up"
          detail="Nothing here needs your attention right now."
        />
      ) : (
        <div className="flex flex-col">
          {GROUP_ORDER.map((group) => {
            const groupItems = filtered.filter((item) => dueGroup(item, now) === group);
            if (groupItems.length === 0) return null;
            return (
              <div
                key={group}
                className="pt-4"
              >
                <p className={`mb-2 text-xs font-semibold uppercase tracking-wide ${GROUP_META[group].text}`}>
                  {GROUP_META[group].label} ({groupItems.length})
                </p>
                <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
                  {groupItems.map((item) => (
                    <li
                      key={item.id}
                      className="flex flex-wrap items-center gap-4 py-3"
                    >
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${KIND_META[item.kind].tone}`}
                      >
                        {KIND_META[item.kind].icon}
                      </span>
                      <div className="min-w-0 flex-1 basis-64">
                        <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{item.title}</p>
                        <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
                          {item.detail} • {item.source}
                        </p>
                        <p className={`text-xs font-medium ${GROUP_META[group].text}`}>{item.dateNote}</p>
                      </div>
                      <Link
                        href={item.href}
                        className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                          item.kind === "approval"
                            ? "bg-indigo-600 text-white hover:bg-indigo-500"
                            : "border border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                        }`}
                      >
                        {item.kind === "approval" ? "Review" : "Open"}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
