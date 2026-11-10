import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { ArrowRightIcon } from "@/components/ui/icons";
import type { AssetCondition } from "../../domain/asset-condition";
import { locationTrail } from "../../domain/asset-profile";
import type { AssetStatus } from "../../domain/asset-status";
import type { AssetDetail } from "../../services/asset-profile-contract";
import { ConditionBadge, StatusBadge } from "../StatusBadges";
import { AssignHolder } from "./AssignHolder";
import { SaveAlert } from "./SaveAlert";
import type { TransferFlow } from "./use-transfer-flow";

function Party({ label, children, location }: { label: string; children: ReactNode; location: string }) {
  return (
    <div className="min-w-0 flex-1 space-y-2 rounded-control bg-muted p-3">
      <p className="text-2xs font-medium text-accent-foreground">{label}</p>
      {children}
      <p className="text-2xs text-muted-foreground wrap-anywhere">{location}</p>
    </div>
  );
}

/** Read-only check before saving (frame 20). The footer's "Confirm Transfer" saves. */
export function TransferReview({ flow, asset }: { flow: TransferFlow; asset: AssetDetail }) {
  const current = locationTrail(asset.locationPath, asset.location) || "No location";
  const next = flow.location && flow.location.id !== asset.location?.id ? flow.location.name : current;
  const rows = [
    { label: "Asset", value: `${asset.name} · ${asset.assetTag}` },
    { label: "Location", value: next === current ? `Stays ${current}` : `${current} → ${next}` },
    { label: "Reason / Note", value: flow.reason.trim() || "—" },
    { label: "Attachments", value: flow.evidence.items.length ? flow.evidence.items.map((item) => item.file.name).join(", ") : "None" },
  ];
  return (
    <Card className="space-y-4 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-semibold text-foreground">Confirm Transfer</h2>
        <StatusBadge status={asset.lifecycleStatus as AssetStatus} />
      </div>
      <p className="text-2xs text-muted-foreground">Review all information below, then confirm to complete the transfer.</p>
      <SaveAlert
        save={flow.save}
        action="transfer"
        reloading={flow.detail.pending}
        onReload={flow.reload}
      />
      <div className="flex min-w-0 flex-col items-stretch gap-3 @min-2xl/assign-flow:flex-row @min-2xl/assign-flow:items-center">
        <Party
          label="From (Current)"
          location={current}
        >
          {asset.custody ? (
            <AssignHolder
              type={asset.custody.type}
              name={asset.custody.name}
              secondary={asset.custody.department?.name}
              avatarUrl={asset.custody.avatarUrl}
            />
          ) : (
            <p className="text-xs text-muted-foreground">No current custodian</p>
          )}
        </Party>
        <ArrowRightIcon
          aria-hidden="true"
          className="mx-auto size-4 shrink-0 rotate-90 text-accent-foreground @min-2xl/assign-flow:rotate-0"
        />
        <Party
          label="To (New)"
          location={next}
        >
          {flow.target && (
            <AssignHolder
              type={flow.target.type}
              name={flow.target.name}
              secondary={flow.target.secondary}
            />
          )}
        </Party>
      </div>
      <dl className="divide-y divide-border text-xs">
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid gap-1 py-2 sm:grid-cols-[10rem_minmax(0,1fr)]"
          >
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className="text-foreground wrap-anywhere">{row.value}</dd>
          </div>
        ))}
        <div className="grid gap-1 py-2 sm:grid-cols-[10rem_minmax(0,1fr)]">
          <dt className="text-muted-foreground">Condition at Time of Transfer</dt>
          <dd>
            <ConditionBadge condition={flow.condition as AssetCondition | null} />
          </dd>
        </div>
      </dl>
    </Card>
  );
}
