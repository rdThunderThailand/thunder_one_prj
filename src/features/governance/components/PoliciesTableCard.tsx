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
        <h2 className="text-sm font-semibold text-foreground">Policies &amp; Standards</h2>
        <button className="flex items-center gap-1 text-xs font-medium text-primary hover:text-accent-foreground">
          View all
          <ArrowRightIcon className="h-3 w-3" />
        </button>
      </div>

      <div role="tablist" className="mb-3 flex gap-1 border-b border-border">
        {policyTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={`border-b-2 px-2.5 py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
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
              <tr className="text-xs text-t1-gray-400">
                <th className="py-1.5 font-medium">Policy Name</th>
                <th className="py-1.5 font-medium">Category</th>
                <th className="py-1.5 font-medium">Version</th>
                <th className="py-1.5 font-medium">Effective Date</th>
                <th className="py-1.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {activePolicies.map((policy) => (
                <tr key={policy.id}>
                  <td className="py-2.5 pr-2 font-medium text-foreground">{policy.name}</td>
                  <td className="py-2.5 pr-2 text-muted-foreground">{policy.category}</td>
                  <td className="py-2.5 pr-2 text-muted-foreground">{policy.version}</td>
                  <td className="py-2.5 pr-2 whitespace-nowrap text-muted-foreground">
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
        <p className="py-8 text-center text-sm text-t1-gray-400" title="Not built yet">
          Nothing here yet.
        </p>
      )}

      <button className="mt-3 flex items-center gap-1.5 border-t border-border pt-3 text-sm font-medium text-primary hover:text-accent-foreground">
        View all policies
        <ArrowRightIcon className="h-3.5 w-3.5" />
      </button>
    </Card>
  );
}
