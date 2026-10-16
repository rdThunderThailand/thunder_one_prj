"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { CheckCircleIcon } from "@/components/ui/icons";
import type { Asset } from "@/features/asset-intelligence/assets";
import { getDepartmentAssets } from "../mock-data";

// Assets transferred from Asset Manager, pending Department Manager's
// acknowledgement into the department (requirement doc DM-01 — the step
// before DM-02 assign-to-employee, and before Employee's own Scan QR
// acknowledgement, EMP-01). Real, working local state on Acknowledge, not
// persisted (see asset-intelligence/issues/components/ReportProblemForm.tsx's comment).
function ApprovalRow({ asset }: { asset: Asset }) {
  const [acknowledged, setAcknowledged] = useState(false);

  if (acknowledged) {
    return (
      <Card className="flex items-center gap-3 p-4">
        <CheckCircleIcon className="h-5 w-5 shrink-0 text-success" />
        <p className="text-sm text-muted-foreground">
          {asset.tag} acknowledged into the department.
        </p>
      </Card>
    );
  }

  return (
    <Card className="flex items-center gap-3 p-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{asset.tag}</p>
        <p className="text-xs text-muted-foreground">
          {asset.model ?? asset.category} · transferred from Asset Manager
        </p>
      </div>
      <button
        onClick={() => setAcknowledged(true)}
        className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary"
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
      <Card className="p-6 text-sm text-muted-foreground">
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
