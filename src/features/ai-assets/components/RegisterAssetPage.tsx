"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { CheckCircleIcon, SearchIcon } from "@/components/ui/icons";
import { CURRENT_EMPLOYEE_ID } from "@/config/current-employee";
import { getMockAssets } from "../services/mock-assets";

// Simulated QR scan (requirement doc EMP-01) — there's no camera integration
// anywhere in this codebase, so this pre-fills the "scan result" with the
// employee's pending asset rather than opening a real scanner. Confirming
// shows a real local success state; it doesn't write back to mock-assets.ts
// (see ai-issues/components/ReportProblemForm.tsx's comment for why this
// sprint keeps mutations client-local rather than introducing mock server state).
export function RegisterAssetPage() {
  const pending = getMockAssets().find(
    (a) => a.assigneeId === CURRENT_EMPLOYEE_ID && a.lifecycleStatus === "pending_acknowledgement",
  );
  const [confirmed, setConfirmed] = useState(false);

  if (!pending) {
    return (
      <Card className="p-6 text-sm text-zinc-500 dark:text-zinc-400">
        No assets are waiting for your confirmation right now.
      </Card>
    );
  }

  if (confirmed) {
    return (
      <Card className="flex items-center gap-3 p-6">
        <CheckCircleIcon className="h-6 w-6 shrink-0 text-emerald-500" />
        <div>
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            {pending.tag} is now registered to you.
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            It will appear in My Assets going forward.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-4 p-6">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-zinc-400">
        <SearchIcon className="h-4 w-4" /> Scan result
      </div>
      <div>
        <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{pending.tag}</p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{pending.model ?? pending.category}</p>
      </div>
      <p className="text-sm text-zinc-600 dark:text-zinc-300">
        This asset has been assigned to you. Confirm receipt to register it in the system.
      </p>
      <button
        onClick={() => setConfirmed(true)}
        className="self-start rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
      >
        Confirm Receipt
      </button>
    </Card>
  );
}
