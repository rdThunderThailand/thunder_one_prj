import Link from "next/link";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { ArrowRightIcon, ClipboardIcon, InfoIcon, TransferIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/lovable/select";
import { Textarea } from "@/components/ui/lovable/textarea";
import { allowedConditions, LIFECYCLE_TEXT_MAX } from "../../domain/asset-lifecycle-actions";
import { actionHref, profileHref } from "../../domain/assignment-assign";
import type { RetireFlow } from "../../hooks/use-retire-flow";
import type { AssetDetail } from "../../services/asset-profile-contract";
import { AssignAttachments } from "../assignments/AssignAttachments";
import { LifecycleCondition, LifecycleHolder, LifecycleStatus } from "./LifecycleSummary";

function FieldError({ id, message }: { id: string; message: string | null }) {
  return message ? <p id={id} className="text-xs text-error">{message}</p> : null;
}

function RetireBlocked({ asset, fromAssignments, action }: {
  asset: AssetDetail; fromAssignments: boolean; action: "return" | "change-status";
}) {
  const href = action === "return"
    ? actionHref(asset.id, "return", fromAssignments)
    : `${profileHref(asset.id, fromAssignments)}/change-status`;
  return (
    <div role="status" className="flex items-start gap-2 rounded-control border border-primary/15 bg-accent/60 p-3 text-xs">
      <InfoIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-accent-foreground" />
      <div className="min-w-0 space-y-2">
        <p className="text-foreground">
          {action === "return"
            ? "This asset must be returned from current custodian before it can be retired."
            : "Change the status to Available first: that ends the current custody."}
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href={href}>
            <TransferIcon aria-hidden="true" className="size-4" />
            {action === "return" ? "Start Return Process" : "Change Status First"}
          </Link>
        </Button>
      </div>
    </div>
  );
}

export function RetireDetails({ flow, asset, fromAssignments }: { flow: RetireFlow; asset: AssetDetail; fromAssignments: boolean }) {
  const { draft, errors, eligibility } = flow;
  const [touched, setTouched] = useState({ condition: false, reason: false });
  const conditionError = touched.condition ? errors.condition : null;
  const reasonError = touched.reason ? errors.reason : null;
  return (
    <Card className="space-y-4 p-4 focus-within:border-foreground/20 focus-within:shadow-float">
      <header className="space-y-0.5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <ClipboardIcon aria-hidden="true" className="size-4 shrink-0 text-accent-foreground" />
          1. Retire Details
        </h2>
        <p className="pl-6 text-xs text-muted-foreground">Provide the retirement information for this asset.</p>
      </header>
      <div className="grid min-w-0 items-start gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="grid min-w-0 items-start gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-foreground">Current Status</p>
            <div className="flex min-h-10 items-center rounded-control border border-border/60 bg-muted/60 px-3 py-1.5">
              <LifecycleStatus value={asset.lifecycleStatus} />
            </div>
          </div>
          <ArrowRightIcon aria-hidden="true" className="hidden size-4 self-start text-accent-foreground sm:mt-8 sm:block" />
          <div className="min-w-0 space-y-1.5">
            <p className="text-xs font-medium text-foreground">Current Custodian</p>
            <div className="flex min-h-10 items-center px-1 py-1.5 text-xs">
              <LifecycleHolder holder={asset.custody} />
            </div>
          </div>
        </div>
        {eligibility?.kind === "blocked" && (
          <RetireBlocked asset={asset} fromAssignments={fromAssignments} action={eligibility.action} />
        )}
      </div>
      <div className="grid min-w-0 gap-3 sm:grid-cols-2">
        <div className="min-w-0 space-y-1.5">
          <label htmlFor="retire-condition" className="text-xs font-medium text-foreground">
            Condition at Retirement <span className="text-error">*</span>
          </label>
          <Select
            value={draft.condition}
            onValueChange={(value) => { setTouched((prev) => ({ ...prev, condition: true })); flow.setCondition(value); }}
            required
          >
            <SelectTrigger
              id="retire-condition"
              className="min-h-10"
              aria-invalid={Boolean(conditionError)}
              aria-describedby={conditionError ? "retire-condition-error" : undefined}
            >
              <SelectValue placeholder="Select condition" />
            </SelectTrigger>
            <SelectContent>
              {allowedConditions("Retired").map((condition) => (
                <SelectItem key={condition} value={condition}>
                  <LifecycleCondition value={condition} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError id="retire-condition-error" message={conditionError} />
        </div>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="retire-reason" className="text-xs font-medium text-foreground">
          Reason for Retirement <span className="text-error">*</span>
        </label>
        <Textarea
          id="retire-reason"
          required
          rows={3}
          maxLength={LIFECYCLE_TEXT_MAX}
          placeholder="Explain why this asset is being retired…"
          value={draft.reason}
          onChange={(event) => { setTouched((prev) => ({ ...prev, reason: true })); flow.setReason(event.target.value); }}
          onBlur={() => setTouched((prev) => ({ ...prev, reason: true }))}
          aria-invalid={Boolean(reasonError)}
          aria-describedby={reasonError ? "retire-reason-count retire-reason-error" : "retire-reason-count"}
        />
        <div className="flex items-center justify-between gap-2">
          <FieldError id="retire-reason-error" message={reasonError} />
          <p id="retire-reason-count" className="ml-auto text-right text-2xs tabular-nums text-muted-foreground">
            {draft.reason.length} / {LIFECYCLE_TEXT_MAX}
          </p>
        </div>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="retire-notes" className="text-xs font-medium text-foreground">Notes</label>
        <Textarea
          id="retire-notes"
          rows={3}
          maxLength={LIFECYCLE_TEXT_MAX}
          placeholder="Add notes, such as data or physical handling (optional)…"
          value={draft.notes}
          onChange={(event) => flow.setNotes(event.target.value)}
          aria-describedby="retire-notes-count"
        />
        <p id="retire-notes-count" className="text-right text-2xs tabular-nums text-muted-foreground">
          {draft.notes.length} / {LIFECYCLE_TEXT_MAX}
        </p>
      </div>
      <AssignAttachments evidence={flow.evidence} />
    </Card>
  );
}
