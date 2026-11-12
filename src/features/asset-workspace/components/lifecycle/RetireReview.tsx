import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { BoxIcon, FileIcon, FileTextIcon, WarningTriangleIcon } from "@/components/ui/icons";
import { fileSize } from "../../domain/asset-profile";
import { assignmentDate } from "../../domain/assignment-current";
import type { RetireFlow } from "../../hooks/use-retire-flow";
import type { AssetDetail } from "../../services/asset-profile-contract";
import type { EvidenceItem } from "../assignments/use-assign-evidence";
import { LifecycleCondition, LifecycleIdentity, LifecycleStatus } from "./LifecycleSummary";

type Rows = ReadonlyArray<readonly [string, ReactNode]>;

const RETIRE_IMPACT = [
  "The asset will be marked as Retired.",
  "The asset will no longer be available for normal assignments.",
  "This action will be recorded in the Audit Log and Status History.",
  "To dispose this asset, you can do so after it is retired.",
];

/** Label / value table with row rules (frames 29–30, 32–33). */
export function LifecycleTable({ rows }: { rows: Rows }) {
  return (
    <dl className="divide-y divide-border rounded-control border border-border text-xs">
      {rows.map(([label, value]) => (
        <div key={label} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3 px-3 py-2">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="min-w-0 font-medium text-foreground wrap-anywhere whitespace-pre-line">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Uploaded attachments as Review / Confirm list them: icon, name, size. */
export function LifecycleFiles({ items }: { items: EvidenceItem[] }) {
  const done = items.filter((item) => item.status === "done");
  if (!done.length) return "—";
  return (
    <ul className="space-y-1.5">
      {done.map((item) => (
        <li key={item.id} className="flex items-center gap-2">
          <FileIcon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 wrap-anywhere">{item.file.name}</span>
          <span className="shrink-0 font-normal text-muted-foreground">{fileSize(item.file.size)}</span>
        </li>
      ))}
    </ul>
  );
}

export function LifecycleAssetInfo({ asset, photo, rows, title = "Asset Information", badge }: {
  asset: AssetDetail; photo: string | null; rows: Rows; title?: string; badge?: ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-card border border-border p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <BoxIcon aria-hidden="true" className="size-4 shrink-0 text-accent-foreground" />
        {title}
      </h3>
      <LifecycleIdentity asset={asset} photo={photo} review badge={badge} />
      <dl className="grid grid-cols-2 gap-3 border-t border-border pt-3 text-xs lg:grid-cols-4">
        {rows.map(([label, value]) => (
          <div key={label} className="min-w-0 space-y-1">
            <dt className="text-2xs text-muted-foreground">{label}</dt>
            <dd className="font-semibold text-foreground wrap-anywhere">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function RetireReview({ asset, flow }: { asset: AssetDetail; flow: RetireFlow }) {
  return (
    <Card className="space-y-4 p-4">
      <header className="space-y-0.5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <FileTextIcon aria-hidden="true" className="size-4 shrink-0 text-accent-foreground" />
          2. Review Retirement Information
        </h2>
        <p className="pl-6 text-xs text-muted-foreground">Please review the information below before confirming.</p>
      </header>
      <LifecycleAssetInfo
        asset={asset}
        photo={flow.photo}
        rows={[
          ["Serial Number", asset.serialNumber || "—"],
          ["Purchase Date", asset.acquisitionDate ? assignmentDate(asset.acquisitionDate) : "—"],
          ["Current Status", <LifecycleStatus key="status" value={asset.lifecycleStatus} />],
          ["Current Condition", <LifecycleCondition key="condition" value={asset.condition} />],
        ]}
      />
      <section className="space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <FileTextIcon aria-hidden="true" className="size-4 shrink-0 text-accent-foreground" />
          Retirement Details
        </h3>
        <LifecycleTable rows={[
          ["Reason for Retirement", flow.draft.reason.trim()],
          ["Condition at Retirement", <LifecycleCondition key="condition" value={flow.draft.condition} />],
          ["Notes", flow.draft.notes.trim() || "—"],
          ["Attachments", <LifecycleFiles key="files" items={flow.evidence.items} />],
        ]} />
      </section>
      <section className="space-y-2 rounded-card border border-warning/25 bg-warning-muted p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <WarningTriangleIcon aria-hidden="true" className="size-4 shrink-0 text-warning" />
          Important Impact
        </h3>
        <ul className="list-disc space-y-1 pl-11 text-xs text-foreground/90 marker:text-warning">
          {RETIRE_IMPACT.map((line) => <li key={line}>{line}</li>)}
        </ul>
      </section>
    </Card>
  );
}
