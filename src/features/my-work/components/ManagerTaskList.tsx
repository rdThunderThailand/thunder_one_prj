"use client";

import Link from "next/link";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ArrowRightIcon, CheckCircleIcon } from "@/components/ui/icons";
import { dueGroup, formatDate, type WorkItem, type WorkItemKind } from "../work-items";
import { KIND_META } from "./work-item-meta";

const TABS: { id: string; label: string; kinds: WorkItemKind[] }[] = [
  { id: "my-tasks", label: "My Tasks", kinds: ["task", "draft"] },
  { id: "pending-approvals", label: "Pending Approvals", kinds: ["approval"] },
  { id: "waiting", label: "Waiting on Others", kinds: ["waiting"] },
];

type RowStatus = "Overdue" | "Pending Approval" | "Waiting on Others" | "To Do";

const statusTone: Record<RowStatus, string> = {
  Overdue: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
  "Pending Approval": "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  "Waiting on Others": "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
  "To Do": "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

function rowStatus(item: WorkItem, now: Date): RowStatus {
  if (dueGroup(item, now) === "overdue") return "Overdue";
  if (item.kind === "approval") return "Pending Approval";
  if (item.kind === "waiting") return "Waiting on Others";
  return "To Do";
}

// The manager variant's table, fed by `MyWork`. Tabs only exist for kinds
// Core can actually produce — the old "Assigned by Me"/"Following"/"Saved"
// tabs had no source and are gone.
export function ManagerTaskList({ items, nowIso }: { items: WorkItem[]; nowIso: string }) {
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const now = new Date(nowIso);
  const tab = TABS.find((t) => t.id === activeTab) ?? TABS[0];
  const rows = items.filter((item) => tab.kinds.includes(item.kind));

  return (
    <Card className="p-4">
      <div
        role="tablist"
        className="mb-3 flex flex-wrap gap-1 border-b border-zinc-100 pb-3 dark:border-zinc-800"
      >
        {TABS.map((t) => {
          const count = items.filter((item) => t.kinds.includes(item.kind)).length;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={activeTab === t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors ${
                activeTab === t.id
                  ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              {t.label}
              {count > 0 && (
                <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={CheckCircleIcon}
          title="Nothing here"
          detail="Items will appear when there's something for you."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-xs text-zinc-400 dark:border-zinc-800">
                <th className="py-2 font-medium">Item</th>
                <th className="py-2 font-medium">Source</th>
                <th className="py-2 font-medium">Status</th>
                <th className="py-2 font-medium">Due Date</th>
                <th className="w-8 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {rows.map((item) => {
                const status = rowStatus(item, now);
                return (
                  <tr
                    key={item.id}
                    className={status === "Overdue" ? "border-l-2 border-red-500" : ""}
                  >
                    <td className="py-3 pl-2 pr-4">
                      <div className="flex items-center gap-2.5">
                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${KIND_META[item.kind].tone}`}>
                          {KIND_META[item.kind].icon}
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium text-zinc-900 dark:text-zinc-50">{item.title}</p>
                          <p className="text-xs text-zinc-400">{item.detail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-zinc-700 dark:text-zinc-200">{item.source}</td>
                    <td className="py-3 pr-4">
                      <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${statusTone[status]}`}>
                        {status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap py-3 pr-4 text-zinc-700 dark:text-zinc-200">
                      {item.dueAt ? formatDate(item.dueAt) : "-"}
                    </td>
                    <td className="py-3 pr-2 text-right">
                      <Link
                        href={item.href}
                        aria-label={`Open ${item.title}`}
                        className="inline-flex text-zinc-400 hover:text-indigo-600"
                      >
                        <ArrowRightIcon className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
