"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CheckCircleIcon } from "@/components/ui/icons";
import type { WorkOrder, WorkOrderStatus } from "../mock-data";

const statusBadge: Record<WorkOrderStatus, { color: "zinc" | "indigo" | "green" | "red"; label: string }> = {
  assigned: { color: "zinc", label: "Assigned" },
  in_progress: { color: "indigo", label: "In Progress" },
  completed: { color: "green", label: "Completed" },
  overdue: { color: "red", label: "Overdue" },
};

// Real, working Start/Complete toggle (requirement doc §2.4 AC: "ปุ่ม Start
// ต้องเปลี่ยน work order status เป็น in_progress ... ทันที (optimistic UI)") —
// local component state only, resets on reload, same client-local-only
// discipline as every other interactive action this sprint (see
// ai-issues/components/ReportProblemForm.tsx's comment for why).
export function WorkOrderCard({ workOrder }: { workOrder: WorkOrder }) {
  const [status, setStatus] = useState<WorkOrderStatus>(workOrder.status);
  const badge = statusBadge[status];

  return (
    <Card className="flex flex-col gap-2 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-zinc-50">
            {workOrder.title}
            {workOrder.severity && (
              <Badge color="red" variant="pill">
                Critical
              </Badge>
            )}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {workOrder.assetTag} · {workOrder.location}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-xs text-zinc-400">
            {workOrder.date} {workOrder.time}
          </span>
          <Badge color={badge.color} variant="pill">
            {badge.label}
          </Badge>
        </div>
      </div>
      <p className="text-sm text-zinc-600 dark:text-zinc-300">{workOrder.description}</p>
      <div>
        {(status === "assigned" || status === "overdue") && (
          <button
            onClick={() => setStatus("in_progress")}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
          >
            Start
          </button>
        )}
        {status === "in_progress" && (
          <button
            onClick={() => setStatus("completed")}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
          >
            Complete
          </button>
        )}
        {status === "completed" && (
          <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <CheckCircleIcon className="h-4 w-4" /> Completed
          </span>
        )}
      </div>
    </Card>
  );
}
