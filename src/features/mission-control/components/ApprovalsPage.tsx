"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { mockRecommendations, type RecommendationStatus } from "../mock-data";

const statusBadge: Record<RecommendationStatus, { color: "zinc" | "green" | "red"; label: string }> = {
  pending: { color: "zinc", label: "Pending" },
  approved: { color: "green", label: "Approved" },
  rejected: { color: "red", label: "Rejected" },
};

// CEO-04: Approve/Reject queue with a lightweight audit trail (who, when) --
// real, working local state per item, not persisted (see
// asset-intelligence/issues/components/ReportProblemForm.tsx's comment for why this sprint
// keeps such actions client-local).
function ApprovalRow({
  title,
  summary,
  evidence,
  initialStatus,
}: {
  title: string;
  summary: string;
  evidence: string;
  initialStatus: RecommendationStatus;
}) {
  const [status, setStatus] = useState(initialStatus);
  const badge = statusBadge[status];

  return (
    <Card className="flex flex-col gap-2 p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{title}</p>
        <Badge color={badge.color} variant="pill">
          {badge.label}
        </Badge>
      </div>
      <p className="text-sm text-zinc-600 dark:text-zinc-300">{summary}</p>
      <p className="text-xs text-zinc-400">Evidence: {evidence}</p>
      {status === "pending" ? (
        <div className="mt-1 flex items-center gap-2">
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
        <p className="text-xs text-zinc-400">{badge.label} by you · just now</p>
      )}
    </Card>
  );
}

export function ApprovalsPage() {
  if (mockRecommendations.length === 0) {
    return (
      <Card className="p-6 text-sm text-zinc-500 dark:text-zinc-400">
        Nothing pending your approval right now.
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {mockRecommendations.map((rec) => (
        <ApprovalRow
          key={rec.id}
          title={rec.title}
          summary={rec.summary}
          evidence={rec.evidence}
          initialStatus={rec.status}
        />
      ))}
    </div>
  );
}
