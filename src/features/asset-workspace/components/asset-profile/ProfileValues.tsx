"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { profileWarranty } from "../../domain/asset-profile-display.mts";
import type { AssetDetail } from "../../services/asset-profile-contract";
import { formatDate } from "./ProfileParts";

export function CustodianValue({ custody }: { custody: AssetDetail["custody"] }) {
  const [failed, setFailed] = useState<string | null>(null);
  if (!custody) return <span className="text-xs text-muted-foreground">Unassigned</span>;
  const initials = (custody.name || "?").trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("");
  return (
    <span className="flex min-w-0 items-center gap-2">
      {custody.avatarUrl && custody.avatarUrl !== failed ? (
        // eslint-disable-next-line @next/next/no-img-element -- tenant-provided avatar URL with an initials fallback.
        <img src={custody.avatarUrl} alt="" className="size-8 shrink-0 rounded-full object-cover" onError={() => setFailed(custody.avatarUrl)} />
      ) : (
        <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">{initials}</span>
      )}
      <span className="min-w-0">
        <span className="block text-xs font-semibold wrap-anywhere">{custody.name || "Unnamed custodian"}</span>
        {custody.department && <span className="block text-xs text-muted-foreground">{custody.department.name}</span>}
      </span>
    </span>
  );
}

export function WarrantyValue({ warranty }: { warranty: AssetDetail["currentWarranty"] }) {
  const state = profileWarranty(warranty?.expiryStatus ?? null);
  return (
    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <Badge color={state.tone} variant="pill">{state.label}</Badge>
      {warranty && (
        <span className="text-xs text-muted-foreground">
          {warranty.endDate ? `Until ${formatDate(warranty.endDate)}` : "No end date"}
          {warranty.provider ? ` (${warranty.provider})` : ""}
        </span>
      )}
    </span>
  );
}
