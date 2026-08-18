"use client";

import Link from "next/link";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { BoxIcon, WarningTriangleIcon } from "@/components/ui/icons";
import { ReportProblemForm } from "@/features/ai-issues";
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
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
          <BoxIcon />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{asset.tag}</p>
          <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
            {asset.model ?? asset.category}
          </p>
        </div>
        <Badge color={badge.color} variant="dot">
          {badge.label}
        </Badge>
        <button
          onClick={() => setReporting((v) => !v)}
          className="shrink-0 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
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
    <Card className="flex items-center gap-3 border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
      <WarningTriangleIcon className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
      <p className="flex-1 text-sm text-amber-800 dark:text-amber-300">
        You have {count} asset{count > 1 ? "s" : ""} waiting for your confirmation.
      </p>
      <Link
        href="/asset-intelligence/scan-qr"
        className="shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-500"
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
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Need help?{" "}
        <span className="font-medium text-indigo-600 dark:text-indigo-400">Contact IT Support</span>
      </p>
    </div>
  );
}
