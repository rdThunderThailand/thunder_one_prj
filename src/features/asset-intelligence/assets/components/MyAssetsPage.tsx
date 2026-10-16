"use client";

import Link from "next/link";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { BoxIcon, WarningTriangleIcon } from "@/components/ui/icons";
import { ReportProblemForm } from "@/features/asset-intelligence/issues";
import { CURRENT_EMPLOYEE_ID } from "@/config/current-employee";
import { getMockAssets } from "../services/mock-assets";
import type { Asset } from "../types";

const statusBadge: Record<Asset["status"], { color: "green" | "yellow" | "red"; label: string }> = {
  healthy: { color: "green", label: "Good" },
  attention: { color: "yellow", label: "Needs attention" },
  critical: { color: "red", label: "Needs attention" },
};

function AssetCard({ asset }: { asset: Asset }) {
  const [reporting, setReporting] = useState(false);
  const badge = statusBadge[asset.status];

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <BoxIcon />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">{asset.tag}</p>
          <p className="truncate text-xs text-muted-foreground">
            {asset.model ?? asset.category}
          </p>
        </div>
        <Badge color={badge.color} variant="dot">
          {badge.label}
        </Badge>
        <button
          onClick={() => setReporting((v) => !v)}
          className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
        >
          {reporting ? "Cancel" : "Report a problem"}
        </button>
      </div>
      {reporting && <ReportProblemForm assetTag={asset.tag} />}
    </Card>
  );
}

function PendingAcknowledgementBanner({ count }: { count: number }) {
  return (
    <Card className="flex items-center gap-3 border-warning/30 bg-warning-muted p-4">
      <WarningTriangleIcon className="h-5 w-5 shrink-0 text-t1-amber-700" />
      <p className="flex-1 text-sm text-t1-amber-700">
        You have {count} asset{count > 1 ? "s" : ""} waiting for your confirmation.
      </p>
      <Link
        href="/asset-intelligence/my-assets/scan-qr"
        className="shrink-0 rounded-lg bg-warning px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-warning/90"
      >
        Register now
      </Link>
    </Card>
  );
}

export function MyAssetsPage() {
  const myAssets = getMockAssets().filter((a) => a.assigneeId === CURRENT_EMPLOYEE_ID);
  const active = myAssets.filter((a) => a.lifecycleStatus === "active");
  const pending = myAssets.filter((a) => a.lifecycleStatus === "pending_acknowledgement");

  return (
    <div className="flex flex-col gap-4">
      {pending.length > 0 && <PendingAcknowledgementBanner count={pending.length} />}
      {active.map((asset) => (
        <AssetCard key={asset.id} asset={asset} />
      ))}
      <p className="text-sm text-muted-foreground">
        Need help?{" "}
        <span className="font-medium text-primary">Contact IT Support</span>
      </p>
    </div>
  );
}
