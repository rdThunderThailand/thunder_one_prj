import { Card } from "@/components/ui/Card";
import { CheckIcon, FileTextIcon } from "@/components/ui/icons";
import { assignmentDate } from "../../domain/assignment-current";
import type { WarrantyDraft } from "../../domain/warranty-form";
import type { AssetDetail } from "../../services/asset-profile-contract";
import { LifecycleCondition, LifecycleStatus } from "../lifecycle/LifecycleSummary";
import { LifecycleAssetInfo, LifecycleFiles, LifecycleTable } from "../lifecycle/RetireReview";
import type { WarrantyFlow } from "./use-warranty-flow";

const day = (value: string) => (value ? assignmentDate(value) : "—");

function warrantyRows(draft: WarrantyDraft, files: React.ReactNode, current: string | null) {
  return [
    ["Provider", draft.provider.trim()],
    ["Warranty Type", draft.type.trim()],
    ["Start Date", day(draft.startDate)],
    ["End Date", day(draft.endDate)],
    ["Reference No.", draft.referenceNo.trim() || "—"],
    ["Coverage Note", draft.coverageNote.trim() || "—"],
    ["Attachments", files],
    ...(current ? [["Becomes current", current] as const] : []),
  ] as const;
}

function assetRows(asset: AssetDetail) {
  return [
    ["Serial Number", asset.serialNumber || "—"],
    ["Category", asset.category?.name || "—"],
    ["Current Status", <LifecycleStatus key="status" value={asset.lifecycleStatus} />],
    ["Current Condition", <LifecycleCondition key="condition" value={asset.condition} />],
  ] as const;
}

export function WarrantyReview({ asset, flow, number }: { asset: AssetDetail; flow: WarrantyFlow; number: number }) {
  return (
    <Card className="space-y-4 p-4">
      <header className="space-y-0.5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <FileTextIcon aria-hidden="true" className="size-4 shrink-0 text-accent-foreground" />
          {number}. Review Warranty Information
        </h2>
        <p className="pl-6 text-xs text-muted-foreground">Please review the information below before confirming.</p>
      </header>
      <LifecycleAssetInfo asset={asset} photo={flow.photo} rows={assetRows(asset)} />
      <section className="space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <FileTextIcon aria-hidden="true" className="size-4 shrink-0 text-accent-foreground" />
          Warranty Details
        </h3>
        <LifecycleTable rows={warrantyRows(
          flow.draft,
          <LifecycleFiles key="files" items={flow.documents.items} />,
          flow.edit ? null : flow.draft.makeCurrent ? "Yes" : "No",
        )} />
      </section>
    </Card>
  );
}

export function WarrantyResult({ asset, flow }: { asset: AssetDetail; flow: WarrantyFlow }) {
  const saved = flow.saved;
  if (!saved) return null;
  const names = saved.documents.length ? saved.documents.join("\n") : "—";
  return (
    <div className="space-y-3">
      <section className="flex items-start gap-3.5 rounded-card border border-success/25 bg-success-muted/70 p-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-success text-primary-foreground">
          <CheckIcon aria-hidden="true" className="size-5" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-foreground">{flow.edit ? "Warranty Updated" : "Warranty Added"}</h2>
          <p className="text-xs text-muted-foreground">
            {saved.warranty.isCurrent ? "This is now the asset's current warranty." : "The record is saved in the asset's warranty history."}
          </p>
        </div>
      </section>
      <Card className="space-y-3 p-4">
        <LifecycleAssetInfo asset={asset} photo={flow.photo} rows={assetRows(asset)} />
      </Card>
      <Card className="space-y-3 p-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <FileTextIcon aria-hidden="true" className="size-4 shrink-0 text-accent-foreground" />
          Warranty Summary
        </h2>
        <LifecycleTable rows={warrantyRows(saved.draft, names, saved.warranty.isCurrent ? "Yes" : "No")} />
      </Card>
    </div>
  );
}
