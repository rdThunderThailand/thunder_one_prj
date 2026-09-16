"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ArrowRightIcon } from "@/components/ui/icons";
import { activePolicies, policyTabs } from "../mock-data";

export function PoliciesTableCard() {
  const [activeTab, setActiveTab] = useState<(typeof policyTabs)[number]>(policyTabs[0]);
  const showPolicies = activeTab === "Active Policies";

  return (
    <Card className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Policies &amp; Standards</h2>
        <button className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
          View all
          <ArrowRightIcon className="h-3 w-3" />
        </button>
      </div>

      <div role="tablist" className="mb-3 flex gap-1 border-b border-zinc-100 dark:border-zinc-800">
        {policyTabs.map((tab) => (
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

      {showPolicies ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead>
              <tr className="text-xs text-zinc-400">
                <th className="py-1.5 font-medium">Policy Name</th>
                <th className="py-1.5 font-medium">Category</th>
                <th className="py-1.5 font-medium">Version</th>
                <th className="py-1.5 font-medium">Effective Date</th>
                <th className="py-1.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {activePolicies.map((policy) => (
                <tr key={policy.id}>
                  <td className="py-2.5 pr-2 font-medium text-zinc-900 dark:text-zinc-50">{policy.name}</td>
                  <td className="py-2.5 pr-2 text-zinc-500 dark:text-zinc-400">{policy.category}</td>
                  <td className="py-2.5 pr-2 text-zinc-500 dark:text-zinc-400">{policy.version}</td>
                  <td className="py-2.5 pr-2 whitespace-nowrap text-zinc-500 dark:text-zinc-400">
                    {policy.effectiveDate}
                  </td>
                  <td className="py-2.5">
                    <Badge color="green" variant="pill">
                      {policy.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-zinc-400" title="Not built yet">
          Nothing here yet.
        </p>
      )}

      <button className="mt-3 flex items-center gap-1.5 border-t border-zinc-100 pt-3 text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:border-zinc-800 dark:text-indigo-400">
        View all policies
        <ArrowRightIcon className="h-3.5 w-3.5" />
      </button>
    </Card>
  );
}
