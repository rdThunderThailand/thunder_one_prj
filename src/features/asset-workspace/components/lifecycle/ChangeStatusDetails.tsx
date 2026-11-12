import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { ArrowRightIcon, InfoIcon, ToolIcon, WarningTriangleIcon } from "@/components/ui/icons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/lovable/select";
import { Textarea } from "@/components/ui/lovable/textarea";
import { allowedConditions, allowedTargets, endsCustody, LIFECYCLE_TEXT_MAX } from "../../domain/asset-lifecycle-actions";
import type { ChangeStatusFlow } from "../../hooks/use-change-status-flow";
import type { AssetDetail } from "../../services/asset-profile-contract";
import { AssignAttachments } from "../assignments/AssignAttachments";
import { LifecycleCondition, LifecycleHolder, LifecycleStatus } from "./LifecycleSummary";

function FieldError({ id, message }: { id: string; message: string | null | undefined }) {
  return message ? <p id={id} className="text-xs text-error">{message}</p> : null;
}

export function ChangeStatusDetails({ flow, asset }: { flow: ChangeStatusFlow; asset: AssetDetail }) {
  const { draft, errors } = flow;
  const [touched, setTouched] = useState({ status: false, condition: false, reason: false });
  const targets = allowedTargets(asset);
  const conditions = allowedConditions(draft.status);
  const holder = asset.custody?.name ?? "The current custodian";
  const statusError = touched.status ? errors?.status : null;
  const conditionError = (touched.condition || touched.status) ? (errors?.condition ?? errors?.change) : null;
  const reasonError = touched.reason ? errors?.reason : null;
  return (
    <Card className="space-y-4 p-4 focus-within:border-foreground/20 focus-within:shadow-float">
      <header className="space-y-0.5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <InfoIcon aria-hidden="true" className="size-4 shrink-0 text-accent-foreground" />
          1. New Status &amp; Condition
        </h2>
        <p className="pl-6 text-xs text-muted-foreground">Select the new status and condition for this asset.</p>
      </header>
      <div className="grid min-w-0 items-start gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1.15fr)]">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-foreground">Current Status</p>
          <div className="flex min-h-10 flex-wrap items-center gap-2.5 rounded-control border border-border/60 bg-muted/60 px-3 py-1.5">
            <LifecycleStatus value={asset.lifecycleStatus} />
            {asset.custody && <LifecycleHolder holder={asset.custody} />}
          </div>
        </div>
        <ArrowRightIcon aria-hidden="true" className="hidden size-4 self-start text-accent-foreground sm:mt-8 sm:block" />
        <div className="min-w-0 space-y-1.5">
          <label htmlFor="lifecycle-status" className="text-xs font-medium text-foreground">New Status <span className="text-error">*</span></label>
          <Select
            value={targets.some((status) => status === draft.status) ? draft.status : ""}
            onValueChange={(value) => { setTouched((prev) => ({ ...prev, status: true })); flow.chooseStatus(value); }}
            required
          >
            <SelectTrigger id="lifecycle-status" className="min-h-10" aria-invalid={Boolean(statusError)} aria-describedby={statusError ? "lifecycle-status-error" : undefined}>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {targets.map((status) => (
                <SelectItem key={status} value={status}>
                  <span className="inline-flex items-center gap-2">
                    {status === "In Maintenance" && <ToolIcon aria-hidden="true" className="size-4" />}
                    {status}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError id="lifecycle-status-error" message={statusError} />
          <div className="flex items-start gap-2 rounded-control border border-primary/15 bg-accent/60 p-3 text-xs">
            <InfoIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-accent-foreground" />
            <div className="min-w-0 space-y-1">
              <p className="font-semibold text-foreground">Allowed transitions from {asset.lifecycleStatus}:</p>
              <ul className="list-disc space-y-0.5 pl-4 text-foreground/90 marker:text-accent-foreground">
                {targets.map((status) => <li key={status}>{status}{status === asset.lifecycleStatus && " (condition only)"}</li>)}
                {asset.lifecycleStatus === "Assigned" && <li>(Return asset first to set Available / Retired)</li>}
              </ul>
            </div>
          </div>
          {endsCustody(asset, draft.status) && (
            <div role="status" className="flex items-start gap-2 rounded-control border border-warning/25 bg-warning-muted p-3 text-xs text-foreground">
              <WarningTriangleIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-warning" />
              <p>{holder} still holds this asset. Saving ends their custody. Use Assign afterwards to assign it again.</p>
            </div>
          )}
        </div>
      </div>
      <div className="grid min-w-0 items-start gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1.15fr)]">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-foreground">Current Condition</p>
          <div className="flex min-h-10 items-center rounded-control border border-border/60 bg-muted/60 px-3 py-1.5">
            <LifecycleCondition value={asset.condition} />
          </div>
        </div>
        <ArrowRightIcon aria-hidden="true" className="hidden size-4 self-start text-accent-foreground sm:mt-8 sm:block" />
        <div className="min-w-0 space-y-1.5">
          <label htmlFor="lifecycle-condition" className="text-xs font-medium text-foreground">New Condition <span className="text-error">*</span></label>
          <Select
            value={conditions.some((condition) => condition === draft.condition) ? draft.condition : ""}
            onValueChange={(value) => { setTouched((prev) => ({ ...prev, condition: true })); flow.setCondition(value); }}
            required
          >
            <SelectTrigger
              id="lifecycle-condition"
              className="min-h-10"
              aria-invalid={Boolean(conditionError)}
              aria-describedby={conditionError ? "lifecycle-condition-error" : undefined}
            >
              <SelectValue placeholder="Select condition" />
            </SelectTrigger>
            <SelectContent>
              {conditions.map((condition) => (
                <SelectItem key={condition} value={condition}>
                  <LifecycleCondition value={condition} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError id="lifecycle-condition-error" message={conditionError} />
        </div>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="lifecycle-reason" className="text-xs font-medium text-foreground">Reason <span className="text-error">*</span></label>
        <Textarea
          id="lifecycle-reason"
          required
          rows={2}
          maxLength={LIFECYCLE_TEXT_MAX}
          placeholder="Enter reason for status or condition change…"
          value={draft.reason}
          onChange={(event) => { setTouched((prev) => ({ ...prev, reason: true })); flow.setReason(event.target.value); }}
          onBlur={() => setTouched((prev) => ({ ...prev, reason: true }))}
          aria-invalid={Boolean(reasonError)}
          aria-describedby={reasonError ? "lifecycle-reason-count lifecycle-reason-error" : "lifecycle-reason-count"}
        />
        <div className="flex items-center justify-between gap-2">
          <FieldError id="lifecycle-reason-error" message={reasonError} />
          <p id="lifecycle-reason-count" className="ml-auto text-right text-2xs tabular-nums text-muted-foreground">{draft.reason.length} / {LIFECYCLE_TEXT_MAX}</p>
        </div>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="lifecycle-notes" className="text-xs font-medium text-foreground">Detail / Notes</label>
        <Textarea
          id="lifecycle-notes"
          rows={3}
          maxLength={LIFECYCLE_TEXT_MAX}
          placeholder="Add additional details or notes (optional)…"
          value={draft.notes}
          onChange={(event) => flow.setNotes(event.target.value)}
          aria-describedby="lifecycle-notes-count"
        />
        <p id="lifecycle-notes-count" className="text-right text-2xs tabular-nums text-muted-foreground">{draft.notes.length} / {LIFECYCLE_TEXT_MAX}</p>
      </div>
      <AssignAttachments evidence={flow.evidence} />
    </Card>
  );
}
