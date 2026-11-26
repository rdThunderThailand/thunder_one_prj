import { Card } from "@/components/ui/Card";
import { EditIcon, FileTextIcon, InfoIcon, WarningTriangleIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import { Checkbox } from "@/components/ui/lovable/checkbox";
import { DISPOSAL_METHODS } from "../../domain/asset-lifecycle-actions";
import { assignmentDate } from "../../domain/assignment-current";
import type { DisposeFlow } from "../../hooks/use-dispose-flow";
import type { AssetDetail } from "../../services/asset-profile-contract";
import { LifecycleCondition, LifecycleStatus } from "./LifecycleSummary";
import { LifecycleAssetInfo, LifecycleFiles, LifecycleTable } from "./RetireReview";

const AFTER_CONFIRMATION = [
  "The asset status will change from Retired → Disposed.",
  "The asset will be removed from active inventory and normal workflows.",
  "A record will be created in Asset History and Audit Log.",
  "This action cannot be undone.",
];

function StepHeader({ title, body }: { title: string; body: string }) {
  return (
    <header className="space-y-0.5">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <FileTextIcon aria-hidden="true" className="size-4 shrink-0 text-accent-foreground" />
        {title}
      </h2>
      <p className="pl-6 text-xs text-muted-foreground">{body}</p>
    </header>
  );
}

function DisposalTable({ flow }: { flow: DisposeFlow }) {
  const method = DISPOSAL_METHODS.find(({ value }) => value === flow.draft.method)?.label ?? flow.draft.method;
  return (
    <LifecycleTable rows={[
      ["Disposal Method", method],
      ["Reason for Disposal", flow.draft.reason.trim()],
      ["Notes", flow.draft.notes.trim() || "—"],
      ["Attachments", <LifecycleFiles key="files" items={flow.evidence.items} />],
    ]} />
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
      <FileTextIcon aria-hidden="true" className="size-4 shrink-0 text-accent-foreground" />
      {children}
    </h3>
  );
}

export function DisposeReview({ asset, flow }: { asset: AssetDetail; flow: DisposeFlow }) {
  return (
    <Card className="space-y-4 p-4">
      <StepHeader title="2. Review Disposal Information" body="Please review the information below before confirming." />
      <LifecycleAssetInfo
        asset={asset}
        photo={flow.photo}
        rows={[
          ["Serial Number", asset.serialNumber || "—"],
          ["Asset Tag", asset.assetTag],
          ["Category", asset.category?.name || "—"],
          ["Brand / Model", "—"],
        ]}
      />
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <SectionTitle>Disposal Details</SectionTitle>
          <Button type="button" variant="outline" size="sm" onClick={flow.edit}>
            <EditIcon aria-hidden="true" className="size-3.5" />
            Edit
          </Button>
        </div>
        <DisposalTable flow={flow} />
      </section>
      <section className="flex items-start gap-3 rounded-card border border-primary/15 bg-accent/60 p-4">
        <InfoIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-accent-foreground" />
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-foreground">After Confirmation</h3>
          <ul className="list-disc space-y-1 pl-4 text-xs text-foreground/90 marker:text-accent-foreground">
            {AFTER_CONFIRMATION.map((line) => <li key={line}>{line}</li>)}
          </ul>
        </div>
      </section>
    </Card>
  );
}

export function DisposeConfirm({ asset, flow }: { asset: AssetDetail; flow: DisposeFlow }) {
  const sending = flow.save.phase === "sending";
  return (
    <Card className="space-y-4 p-4">
      <StepHeader title="3. Confirm Disposal" body="Please confirm the disposal action. This action cannot be undone." />
      <section role="note" className="flex items-start gap-3 rounded-card border border-error/25 bg-error-muted p-4">
        <WarningTriangleIcon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-error" />
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-error">Final Confirmation Required</h3>
          <p className="text-xs text-foreground/90">
            You are about to permanently dispose this asset. It leaves active use and cannot be restored. Its record and
            history are kept.
          </p>
        </div>
      </section>
      <LifecycleAssetInfo
        asset={asset}
        photo={flow.photo}
        title="Asset to Be Disposed"
        badge={(
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <LifecycleStatus value="Retired" />
            <span aria-hidden="true">→</span>
            <span className="sr-only">to</span>
            <LifecycleStatus value="Disposed" />
          </span>
        )}
        rows={[
          ["Serial Number", asset.serialNumber || "—"],
          ["Purchase Date", asset.acquisitionDate ? assignmentDate(asset.acquisitionDate) : "—"],
          ["Current Status", <LifecycleStatus key="status" value={asset.lifecycleStatus} />],
          ["Current Condition", <LifecycleCondition key="condition" value={asset.condition} />],
        ]}
      />
      <section className="space-y-3">
        <SectionTitle>Disposal Information</SectionTitle>
        <DisposalTable flow={flow} />
      </section>
      <label
        htmlFor="dispose-confirm"
        className="flex cursor-pointer items-start gap-3 rounded-card border border-primary/40 p-4 has-[button:disabled]:cursor-not-allowed"
      >
        <Checkbox
          id="dispose-confirm"
          className="mt-0.5"
          checked={flow.checked}
          disabled={sending}
          onCheckedChange={(value) => flow.setChecked(value === true)}
          aria-describedby="dispose-confirm-hint"
        />
        <span className="space-y-0.5">
          <span className="block text-xs font-medium text-foreground">
            I confirm that the information above is correct and I want to permanently dispose this asset.
          </span>
          <span id="dispose-confirm-hint" className="block text-2xs text-muted-foreground">This action will be recorded in the Audit Log.</span>
        </span>
      </label>
    </Card>
  );
}
