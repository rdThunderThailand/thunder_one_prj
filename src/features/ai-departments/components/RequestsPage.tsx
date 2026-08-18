"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getMockAssetRequests, type AssetRequestStatus } from "@/features/ai-requests";

const statusBadge: Record<AssetRequestStatus, { color: "zinc" | "green" | "red" | "yellow"; label: string }> = {
  waiting_it: { color: "yellow", label: "Waiting IT" },
  approved: { color: "green", label: "Approved" },
  rejected: { color: "red", label: "Rejected" },
  completed: { color: "zinc", label: "Completed" },
};

// Approve/Reject queue (requirement doc DM-03) — real, working local state
// per request, not persisted or reflected back into ai-requests's mock data
// (see ai-issues/components/ReportProblemForm.tsx's comment for why this
// sprint keeps such actions client-local).
function RequestRow({
  requesterName,
  description,
  requestedAt,
  initialStatus,
}: {
  requesterName: string;
  description: string;
  requestedAt: string;
  initialStatus: AssetRequestStatus;
}) {
  const [status, setStatus] = useState(initialStatus);
  const badge = statusBadge[status];

  return (
    <Card className="flex items-center gap-3 p-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{requesterName}</p>
        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
      </div>
      <span className="shrink-0 text-xs text-zinc-400">{requestedAt}</span>
      {status === "waiting_it" ? (
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => setStatus("approved")}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
          >
            Approve
          </button>
          <button
            onClick={() => setStatus("rejected")}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            Reject
          </button>
        </div>
      ) : (
        <Badge color={badge.color} variant="pill">
          {badge.label}
        </Badge>
      )}
    </Card>
  );
}

export function RequestsPage() {
  const requests = getMockAssetRequests();

  return (
    <div className="flex flex-col gap-3">
      {requests.map((request) => (
        <RequestRow
          key={request.id}
          requesterName={request.requesterName}
          description={request.description}
          requestedAt={request.requestedAt}
          initialStatus={request.status}
        />
      ))}
    </div>
  );
}
