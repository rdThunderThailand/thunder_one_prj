import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { ArrowRightIcon, BoxIcon, ClockIcon, FileIcon, InfoIcon, LocationIcon, TransferIcon } from "@/components/ui/icons";
import { endsCustody } from "../../domain/asset-lifecycle-actions";
import { fileSize, locationTrail } from "../../domain/asset-profile";
import { assignmentDate } from "../../domain/assignment-current";
import type { ChangeStatusFlow } from "../../hooks/use-change-status-flow";
import type { AssetDetail } from "../../services/asset-profile-contract";
import { LifecycleCondition, LifecycleHolder, LifecycleIdentity, LifecycleStatus, LifecycleValues } from "./LifecycleSummary";

type Rows = ReadonlyArray<readonly [string, ReactNode]>;

export function ChangeStatusComparison({ beforeTitle, afterTitle, before, after, rowArrows = false }: {
  beforeTitle: string; afterTitle: string; before: Rows; after: Rows; rowArrows?: boolean;
}) {
  if (rowArrows) {
    return (
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <section className="min-w-0 space-y-3 rounded-card border border-border bg-muted/50 p-4 sm:row-span-7 sm:grid sm:grid-rows-subgrid sm:gap-y-2.5 sm:space-y-0">
          <h3 className="border-b border-border/60 pb-2 text-xs font-semibold text-foreground">{beforeTitle}</h3>
          {before.map((row) => <LifecycleValues key={row[0]} rows={[row]} />)}
        </section>
        <div aria-hidden="true" className="hidden sm:row-span-7 sm:grid sm:grid-rows-subgrid sm:gap-y-2.5">
          <span />
          {before.map(([label]) => (
            <ArrowRightIcon key={label} className="size-4 self-center text-accent-foreground" />
          ))}
        </div>
        <section className="min-w-0 space-y-3 rounded-card border border-success/25 bg-success-muted/60 p-4 sm:row-span-7 sm:grid sm:grid-rows-subgrid sm:gap-y-2.5 sm:space-y-0">
          <h3 className="border-b border-success/20 pb-2 text-xs font-semibold text-foreground">{afterTitle}</h3>
          {after.map((row) => <LifecycleValues key={row[0]} rows={[row]} />)}
        </section>
      </div>
    );
  }
  return (
    <div className="grid items-stretch gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
      <section className="min-w-0 space-y-3 rounded-card border border-border bg-muted/50 p-4">
        <h3 className="border-b border-border/60 pb-2 text-xs font-semibold text-foreground">{beforeTitle}</h3>
        <LifecycleValues rows={before} />
      </section>
      <ArrowRightIcon aria-hidden="true" className="hidden size-5 self-center text-accent-foreground sm:block" />
      <section className="min-w-0 space-y-3 rounded-card border border-success/25 bg-success-muted/60 p-4">
        <h3 className="border-b border-success/20 pb-2 text-xs font-semibold text-foreground">{afterTitle}</h3>
        <LifecycleValues rows={after} />
      </section>
    </div>
  );
}

export function ChangeStatusReview({ asset, flow }: { asset: AssetDetail; flow: ChangeStatusFlow }) {
  const location = locationTrail(asset.locationPath, asset.location) || "—";
  const attachments = flow.evidence.items.filter((item) => item.status === "done");
  const size = attachments.reduce((total, item) => total + item.file.size, 0);
  const locationNode = (
    <span className="inline-flex items-center gap-1.5">
      <LocationIcon aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" />
      <span>{location}</span>
    </span>
  );
  return (
    <Card className="space-y-4 p-4">
      <header className="space-y-0.5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <InfoIcon aria-hidden="true" className="size-4 shrink-0 text-accent-foreground" />
          2. Review Changes
        </h2>
        <p className="pl-6 text-xs text-muted-foreground">Please review the information below before confirming.</p>
      </header>
      <section className="space-y-3 rounded-card border border-border p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <BoxIcon aria-hidden="true" className="size-4 shrink-0 text-accent-foreground" />
          Asset Information
        </h3>
        <LifecycleIdentity asset={asset} photo={flow.photo} review />
        <dl className="grid grid-cols-2 gap-3 border-t border-border pt-3 text-xs lg:grid-cols-4">
          {[
            ["Serial Number", asset.serialNumber],
            ["Asset Tag", asset.assetTag],
            ["Category", asset.category?.name],
            ["Brand / Model", null],
          ].map(([label, value]) => (
            <div key={label} className="min-w-0 space-y-1">
              <dt className="text-2xs text-muted-foreground">{label}</dt>
              <dd className="font-semibold text-foreground wrap-anywhere">{value || "—"}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className="space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <TransferIcon aria-hidden="true" className="size-4 shrink-0 text-accent-foreground" />
          Change Summary
        </h3>
        <ChangeStatusComparison
          beforeTitle="Current (Before)"
          afterTitle="New (After)"
          before={[
            ["Status", <LifecycleStatus key="status" value={asset.lifecycleStatus} />],
            ["Condition", <LifecycleCondition key="condition" value={asset.condition} />],
            ["Current Custodian", <LifecycleHolder key="holder" holder={asset.custody} />],
            ["Location", locationNode],
            ["Since", asset.custody?.since ? (
              <span key="since" className="inline-flex items-center gap-1.5">
                <ClockIcon aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" />
                <span>{assignmentDate(asset.custody.since)}</span>
              </span>
            ) : "—"],
          ]}
          after={[
            ["Status", <LifecycleStatus key="status" value={flow.draft.status} />],
            ["Condition", <LifecycleCondition key="condition" value={flow.draft.condition} />],
            ["Current Custodian", endsCustody(asset, flow.draft.status) ? "None — custody ends" : (
              <div key="holder" className="space-y-1">
                <LifecycleHolder holder={asset.custody} />
                <p className="flex items-center gap-1 text-2xs font-normal text-muted-foreground">
                  <InfoIcon aria-hidden="true" className="size-3 shrink-0" />
                  Custodian remains the same
                </p>
              </div>
            )],
            ["Location", (
              <div key="location" className="space-y-1">
                {locationNode}
                <p className="flex items-center gap-1 text-2xs font-normal text-muted-foreground">
                  <InfoIcon aria-hidden="true" className="size-3 shrink-0" />
                  Location remains the same
                </p>
              </div>
            )],
            ["Reason", flow.draft.reason.trim()],
            ["Notes", flow.draft.notes.trim() || "—"],
            ["Attachments", attachments.length ? (
              <span key="attachments" className="inline-flex items-center gap-1.5">
                <FileIcon aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" />
                <span>{`${attachments.length} file${attachments.length === 1 ? "" : "s"} (${fileSize(size)})`}</span>
              </span>
            ) : "—"],
          ]}
        />
      </section>
    </Card>
  );
}
