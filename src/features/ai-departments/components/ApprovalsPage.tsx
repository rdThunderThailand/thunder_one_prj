"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { CheckCircleIcon } from "@/components/ui/icons";
import type { Asset } from "@/features/ai-assets";
import { getDepartmentAssets } from "../mock-data";

// Assets transferred from Asset Manager, pending Department Manager's
// acknowledgement into the department (requirement doc DM-01 — the step
// before DM-02 assign-to-employee, and before Employee's own Scan QR
// acknowledgement, EMP-01). Real, working local state on Acknowledge, not
// persisted (see ai-issues/components/ReportProblemForm.tsx's comment).
function ApprovalRow({ asset }: { asset: Asset }) {
  const [acknowledged, setAcknowledged] = useState(false);

  if (acknowledged) {
    return (
      <Card className="flex items-center gap-3 p-4">
        <CheckCircleIcon className="h-5 w-5 shrink-0 text-emerald-500" />
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          {asset.tag} acknowledged into the department.
        </p>
      </Card>
    );
  }

  return (
    <Card className="flex items-center gap-3 p-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{asset.tag}</p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {asset.model ?? asset.category} · transferred from Asset Manager
        </p>
      </div>
      <button
        onClick={() => setAcknowledged(true)}
        className="shrink-0 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
      >
        Acknowledge
      </button>
    </Card>
  );
}

export function ApprovalsPage() {
  const pending = getDepartmentAssets().filter((a) => a.lifecycleStatus === "pending_department_ack");

  if (pending.length === 0) {
    return (
      <Card className="p-6 text-sm text-zinc-500 dark:text-zinc-400">
        Nothing waiting on your acknowledgement right now.
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {pending.map((asset) => (
        <ApprovalRow key={asset.id} asset={asset} />
      ))}
    </div>
  );
}
