"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CheckCircleIcon } from "@/components/ui/icons";
import { getMockIssues, type Issue } from "@/features/asset-intelligence/issues";
import { mockTechnicians } from "@/features/thunder-care/work-orders";
import { issueStatusBadge } from "../status-colors";

// Real, working dispatch UI (pick a technician, confirm) with real local
// state — but doesn't write back to asset-intelligence/issues's mock data or create a row in
// thunder-care/work-orders's mockWorkOrders. Same reasoning as
// asset-intelligence/issues/components/ReportProblemForm.tsx: no live cross-page mutation
// this sprint, cross-role consistency comes from shared seeded mock data
// instead. A real dispatch would create a WorkOrder with
// issueId = this issue's id and technicianId = the chosen technician — see
// thunder-care/work-orders/mock-data.ts's wo-1/wo-2/wo-10 for what that looks like
// once seeded, and asset-intelligence/issues/README.md for how this was verified end to end.
function DispatchControl() {
  const [technicianId, setTechnicianId] = useState(mockTechnicians[0]?.id ?? "");
  const [dispatchedTo, setDispatchedTo] = useState<string | null>(null);

  if (dispatchedTo) {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
        <CheckCircleIcon className="h-4 w-4" /> Dispatched to {dispatchedTo}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={technicianId}
        onChange={(e) => setTechnicianId(e.target.value)}
        className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-700 focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
      >
        {mockTechnicians.map((tech) => (
          <option key={tech.id} value={tech.id}>
            {tech.name}
          </option>
        ))}
      </select>
      <button
        onClick={() => {
          const tech = mockTechnicians.find((t) => t.id === technicianId);
          setDispatchedTo(tech?.name ?? technicianId);
        }}
        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
      >
        Dispatch
      </button>
    </div>
  );
}

function QueueRow({ issue }: { issue: Issue }) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-zinc-50">
          {issue.assetTag}
          <Badge color={issueStatusBadge[issue.status].color} variant="pill">
            {issueStatusBadge[issue.status].label}
          </Badge>
        </p>
        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{issue.description}</p>
      </div>
      <DispatchControl />
    </Card>
  );
}

export function WorkQueuePage() {
  const issues = getMockIssues();

  return (
    <div className="flex flex-col gap-3">
      {issues.map((issue) => (
        <QueueRow key={issue.id} issue={issue} />
      ))}
    </div>
  );
}
