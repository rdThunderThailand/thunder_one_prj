"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { profileWarranty } from "../../domain/asset-profile-display.mts";
import type { AssetDetail } from "../../services/asset-profile-contract";
import { formatDate } from "./ProfileParts";

export function CustodianValue({ custody }: { custody: AssetDetail["custody"] }) {
  if (!custody) return <span className="text-xs text-muted-foreground">Unassigned</span>;
  const name = custody.name || "Unnamed custodian";
  return (
    <span className="flex min-w-0 items-center gap-2">
      <Avatar name={name} src={custody.avatarUrl} size={32} />
      <span className="min-w-0">
        <span className="block text-xs font-semibold wrap-anywhere text-foreground">{name}</span>
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
